import Collider from "./components/collider.js";
import RigidBody from "./components/rigid-body.js";
import PolygonShape from "./components/shapes/polygon-shape.js";
import GameObject from "./game-object.js";

export default class Polygon extends GameObject {
  constructor(width, height, sides = 3) {
    super();

    if(isNaN(height)) height = width;

    this.color = 'black';
    this.size.add(width, height);
    this.add(new PolygonShape(this, sides));
    this.add(new RigidBody(this));
    this.add(new Collider(this));
  }
}