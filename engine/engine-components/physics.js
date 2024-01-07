import DynamicSpatialHash from "./dynamic-spatial-hash.js";
import Vector from "./vector.js";

export default class Physics{
  #gravity = new Vector(0, 0);
  #wind = new Vector(0, 0);
  airDrag = 0.02;
  collisionIterations = 2;

  constructor() {
    this.SpatialHash = new DynamicSpatialHash(64);
  }

  get gravity(){
    return this.#gravity;
  }

  get wind(){
    return this.#wind;
  }

  set({ gravity, wind, airDrag }){
    if(gravity != null) this.#gravity.set(gravity);
    if(wind != null) this.#wind.set(wind);
    if(airDrag != null) this.airDrag = airDrag;
  }

  add(gameObject){
    if(!gameObject?.has('RigidBody') || !gameObject?.has("Collider")) return;
    this.SpatialHash.add(gameObject);
  }

  remove(gameObject){
    if(!gameObject) return;
    this.SpatialHash.delete(gameObject);
  }

  query(gameObject){
    return this.SpatialHash.query(gameObject);
  }

  update(gameObject){
    if(!gameObject?.has("Collider") || gameObject.destroyed || !gameObject.active) return;
    this.SpatialHash.update(gameObject);
  }

  applyPhysics(gameObject){
    const rigidBody = gameObject.RigidBody;

    if(!rigidBody) return;
  
    rigidBody.applyDrag(this.airDrag);
    if(!rigidBody.disableGravity) rigidBody.applyGravity(this.#gravity);
    if(!rigidBody.disableWind) rigidBody.applyWind(this.#wind);
  }

  collisions(gameObject){
    if(
      !gameObject.active ||
      !gameObject.Collider ||
      gameObject.Collider?.disableCollisions ||
      gameObject.destroyed ||
      (gameObject.Collider?.trigger)
    ) return;

    const SpatialHash = this.SpatialHash;
    const Collider = gameObject.Collider;

    for(let i = 0; i < this.collisionIterations; i++){
      const query = SpatialHash.query(gameObject);
  
      Collider.nearByObjects = query;

      if(query.length === 0) return Collider.nearByObjects = new Set();
  
      const queryLength = query.length;

      for (let i = 0; i < queryLength; i++) {
        const other = query[i];
        if (!other.Collider) continue;
        
        if(Collider.ignoredCollisions.has(other.GameObject) || other.ignoredCollisions.has(gameObject)) continue;
        if(Collider.ignoredCollisions.has(other.type) || other.ignoredCollisions.has(gameObject.type)) continue;

        const MTV = Collider.detectCollision(other.Collider);

        if (!MTV?.collided) continue;
        
        Collider.collision(other.Collider, MTV);

        SpatialHash.update(gameObject);
        SpatialHash.update(other);
      }
    }
  }
}