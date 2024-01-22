import Vector from "../../engine-components/vector.js";
import Component from "./component.js";

export default class LightSource extends Component{
  // Define a class named LightSource
  static name = 'LightSource';
  name = 'LightSource';

  // Define an array of available blending modes
  #modes = [ "lighter", "source-in", "source-out", "source-over", "source-atop", "destination-over", "destination-in", "destination-out", "destination-atop", "copy", "xor", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"];

  // Define an array of available types
  #types = ["spot", "cone"];

  // Set the default blending mode to "lighter"
  #mode = "lighter";

  // Set the default value of #added to false
  #added = false;

  // Set the default radius to 100
  #radius = 100;

  // Set the default brightness to 1
  #brightness = 1;

  // Set the default type to "spot"
  #type = "spot";

  // Define an array of steps with their start value and color
  #steps = [
    { start: 0, color: "transparent" },
    { start: 1, color: "rgba(255, 255, 255)" }
  ];

  // Create a new Oscillation object
  #oscillation = new Oscillation(this);

  // Set #enabled to true by default
  #enabled = true;

  // Set the default angle to 0
  #angle = 0;

  // Set the default distance to 0
  #distance = 0;

  /**
   * Constructor for the LightSource class.
   * @param {GameObject} GameObject - The parent game object.
   * @param {number} radius - The radius of the light source.
   */
  constructor(GameObject, radius = 100) {
    super();
    this.GameObject = GameObject;

    // Set up the light source object in the GameObject's Render component
    this.GameObject.Render.lightSource = {
      enabled: this.#enabled,
      mode: this.#mode,
      brightness: this.#brightness,
      radius: radius,
      type: this.#type,
      position: this.GameObject.position.toObject(),
      steps: [
        { start: 0, color: "transparent" },
        { start: 1, color: "#fff" }
      ],
      angle: this.#angle,
      distance: this.#distance
    };

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
   * Get the value of the `oscillation` property.
   *
   * @return {type} The value of the `oscillation` property.
   */
  get oscillation(){
    return this.#oscillation;
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

  /**
   * Adds a step to the light source.
   * @param {Object|Array} step - The step or array of steps to add.
   * @throws {Error} - If step is not an object with start and color properties.
   * @throws {Error} - If step start is not a number.
   * @throws {Error} - If step color is not provided.
   */
  add(step) {
    // If step is an array, add each step recursively
    if (step instanceof Array) {
      return step.forEach(step => this.add(step));
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
    step.start = 1 - step.start;

    // Add step to steps array
    this.#steps.push(step);

    // Update lightSource steps and set GameObject as active
    this.GameObject.Render.lightSource.steps = this.#steps;
    this.GameObject.active = true;
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

class Oscillation{
  #enabled = true;
  #min = 0;
  #max = 1;
  #speed = 0.02;

  constructor(lightSource){
    this.lightSource = lightSource;
  }

  get enabled(){
    return this.#enabled;
  }

  set enabled(enabled){
    if(this.#enabled === enabled) return;
    this.#enabled = enabled;
    this.lightSource.GameObject.Render.lightSource.oscillation.enabled = enabled;
    this.lightSource.GameObject.active = true;
  }

  get min(){
    return this.#min;
  }

  set min(min){
    if(isNaN(min)) throw new Error("LightSource: min must be a number.");
    this.#min = min;
    this.lightSource.GameObject.Render.lightSource.oscillation.min = min;
    this.lightSource.GameObject.active = true;
  }

  get max(){
    return this.#max;
  }

  set max(max){
    if(isNaN(max)) throw new Error("LightSource: max must be a number.");
    this.#max = max;
    this.lightSource.GameObject.Render.lightSource.oscillation.max = max;
    this.lightSource.GameObject.active = true;
  }

  get speed(){
    return this.#speed;
  }

  set speed(speed){
    if(isNaN(speed)) throw new Error("LightSource: speed must be a number.");
    this.#speed = speed;
    this.lightSource.GameObject.Render.lightSource.oscillation.speed = speed;
    this.lightSource.GameObject.active = true;
  }
}