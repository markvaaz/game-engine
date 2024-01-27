import Component from "./components/component.js";
import Render from "./components/render.js";
import Transform from "./components/transform.js";

export default class GameObject {
  // The name of the game object
  static name = 'GameObject';
  
  // The name of the game object (instance property)
  name = 'GameObject';
  
  // A map to store the components of the game object
  components = new Map();
  
  // A map to store the children of the game object
  children = new Map();
  
  // A set to store the game object's collision targets
  collidesOnlyWith = new Set();
  
  // A set to store the game object's ignored collisions
  ignoredCollisions = new Set();
  
  // A set to store the game object's trigger-only collisions
  triggerOnlyCollisions = new Set();
  
  // Indicates if the game object is destroyed or not
  destroyed = false;
  
  // The scene the game object belongs to
  Scene = null;
  
  // Indicates if the game object is visible or not
  visible = true;
  
  // The update mode of the game object
  updateMode = "all";
  
  // Private field to store the layer of the game object
  #layer = 0;
  
  // Private field to store the ID of the game object
  #id = "";
  
  constructor(){
    this.add(Transform);
    this.add(Render);
  }

  /**
   * Returns the id of the object.
   *
   * @return {string} The id generated for the object.
   */
  get id(){
    if(this.#id === "") for(let i = 0; i < 10; i++) this.#id += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+<>?,.;:[]{}|~".charAt(Math.floor(Math.random() * "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+<>?,.;:[]{}|~".length));
    return this.#id;
  }

  get position(){ return this.Transform.position; }
  get relativePosition(){ return this.Transform.relativePosition; }
  get rotation(){ return this.Transform.rotation; }
  set rotation(value){ this.Transform.rotation = value; }
  get anchor(){ return this.Transform.anchor; }
  get size(){ return this.Transform.size; }
  get layer(){ return this.#layer; }
  set layer(value){
    this.#layer = value;
    this.Render.layer = value;
  }
  get zIndex(){ return this.layer; }
  set zIndex(value){ this.layer = value; }
  get active(){ return this.Transform.active; }
  set active(value){ this.Transform.active = value; }
  get bounds(){
    if(this.Shape) return this.Shape.bounds;
    return this.Transform.bounds;
  }

  get debug(){ return this.Render.debug.enabled; }
  set debug(value){ this.Render.debug.enabled = value; }

  /**
   * Adds a component or a game object to the parent game object.
   * 
   * @param {Component|GameObject} Component - The component class or game object instance to be added.
   */
  add(Component, ...args) {
    if(Component instanceof GameObject){
      // Set the parent of the component
      Component.Parent = this;

      // Add the component to the trigger-only collisions set of the parent and the component itself
      this.triggerOnlyCollisions.add(Component);
      Component.triggerOnlyCollisions.add(this);
      
      // Add the component to the children map of the parent game object
      return this.children.set(Component.id, Component);
    }

    const component = new Component(this, ...args);

    component.id = this.id;
    // Add the component to the parent game object using its name as a property
    this[component.name] = component;

    // Add the component to the components map of the parent game object
    this.components.set(component.name, component);
  }

  /**
   * Removes a component from the game object.
   * If the component is an instance of GameObject, it's parent is set to null and it's removed from the children collection.
   * Otherwise, the component is removed from the object's properties and the components collection.
   * @param {GameObject|any} component - The component to be removed.
   */
  delete(component) {
    if (component instanceof GameObject) {
      component.Parent = null;
      return this.children.delete(component.id); // Remove component from children collection
    }

    delete this[component.name]; // Remove component from object's properties
    this.components.delete(component.name); // Remove component from components collection
  }

  /**
   * Checks if the given component exists in the game object.
   *
   * @param {GameObject|string} component - The component to check. Can be either a GameObject instance or a string representing the component's name.
   * @return {boolean} Returns true if the component exists in the game object, otherwise returns false.
   */
  has(component){
    if(component instanceof GameObject){
      return this.children.has(component.id);
    }
    if(typeof component === "string") return this.components.has(component);
    return this.components.has(component.name);
  }

  /**
   * Destroys the object by setting the 'destroyed' flag to true.
   */
  destroy(){
    this.destroyed = true;
  }

  /**
   * Execute the 'beforeUpdate' method on each component in the 'components' array if it exists.
   *
   * @param {Time} Time - the time parameter to be passed to the 'beforeUpdate' method of each component
   */
  defaultBeforeUpdate(Time){
    this.components.forEach(component => {
      if(this.destroyed) return;
      component.beforeUpdate?.(Time);
    }); 
  }

  /**
   * Updates all components in the list with the given time.
   *
   * @param {type} Time - the time to update the components with
   */
  defaultUpdate(Time){
    this.components.forEach(component => {
      if(this.destroyed) return;
      component.update?.(Time);
    });
  }

  /**
   * Calls the afterUpdate method on all the components in the component list
   * and updates the position of all the children based on the parent's position.
   *
   * @param {Time} Time - The time object used for updating components.
   * @return {void} This function does not return a value.
   */
  defaultAfterUpdate(Time){
    this.components.forEach(component => {
      if(this.destroyed) return;
      component.afterUpdate?.(Time);
    });

    if(this.children.size === 0) return;

    this.children.forEach(child => {
      if(child.destroyed) return this.remove(child);
      child.position.set(this.Transform.position.copy.add(child.relativePosition));
    });
  }
}