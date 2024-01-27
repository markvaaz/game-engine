import DynamicSpatialHash from "./dynamic-spatial-hash.js";
import Events from "./events.js";
import Vector from "./vector.js";

export default class SAT{
  GameObjects = new Map();
  Collisions = new Map();
  SpatialHash = new DynamicSpatialHash(64);
  iterations = 1;
  collisionInformation = { collided: false, normal: new Vector(), overlap: Infinity, tangent: new Vector(), penetration: new Vector(), axis: new Vector(), center: new Vector() };

  constructor({ cellSize = 64 } = {}){
    this.SpatialHash.cellSize = cellSize;
  }

  add(gameObject){
    if(!gameObject.Collider) return;
    this.GameObjects.set(gameObject.id, gameObject);
    this.SpatialHash.add(gameObject);
  }

  delete(gameObject){
    this.GameObjects.delete(gameObject.id);
    this.SpatialHash.delete(gameObject);
  }

  update(){
    this.checkCollisions();
  }

  updateHash(gameObject){
    if(gameObject.destroyed) return this.SpatialHash.delete(gameObject);
    if(!gameObject.Collider || !gameObject.active) return;

    this.SpatialHash.update(gameObject);
  }

  checkCollisions(){
    for(let i = 0; i < this.iterations; i++){
      for(const gameObjectA of this.GameObjects.values()){
        this.updateHash(gameObjectA);
        if(!gameObjectA.Collider || gameObjectA.Collider.disabled || !gameObjectA.active) continue;
        const query = this.SpatialHash.query(gameObjectA);

        for(const gameObjectB of query){
          if(this.Collisions.has(`${gameObjectA.id}-${gameObjectB.id}`) || this.Collisions.has(`${gameObjectB.id}-${gameObjectA.id}`)) continue;

          const collisionInformation = this.getCollisionInformation(gameObjectA, gameObjectB);

          if(collisionInformation.collided){
            const collision = new Collision({ gameObjectA, gameObjectB, ...collisionInformation }); // Create a collision object for later modification in the algorithm and for the event system.
            this.solveCollision(collision);
          }
        }
      }
    }
  }

  solveCollision(collision){
    const { gameObjectA, gameObjectB } = collision;
    const thisType = gameObjectA.type;
    const otherType = gameObjectB.type;

    /* ---- Filters start ---- */
    
    // Check if the object has specific collision restrictions
    if(gameObjectA.Collider.ignoredCollisions.has(otherType) || gameObjectA.Collider.ignoredCollisions.has(gameObjectB)){
      this.Collisions.delete(collision.id);
      return;
    }

    if(gameObjectB.Collider.ignoredCollisions.has(thisType) || gameObjectB.Collider.ignoredCollisions.has(gameObjectA)){
      this.Collisions.delete(collision.id);
      return;
    }

    // Check if the object can only collide with certain types of objects
    if(gameObjectA.collidesOnlyWith.size > 0 && !(gameObjectA.collidesOnlyWith.has(otherType) || gameObjectA.collidesOnlyWith.has(gameObjectB))){
      this.Collisions.delete(collision.id);
      return;
    }

    if(gameObjectB.collidesOnlyWith.size > 0 && !(gameObjectB.collidesOnlyWith.has(thisType) || gameObjectB.collidesOnlyWith.has(gameObjectA))){
      this.Collisions.delete(collision.id);
      return;
    }

    gameObjectA.Collider.dispatch(collision);
    gameObjectB.Collider.dispatch(collision);
    Events.dispatch("collision", collision);

    // Check if either object is a trigger or has trigger-only collisions
    if(gameObjectA.Collider.trigger || gameObjectB.Collider.trigger || gameObjectA.triggerOnlyCollisions.has(otherType) || gameObjectA.triggerOnlyCollisions.has(gameObjectB) || gameObjectB.Collider.triggerOnlyCollisions.has(thisType) || gameObjectB.Collider.triggerOnlyCollisions.has(gameObjectA)){
      this.Collisions.delete(collision.id);
      return;
    }

    /* ---- Filters end ---- */

    this.separate(collision);
  }

  separate(collision){
    const { gameObjectA, gameObjectB, penetration } = collision;
    const direction = penetration.copy;

    // Calculate the total inverse mass
    const totalInverseMass = gameObjectA.RigidBody.inverseMass + gameObjectB.RigidBody.inverseMass;

    // Check if the total inverse mass is non-positive
    if(totalInverseMass <= 0) return;

    // Calculate the separation factors
    const separationFactorA = (gameObjectA.RigidBody.inverseMass / totalInverseMass);
    const separationFactorB = (gameObjectB.RigidBody.inverseMass / totalInverseMass);

    // Calculate the separation vectors
    const separationVectorA = direction.copy.mult(-separationFactorA);
    const separationVectorB = direction.mult(separationFactorB);

    // Move the objects based on the separation vectors
    if(!gameObjectA.RigidBody.static) gameObjectA.position.add(separationVectorA);
    if(!gameObjectB.RigidBody.static) gameObjectB.position.add(separationVectorB);
  }

  /**
   * Determines collision information between two game objects using the Separating Axis Theorem (SAT).
   *
   * @param {GameObject} gameObjectA - The first game object involved in the collision.
   * @param {GameObject} gameObjectB - The second game object involved in the collision.
   * @returns {MTV} - Object containing the collision information.
   */
  getCollisionInformation(gameObjectA, gameObjectB) {
    if(
      gameObjectA === gameObjectB ||
      gameObjectA.Collider.disabled ||
      gameObjectB.Collider.disabled ||
      // AABB collision check to avoid unnecessary calculations
      !gameObjectA.Shape.isWithinBounds(gameObjectB.Shape.bounds, 1)
    ) return { collided: false };
    
    const CI = this.collisionInformation;
    const verticesA = gameObjectA.Shape.vertices;
    const verticesB = gameObjectB.Shape.vertices;

    // Reset the collision information
    CI.collided = false;
    CI.overlap = Infinity;
    
    // Get the maximum length of the vertices to avoid multiple loops. For example,
    // if the total vertices from A are 20 and the total vertices from B are 30,
    // it will loop 30 times instead of 50 (the some of the vertices length).
    // Although the number of calculations in this state is approximately the same,
    // it may be helpful (or not) depending on the changes.
    const lenghtA = verticesA.length;
    const lenghtB = verticesB.length;
    const maxLength = Math.max(lenghtA, lenghtB);

    for(let i = 0; i < maxLength; i++){
      if(i < lenghtA && !this.getMTV(verticesA, verticesB, i))
        return CI;

      if(i < lenghtB && !this.getMTV(verticesB, verticesA, i))
        return CI;
    }

    // Calculate the relative position vector 'center' from the center of gameObjectA to gameObjectB,
    // then check if this vector points in the opposite direction to the collision normal.
    // If so, invert the collision-related vectors in the MTV (Minimum Translation Vector) object
    // to ensure they align correctly for resolving the collision.
    const center = CI.center.set(gameObjectB.Shape.centerOfMass).sub(gameObjectA.Shape.centerOfMass);

    // Check if the center vector aligns with the collision normal (dot product < 0)
    if (center.dot(CI.normal) < 0) {
      // If the center vector points in the opposite direction to the collision normal,
      // invert the normal, tangent, and penetration vectors in the MTV to ensure proper collision resolution.
      CI.normal.negate();
      CI.tangent.negate();
      CI.penetration.negate();
    }

    return CI;
  }

  /**
   * Calculate the Minimum Translation Vector (MTV) between two sets of vertices.
   * @param {Array} verticesA - Vertices of object A.
   * @param {Array} verticesB - Vertices of object B.
   * @param {number} index - Index of the current vertex in verticesA.
   * @returns {boolean} - Returns true if a collision occurred, false otherwise.
   */
  getMTV(verticesA, verticesB, index){
    const vertexA = verticesA[index];
    const vertexB = verticesA[index + 1] ?? verticesA[0];
    const CI = this.collisionInformation;

    // Calculate the axis perpendicular to the current edge.
    const axis = CI.axis.set(-(vertexB.y - vertexA.y), vertexB.x - vertexA.x).normalize();
    
    // Get the overlap along the axis.
    const overlap = this.getOverlap(axis, verticesA, verticesB);

    // If there's no overlap, update the MTV to indicate no collision.
    if(overlap === 0) return CI.collided = false;

    // If the absolute overlap is less than the current minimum overlap in the MTV,
    // update the MTV with information about the current collision.
    if(Math.abs(overlap) < CI.overlap){
      CI.collided = true;
      
      CI.overlap = Math.abs(overlap);

      CI.normal.set(axis.x, axis.y);

      CI.tangent.set(-CI.normal.y, CI.normal.x);

      CI.penetration.set(CI.normal.x * overlap, CI.normal.y * overlap);
    }

    return CI.collided;
  }

  /**
   * Calculate the overlap between two sets of vertices along a specified axis.
   *
   * @param {Vector} axis - The axis along which the overlap is calculated.
   * @param {Array} verticesA - Vertices of the first object.
   * @param {Array} verticesB - Vertices of the second object.
   * @returns {number} - The overlap between the two sets of vertices along the specified axis.
   */
  getOverlap(axis, verticesA, verticesB){
    let minA = Infinity;
    let maxA = -Infinity;
    let minB = Infinity;
    let maxB = -Infinity;

    const lenghtA = verticesA.length;
    const lenghtB = verticesB.length;

    const maxLength = Math.max(lenghtA, lenghtB);

    // Loop through vertices to calculate projections and find minimum and maximum values
    for (let i = 0; i < maxLength; i++) {
      if(i < lenghtA){
        const projection = axis.dot(verticesA[i]);
        minA = Math.min(minA, projection);
        maxA = Math.max(maxA, projection);
      }

      if(i < lenghtB){
        const projection = axis.dot(verticesB[i]);
        minB = Math.min(minB, projection);
        maxB = Math.max(maxB, projection);
      }
    }

    // Check for separation along the axis, return 0 if no overlap
    if (minA > maxB || minB > maxA) return 0;

    // Calculate the overlap between the two projections
    return Math.min(maxB - minA, maxA - minB);
  }
}


class Collision{
  gameObjectA = null;
  gameObjectB = null;
  overlap = 0;
  normal = new Vector();
  tangent = new Vector();
  penetration = new Vector();
  id = null;
  idB = null;
  collided = false;

  constructor({ gameObjectA, gameObjectB, overlap, normal, tangent, penetration, collided }){
    this.gameObjectA = gameObjectA;
    this.gameObjectB = gameObjectB;
    this.overlap = overlap;
    this.normal.set(normal);
    this.tangent.set(tangent);
    this.penetration.set(penetration);
    this.id = `${gameObjectA.id}-${gameObjectB.id}`;
    this.idB = `${gameObjectB.id}-${gameObjectA.id}`;
    this.collided = collided;
  }
}