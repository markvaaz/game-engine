import Vector from "./vector.js";

export default class Mouse{
  #position = new Vector();
  #previous = new Vector();
  #down = false;
  #wheel = 0;
  #buttons = new Set();

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
  get movement(){ return this.#previous.copy.sub(this.#position) }

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
  set wheel(value){
    if(typeof value !== "number") return this.#wheel;
    this.#wheel = value;
  }

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

  setPosition(x, y){
    if(x instanceof Vector) return this.setPosition(x.x, x.y);
    this.x = x;
    this.y = y;
  }
}