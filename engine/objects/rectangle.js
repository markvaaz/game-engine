import Collider from "./components/collider.js";
import RigidBody from "./components/rigid-body.js";
import RectangleShape from "./components/shapes/rectangle-shape.js";
import GameObject from "./game-object.js";

export default class Rectangle extends GameObject {
  constructor(width, height) {
    super();

    if(isNaN(height)) height = width;

    this.color = 'black';
    this.size.add(width, height);
    this.add(RectangleShape);
    this.add(RigidBody);
    this.add(Collider);
  }
}