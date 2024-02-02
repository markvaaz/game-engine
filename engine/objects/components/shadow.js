import Vector from "../../engine-components/vector.js";
import Component from "./component.js";

export default class Shadow extends Component{
  static name = "Shadow";
  name = "Shadow";
  #enabled = true;
  #opacity = 0.25;
  #blur = 0;
  #shape = [];
  #bounds = { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } };
  #position = { x: 0, y: 0 };
  added = false;

  constructor(GameObject) {
    super();
    this.GameObject = GameObject;

    this.#position = this.GameObject.position.toObject();

    this.GameObject.Render.shadow = {
      enabled: this.#enabled,
      opacity: this.#opacity,
      blur: this.#blur,
      shape: this.#shape,
      bounds: this.#bounds,
      position: this.#position
    };

    if(this.GameObject.Shape && this.GameObject.Shape.vertices.length > 0) {
      this.add(this.GameObject.Shape.vertices, true);
    }

    this.GameObject.position.onChange(() => {
      this.#position = this.GameObject.position.toObject();
      this.GameObject.Render.shadow.position = this.#position;
      this.GameObject.active = true;
    })
  }

  get enabled() {
    return this.#enabled;
  }

  set enabled(enabled) {
    if(this.#enabled === enabled) return;
    this.#enabled = enabled;
    this.GameObject.Render.shadow.enabled = enabled;
    this.GameObject.active = true;
  }

  get opacity() {
    return this.#opacity;
  }

  set opacity(opacity) {
    if(isNaN(opacity)) throw new Error("Shadow: opacity must be a number.");
    this.#opacity = opacity;
    this.GameObject.Render.shadow.opacity = opacity;
    this.GameObject.active = true;
  }

  /**
   * The blur of the shadow. (resource intensive)
   *
   * @return {type} The value of the blur property.
   */
  get blur() {
    return this.#blur;
  }

  set blur(blur) {
    if(isNaN(blur)) throw new Error("Shadow: blur must be a number.");
    this.#blur = blur;
    this.GameObject.Render.shadow.blur = blur;
    this.GameObject.active = true;
  }

  /**
   * Adds a shape to the GameObject's shadow.
   *
   * @param {Array} shape - An array of vertices representing the shape.
   * @throws {Error} Throws an error if the shape is not an array.
   */
  add(shape, bounds = false) {
    if(!(shape instanceof Array)) throw new Error("Shadow: shape must be an array of vertices.");
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    this.#shape = shape.map(vertex => {
      if(vertex instanceof Vector) vertex = vertex.toObject();

      if(vertex.x < minX) minX = vertex.x;
      if(vertex.x > maxX) maxX = vertex.x;
      if(vertex.y < minY) minY = vertex.y;
      if(vertex.y > maxY) maxY = vertex.y;

      return vertex;
    });

    this.#bounds = { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } };

    this.GameObject.Render.shadow.shape = this.#shape;
    this.GameObject.Render.shadow.bounds = this.#bounds;

    this.GameObject.active = true;

    if(!bounds) this.added = true;
  }
}