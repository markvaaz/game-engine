import Capsule from "../engine/objects/capsule.js";
import EllipseShape from "../engine/objects/components/shapes/ellipse-shape.js";
import Ellipse from "../engine/objects/ellipse.js";
import GameObject from "../engine/objects/game-object.js";
import Rectangle from "../engine/objects/rectangle.js";

export default class Test extends Ellipse{
  name = "Test";
  constructor(x, y){
    super(50, 50);
    this.position.set(x, y);
    this.size.set(50);
    // this.add(new EllipseShape(this));
    this.speed = 0.5;
    this.debug.enabled = true;
    this.debug.lineColor = "transparent"
    this.debug.fillColor = `hsl(${Math.random() * 360} 100% 50% / 100%)`;
  }

  randomMovement(){
    const speed = this.speed;

    this.position.add(Math.random() * speed * 2 - speed, Math.random() * speed * 2 - speed);
  }

  update(Time) {
    if(this.target){
      const targetPosition = this.target.position;
      const direction = targetPosition.copy.subtract(this.position).normal;
      const speed = this.speed;
      const movement = direction.multiply(speed);
  
      this.Rigidbody.set(movement.x, movement.y);
    }

    // this.randomMovement()
  }
  
}