import Vector from "../../engine-components/vector.js";

export default class LightSource{
  static name = 'LightSource';
  name = 'LightSource';
  #modes = [ "lighter", "source-in", "source-out", "source-over", "source-atop", "destination-over", "destination-in", "destination-out", "destination-atop", "copy", "xor", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"];
  #mode = "multiply";
  #added = false;

  constructor(GameObject, radius = 100){
    this.GameObject = GameObject;
    this.radius = radius;
    this.relativePosition = new Vector(0, 0);
    this.position = this.GameObject.position.copy;
    this.GameObject.position.onChange(() => this.position.set(this.GameObject.position.copy.add(this.relativePosition)));
    this.oscillate = false;
    this.min = this.radius * 0.85;
    this.max = this.radius;
    this.speed = 0.015;
    this.brightness = 1;
    this.disabled = false;
    this.steps = [{ start: 0, color: "transparent" }, { start: 1, color: "rgba(255, 255, 255)" }];
  }

  set mode(mode){
    if(this.#modes.includes(mode)) this.#mode = mode;
    else throw new Error(`LightSource: mode '${mode}' is not a valid mode. Valid modes are: ${this.#modes.join(', ')}`);
  }

  get mode(){
    return this.#mode;
  }

  add(step){
    if(step instanceof Array) return step.forEach(step => this.add(step));
    if(typeof step !== "object") throw new Error("LightSource: step must be an object with start and color properties.");
    if(isNaN(step.start)) throw new Error("LightSource: step start is required.");
    if(!step.color) throw new Error("LightSource: step color is required.");

    if(!this.#added){
      this.#added = true;
      this.steps = [];
    }

    step.start = 1 - step.start;

    this.steps.push(step);
  }

  update(Time) {
    if(this.oscillate) this.radius = ((this.max - this.min) / 2) * Math.sin(this.speed * Time.frameCount) + (this.max + this.min) / 2;
  }
}