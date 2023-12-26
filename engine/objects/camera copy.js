import GameObject from "./game-object.js";
import Vector from "../engine-components/vector.js";
import Events from "../engine-components/events.js";
import Lights from "./lights.js";

export default class Camera extends GameObject{
  #zoomFactor = 0.05;
  #view = "cartesian";
  #rotation = 0;
  #followMode = "smooth";
  #mouseSettings = {
    mousemove: true,
    vertical: true,
    horizontal: true,
    zoom: true,
    inverted: false,
    invertX: false,
    invertY: false,
    sensitivity: new Vector(1, 1)
  };
  scale = new Vector(1, 1);
  initialScale = this.scale;
  maxZoom = 0.2;
  minZoom = 5;
  target = null;
  temporaryTarget = null;
  maxSpeed = 100;
  initialPosition = this.position;

  constructor(name = 'Camera'){
    super();
    this.name = name;
    this.setEvents();
  }

  get followMode(){ return this.#followMode; }
  set followMode(followMode){
    if(followMode !== "smooth" && followMode !== "instant") return console.warn("Camera.followMode must be 'smooth' or 'instant'");
    return this.#followMode = followMode;
  }
  get zoomFactor(){ return this.#zoomFactor; }
  set zoomFactor(zoomFactor){
    if(isNaN(zoomFactor)) return;
    if(zoomFactor > this.maxZoom) zoomFactor = this.maxZoom;
    else if(zoomFactor < this.minZoom) zoomFactor = this.minZoom;

    return this.#zoomFactor = zoomFactor;
  }
  get mouse(){ return this.screenToWorld(Events.mouse.position); }
  get pmouse(){ return this.screenToWorld(Events.mouse.previous); }
  get movement(){ return this.pmouse.sub(this.mouse); }
  get view(){ return this.#view; }
  get bounds(){
    return {
      min: this.position.copy,
      max: this.position.copy.add(this.size.copy.div(this.scale))
    }
  }

  settings({
    mousemove = this.#mouseSettings.mousemove,
    vertical = this.#mouseSettings.vertical,
    horizontal = this.#mouseSettings.horizontal,
    zoom = this.#mouseSettings.zoom,
    inverted = this.#mouseSettings.inverted,
    invertX = this.#mouseSettings.invertX,
    invertY = this.#mouseSettings.invertY,
    sensitivity = this.#mouseSettings.sensitivity
  }){
    this.#mouseSettings.mousemove = mousemove;
    this.#mouseSettings.vertical = vertical;
    this.#mouseSettings.horizontal = horizontal;
    this.#mouseSettings.zoom = zoom;
    this.#mouseSettings.inverted = inverted;
    this.#mouseSettings.invertX = invertX;
    this.#mouseSettings.invertY = invertY;
    this.#mouseSettings.sensitivity = sensitivity;
  }

  setEvents(){
    Events.mousemove(this.mousemove);
    Events.wheel(this.wheel);
  }

  changeView(view){
    if(view === "isometric"){
      this.#view = view;
      this.#rotation = 45;
      this.scale.x = 1;
      this.scale.y = 0.5;
    }else if(view === "cartesian"){
      this.#view = view;
      this.#rotation = 0;
      this.scale.x = 1;
      this.scale.y = 1;
    }
  }

  // Convert screen coordinates to world coordinates.
  screenToWorld({ x, y }, scale = this.scale){
    return new Vector({
      x: x / scale.x + this.position.x,
      y: y / scale.y + this.position.y
    });
  }

  // Convert world coordinates to screen coordinates.
  worldToScreen({ x, y }, scale = this.scale){
    return new Vector({
      x: (x - this.position.x) * scale.x,
      y: (y - this.position.y) * scale.y
    });
  }

  // Set the position of an gameObject related to the screen to the world position.
  setPositionToWorld(gameObject){
    gameObject.position.set(this.screenToWorld(gameObject.position));
  }

  // Set the position of an gameObject related to the world to the screen position.
  setPositionToScreen(gameObject){
    gameObject.position.set(this.worldToScreen(gameObject.position));
  }

  // Return the size of an gameObject related to the world, used for auto scaling entities to render them in the correct size related to the screen.
  worldSizeToCameraSize(scale){
    return new Vector(scale.x / this.scale.x, scale.y / this.scale.y)
  }

  // Apply the camera transformations to the context.
  draw(context){
    this.size.set(context.canvas.width, context.canvas.height);
    context.save();
    context.scale(this.scale.x, this.scale.y);
    context.rotate(this.#rotation * Math.PI * (1 / 180));
    context.translate(-this.position.x, -this.position.y);
  }

  // Restore the context to the previous state.
  endDraw(context){
    context.restore();
  }

  // Update the scale of the camera.
  zoomIn(){
    if(this.scale.x + this.#zoomFactor > this.minZoom) this.scale.set(this.minZoom);
    else this.scale.add(this.#zoomFactor);
  }

  zoomOut(){
    if(this.scale.x - this.#zoomFactor < this.maxZoom) this.scale.set(this.maxZoom);
    else this.scale.sub(this.#zoomFactor);
  }

  zoomInTo({ x, y }, zoomFactor = this.#zoomFactor){
    if(this.scale.x + zoomFactor > this.minZoom) return;
    const position = this.worldToScreen({ x, y });
    const screenPosition = this.screenToWorld(position);
    const zoom = this.scale.copy.add(zoomFactor);
    const zoomedScreenPosition = this.screenToWorld(position, zoom);

    this.position.add(screenPosition.copy.sub(zoomedScreenPosition));
    this.zoomIn();
  }

  zoomOutTo({ x, y }, zoomFactor = this.#zoomFactor){
    if(this.scale.x - zoomFactor < this.maxZoom) return;
    const position = this.worldToScreen({ x, y });
    const screenPosition = this.screenToWorld(position);
    const zoom = this.scale.copy.sub(zoomFactor);
    const zoomedScreenPosition = this.screenToWorld(position, zoom);

    this.position.add(screenPosition.copy.sub(zoomedScreenPosition));
    this.zoomOut();
  }
  
  // Zoom in and out to the mouse position.
  zoomInToMouse() {
    this.zoomInTo(this.mouse);
  }
  
  zoomOutToMouse() {
    this.zoomOutTo(this.mouse);
  }

  // Set the target to follow.
  follow(target){
    this.target = target;
    this.arrived = false;
  }

  endFollow(){
    this.target = null;
    this.arrived = false;
  }

  goTo(x = this.position.x, y = this.position.y){
    if(x instanceof Vector) return this.goTo(x.x, x.y);

    this.temporaryTarget = {
      position: new Vector(x, y),
      RigidBody: {
        velocity: new Vector(0, 0)
      }
    }
  }

  updateFollow(Time){
    if((this.target == null && this.temporaryTarget == null) || Events.mouse.down) return;

    let target = this.target;

    if(this.temporaryTarget) target = this.temporaryTarget;

    if(this.position.distance(target.position.copy.sub(this.size.copy.mult(0.5).div(this.scale))) > 50)
      this.arrived = false;
    

    if(this.followMode == "smooth" && !this.arrived){
      const force = 0.1;

      this.position.add(target.position.copy.sub(this.size.copy.mult(0.5).div(this.scale)).sub(this.position).mult(force));

      if(this.position.distance(target.position.copy.sub(this.size.copy.mult(0.5).div(this.scale))) <= 5)
        this.arrived = true;
    }
    
    else if(this.followMode == "instant" || this.arrived)
      this.position.set(target.position.copy.sub(this.size.copy.mult(0.5).div(this.scale)));
    

    if(this.temporaryTarget && this.position.distance(target.position.copy.sub(this.size.copy.mult(0.5).div(this.scale))) < 1)
      this.temporaryTarget = null;
  }

  // Move the camera with the mouse.
  mousemove = () => {
    if(this.#mouseSettings.mousemove && Events.mouse.down && Events.mouse.buttons.has(2)){
      const movement = this.movement.copy;

      if(this.#mouseSettings.inverted) movement.mult(-1);

      if(this.#mouseSettings.horizontal) this.position.add(movement.x, 0);
      if(this.#mouseSettings.vertical) this.position.add(0, movement.y);
    }
  }

  // Zoom in and out with the mouse wheel.
  wheel = () => {
    if(!this.#mouseSettings.zoom) return;
    if(Events.mouse.wheel > 0) this.zoomOutToMouse();
    else if(Events.mouse.wheel < 0) this.zoomInToMouse();
  }

  // Update the camera every frame.
  beforeRender = (Time) => {
    this.updateFollow(Time);
  }

  isWithinBounds(gameObject){
    if(this.inactive && gameObject.inactive) return gameObject.onCameraView;

    const cameraBounds = this.bounds;
    const objectBounds = gameObject.bounds;
    const offset = 10;

    cameraBounds.min.sub(offset);
    cameraBounds.max.add(offset * 2);

    if(objectBounds.max.x >= cameraBounds.min.x && objectBounds.min.x <= cameraBounds.max.x && objectBounds.max.y >= cameraBounds.min.y && objectBounds.min.y <= cameraBounds.max.y)
      return true;
    
    else return false;
  }

  reset(){
    this.position.set(this.initialPosition);
    this.scale = this.initialScale;
  }
}