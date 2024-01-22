import Vector from "./vector.js";

export default class Physics{
  wind = new Vector(0, 0);
  airDrag = 0.05;

  applyPhysics(gameObject){
    if(!gameObject.RigidBody) return;
    
    this.applyWind(gameObject);
    this.applyAirDrag(gameObject);
  }

  applyWind(gameObject){
    gameObject.RigidBody.velocity.add(this.wind.copy.multiply(gameObject.RigidBody.inverseMass));
    gameObject.position.add(gameObject.RigidBody.velocity);
  }

  applyAirDrag(gameObject){
    gameObject.RigidBody.velocity.multiply(1 - this.airDrag);
    gameObject.position.add(gameObject.RigidBody.velocity);
  }
}