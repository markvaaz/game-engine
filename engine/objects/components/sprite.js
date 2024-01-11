import Vector from "../../engine-components/vector.js";

export default class Sprite{
  #src = "";
  #debug = false;

  constructor(gameObject, { src, anchor = 0, size = 0, scale = 1, debug = false } = {}) {
    this.GameObject = gameObject;
    this.anchor = new Vector(anchor);
    this.size = new Vector(size);
    this.scale = new Vector(scale);
    this.src = src;
    this.debug = debug;

    this.anchor.onChange(() => {
      this.GameObject.Render.sprite.anchor = this.anchor.toObject();
      this.GameObject.active = true;
    });

    this.size.onChange(() => {
      this.GameObject.Render.sprite.size = this.size.toObject();
      this.GameObject.active = true;
    });

    this.scale.onChange(() => {
      this.GameObject.Render.sprite.scale = this.scale.toObject();
      this.GameObject.active = true;
    })

    this.slice = {
      position: new Vector(0, 0),
      size: new Vector(0, 0),
    }

    this.slice.position.onChange(() => {
      this.GameObject.Render.sprite.slice.x = this.slice.position.x;
      this.GameObject.Render.sprite.slice.y = this.slice.position.y;
      this.GameObject.active = true;
    });

    this.slice.size.onChange(() => {
      this.GameObject.Render.sprite.slice.width = this.slice.size.x;
      this.GameObject.Render.sprite.slice.height = this.slice.size.y;
      this.GameObject.active = true;
    });

    this.GameObject.Render.setSprite(this);
  }

  get src(){
    return this.#src;
  }

  set src(src){
    this.#src = src;
    this.GameObject.Render.sprite.src = src;
    this.GameObject.active = true;
  }

  get debug(){
    return this.#debug;
  }

  set debug(debug){
    this.#debug = debug;
    this.GameObject.Render.sprite.debug = debug;
    this.GameObject.active = true;
  }
}