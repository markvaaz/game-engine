import Collider from "./components/collider.js";
import RigidBody from "./components/rigid-body.js";
import CapsuleShape from "./components/shapes/capsule-shape.js";
import GameObject from "./game-object.js";

export default class Capsule extends GameObject {
  constructor(width, height) {
    super();

    this.size.add(width, height);
    this.add(new CapsuleShape(this));
    this.add(new RigidBody(this));
    this.add(new Collider(this));
  }
}