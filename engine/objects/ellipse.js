import Collider from "./components/collider.js";
import RigidBody from "./components/rigid-body.js";
import EllipseShape from "./components/shapes/ellipse-shape.js";
import GameObject from "./game-object.js";

export default class Ellipse extends GameObject {
  constructor(width, height) {
    super();

    if(isNaN(height)) height = width;

    this.color = 'black';
    this.size.add(width, height);
    this.add(new EllipseShape(this));
    this.add(new RigidBody(this));
    this.add(new Collider(this));
  }
}