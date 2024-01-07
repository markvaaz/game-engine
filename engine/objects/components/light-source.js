import Vector from "../../engine-components/vector.js";

export default class LightSource{
  static name = 'LightSource';
  name = 'LightSource';
  #modes = [ "lighter", "source-in", "source-out", "source-over", "source-atop", "destination-over", "destination-in", "destination-out", "destination-atop", "copy", "xor", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"];
  #types = ["spot", "cone"];
  #mode = "lighter";
  #added = false;
  #radius = 100;
  #brightness = 1;
  #type = "spot";
  #steps = [{ start: 0, color: "transparent" }, { start: 1, color: "rgba(255, 255, 255)" }];
  #oscillation = new Oscillation(this);
  #enabled = true;
  #angle = 0;
  #distance = 0;

  constructor(GameObject, radius = 100){
    this.GameObject = GameObject;

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
      oscillation: {
        enabled: false,
        min: 0,
        max: 0,
        speed: 0
      },
      angle: this.#angle,
      distance: this.#distance
    };

    this.GameObject.active = true;

    this.radius = radius;
    this.relativePosition = new Vector(0, 0);
    this.position = this.GameObject.position.copy;
    this.GameObject.position.onChange(() => this.position.set(this.GameObject.position.copy.add(this.relativePosition)));
    this.position.onChange(() => this.GameObject.Render.lightSource.position = this.position.toObject());
  }

  get radius(){
    return this.#radius;
  }

  set radius(radius){
    if(isNaN(radius)) throw new Error("LightSource: radius must be a number.");
    this.#radius = radius;
    this.GameObject.Render.lightSource.radius = radius;
    this.GameObject.active = true;
  }

  get mode(){
    return this.#mode;
  }

  set mode(mode){
    if(this.#modes.includes(mode)){
      this.#mode = mode;
      this.GameObject.Render.lightSource.mode = mode;
      this.GameObject.active = true;
    }
    else throw new Error(`LightSource: mode '${mode}' is not a valid mode. Valid modes are: ${this.#modes.join(', ')}`);
  }

  get brightness(){
    return this.#brightness;
  }

  set brightness(brightness){
    if(isNaN(brightness)) throw new Error("LightSource: brightness must be a number.");
    this.#brightness = brightness;
    this.GameObject.Render.lightSource.brightness = brightness;
    this.GameObject.active = true;
  }

  get type(){
    return this.#type;
  }

  set type(type){
    if(this.#types.includes(type)){
      this.#type = type;
      this.GameObject.Render.lightSource.type = type;
      this.GameObject.active = true;
    }
    else throw new Error(`LightSource: type '${type}' is not a valid type. Valid types are: ${this.#types.join(', ')}`);
  }

  get angle(){
    return this.#angle;
  }

  set angle(angle){
    if(isNaN(angle)) throw new Error("LightSource: angle must be a number.");
    this.#angle = angle;
    this.GameObject.Render.lightSource.angle = angle;
    this.GameObject.active = true;
  }

  get distance(){
    return this.#distance;
  }

  set distance(distance){
    if(isNaN(distance)) throw new Error("LightSource: distance must be a number.");
    this.#distance = distance;
    this.GameObject.Render.lightSource.distance = distance;
    this.GameObject.active = true;
  }

  get steps(){
    return this.#steps;
  }

  get oscillation(){
    return this.#oscillation;
  }

  get enabled(){
    return this.#enabled;
  }

  set enabled(enabled){
    this.#enabled = enabled;
    this.GameObject.Render.lightSource.enabled = enabled;
    this.GameObject.active = true;
  }

  add(step){
    if(step instanceof Array) return step.forEach(step => this.add(step));
    if(typeof step !== "object") throw new Error("LightSource: step must be an object with start and color properties.");
    if(isNaN(step.start)) throw new Error("LightSource: step start is required.");
    if(!step.color) throw new Error("LightSource: step color is required.");

    if(!this.#added){
      this.#added = true;
      this.#steps = [];
    }

    step.start = 1 - step.start;

    this.#steps.push(step);

    this.GameObject.Render.lightSource.steps = this.#steps;
    this.GameObject.active = true;
  }

  clear(){
    this.#steps = [];
    this.GameObject.Render.lightSource.steps = this.#steps;
    this.GameObject.active = true; 
  }

  update(Time) {
    // if(this.oscillate) this.radius = ((this.max - this.min) / 2) * Math.sin(this.speed * Time.frameCount) + (this.max + this.min) / 2;
  }
}

class Oscillation{
  #enabled = false;
  #min = 0;
  #max = 0;
  #speed = 0;

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