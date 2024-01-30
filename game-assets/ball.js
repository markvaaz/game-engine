import Time from "../engine/engine-components/time.js";
import Vector from "../engine/engine-components/vector.js";
import Capsule from "../engine/objects/capsule.js";
import Shadow from "../engine/objects/components/shadow.js";
import Ellipse from "../engine/objects/ellipse.js";
import Polygon from "../engine/objects/polygon.js";
import Rectangle from "../engine/objects/rectangle.js";

export default class Ball extends Rectangle{
  name = "Test";
  type = "Ball";
  constructor(x, y){
    super(64, 64, 6);
    this.position.set(x, y);
    this.size.set(200);
    this.speed = 10;
    this.direction = new Vector(3, 3);
    this.add(Shadow);
    // this.Shadow.opacity = 0.8;
    // this.RigidBody.static = true;
    // this.RigidBody.density = 2;
    this.direction.rotate(Math.random() * Math.PI * 2 - Math.PI);

    this.Collider.onCollision((collision) => {
      if(collision.collided) this.direction.negate();
    });
  }

  randomMovement(){
    const speed = this.speed;
    
    this.direction.magnitude = speed;

    const dir = Math.random() > 0.5 ? 1 : -1;

    this.direction.angle += (Math.random() * 1 - 0.5) * dir;

    this.position.add(this.direction);
  }

  update() {
    if(this.target){
      const targetPosition = this.target.position;
      const direction = targetPosition.copy.subtract(this.position).normal;
      const speed = this.speed;
      const movement = direction.multiply(speed);

      movement.multiply(Time.deltaTime);
  
      this.RigidBody.velocity.set(movement.x, movement.y);
    }

    // this.randomMovement(Time);
  }
  
}