import Vector from "../../engine-components/vector.js";
import RigidBody from "./rigid-body.js";

export default class Collider{
  name = "Collider";
  static name = "Collider";
  disableCollisions = false;
  collisions = new Set();
  trigger = false;
  nearByObjects = new Set();
  #collisionCallbacks = new Map();
  #id = -1;

  constructor(gameObject){
    this.GameObject = gameObject;
    if(!this.GameObject.Shape) this.GameObject.add(new Shape(this.GameObject));
    if(!this.GameObject.RigidBody) this.GameObject.add(new RigidBody(this.GameObject));
  }

  get collidesOnlyWith(){ return this.GameObject.collidesOnlyWith; }
  get ignoredCollisions(){ return this.GameObject.ignoredCollisions; }
  get triggerOnlyCollisions(){ return this.GameObject.triggerOnlyCollisions; }

  onCollision(callback){
    callback.id = this.#id++;

    this.#collisionCallbacks.set(callback.id, callback);
  }

  offCollision(id){
    if(typeof id === "function") this.#collisionCallbacks.delete(id.id);
    else if(typeof id === "number") this.#collisionCallbacks.delete(id);
  }

  getMTV(other) {
    if (other === this || this.disableCollisions || other.disableCollisions) return { collided: false };

    const axesA = this.GameObject.Shape.normalAxes
    const axesB = other.GameObject.Shape.normalAxes
    const totalLength = axesA.length + axesB.length;

    let MTV = { collided: false, normal: new Vector(), overlap: 0, magnitude: Infinity };
    let minOverlap = Infinity;

    for(let i = 0; i < totalLength; i++){
      let axis;

      if(i < axesA.length) axis = axesA[i];
      else axis = axesB[i - axesA.length];

      const projections = this.getProjections(axis, other);
      const overlap = this.getOverlap(projections[0], projections[1]);

      if (overlap === 0) return { collided: false, normal: axis, overlap: overlap };

      else if (Math.abs(overlap) < minOverlap) {
        minOverlap = Math.abs(overlap);
        MTV = { collided: true, normal: axis, overlap: overlap, magnitude: minOverlap };
      }
    }

    const center1 = this.GameObject.Shape.centerOfMass;
    const center2 = other.GameObject.Shape.centerOfMass;
    const centerVector = center2.copy.subtract(center1);

    if (Vector.dot(centerVector, MTV.normal) < 0) MTV.normal.mult(-1);

    return MTV;
  }

  getProjections(axis, other) {
    const vertices1 = this.GameObject.Shape.vertices;
    const vertices2 = other.GameObject.Shape.vertices;
  
    let min1 = Infinity;
    let max1 = -Infinity;
    let min2 = Infinity;
    let max2 = -Infinity;
  
    const maxLength = Math.max(vertices1.length, vertices2.length);
  
    for (let i = 0; i < maxLength; i++) {
      if(i < vertices1.length){
        const projection1 = vertices1[i].dot(axis);
        min1 = Math.min(min1, projection1);
        max1 = Math.max(max1, projection1);
      }
  
      if(i < vertices2.length){
        const projection2 = vertices2[i].dot(axis);
        min2 = Math.min(min2, projection2);
        max2 = Math.max(max2, projection2);
      }
    }
  
    return [{ min: min1, max: max1 }, { min: min2, max: max2 }];
  }

  getOverlap(projection1, projection2) {
    if (projection1.min > projection2.max || projection2.min > projection1.max) return 0;
    const overlap1 = projection2.max - projection1.min;
    const overlap2 = projection1.max - projection2.min;
    return Math.min(overlap1, overlap2);
  }

  detectCollision = (other) => {
    if(!this.GameObject.Shape.isWithinBounds(other.GameObject.Shape, 1)) return { collided: false };
    return this.getMTV(other);
  }

  collision(other, MTV){
    if(this.collidesOnlyWith.size > 0 && (!this.collidesOnlyWith.has(other.GameObject.type) || !this.collidesOnlyWith.has(other.GameObject))) return;

    this.collisions.add(other);
    this.#collisionCallbacks.forEach(callback => callback(this, other, MTV));

    if(
      (other.collidesOnlyWith.size > 0 &&
      (!other.collidesOnlyWith.has(this.GameObject.type) || !other.collidesOnlyWith.has(this.GameObject))) ||
      this.trigger || other.trigger ||
      this.triggerOnlyCollisions.has(other.GameObject.type) || this.triggerOnlyCollisions.has(other.GameObject) ||
      other.triggerOnlyCollisions.has(this.GameObject.type) || other.triggerOnlyCollisions.has(this.GameObject)
    ) return;

    this.separateObjects(other, MTV);
  }

  separateObjects(other, MTV) {
    const overlap = MTV.overlap;
    const normal = MTV.normal;
    const direction = normal.copy.mult(overlap);
  
    const totalInverseMass = this.GameObject.RigidBody.inverseMass + other.GameObject.RigidBody.inverseMass;

    if(totalInverseMass <= 0) return;

    const separationFactorA = (this.GameObject.RigidBody.inverseMass / totalInverseMass) - 0.01;
    const separationFactorB = (other.GameObject.RigidBody.inverseMass / totalInverseMass) - 0.01;
  
    const separationVectorA = direction.copy.mult(-separationFactorA);
    const separationVectorB = direction.mult(separationFactorB);
  
    if(!this.GameObject.RigidBody.static) this.GameObject.position.add(separationVectorA);
    if(!other.GameObject.RigidBody.static) other.GameObject.position.add(separationVectorB);
  }

  afterUpdate(){
    this.collisions.forEach(other => {
      if(other.GameObject.destroyed || !this.GameObject.Shape.isWithinBounds(other.GameObject.Shape, 1))
        return this.collisions.delete(other);

      const MTV = this.getMTV(other);

      // if(MTV.collided) this.collision(other, MTV);
      // else this.collisions.delete(other);
      if(!MTV.collided) this.collisions.delete(other);
    });
  }
}