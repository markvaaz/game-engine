import UIElement from "./element.js";

export default class Button extends UIElement {
  constructor(options) {
    super();
    const defaults = { text: "Button", position: { x: 0, y: 0 }, backgroundColor: "#4190df", color: "#fff", padding: "10px", borderRadius: "6px", ...options }
    this.text = defaults.text;
    this.position.set(defaults.position);
    delete defaults.position;
    delete defaults.text;
    this.style(defaults);
    this.hover({ backgroundColor: "#0078d7", color: "#fff" });
  }
}