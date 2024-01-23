import DynamicSpatialHash from "./dynamic-spatial-hash.js";
import Events from "./events.js";
import Vector from "./vector.js";

export default class SAT{
  GameObjects = new Map();
  collisions = new Map();
  deletedCollisions = new Map();
  SpatialHash = new DynamicSpatialHash(64);
  iterations = 2;

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
        if(!gameObjectA.Collider || gameObjectA.Collider.disableCollisions || !gameObjectA.active) continue;
        const query = this.SpatialHash.query(gameObjectA);

        for(const gameObjectB of query){
          if(this.collisions.has(`${gameObjectA.id}-${gameObjectB.id}`) || this.collisions.has(`${gameObjectB.id}-${gameObjectA.id}`)) continue;

          const collisionInformation = this.getCollisionInformation(gameObjectA, gameObjectB);

          if(collisionInformation.collided){

            const collision = new Collision({ gameObjectA, gameObjectB, ...collisionInformation }); // Create a collision object for later modification in the algorithm and for the event system.

            this.solveCollisions(collision);
          }
        }
      }
    }
  }

  solveCollisions(collision){
    const { gameObjectA, gameObjectB } = collision;
    const thisType = gameObjectA.type;
    const otherType = gameObjectB.type;

    /* ---- Filters start ---- */
    
    // Check if the object has specific collision restrictions
    if(gameObjectA.Collider.ignoredCollisions.has(otherType) || gameObjectA.Collider.ignoredCollisions.has(gameObjectB)){
      this.collisions.delete(collision.id);
      return;
    }

    if(gameObjectB.Collider.ignoredCollisions.has(thisType) || gameObjectB.Collider.ignoredCollisions.has(gameObjectA)){
      this.collisions.delete(collision.id);
      return;
    }

    // Check if the object can only collide with certain types of objects
    if(gameObjectA.collidesOnlyWith.size > 0 && !(gameObjectA.collidesOnlyWith.has(otherType) || gameObjectA.collidesOnlyWith.has(gameObjectB))){
      this.collisions.delete(collision.id);
      return;
    }

    if(gameObjectB.collidesOnlyWith.size > 0 && !(gameObjectB.collidesOnlyWith.has(thisType) || gameObjectB.collidesOnlyWith.has(gameObjectA))){
      this.collisions.delete(collision.id);
      return;
    }

    // Check if either object is a trigger or has trigger-only collisions
    if(gameObjectA.Collider.trigger || gameObjectB.Collider.trigger || gameObjectA.triggerOnlyCollisions.has(otherType) || gameObjectA.triggerOnlyCollisions.has(gameObjectB) || gameObjectB.Collider.triggerOnlyCollisions.has(thisType) || gameObjectB.Collider.triggerOnlyCollisions.has(gameObjectA)){
      this.collisions.delete(collision.id);

      gameObjectA.Collider.dispatch(collision);
      gameObjectB.Collider.dispatch(collision);
      Events.emit("collision", collision);

      return;
    }

    /* ---- Filters end ---- */

    gameObjectA.Collider.dispatch(collision);
    gameObjectB.Collider.dispatch(collision);
    Events.dispatch("collision", collision);

    this.separate(collision);
  }

  separate(collision){
    const { gameObjectA, gameObjectB, penetration, normal, tangent } = collision;
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

  getCollisionInformation(gameObjectA, gameObjectB) {
    if (gameObjectA === gameObjectB || gameObjectA.Collider.disableCollisions || gameObjectB.Collider.disableCollisions || !gameObjectA.Shape.isWithinBounds(gameObjectB.Shape.bounds, 1)) {
      return { collided: false };
    }

    const verticesA = gameObjectA.Shape.vertices;
    const verticesB = gameObjectB.Shape.vertices;
    const MTV = { collided: false, normal: null, overlap: Infinity, tangent: null, penetration: null };
    const maxLength = Math.max(verticesA.length, verticesB.length);

    const getMTV = (vertices, i) => {
      const vertex = vertices[i];

      const axis = this.getAxis(vertex, vertices[i + 1] || vertices[0]);
      
      const projections = this.getProjections(axis.normal, verticesA, verticesB);
      
      const overlap = this.getOverlap(projections[0], projections[1]);

      if(overlap === 0){
        MTV.collided = false;
      }

      if(Math.abs(overlap) < MTV.overlap){
        MTV.overlap = Math.abs(overlap);
        MTV.normal = axis.normal;
        MTV.tangent = new Vector(-MTV.normal.y, MTV.normal.x);
        MTV.penetration = MTV.normal.copy.multiply(overlap);
        MTV.collided = true;
      }

      return MTV.collided;
    }

    for(let i = 0; i < maxLength; i++){
      if(i < verticesA.length && !getMTV(verticesA, i)) return MTV;
      if(i < verticesB.length && !getMTV(verticesB, i)) return MTV;
    }

    const centerA = gameObjectA.Shape.centerOfMass;
    const centerB = gameObjectB.Shape.centerOfMass;
    const centerVector = centerB.copy.subtract(centerA);

    if (Vector.dot(centerVector, MTV.normal) < 0) {
      MTV.normal.negate();
      MTV.tangent.negate();
      MTV.penetration.negate();
    }

    return MTV;
  }

  getAxis(vertexA, vertexB){
    return new Vector(-(vertexB.y - vertexA.y), vertexB.x - vertexA.x);
  }

  getProjections(axis, verticesA, verticesB){
    let minA = Infinity;
    let maxA = -Infinity;
    let minB = Infinity;
    let maxB = -Infinity;

    const maxLength = Math.max(verticesA.length, verticesB.length);

    for (let i = 0; i < maxLength; i++) {
      if(i < verticesA.length){
        const projection = axis.dot(verticesA[i]);
        minA = Math.min(minA, projection);
        maxA = Math.max(maxA, projection);
      }

      if(i < verticesB.length){
        const projection = axis.dot(verticesB[i]);
        minB = Math.min(minB, projection);
        maxB = Math.max(maxB, projection);
      }
    }

    return [{ min: minA, max: maxA }, { min: minB, max: maxB }];
  }

  getOverlap(projectionA, projectionB) {
    if (projectionA.min > projectionB.max || projectionB.min > projectionA.max) return 0;
    const overlapA = projectionB.max - projectionA.min;
    const overlapB = projectionA.max - projectionB.min;
    return Math.min(overlapA, overlapB);
  }
}


class Collision{
  constructor({
    gameObjectA = null,
    gameObjectB = null,
    overlap = 0,
    normal = new Vector(0, 0),
    tangent = new Vector(0, 0),
    penetration = new Vector(0, 0),
    collided = false
  }){
    this.gameObjectA = gameObjectA;
    this.gameObjectB = gameObjectB;
    this.overlap = overlap;
    this.normal = normal;
    this.tangent = tangent;
    this.penetration = penetration;
    this.id = `${gameObjectA.id}-${gameObjectB.id}`;
    this.idB = `${gameObjectB.id}-${gameObjectA.id}`;
    this.collided = collided;
  }
}
