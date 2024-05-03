import { getFileImport } from "../../utilities.js";
import Vector from "../engine-components/vector.js";
import Component from "./components/component.js";
import Render from "./components/render.js";
import Transform from "./components/transform.js";

export default class GameObject {
  // The name of the game object
  static name = 'GameObject';
  
  // The name of the game object (instance property)
  name = 'GameObject';

  path = "/engine/objects/";

  fileName = "game-object";
  
  // A map to store the components of the game object
  components = new Map();
  
  // A set to store the game object's collision targets
  collidesOnlyWith = new Set();
  
  // A set to store the game object's ignored collisions
  ignoredCollisions = new Set();
  
  // A set to store the game object's trigger-only collisions
  triggerOnlyCollisions = new Set();
  
  // Indicates if the game object is destroyed or not
  destroyed = false;
  
  // Indicates if the game object is visible or not
  visible = true;
  
  // The update mode of the game object
  updateMode = "all";
  
  // Private field to store the layer of the game object
  #layer = 0;
  
  // Private field to store the ID of the game object
  #id = "";

  canSave = false;
  
  constructor(){
    this.add(Transform);
    this.add(Render);
  }

  save(){
    const save = {
      components: {},
      name: this.name,
      path: this.path,
      fileName: this.fileName,
      collidesOnlyWith: [...this.collidesOnlyWith],
      ignoredCollisions: [...this.ignoredCollisions],
      triggerOnlyCollisions: [...this.triggerOnlyCollisions],
      destroyed: this.destroyed,
      visible: this.visible,
      updateMode: this.updateMode,
      layer: this.layer,
      id: this.id,
      canSave: this.canSave
    }

    this.components.forEach(component => {
      if(component.name === "Render") return;
      save.components[component.name] = component.save();
    });

    return save;
  }

  async load(data){
    const loadComponent = async key => {
      if(!data.components[key]) return;

      if(this[key]) return await this[key].load(data.components[key]);

      const componentData = data.components[key];
      const fileName = componentData.fileName;
      const COMPONENT = await getFileImport(componentData.path, fileName.split("/")[0], fileName.split("/")[1] || "default");
      const component = new COMPONENT(this);

      await component.load(componentData);
      
      component.id = this.id;

      // Add the component to the parent game object using its name as a property
      this[component.name] = component;
  
      // Add the component to the components map of the parent game object
      this.components.set(component.name, component);
    }

    // Load higher priority components first
    const priorityComponents = ["Transform", "Render", "Shape"];

    for (const component of priorityComponents) {
      await loadComponent(component);
    }

    for (const key in data.components) {
      if (priorityComponents.includes(key)) continue;
      await loadComponent(key);
    }

    this.collidesOnlyWith = new Set(data.collidesOnlyWith);
    this.ignoredCollisions = new Set(data.ignoredCollisions);
    this.triggerOnlyCollisions = new Set(data.triggerOnlyCollisions);
    this.destroyed = data.destroyed;
    this.visible = data.visible;
    this.updateMode = data.updateMode;
    this.layer = data.layer;
    this.#id = data.id;
    this.canSave = data.canSave;
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
   * @param {Component|GameObject} component - The component class or game object instance to be added.
   */
  add(component, ...args) {
    if(component instanceof Component){
      component.id = this.id;

      this[component.name] = component;
      this.components.set(component.name, component);
    }else{
      const comp = new component(this, ...args);
  
      comp.id = this.id;
      // Add the component to the parent game object using its name as a property
      this[comp.name] = comp;
  
      // Add the component to the components map of the parent game object
      this.components.set(comp.name, comp);
    }

  }

  /**
   * Removes a component from the game object.
   * If the component is an instance of GameObject, it's parent is set to null and it's removed from the children collection.
   * Otherwise, the component is removed from the object's properties and the components collection.
   * @param {GameObject|any} component - The component to be removed.
   */
  delete(component) {
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
    if(typeof component === "string") return this.components.has(component);
    return this.components.has(component.name);
  }

  /**
   * Destroys the object by setting the 'destroyed' flag to true.
   */
  destroy(){
    this.destroyed = true;
    this.Render.destroyed = true;
  }

  defaultBeforeUpdate(){
    this.components.forEach(component => {
      if(this.destroyed) return;
      component.beforeUpdate?.();
    }); 
  }

  /**
   * Updates all components in the list with the given time.
   */
  defaultUpdate(){
    this.components.forEach(component => {
      if(this.destroyed) return;
      component.update?.();
    });
  }

  /**
   * Calls the afterUpdate method on all the components in the component list
   * and updates the position of all the children based on the parent's position.
   */
  defaultAfterUpdate(){
    this.components.forEach(component => {
      if(this.destroyed) return;
      component.afterUpdate?.();
    });
  }
}