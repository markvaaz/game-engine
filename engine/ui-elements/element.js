import Vector from "../engine-components/vector.js";

export default class UIElement {
  #dom = document.createElement("div");
  #style = {};
  #hover = {};
  position = new Vector(-1);

  constructor() {
    this.#dom.style.position = "absolute";
    this.#dom.style.zIndex = 1000;
    document.body.appendChild(this.#dom);
    this.position.onChange(() => {
      this.#dom.style.top = `${this.position.y}px`;
      this.#dom.style.left = `${this.position.x}px`;
    });
    this.position.set(0);
  }

  get text() {
    return this.#dom.textContent;
  }

  set text(text) {
    this.#dom.textContent = text;
    return this;
  }

  on(event, callback) {
    this.#dom.addEventListener(event, callback);
    return this;
  }

  off(event, callback) {
    this.#dom.removeEventListener(event, callback);
    return this;
  }
  hover(options = this.#hover){
    this.on("mouseenter", () => {
      this.style(options, true);
    });
    this.on("mouseleave", () => {
      this.style(this.#style);
    });
    return this;
  }

  style(options = {}) {
    for(const [key, value] of Object.entries(options)){
      if(this.#dom.style[key] === undefined) continue;
      this.#dom.style[key] = value;
      if(!arguments[1]) this.#style[key] = value;
    }

    this.#dom.style.top = `${this.position.y}px`;
    this.#dom.style.left = `${this.position.x}px`;

    return this;
  }

  set(options){
    for(const [key, value] of Object.entries(options))
      this[key] = value;
    return this;
  }
}