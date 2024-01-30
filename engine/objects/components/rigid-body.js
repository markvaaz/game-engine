import Vector from "../../engine-components/vector.js";
import Component from "./component.js";

export default class RigidBody extends Component{
  static name = 'RigidBody';
  name = 'RigidBody';
  #static = false;
  #mass = 0;
  #inverseMass = 0;
  #density = 1;
  velocity = new Vector();
  acceleration = new Vector();
  maxSpeed = Infinity;
  restitution = 0.5;
  friction = 0.01;
  centerOfMass = new Vector();
  lastFrame = 0;
  grounded = false;
  inertia = 0;

  constructor(gameObject){
    super();
    this.GameObject = gameObject;
    this.getShapeData();

    this.velocity.onChange((x, y, vector) => {
      this.GameObject.Render.transform.velocity.x = vector.x;
      this.GameObject.Render.transform.velocity.y = vector.y;
    })

    this.GameObject.size.onChange(() => this.getShapeData());
  }

  getShapeData() {
    const shape = this.GameObject.Shape;

    if (!shape) {
      throw new Error("RigidBody: No shape component found on game object.");
    }

    this.centerOfMass = shape.getCenterOfMass();
    this.area = shape.getArea();
    this.#mass = this.#density * this.area;
    this.#inverseMass = 1 / this.mass;
    this.inertia = this.mass * this.centerOfMass.magnitudeSquared;
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

  get speed(){
    return this.velocity.magnitude;
  }

  get static(){
    return this.#static;
  }

  set static(value){
    this.#static = value;
    if(value){
      this.velocity.set(0, 0);
      this.acceleration.set(0, 0);
      this.velocity.lock();
      this.acceleration.lock();
    }else{
      this.velocity.unlock();
      this.acceleration.unlock();
    }
  }

  applyTorque(torque) {
    this.torque += torque;
  }

  applyForce(force){
    this.acceleration.add(force.copy.multiply(this.#inverseMass));
  }

  applyImpulse(impulse){
    this.velocity.add(impulse.copy.multiply(this.#inverseMass));
  }

  applyFriction(friction){
    this.velocity.multiply(1 - friction);
  }

  update = () => {
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxSpeed);
    this.GameObject.position.add(this.velocity.copy);
    this.acceleration.multiply(0);
  }
}
