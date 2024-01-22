import Vector from "../../engine-components/vector.js";
import Component from "./component.js";

export default class Sprite extends Component{
  static name = "Sprite";
  name = "Sprite";
  #src = "";
  #debug = false;
  #direction = 1;

  constructor(gameObject, { src, anchor = 0, size = 0, scale = 1, debug = false, direction = 1 } = {}) {
    super();
    this.GameObject = gameObject;

    this.anchor = new Vector(anchor);
    this.size = new Vector(size);
    this.scale = new Vector(scale);

    this.GameObject.Render.sprite = {
      src: src,
      anchor: this.anchor.toObject(),
      size: this.size.toObject(),
      slice: {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      },
      scale: this.scale.toObject(),
      direction: direction,
      debug: this.debug  
    }

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

  get direction(){
    return this.#direction;
  }

  set direction(direction){
    this.#direction = direction;
    this.GameObject.Render.sprite.direction = direction;
    this.GameObject.active = true;
  }
}