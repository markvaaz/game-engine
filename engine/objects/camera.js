import GameObject from "./game-object.js";
import Vector from "../engine-components/vector.js";
import Events from "../engine-components/events.js";

export default class Camera extends GameObject{
  // Setting the initial zoom factor to 0.05
  #zoomFactor = 0.05;

  // Setting the initial view to "cartesian"
  #view = "cartesian";

  // Setting the initial rotation to 0
  #rotation = 0;

  // Setting the initial follow mode to "smooth"
  #followMode = "smooth";

  // Setting the initial mouse settings
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

  // Creating a new vector for scale and setting it to (1, 1)
  scale = new Vector(1, 1);

  // Setting the initial scale to the current scale
  initialScale = this.scale;

  // Setting the maximum zoom to 0.2
  maxZoom = 0.2;

  // Setting the minimum zoom to 5
  minZoom = 5;

  // Setting the initial target to null
  target = null;

  // Setting the initial temporary target to null
  temporaryTarget = null;

  // Setting the maximum speed to 100
  maxSpeed = 100;

  // Setting the initial position to the current position
  initialPosition = this.position;

  /**
   * Constructs a new instance of the Camera class.
   *
   * @param {string} [name='Camera'] - The name of the camera.
   * @return {undefined}
   */
  constructor(name = 'Camera'){
    super();
    this.name = name;
    this.setEvents();
  }

  get followMode(){ return this.#followMode; }
  
  /**
   * Sets the follow mode of the camera.
   *
   * @param {string} followMode - The follow mode to set. Must be 'smooth' or 'instant'.
   * @return {undefined} This function does not return a value.
   */
  set followMode(followMode){
    if(followMode !== "smooth" && followMode !== "instant") return console.warn("Camera.followMode must be 'smooth' or 'instant'");
    return this.#followMode = followMode;
  }
  
  /**
   * Retrieve the value of the zoomFactor property.
   *
   * @return {number} The value of the zoomFactor property.
   */
  get zoomFactor(){
    return this.#zoomFactor;
  }
  /**
   * Sets the zoom factor of the object.
   *
   * @param {number} zoomFactor - The new zoom factor to be set.
   * @return {number} The updated zoom factor.
   */
  set zoomFactor(zoomFactor){
    if(isNaN(zoomFactor)) return;
    if(zoomFactor > this.maxZoom) zoomFactor = this.maxZoom;
    else if(zoomFactor < this.minZoom) zoomFactor = this.minZoom;

    return this.#zoomFactor = zoomFactor;
  }

  /**
   * Retrieves the position of the mouse in the world coordinate system.
   *
   * @return {type} The position of the mouse in the world coordinate system.
   */
  get mouse(){
    return this.screenToWorld(Events.windowMouse.position);
  }

  /**
   * Returns the previous mouse position in world coordinates.
   *
   * @return {type} The previous mouse position in world coordinates.
   */
  get pmouse(){
    return this.screenToWorld(Events.windowMouse.previous);
  }

  /**
   * Get the movement vector based on the position of the mouse.
   *
   * @return {Vector} The movement vector.
   */
  get movement(){
    return this.pmouse.sub(this.mouse);
  }
  
  /**
   * Get the value of the view property.
   *
   * @return {type} The value of the view property.
   */
  get view(){
    return this.#view;
  }

  /**
   * Returns the bounds of the object.
   *
   * @return {Object} The bounds object with min and max properties.
   */
  get bounds(){
    return {
      min: this.position.copy,
      max: this.position.copy.add(this.size)
    }
  }

  /**
   * Updates the mouse settings for the application.
   *
   * @param {Object} settings - The new mouse settings.
   *   - {boolean} mousemove - Whether mouse movement is enabled.
   *   - {boolean} vertical - Whether vertical movement is enabled.
   *   - {boolean} horizontal - Whether horizontal movement is enabled.
   *   - {boolean} zoom - Whether zooming is enabled.
   *   - {boolean} inverted - Whether mouse movement is inverted.
   *   - {boolean} invertX - Whether horizontal movement is inverted.
   *   - {boolean} invertY - Whether vertical movement is inverted.
   *   - {number} sensitivity - The mouse sensitivity.
   */
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

  /**
   * Set the events for the object.
   */
  setEvents(){
    Events.mousemove(this.mousemove);
    Events.wheel(this.wheel);
  }

  /**
   * Changes the view of the object.
   *
   * @param {string} view - The view to change to. Must be either "isometric" or "cartesian".
   * @return {void} This function does not return a value.
   */
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

  /**
   * Converts screen coordinates to world coordinates.
   *
   * @param {object} coordinates - The screen coordinates to convert.
   * @param {number} coordinates.x - The x-coordinate on the screen.
   * @param {number} coordinates.y - The y-coordinate on the screen.
   * @param {number} [scale=this.scale] - The scaling factor to apply.
   * @return {Vector} The world coordinates.
   */
  screenToWorld({ x, y }, scale = this.scale){
    return new Vector(
      x / scale.x + this.position.x,
      y / scale.y + this.position.y
    );
  }

  /**
   * Converts coordinates from world space to screen space.
   *
   * @param {Object} point - The coordinates to be converted.
   * @param {number} [scale=this.scale] - The scale factor for the conversion.
   * @return {Vector} The converted coordinates in screen space.
   */
  worldToScreen({ x, y }, scale = this.scale){
    return new Vector(
      (x - this.position.x) * scale.x,
      (y - this.position.y) * scale.y
    );
  }

  /**
   * Updates the size of the object.
   *
   * @param {number} width - The width of the object.
   * @param {number} height - The height of the object.
   * @return {void} This function does not return a value.
   */
  updateSize(width, height){
    this.size.set(width / this.scale.x, height / this.scale.y);
  }

  /**
   * Zooms in.
   */
  zoomIn(){
    if(this.scale.x + this.#zoomFactor > this.minZoom) this.scale.set(this.minZoom);
    else this.scale.add(this.#zoomFactor);
  }

  /**
   * Zooms out.
   */
  zoomOut(){
    if(this.scale.x - this.#zoomFactor < this.maxZoom) this.scale.set(this.maxZoom);
    else this.scale.sub(this.#zoomFactor);
  }

  /**
   * Zooms in to a specific point on the screen.
   *
   * @param {object} point - The point to zoom in to, with x and y coordinates.
   * @param {number} zoomFactor - The factor by which to zoom in. Defaults to the zoom factor of the current instance.
   */
  zoomInTo({ x, y }, zoomFactor = this.#zoomFactor){
    if(this.scale.x + zoomFactor > this.minZoom) return;
    const position = this.worldToScreen({ x, y });
    const screenPosition = this.screenToWorld(position);
    const zoom = this.scale.copy.add(zoomFactor);
    const zoomedScreenPosition = this.screenToWorld(position, zoom);

    this.position.add(screenPosition.copy.sub(zoomedScreenPosition));
    this.zoomIn();
  }

  /**
   * Zooms out to the specified coordinates with an optional zoom factor.
   *
   * @param {object} coordinates - The x and y coordinates to zoom out to.
   * @param {number} zoomFactor - The zoom factor (default is the current zoom factor).
   */
  zoomOutTo({ x, y }, zoomFactor = this.#zoomFactor){
    if(this.scale.x - zoomFactor < this.maxZoom) return;
    const position = this.worldToScreen({ x, y });
    const screenPosition = this.screenToWorld(position);
    const zoom = this.scale.copy.sub(zoomFactor);
    const zoomedScreenPosition = this.screenToWorld(position, zoom);

    this.position.add(screenPosition.copy.sub(zoomedScreenPosition));
    this.zoomOut();
  }
  
  /**
   * Zooms in to the mouse position.
   */
  zoomInToMouse() {
    this.zoomInTo(this.mouse);
  }
  
  /**
   * Zoom out to the mouse position.
   */
  zoomOutToMouse() {
    this.zoomOutTo(this.mouse);
  }

  /**
   * Initializes the "follow" function with a target.
   *
   * @param {type} target - The target to follow.
   */
  follow(target){
    this.target = target;
    this.arrived = false;
  }

  /**
   * Ends the follow action.
   */
  endFollow(){
    this.target = null;
    this.arrived = false;
  }

/**
 * Navigates to the specified coordinates.
 *
 * @param {number} x - The x-coordinate to navigate to. Default is the current x-coordinate.
 * @param {number} y - The y-coordinate to navigate to. Default is the current y-coordinate.
 */
  goTo(x = this.position.x, y = this.position.y){
    if(x instanceof Vector) return this.goTo(x.x, x.y);

    this.temporaryTarget = {
      position: new Vector(x, y),
      RigidBody: {
        velocity: new Vector(0, 0)
      }
    }
  }

  /**
   * Updates the position of the object based on its target.
   */
  updateFollow() {
    // If there is no target or the mouse is being clicked, do nothing
    if (this.target === null && this.temporaryTarget === null || Events.windowMouse.down) {
      return;
    }

    let target = this.target;

    // If there is a temporary target, update the target variable
    if (this.temporaryTarget) {
      target = this.temporaryTarget;
    }

    // Calculate the distance to the target
    const distanceToTarget = this.position.distance(target.position.copy.sub(this.size.copy.mult(0.5)));

    // If the distance to the target is greater than 100, set the 'arrived' flag to false
    if (distanceToTarget > 100) {
      this.arrived = false;
    }

    // If the follow mode is 'smooth' and the object has not arrived at the target
    if (this.followMode === "smooth" && !this.arrived) {
      const force = 0.1;
      const positionDifference = target.position.copy.sub(this.size.copy.mult(0.5)).sub(this.position);

      // Apply a force to smoothly move the object towards the target
      this.position.add(positionDifference.mult(force));

      // If the distance to the target is less than or equal to 5, set the 'arrived' flag to true
      if (distanceToTarget <= 1) {
        this.arrived = true;
      }
    } 
    // If the follow mode is 'instant' or the object has arrived at the target
    else if (this.followMode === "instant" || this.arrived) {
      // Set the object's position to the target position
      this.position.set(target.position.copy.sub(this.size.copy.mult(0.5)));
    }

    // If there is a temporary target and the distance to the target is less than 1, set the temporary target to null
    if (this.temporaryTarget && distanceToTarget < 1) {
      this.temporaryTarget = null;
    }
  }

  /**
   * Handles the mouse movement event.
   */
  mousemove = () => {
    if(this.#mouseSettings.mousemove && Events.windowMouse.down && Events.windowMouse.buttons.has(2)){
      const movement = this.movement.copy;

      if(this.#mouseSettings.inverted) movement.mult(-1);

      if(this.#mouseSettings.horizontal) this.position.add(movement.x, 0);
      if(this.#mouseSettings.vertical) this.position.add(0, movement.y);
    }
  }

  /**
   * Handles the wheel event.
   * If zoom is enabled, it checks the direction of the wheel and calls the corresponding zoom function.
   */
  wheel = () => {
    if(!this.#mouseSettings.zoom) return;
    if(Events.windowMouse.wheel.y > 0) this.zoomOutToMouse();
    else if(Events.windowMouse.wheel.y < 0) this.zoomInToMouse();
  }

  /**
   * Executes before rendering.
   * @function beforeRender
   * @memberof ClassName
   * @instance
   * @returns {void}
   */
  beforeRender = () => {
    this.updateFollow();
  }

  /**
   * Checks if the given bounds are within the camera bounds, taking into account an optional radius.
   *
   * @param {object} bounds - The bounds to check against the camera bounds.
   * @param {number} radius - An optional radius to expand the camera bounds.
   * @return {boolean} - Returns true if the given bounds are within the camera bounds, otherwise returns false.
   */
  isWithinBounds(bounds, radius) {
    const cameraBounds = this.bounds;
    const objectBounds = bounds;
    const offset = radius ? -200 + radius : -200;

    cameraBounds.min.sub(offset);
    cameraBounds.max.add(offset * 2);

    return (
      objectBounds.max.x >= cameraBounds.min.x &&
      objectBounds.min.x <= cameraBounds.max.x &&
      objectBounds.max.y >= cameraBounds.min.y &&
      objectBounds.min.y <= cameraBounds.max.y
    );
  }

  /**
   * Converts the object to a plain JavaScript object, including all properties and nested objects.
   */
  toObject(){
    return {
      position: this.position.toObject(),
      size: this.size.toObject(),
      scale: this.scale.toObject(),
      bounds: {
        min: this.bounds.min.toObject(),
        max: this.bounds.max.toObject()
      },
      rotation: this.#rotation,
      active: this.active
    }
  }

  /**
   * Resets the position and scale of the object.
   */
  reset(){
    this.position.set(this.initialPosition);
    this.scale.set(this.initialScale);
    this.target = null;
  }
}