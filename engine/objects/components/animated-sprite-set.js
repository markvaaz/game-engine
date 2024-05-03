import Time from "../../engine-components/time.js";
import Vector from "../../engine-components/vector.js";
import Component from "./component.js";

export default class AnimatedSprite extends Component{
  static name = "AnimatedSprite";
  name = "AnimatedSprite";
  fileName = "animated-sprite-set";

  frame = 0;
  type = "set";
  #facings = ["left", "right"];
  #facing = "right";
  #debug = false;
  #animations = {};
  #current = "";
  slice = { position: new Vector(), size: new Vector() };
  anchor = new Vector();
  scale = new Vector(1);
  size = new Vector();

  constructor(GameObject, animation){
    super();
    this.GameObject = GameObject;
    this.add(animation);
    this.addSpriteToRender();
  }

  save(){
    return {
      ...this,
      facing: this.#facing,
      debug: this.#debug,
      animations: this.#animations,
      current: this.#current,
    }
  }

  async load(data){
    Object.keys(data.animations).forEach(key => {
      this.add(data.animations[key]);
    });
    this.addSpriteToRender();
    this.frame = data.frame;
    this.facing = data.facing;
    this.debug = data.debug;
    this.scale.set(data.scale);
    this.size.set(data.size);
    this.anchor.set(data.anchor);
  }

  get src(){
    return this.#animations[this.#current].srcs[this.frame];
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

  get current(){
    return this.#animations[this.#current];
  }

  add(animation){
    this.validateAnimation(animation);

    this.#animations[animation.name] = animation;

    if(!this.#current){
      this.set(animation.name, true);
    }
  }

  set(animation, force = false){
    if(animation === this.#current && !force) return;
    if(this.current && this.current.once && !this.current.finished && !force) return;
    if(!this.#animations[animation]){
      throw new Error(`Animation: ${animation} not found`);
    }
    const a = this.#animations[animation];
    this.#current = animation;
    this.scale.set(a.scale);
    this.size.set(a.cellSize);
    this.anchor.set(a.anchor);
    this.#debug = a.debug;
    this.frame = 0;
    this.current.finished = false;
  }

  copy(animation, options){
    if(!options.name) throw new Error("Animation name is required");
    const newAnimation = { ...this.#animations[animation], ...options };

    this.add(newAnimation);
  }

  update(){
    if(this.current.finished) this.set(this.current.fallback);

    const { frameRate, collumns, cellSize, once, skipFrames, srcs } = this.current;

    if(Time.frameCount % frameRate === 0){
      while(skipFrames && skipFrames.includes(this.frame)){
        this.frame = (this.frame + 1) % collumns;
      }

      if(once && ((this.frame + 1) % collumns === 0)){
        this.current.finished = true;
      }

      this.frame = (this.frame + 1) % srcs.length;
      this.size.set(cellSize.x, cellSize.y);
      this.GameObject.Render.sprite.src = this.src;
      this.GameObject.active = true;
    }
  }

  validateAnimation(animation){
    if(!animation.name) throw new Error("Animation name is required");
    if(!(animation.srcs instanceof Array)) throw new Error("Animation srcs is required");
    if(!animation.frameRate) throw new Error("Animation frameRate is required");
    if(!animation.cellSize) throw new Error("Animation cellSize is required");
    if(animation.cellSize.x == null || animation.cellSize.y == null) throw new Error("Animation cellSize most be a vector object");
    if(!animation.anchor) throw new Error("Animation anchor is required");
    if(animation.anchor.x == null || animation.anchor.y == null) throw new Error("Animation anchor most be a vector object");
  }

  addSpriteToRender(){
    this.GameObject.Render.sprite = {
      src: this.src,
      anchor: this.anchor.toObject(),
      size: this.size.toObject(),
      slice: {
        x: this.slice.position.x,
        y: this.slice.position.y,
        width: this.slice.size.x,
        height: this.slice.size.y
      },
      scale: this.scale.toObject(),
      direction: this.facing === "right" ? 1 : -1,
      debug: this.debug
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

    this.size.onChange(() => {
      this.GameObject.Render.sprite.size.x = this.size.x;
      this.GameObject.Render.sprite.size.y = this.size.y;
      this.GameObject.active = true;
    })

    this.scale.onChange(() => {
      this.GameObject.Render.setSprite(this);
      this.GameObject.active = true;
    });
  }
}