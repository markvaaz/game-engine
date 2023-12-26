import Vector from "../../engine-components/vector.js";

export default class LightSource{
  static name = 'LightSource';
  name = 'LightSource';
  #modes = [ "lighter", "source-in", "source-out", "source-over", "source-atop", "destination-over", "destination-in", "destination-out", "destination-atop", "copy", "xor", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"];
  #mode = "lighter";

  constructor(GameObject, radius = 100){
    this.GameObject = GameObject;
    this.radius = radius;
    this.color = "transparent";
    this.start = 0;
    this.stop = 1;
    this.relativePosition = new Vector(0, 0);
    this.position = this.GameObject.position.copy;
    this.GameObject.position.onChange(() => this.position.set(this.GameObject.position.copy.add(this.relativePosition)));
    this.oscillate = false;
    this.min = this.radius * 0.85;
    this.max = this.radius;
    this.speed = 0.015;
    this.brightness = 1;
    this.disabled = false;
  }

  set mode(mode){
    if(this.#modes.includes(mode)) this.#mode = mode;
    else throw new Error(`LightSource: mode '${mode}' is not a valid mode. Valid modes are: ${this.#modes.join(', ')}`);
  }

  get mode(){
    return this.#mode;
  }

  update(Time) {
    if(this.oscillate) this.radius = ((this.max - this.min) / 2) * Math.sin(this.speed * Time.frameCount) + (this.max + this.min) / 2;
  }
}