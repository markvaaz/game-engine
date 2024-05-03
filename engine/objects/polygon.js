import Collider from "./components/collider.js";
import RigidBody from "./components/rigid-body.js";
import { Polygon as PolygonShape } from "./components/shape.js";
import GameObject from "./game-object.js";

export default class Polygon extends GameObject {
  fileName = "polygon";
  
  constructor(width, height, sides = 3) {
    super();

    if(isNaN(height)) height = width;

    this.color = 'black';
    this.size.add(width, height);
    this.add(PolygonShape, sides);
    this.add(RigidBody);
    this.add(Collider);
  }
}