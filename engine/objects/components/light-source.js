import Vector from "../../engine-components/vector.js";
import Component from "./component.js";

export default class LightSource extends Component{
  // Define a class named LightSource
  static name = 'LightSource';
  name = 'LightSource';
  fileName = 'light-source';

  // Define an array of available blending modes
  #modes = [ "lighter", "source-in", "source-out", "source-over", "source-atop", "destination-over", "destination-in", "destination-out", "destination-atop", "copy", "xor", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"];

  // Define an array of available types
  #types = ["spot", "radial"];

  // Set the default blending mode to "lighter"
  #mode = "lighter";

  // Set the default value of #added to false
  #added = false;

  // Set the default radius to 100
  #radius = 100;

  // Set the default brightness to 1
  #brightness = 1;

  // Set the default type to "radial"
  #type = "radial";

  // Define an array of steps with their start value and color
  #steps = [
    { start: 0, color: "rgba(100, 100, 100, 0)" },
    { start: 1, color: "rgba(255, 255, 255)" }
  ];

  // Set #enabled to true by default
  #enabled = true;

  // Set the default angle to 0
  #angle = 0;

  // Set the default distance to 0
  #distance = 0;

  #vertexCache = new Array(5).fill().map(() => new Vector(0, 0));
  #originCache = new Vector(0, 0);

  /**
   * Constructor for the LightSource class.
   * @param {GameObject} GameObject - The parent game object.
   * @param {number} radius - The radius of the light source.
   */
  constructor(GameObject, radius = 100) {
    super();
    this.GameObject = GameObject;

    // Set up the light source object in the GameObject's Render component
    this.addToRender();

    this.GameObject.active = true; //Sets the object as active so it is updated on render

    this.radius = radius;
    this.relativePosition = new Vector(0, 0);
    this.position = this.GameObject.position.copy;

    // Update the position of the light source when the parent game object's position changes
    this.GameObject.position.onChange(() =>
      this.position.set(this.GameObject.position.copy.add(this.relativePosition))
    );

    // Update the position of the light source in the Render component when the position changes
    this.position.onChange(() => this.GameObject.Render.lightSource.position = this.position.toObject());
  }

  save(){
    return {
      ...this,
      mode: this.#mode,
      radius: this.#radius,
      brightness: this.#brightness,
      type: this.#type,
      steps: this.#steps,
      enabled: this.#enabled,
      angle: this.#angle,
      distance: this.#distance
    }
  }

  load(data){
    this.mode = data.mode;
    this.radius = data.radius;
    this.brightness = data.brightness;
    this.type = data.type;
    this.clear();
    this.add(data.steps, true);
    this.enabled = data.enabled;
    this.angle = data.angle;
    this.distance = data.distance;
  }

  /**
   * Get the radius value.
   *
   * @return {any} The radius value.
   */
  get radius(){
    return this.#radius;
  }

  /**
   * Sets the radius of the LightSource.
   *
   * @param {number} radius - The radius of the LightSource.
   * @return {void} This function does not return anything.
   */
  set radius(radius){
    if(isNaN(radius)) throw new Error("LightSource: radius must be a number.");
    this.#radius = radius;
    this.GameObject.Render.lightSource.radius = radius;
    this.setBounds();
    this.GameObject.active = true; //Sets the object as active so it is updated on render
  }

  /**
   * Get the value of the mode property.
   *
   * @return {any} The value of the mode property.
   */
  get mode(){
    return this.#mode;
  }

  /**
   * Sets the mode of the light source.
   *
   * @param {string} mode - The mode to set the light source to.
   * @throws {Error} Throws an error if the given mode is not valid.
   */
  set mode(mode){
    if(this.#modes.includes(mode)){
      this.#mode = mode;
      this.GameObject.Render.lightSource.mode = mode;
      this.GameObject.active = true; //Sets the object as active so it is updated on render
    }
    else throw new Error(`LightSource: mode '${mode}' is not a valid mode. Valid modes are: ${this.#modes.join(', ')}`);
  }

  /**
   * Get the brightness value.
   *
   * @return {type} The brightness value.
   */
  get brightness(){
    return this.#brightness;
  }

  /**
   * Set the brightness of the light source.
   *
   * @param {number} brightness - The brightness value to set.
   * @throws {Error} If brightness is not a number.
   */
  set brightness(brightness){
    if(isNaN(brightness)) throw new Error("LightSource: brightness must be a number.");
    this.#brightness = brightness;
    this.GameObject.Render.lightSource.brightness = brightness;
    this.GameObject.active = true; //Sets the object as active so it is updated on render
  }

  /**
   * Get the value of the type property.
   *
   * @return {type} The value of the type property.
   */
  get type(){
    return this.#type;
  }

  /**
   * Sets the type of the light source.
   *
   * @param {type} type - The type to set for the light source.
   * @throws {Error} If the type is not a valid type.
   */
  set type(type){
    if(this.#types.includes(type)){
      this.#type = type;
      this.GameObject.Render.lightSource.type = type;
      this.GameObject.active = true; //Sets the object as active so it is updated on render
    }
    else throw new Error(`LightSource: type '${type}' is not a valid type. Valid types are: ${this.#types.join(', ')}`);
  }

  /**
   * Get the angle.
   *
   * @return {type} The angle.
   */
  get angle(){
    return this.#angle;
  }

  /**
   * Sets the angle of the light source.
   *
   * @param {number} angle - The angle to set for the light source.
   * @return {undefined} This function does not return a value.
   */
  set angle(angle){
    if(isNaN(angle)) throw new Error("LightSource: angle must be a number.");
    this.#angle = angle;
    this.GameObject.Render.lightSource.angle = angle;
    this.setBounds();
    this.GameObject.active = true; //Sets the object as active so it is updated on render
  }

  /**
   * Get the value of the distance property.
   *
   * @return {type} The value of the distance property.
   */
  get distance(){
    return this.#distance;
  }

  /**
   * Sets the distance of the light source.
   *
   * @param {number} distance - The distance of the light source.
   * @throws {Error} LightSource: distance must be a number.
   */
  set distance(distance){
    if(isNaN(distance)) throw new Error("LightSource: distance must be a number.");
    this.#distance = distance;
    this.GameObject.Render.lightSource.distance = distance;
    this.setBounds();
    this.GameObject.active = true; //Sets the object as active so it is updated on render
  }

  /**
   * Retrieves the steps property.
   *
   * @return {type} The value of the steps property.
   */
  get steps(){
    return this.#steps;
  }


  /**
   * Retrieves the value of the 'enabled' property.
   *
   * @return {type} The value of the 'enabled' property.
   */
  get enabled(){
    return this.#enabled;
  }

  /**
   * Sets the enabled state of the object and updates the corresponding properties.
   *
   * @param {boolean} enabled - The new enabled state.
   * @return {undefined} This function does not return a value.
   */
  set enabled(enabled){
    this.#enabled = enabled;
    this.GameObject.Render.lightSource.enabled = enabled;
    this.GameObject.active = true; //Sets the object as active so it is updated on render
  }

  get bounds(){
    this.GameObject.Render.lightSource.bounds;
  }

  /**
   * Adds a step to the light source.
   * @param {Object|Array} step - The step or array of steps to add.
   * @throws {Error} - If step is not an object with start and color properties.
   * @throws {Error} - If step start is not a number.
   * @throws {Error} - If step color is not provided.
   */
  add(step, dontInvert = false) {
    // If step is an array, add each step recursively
    if (step instanceof Array) {
      return step.forEach(step => this.add(step, dontInvert));
    }

    // Validate step object properties
    if (typeof step !== "object") {
      throw new Error("LightSource: step must be an object with start and color properties.");
    }
    if (isNaN(step.start)) {
      throw new Error("LightSource: step start is required.");
    }
    if (!step.color) {
      throw new Error("LightSource: step color is required.");
    }

    // Initialize steps array if not already done
    if (!this.#added) {
      this.#added = true;
      this.#steps = [];
    }

    // Invert step start value
    if(!dontInvert) step.start = 1 - step.start;

    if(step.color === "transparent") step.color = "rgba(100, 100, 100, 0)";

    // Add step to steps array
    this.#steps.push(step);

    // Update lightSource steps and set GameObject as active
    this.GameObject.Render.lightSource.steps = this.#steps;
    this.GameObject.active = true;
  }

  setBounds() {
    const vertexCache = this.#vertexCache;
    const origin = this.#originCache.set(this.distance, 0).rotate(this.angle);

    vertexCache[1].set(origin.x - this.radius, origin.y - this.radius);
    vertexCache[2].set(origin.x - this.radius, origin.y + this.radius);
    vertexCache[3].set(origin.x + this.radius, origin.y + this.radius);
    vertexCache[4].set(origin.x + this.radius, origin.y - this.radius);
  
    // Cálculo direto dos limites
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
  
    for (let i = 0; i < vertexCache.length; i++) {
      const vertex = vertexCache[i];
      minX = Math.min(minX, vertex.x);
      minY = Math.min(minY, vertex.y);
      maxX = Math.max(maxX, vertex.x);
      maxY = Math.max(maxY, vertex.y);
    }

    this.GameObject.Render.lightSource.bounds.min.x = minX;
    this.GameObject.Render.lightSource.bounds.max.x = maxX;
    this.GameObject.Render.lightSource.bounds.min.y = minY;
    this.GameObject.Render.lightSource.bounds.max.y = maxY;
  }
  
  addToRender(){
    this.GameObject.Render.lightSource = {
      enabled: this.#enabled,
      mode: this.#mode,
      brightness: this.#brightness,
      radius: 0,
      type: this.#type,
      position: this.GameObject.position.toObject(),
      steps: [
        { start: 0, color: "transparent" },
        { start: 1, color: "#fff" }
      ],
      angle: this.#angle,
      distance: this.#distance,
      bounds: {
        min: { x:0, y:0 },
        max: { x:0, y:0 }
      }
    };
  }

  /**
   * Clears the steps array, sets the steps for the light source, and activates the game object.
   */
  clear(){
    this.#steps = [];
    this.GameObject.Render.lightSource.steps = this.#steps;
    this.GameObject.active = true; //Sets the object as active so it is updated on render 
  }
}