import DynamicSpatialHash from "./dynamic-spatial-hash.js";
import Vector from "./vector.js";

export default class Physics{
  collisionIterations = 2;
  SpatialHash = new DynamicSpatialHash(64);

  /**
   * Adds a game object to the spatial hash if it has a 'RigidBody' component and a 'Collider' component.
   *
   * @param {type} gameObject - the game object to be added
   * @return {type} undefined
   */
  add(gameObject){
    if(!gameObject?.has('RigidBody') || !gameObject?.has("Collider")) return;
    this.SpatialHash.add(gameObject);
  }

  /**
   * Removes a game object from the SpatialHash.
   *
   * @param {gameObject} gameObject - The game object to remove.
   */
  remove(gameObject){
    if(!gameObject) return;
    this.SpatialHash.delete(gameObject);
  }

  /**
   * Query the spatial hash for game objects in the same bounds as the given game object.
   *
   * @param {object} gameObject - The game object to query with.
   * @return {type} The result of the query.
   */
  query(gameObject){
    return this.SpatialHash.query(gameObject);
  }

  /**
   * Updates the game object in the spatial hash.
   *
   * @param {Object} gameObject - The game object to update.
   */
  update(gameObject){
    if(!gameObject?.has("Collider") || gameObject.destroyed || !gameObject.active) return;
    this.SpatialHash.update(gameObject);
  }

  /**
   * Detect and handle collisions for the given game object.
   * @param {GameObject} gameObject - The game object to check for collisions.
   */
  collisions(gameObject) {
    // Skip collision detection if the game object is not active,
    // does not have a Collider component, has disabled collisions,
    // is destroyed, or is a trigger.
    if (!gameObject.active || !gameObject.Collider || gameObject.Collider.disableCollisions || gameObject.destroyed || gameObject.Collider.trigger) {
      return;
    }

    const spatialHash = this.SpatialHash;
    const collider = gameObject.Collider;

    // Iterate through collision checks for the specified number of iterations.
    for (let i = 0; i < this.collisionIterations; i++) {
      // Query the spatial hash for nearby objects.
      const query = spatialHash.query(gameObject);

      collider.nearByObjects = query;

      // If no nearby objects are found, clear the set and return.
      if (query.length === 0) {
        collider.nearByObjects = new Set();
        return;
      }

      // Iterate through each nearby object.
      for (let i = 0; i < query.length; i++) {
        const other = query[i];
        if (!other.Collider) {
          continue;
        }

        // Skip collision detection if the colliders are ignored.
        if (collider.ignoredCollisions.has(other.GameObject) || other.ignoredCollisions.has(gameObject)) {
          continue;
        }

        // Skip collision detection if the collider types are ignored.
        if (collider.ignoredCollisions.has(other.type) || other.ignoredCollisions.has(gameObject.type)) {
          continue;
        }

        // Detect collision and obtain minimum translation vector (MTV).
        const MTV = collider.detectCollision(other.Collider);

        // Skip collision handling if no collision occurred.
        if (!MTV || !MTV.collided) {
          continue;
        }

        // Handle collision between the colliders.
        collider.collision(other.Collider, MTV);

        // Update the spatial hash for both objects.
        spatialHash.update(gameObject);
        spatialHash.update(other);
      }
    }
  }
}