import Vector from "../engine/engine-components/vector.js";
import Capsule from "../engine/objects/capsule.js";
import EllipseShape from "../engine/objects/components/shapes/ellipse-shape.js";
import Ellipse from "../engine/objects/ellipse.js";
import GameObject from "../engine/objects/game-object.js";
import Polygon from "../engine/objects/polygon.js";
import Rectangle from "../engine/objects/rectangle.js";

export default class Test extends Ellipse{
  name = "Test";
  constructor(x, y){
    super(64, 64, 4);
    this.position.set(x, y);
    this.size.set(64);
    // this.add(new EllipseShape(this));
    this.speed = 3;
    this.direction = new Vector(3, 3);
  }

  randomMovement(){
    const speed = this.speed;
    
    this.direction.magnitude = speed;

    const dir = Math.random() > 0.5 ? 1 : -1;

    this.direction.angle += (Math.random() * 0.5 - 0.2) * dir;

    this.position.add(this.direction);
    // this.position.add(Math.random() * speed * 2 - speed, Math.random() * speed * 2 - speed);
  }

  update(Time) {
    if(this.target){
      const targetPosition = this.target.position;
      const direction = targetPosition.copy.subtract(this.position).normal;
      const speed = this.speed;
      const movement = direction.multiply(speed);
  
      this.Rigidbody.set(movement.x, movement.y);
    }

    // this.randomMovement();
  }
  
}