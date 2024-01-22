import Vector from "../../engine-components/vector.js";
import Component from "./component.js";
import RigidBody from "./rigid-body.js";

export default class Collider extends Component{
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
    super();
    // Assign the gameObject parameter to the GameObject property
    this.GameObject = gameObject;

    // Check if the GameObject does not have a RigidBody
    if (!this.GameObject.RigidBody) {
      // If it doesn't, add a new RigidBody component to the GameObject
      this.GameObject.add(RigidBody);
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

  dispatch(collision){
    for(const callback of this.#collisionCallbacks.values()){
      callback(collision);
    }
  }
}