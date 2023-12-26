import Vector from "../../engine-components/vector.js";

export default class RigidBody{
  static name = 'RigidBody';
  name = 'RigidBody';
  #static = false;
  #mass = 0;
  #inverseMass = 0;
  #density = 1;
  velocity = new Vector();
  acceleration = new Vector();
  friction = 0.2;
  drag = 1;
  restitution = 1;
  disableGravity = false;
  disableWind = false;
  maxSpeed = Infinity;
  lastFrame = 0;

  constructor(gameObject){
    this.GameObject = gameObject;
    this.getShapeData();
  }

  getShapeData(){
    const shape = this.GameObject.Shape;
    if(!shape) return console.error("RigidBody: No shape component found on game object.");
    this.area = shape.getArea();
    this.#mass = this.#density * this.area;
    this.#inverseMass = 1 / this.mass;
  }

  get mass(){
    if(this.#static) return Infinity;
    return this.#mass;
  }

  set mass(value){
    if(value == Infinity) return this.#static = true;
    this.#mass = value;
    this.#inverseMass = 1 / this.#mass;
    this.#density = this.#mass / this.area;
  }

  get inverseMass(){
    if(this.#static) return 0;
    return this.#inverseMass;
  }

  get density(){
    return this.#density;
  }

  set density(value){
    this.#density = value;
    this.#mass = this.#density * this.area;
    this.#inverseMass = 1 / this.#mass;
  }

  get position(){
    return this.GameObject.position;
  }

  get lastPosition(){
    return this.GameObject.lastPosition;
  }

  get speed(){
    return this.velocity.magnitude;
  }

  get static(){
    return this.#static;
  }

  set static(value){
    this.#static = value;
    if(value){
      this.disableGravity = true;
      this.disableWind = true;
      this.velocity.set(0, 0);
      this.acceleration.set(0, 0);
      this.velocity.lock();
      this.acceleration.lock();
    }else{
      this.disableGravity = true;
      this.disableWind = true;
      this.velocity.unlock();
      this.acceleration.unlock();
    }
  }

  applyForce(force){
    if(!isNaN(force)) force = new Vector(force, force);
    else if(force instanceof Vector) force = force.copy;

    this.acceleration.add(force.mult(this.#inverseMass));

    return this;
  }

  applyImpulse(impulse){
    if(!isNaN(impulse)) impulse = new Vector(impulse, impulse);
    else if(impulse instanceof Vector) impulse = impulse.copy;

    this.velocity.add(impulse);

    this.velocity.limit(this.maxSpeed);

    return this;
  }

  applyDrag(c){
    const drag = this.velocity.negated.normalized.multiply(c);
    this.applyForce(drag);

    return this;
  }

  applyFriction(friction){
    if(friction instanceof Vector){
      this.acceleration.add(friction.negated);
    }else{
      const frictionMagnitude = this.velocity.magnitude * friction;
      const frictionDirection = this.velocity.negated.normalized;
      const frictionForce = frictionDirection.multiply(frictionMagnitude);
  
      this.acceleration.add(frictionForce);
    }

    return this;
  }

  applyGravity(gravity){
    if(!isNaN(gravity)) gravity = new Vector(gravity, gravity);
    else if(gravity instanceof Vector) gravity = gravity.copy;

    this.acceleration.add(gravity);

    return this;
  }

  applyWind(wind){
    if(!isNaN(wind)) wind = new Vector(wind, wind);
    else if(wind instanceof Vector) wind = wind.copy;

    this.acceleration.add(wind.mult(this.#inverseMass).multiply(this.drag));

    return this;
  }

  setVelocity(velocity){
    if(!isNaN(velocity)) velocity = new Vector(velocity, velocity);
    this.velocity.set(velocity);

    return this;
  }

  update = (Time) => {
    this.velocity.add(this.acceleration);

    this.velocity.limit(this.maxSpeed);

    this.GameObject.position.add(this.velocity.copy);

    this.acceleration.multiply(0);
  }
}
