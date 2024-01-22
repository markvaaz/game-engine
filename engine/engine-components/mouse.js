import Vector from "./vector.js";

export default class Mouse{
  #position = new Vector();
  #previous = new Vector();
  #down = false;
  #wheel = new Vector();
  #buttons = new Set();
  #movement = new Vector();
  #element = null;
  locked = false;
  
  constructor(window = false){
    if(window){
      this.#element = document.createElement("div");
      this.#element.id = "engine-cursor";
  
      if(!document.getElementById("engine-cursor")) document.body.appendChild(this.#element);
    }
  }

  /**
   * @property {Vector} position - the position of the mouse.
   * @readonly
   */
  get position(){ return this.#position.copy }

  /**
   * @property {Vector} previous - the previous position of the mouse.
   * @readonly
   */
  get previous(){ return this.#previous.copy }

  /**
   * @property {Vector} movement - the movement of the mouse.
   * @readonly
   */
  get movement(){ return this.#movement.copy }

  /**
   * @property {boolean} down - whether or not the mouse is down.
   */
  get down(){ return this.#down }
  set down(value){
    if(typeof value !== "boolean") return this.#down;
    this.#down = value;
  }

  /**
   * @property {number} wheel - the amount the mouse wheel has been scrolled.
   */
  get wheel(){ return this.#wheel }

  /**
   * @property {Set} buttons - the buttons that are currently pressed.
   */
  get buttons(){ return this.#buttons }

  /**
   * @property {number} x - the x position of the mouse.
   */
  get x(){ return this.#position.x }
  set x(value){
    if(isNaN(value)) return this.#position.x;
    this.#previous.x = this.#position.x;
    this.#position.x = value;
  }

  /**
   * @property {number} y - the y position of the mouse.
   */
  get y(){ return this.#position.y }
  set y(value){
    if(isNaN(value)) return this.#position.y;
    this.#previous.y = this.#position.y;
    this.#position.y = value;
  }

  setPosition(x, y, movementX = 0, movementY = 0){
    if(x instanceof Vector) return this.setPosition(x.x, x.y);

    if(this.locked){
      this.#position.setConstraints(0, innerWidth, 0, innerHeight);
      this.#previous.setConstraints(0, innerWidth, 0, innerHeight);
      this.x += movementX;
      this.y += movementY;
      this.movement.set(this.previous.sub(this.position));
    }else{
      this.x = x;
      this.y = y;
      this.#position.unsetConstraints();
      this.#previous.unsetConstraints();
      this.movement.set(movementX, movementY);
    }

    if(!this.#element) return;
    this.#element.style.left = `${this.x}px`;
    this.#element.style.top = `${this.y}px`;
  }
}