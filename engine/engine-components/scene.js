import Camera from "../objects/camera.js";
import GameObject from "../objects/game-object.js";
import Events from "./events.js";
import Physics from "./physics.js";

export default class Scene{
  static name = 'Scene';
  name = 'Scene';
  GameObjects = new Map();
  queueToRender = new Map();
  Cameras = new Map();
  Physics = new Physics();
  Camera = new Camera("Main");
  addedObjects = 0;
  globalLight = new GlabalLight(this);

  constructor(Renderer){
    this.Renderer = Renderer;
    this.addCamera(this.Camera);
    this.Renderer.setup(this.Camera, this.globalLight);
  }

  setup(canvas){
    this.Camera.updateSize(canvas.width, canvas.height);
    this.GameObjects.forEach(gameObject => {
      gameObject.setup?.();
    });
  }

  addCamera(camera){
    this.Cameras.set(camera.name, camera);
    if(!this.Camera) this.Camera = camera;

    camera.updateSize(this.Renderer.canvas.width, this.Renderer.canvas.height);
  }

  changeCamera(camera){
    this.Camera = this.Cameras.get(camera);
  }

  add(gameObject){
    if(!(gameObject instanceof GameObject)) return;

    this.addedObjects++;

    if(gameObject.updateMode === "all" || gameObject.updateMode === "world"){
      this.Physics.add(gameObject);
      this.GameObjects.set(gameObject.id, gameObject);
      gameObject.Scene = this;
    }
    
    if(gameObject.updateMode === "all" || gameObject.updateMode === "render") this.Renderer.add(gameObject);

    if(gameObject.children.size > 0) gameObject.children.forEach(child => this.add(child));
  }

  delete(gameObject){
    if(!(gameObject instanceof GameObject)) return;

    this.addedObjects--;

    gameObject.Scene = null;

    this.GameObjects.delete(gameObject.id);

    this.Renderer.delete(gameObject);

    this.Physics.remove(gameObject);

    if(gameObject.children.size > 0){
      gameObject.children.forEach(child => {
        child.destroy();
        this.delete(child);
      });
    }
  }

  has(gameObject){
    if(!(gameObject instanceof GameObject)) return;
    return this.GameObjects.has(gameObject.id);
  }

  updateVisibility(gameObject){
    if(this.Camera.isWithinBounds(gameObject.bounds, gameObject.LightSource?.radius))
      gameObject.visible = true;
    else
      gameObject.visible = false;
  }

  updateRenderInformation(gameObject){
    if(gameObject.active && gameObject.updateMode !== "world") this.queueToRender.set(gameObject.id, gameObject.Render);
    else this.queueToRender.delete(gameObject.id);
  }

  beforeUpdate = (Time) => {
    this.Camera.beforeUpdate?.(Time);
  }
  
  update = (Time) => {
    this.Camera.defaultUpdate?.(Time);
    this.Camera.update?.(Time);
  
    for (const gameObject of this.GameObjects.values()){
      if(gameObject.destroyed) continue;
  
      this.updateVisibility(gameObject);
      
      gameObject.defaultBeforeUpdate?.(Time);
      gameObject.beforeUpdate?.(Time);
      
      gameObject.defaultUpdate(Time);
      
      gameObject.update?.(Time);
      
      this.Physics.update(gameObject);

      gameObject.defaultAfterUpdate?.(Time);
      gameObject.afterUpdate?.(Time);
      
      this.Physics.collisions(gameObject, Time);
      this.Physics.update(gameObject);

      this.updateRenderInformation(gameObject);
    }

    this.Renderer.update(this.queueToRender);
  }
  
  afterUpdate = (Time) => {
    
  }

  beforeRender = () => {
    this.Camera.updateSize(this.Renderer.canvas.width, this.Renderer.canvas.height);
    this.Camera.beforeRender();
    Events.mouse.setPosition(this.Camera.mouse);
  }

  render = () => {
    this.Renderer.updateCamera(this.Camera.toObject());
    this.Renderer.render();
  }
}

class GlabalLight{
  #color = "#000000";
  #brightness = 1;

  constructor(scene){
    this.scene = scene;
  }

  get color(){
    return this.#color;
  }

  get brightness(){
    return this.#brightness;
  }

  set color(color){
    this.#color = color;
    this.scene.Renderer.updateLight(this.#color, this.#brightness);
  }

  set brightness(brightness){
    this.#brightness = brightness;
    this.scene.Renderer.updateLight(this.#color, this.#brightness);
  }
}