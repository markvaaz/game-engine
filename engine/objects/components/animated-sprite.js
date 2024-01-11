import Vector from "../../engine-components/vector.js";

export default class AnimatedSprite {
  static name = "AnimatedSprite";
  name = "AnimatedSprite";
  currentFrame = 0;
  #type = "set";
  #types = ["set", "sheet"];
  #facings = ["left", "right"];
  #facing = "left";
  #debug = false;
  #direction = -1;

  constructor(gameObject, { srcs, position, size, frameRate, type, debug, scale = 1, anchor = 0, collumns = 1, rows = 1 } = {}) {
    this.GameObject = gameObject;
    this.srcs = srcs;

    this.slice = {
      position: new Vector(position),
      size: new Vector(size),
    }
    this.anchor = new Vector(anchor);
    this.size = new Vector(size);
    this.frameRate = frameRate;
    this.scale = new Vector(scale);

    this.debug = debug;
    this.type = type;

    this.collumns = collumns;
    this.rows = rows;

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

    this.scale.onChange(() => {
      this.GameObject.Render.setSprite(this);
      this.GameObject.active = true;
    });

    this.GameObject.Render.setSprite(this);
  }

  get type(){
    return this.#type;
  }

  set type(type){
    if(!this.#types.includes(type)) throw new Error(`Invalid type: ${type}, expected one of: ${this.#types.join(", ")}`);
    this.#type = type;
  }

  get src(){
    if(this.#type === "sheet")
      return this.srcs[0];

    if(this.#type === "set")
      return this.srcs[this.currentFrame];
  }

  get debug(){
    return this.#debug;
  }

  set debug(debug){
    this.#debug = debug;
    this.GameObject.Render.sprite.debug = debug;
  }

  get facing(){
    return this.#facing;
  }

  set facing(direction){
    if(!this.#facings.includes(direction)) throw new Error(`Invalid direction: ${direction}, expected one of: ${this.#facings.join(", ")}`);
    this.#facing = direction;
    this.GameObject.Render.sprite.direction = direction === "right" ? 1 : -1;
  }

  updateSet(frameCount){
    this.currentFrame = frameCount / this.frameRate % this.srcs.length;
    this.GameObject.Render.sprite.src = this.src;
    this.GameObject.active = true;
  }

  updateSheet(frameCount){
    const totalFrames = this.collumns * this.rows;
    const currentFrameIndex = Math.floor(frameCount / this.frameRate) % totalFrames;
  
    const column = currentFrameIndex % this.collumns;
    const row = Math.floor(currentFrameIndex / this.collumns);
  
    const portionX = column * this.slice.size.x;
    const portionY = row * this.slice.size.y;
  
    this.slice.position.set(portionX, portionY);
    this.GameObject.active = true;
  }
  
  update(Time){
    if(Time.frameCount % this.frameRate === 0){
      if(this.#type === "set") this.updateSet(Time.frameCount);
      if(this.#type === "sheet") this.updateSheet(Time.frameCount);
    }
  }
}