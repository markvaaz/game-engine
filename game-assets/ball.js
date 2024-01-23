import Events from "../engine/engine-components/events.js";
import Vector from "../engine/engine-components/vector.js";
import Capsule from "../engine/objects/capsule.js";
import Shadow from "../engine/objects/components/shadow.js";
import Ellipse from "../engine/objects/ellipse.js";
import Rectangle from "../engine/objects/rectangle.js";

export default class Ball extends Ellipse{
  name = "Test";
  type = "Ball";
  constructor(x, y){
    super(64, 64, 4);
    this.position.set(x, y);
    this.size.set(500);
    this.speed = 30;
    this.direction = new Vector(3, 3);
    this.add(Shadow);
    // this.RigidBody.static = true;
    // this.rotation = Math.PI / 4;
  }

  randomMovement(){
    const speed = this.speed;
    
    this.direction.magnitude = speed;

    const dir = Math.random() > 0.5 ? 1 : -1;

    this.direction.angle += (Math.random() * 0.5 - 0.2) * dir;

    this.position.add(this.direction);
  }

  update(Time) {
    if(this.target){
      const targetPosition = this.target.position;
      const direction = targetPosition.copy.subtract(this.position).normal;
      const speed = this.speed;
      const movement = direction.multiply(speed);

      movement.multiply(Time.deltaTime);
  
      this.RigidBody.velocity.set(movement.x, movement.y);
    }

    // this.rotation += Time.deltaTime * 0.5;

    // this.randomMovement();
  }
  
}