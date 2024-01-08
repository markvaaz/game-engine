import Vector from "../../engine-components/vector.js";
import RigidBody from "./rigid-body.js";

export default class Collider{
  // Define a variable 'name' and assign it the value "Collider"
  name = "Collider";

  // Define a static property 'name' and assign it the value "Collider"
  static name = "Collider";

  // Define a variable 'disableCollisions' and assign it the value false
  disableCollisions = false;

  // Create a new empty set 'collisions'
  collisions = new Set();

  // Define a variable 'trigger' and assign it the value false
  trigger = false;

  // Create a new empty set 'nearByObjects'
  nearByObjects = new Set();

  // Create a new empty map 'collisionCallbacks'
  #collisionCallbacks = new Map();

  // Define a variable 'id' and assign it the value -1
  #id = -1;

  constructor(gameObject) {
    // Assign the gameObject parameter to the GameObject property
    this.GameObject = gameObject;

    // Check if the GameObject does not have a Shape
    if (!this.GameObject.Shape) {
      // If it doesn't, add a new Shape component to the GameObject
      this.GameObject.add(new Shape(this.GameObject));
    }

    // Check if the GameObject does not have a RigidBody
    if (!this.GameObject.RigidBody) {
      // If it doesn't, add a new RigidBody component to the GameObject
      this.GameObject.add(new RigidBody(this.GameObject));
    }
  }

  get collidesOnlyWith(){ return this.GameObject.collidesOnlyWith; }
  get ignoredCollisions(){ return this.GameObject.ignoredCollisions; }
  get triggerOnlyCollisions(){ return this.GameObject.triggerOnlyCollisions; }

  /**
   * Adds a collision callback function to the list of collision callbacks.
   *
   * @param {function} callback - The callback function to be added.
   */
  onCollision(callback){
    callback.id = this.#id++;

    this.#collisionCallbacks.set(callback.id, callback);
  }

/**
 * Removes the collision callback with the specified ID.
 *
 * @param {number|function} id - The ID of the collision callback to remove.
 */
  offCollision(id){
    if(typeof id === "function") this.#collisionCallbacks.delete(id.id);
    else if(typeof id === "number") this.#collisionCallbacks.delete(id);
  }

  /**
   * Calculates the Minimum Translation Vector (MTV) between two colliding objects.
   * 
   * @param {Object} other - The other colliding object.
   * @returns {Object} - The MTV between the two objects.
   */
  getMTV(other) {
    // Check if collision is disabled or the objects are the same
    if (other === this || this.disableCollisions || other.disableCollisions) {
      // Return no collision
      return { collided: false };
    }

    // Get the normal axes of both objects
    const axesA = this.GameObject.Shape.normalAxes;
    const axesB = other.GameObject.Shape.normalAxes;

    // Get the total number of axes to iterate in only one loop
    const totalLength = axesA.length + axesB.length;

    // Initialize variables
    let MTV = { collided: false, normal: new Vector(), overlap: 0, magnitude: Infinity };
    let minOverlap = Infinity;

    // Iterate over every axis
    for(let i = 0; i < totalLength; i++){
      let axis;

      // Determine the axis based on the length of axesA and axesB
      if(i < axesA.length) {
        axis = axesA[i];
      } else {
        axis = axesB[i - axesA.length];
      }

      // Get the projections of both objects onto the axis
      const projections = this.getProjections(axis, other);
      // Get the overlap between the projections
      const overlap = this.getOverlap(projections[0], projections[1]);

      // If there is no overlap, return no collision
      if (overlap === 0) {
        return { collided: false, normal: axis, overlap: overlap };
      }
      // If the overlap is smaller than the current minimum overlap, update MTV
      else if (Math.abs(overlap) < minOverlap) {
        minOverlap = Math.abs(overlap);
        MTV = { collided: true, normal: axis, overlap: overlap, magnitude: minOverlap };
      }
    }

    // Calculate the center vectors of both objects
    const center1 = this.GameObject.Shape.centerOfMass;
    const center2 = other.GameObject.Shape.centerOfMass;
    const centerVector = center2.copy.subtract(center1);

    // Reverse the normal vector
    if (Vector.dot(centerVector, MTV.normal) < 0) {
      MTV.normal.mult(-1);
    }

    return MTV;
  }

  /**
   * Get the projections of two objects onto a given axis.
   * @param {Vector} axis - The axis onto which the projections are calculated.
   * @param {Object} other - The other object for which the projections are calculated.
   * @returns {Array} An array containing the projections of the two objects.
   */
  getProjections(axis, other) {
    // Get the vertices of the two objects
    const vertices1 = this.GameObject.Shape.vertices;
    const vertices2 = other.GameObject.Shape.vertices;

    // Initialize variables to store the minimum and maximum projections
    let min1 = Infinity;
    let max1 = -Infinity;
    let min2 = Infinity;
    let max2 = -Infinity;

    // Get the maximum length of the two sets of vertices
    const maxLength = Math.max(vertices1.length, vertices2.length);

    // Iterate over the vertices and calculate the projections
    for (let i = 0; i < maxLength; i++) {
      if(i < vertices1.length){
        const projection1 = axis.dot(vertices1[i]);
        min1 = Math.min(min1, projection1);
        max1 = Math.max(max1, projection1);
      }

      if(i < vertices2.length){
        const projection2 = axis.dot(vertices2[i]);
        min2 = Math.min(min2, projection2);
        max2 = Math.max(max2, projection2);
      }
    }

    // Return the projections as an array of objects
    return [{ min: min1, max: max1 }, { min: min2, max: max2 }];
  }

  /**
   * Calculates the overlap between two projections.
   *
   * @param {Object} projection1 - The first projection.
   * @param {Object} projection2 - The second projection.
   * @returns {number} The overlap between the two projections.
   */
  getOverlap(projection1, projection2) {
    if (projection1.min > projection2.max || projection2.min > projection1.max) return 0;
    const overlap1 = projection2.max - projection1.min;
    const overlap2 = projection1.max - projection2.min;
    return Math.min(overlap1, overlap2);
  }

  /**
   * Check if there is a collision between the current object and another object.
   * @param {Object} other - The other object to check for collision with.
   * @returns {Object} - An object indicating whether a collision occurred and the minimum translation vector (MTV) if applicable.
   */
  detectCollision = (other) => {
    // Check if the current object is within the bounds of the other object
    if (!this.GameObject.Shape.isWithinBounds(other.GameObject.Shape.bounds, 1)) {
        // If not within bounds, return false to indicate no collision
        return { collided: false };
    }
    
    // If within bounds, calculate and return the minimum translation vector (MTV)
    return this.getMTV(other);
  }

  /**
   * Handles collision between the current object and another object.
   * @param {object} other - The other object involved in the collision.
   * @param {object} MTV - The Minimum Translation Vector (MTV) for separating the objects.
   */
  collision(other, MTV) {
    // Check if the current object has specific collision restrictions
    const thisType = this.GameObject.type;
    const otherType = other.GameObject.type;

    // If the current object can only collide with certain types of objects
    if (
      this.collidesOnlyWith.size > 0 &&
      (!this.collidesOnlyWith.has(otherType) || !this.collidesOnlyWith.has(other.GameObject))
    ) {
      return;
    }

    // Add the other object to the collisions set
    this.collisions.add(other);

    // Call the collision callbacks for the current object
    this.#collisionCallbacks.forEach(callback => callback({ colliderA: this, colliderB: other, MTV, ended: false }));

    // Check if the other object has specific collision restrictions
    if (
      other.collidesOnlyWith.size > 0 &&
      (!other.collidesOnlyWith.has(thisType) || !other.collidesOnlyWith.has(this.GameObject))
    ) {
      return;
    }

    // Check if either object is a trigger or has trigger-only collisions
    if (
      this.trigger ||
      other.trigger ||
      this.triggerOnlyCollisions.has(otherType) ||
      this.triggerOnlyCollisions.has(other.GameObject) ||
      other.triggerOnlyCollisions.has(thisType) ||
      other.triggerOnlyCollisions.has(this.GameObject)
    ) {
      return;
    }

    // Separate the objects using the Minimum Translation Vector (MTV)
    this.separateObjects(other, MTV);
  }

  /**
   * Separates two objects based on the minimum translation vector (MTV).
   * @param {Object} other - The other object to separate from.
   * @param {Object} MTV - The minimum translation vector.
   */
  separateObjects(other, MTV) {
    // Extract relevant information from MTV
    const overlap = MTV.overlap;
    const normal = MTV.normal;

    // Calculate the separation direction
    const direction = normal.copy.mult(overlap);

    // Calculate the total inverse mass
    const totalInverseMass = this.GameObject.RigidBody.inverseMass + other.GameObject.RigidBody.inverseMass;

    // Check if the total inverse mass is non-positive
    if(totalInverseMass <= 0) return;

    // Calculate the separation factors
    const separationFactorA = (this.GameObject.RigidBody.inverseMass / totalInverseMass) - 0.01;
    const separationFactorB = (other.GameObject.RigidBody.inverseMass / totalInverseMass) - 0.01;

    // Calculate the separation vectors
    const separationVectorA = direction.copy.mult(-separationFactorA);
    const separationVectorB = direction.mult(separationFactorB);

    // Move the objects based on the separation vectors
    if(!this.GameObject.RigidBody.static) this.GameObject.position.add(separationVectorA);
    if(!other.GameObject.RigidBody.static) other.GameObject.position.add(separationVectorB);
  }

  /**
   * Removes collisions that are no longer valid after updating the game state.
   */
  afterUpdate(){
    this.collisions.forEach((other) => {
      // Remove collisions with destroyed game objects
      if (other.GameObject.destroyed) {
        return this.collisions.delete(other);
      }

      // Remove collisions with game objects that are no longer within the bounds
      if (!this.GameObject.Shape.isWithinBounds(other.GameObject.Shape.bounds, 1)) {
        this.#collisionCallbacks.forEach(callback => callback({ colliderA: this, colliderB: other, MTV: null, ended: true }));
        return this.collisions.delete(other);
      }

      const MTV = this.getMTV(other);

      // Remove collisions that are no longer valid
      if (!MTV.collided) {
        this.collisions.delete(other);
        this.#collisionCallbacks.forEach(callback => callback({ colliderA: this, colliderB: other, MTV, ended: true }));
      }
    });
  }
}