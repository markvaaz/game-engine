import Vector from "../../engine-components/vector.js";

export default class RigidBody{
  // Defining a static property called 'name' and assigning it the value 'RigidBody'
  static name = 'RigidBody';

  // Defining an instance property called 'name' and assigning it the value 'RigidBody'
  name = 'RigidBody';

  // Defining a private static property called '#static' and assigning it the value 'false'
  #static = false;

  // Defining a private instance property called '#mass' and assigning it the value '0'
  #mass = 0;

  // Defining a private instance property called '#inverseMass' and assigning it the value '0'
  #inverseMass = 0;

  // Defining a private instance property called '#density' and assigning it the value '1'
  #density = 1;

  // Defining an instance property called 'velocity' and assigning it a new instance of the 'Vector' class
  velocity = new Vector();

  // Defining an instance property called 'acceleration' and assigning it a new instance of the 'Vector' class
  acceleration = new Vector();

  // Defining an instance property called 'maxSpeed' and assigning it the value 'Infinity'
  maxSpeed = Infinity;

  // Defining an instance property called 'lastFrame' and assigning it the value '0'
  lastFrame = 0;

  constructor(gameObject){
    this.GameObject = gameObject;
    this.getShapeData();

    this.GameObject.size.onChange(() => this.getShapeData());
  }

  /**
   * Calculates the shape data for the RigidBody.
   * @returns {void}
   */
  getShapeData() {
    const shape = this.GameObject.Shape;

    // Check if shape component exists
    if (!shape) {
      throw new Error("RigidBody: No shape component found on game object.");
    }

    this.area = shape.getArea();
    this.#mass = this.#density * this.area;
    this.#inverseMass = 1 / this.mass;
  }

  /**
   * Get the mass of the object.
   *
   * @return {number} The mass of the object.
   */
  get mass(){
    if(this.#static) return Infinity;
    return this.#mass;
  }

  /**
   * Set the mass of the object.
   *
   * @param {number} value - The value to set as the mass.
   */
  set mass(value){
    if(value == Infinity) return this.#static = true;
    this.#mass = value;
    this.#inverseMass = 1 / this.#mass;
    this.#density = this.#mass / this.area;
  }

  /**
   * Get the inverse mass of the object.
   *
   * @return {number} The inverse mass value.
   */
  get inverseMass(){
    if(this.#static) return 0;
    return this.#inverseMass;
  }

  /**
   * Get the density value.
   *
   * @return {type} The density value.
   */
  get density(){
    return this.#density;
  }

  /**
   * Sets the density of the object and updates the mass and inverse mass accordingly.
   *
   * @param {number} value - The new density value.
   */
  set density(value){
    this.#density = value;
    this.#mass = this.#density * this.area;
    this.#inverseMass = 1 / this.#mass;
  }

  /**
   * Get the speed of the object.
   *
   * @return {number} The magnitude of the object's velocity.
   */
  get speed(){
    return this.velocity.magnitude;
  }

  /**
   * Get the value of the static property.
   *
   * @return {type} The value of the static property.
   */
  get static(){
    return this.#static;
  }

  /**
   * Set the value of the static property.
   *
   * @param {boolean} value - The new value for the static property.
   */
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

  /**
   * Apply a force to the object.
   *
   * @param {Vector | number} force - The force to apply. It can be a Vector object or a number.
   * @return {this} - Returns the modified object.
   */
  applyForce(force){
    if(!isNaN(force)) force = new Vector(force, force);
    else if(force instanceof Vector) force = force.copy;

    this.acceleration.add(force.mult(this.#inverseMass));

    return this;
  }

  /**
   * Applies an impulse to the object.
   *
   * @param {number|Vector} impulse - The impulse to apply. If a number is provided, it will be converted to a Vector with equal x and y components. If a Vector is provided, it will be used as is.
   * @return {Object} - Returns the object itself after applying the impulse.
   */
  applyImpulse(impulse){
    if(!isNaN(impulse)) impulse = new Vector(impulse, impulse);
    else if(impulse instanceof Vector) impulse = impulse.copy;

    this.velocity.add(impulse);

    this.velocity.limit(this.maxSpeed);

    return this;
  }

  /**
   * Sets the velocity of the object.
   *
   * @param {number|Vector} velocity - The velocity to set. If a number is provided, the x and y components of the velocity will be set to the same value.
   * @return {Object} - Returns the object itself for method chaining.
   */
  setVelocity(velocity){
    if(!isNaN(velocity)) velocity = new Vector(velocity, velocity);
    this.velocity.set(velocity);

    return this;
  }

  /**
   * Updates the GameObject's position based on velocity and acceleration.
   */
  update = () => {
    // Add acceleration to velocity
    this.velocity.add(this.acceleration);

    // Limit velocity to maximum speed
    this.velocity.limit(this.maxSpeed);

    // Update the position of the GameObject
    this.GameObject.position.add(this.velocity.copy);

    // Reset acceleration to zero
    this.acceleration.multiply(0);
  }
}
