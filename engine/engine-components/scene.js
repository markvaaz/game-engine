import { circularJSON, getFileImport } from "../../utilities.js";
import Camera from "../objects/camera.js";
import GameObject from "../objects/game-object.js";
import Events from "./events.js";
import Physics from "./physics.js";
import Vector from "./vector.js";

export default class Scene{
  // Define a static property "name" with the value 'Scene'
  static name = 'Scene';
  
  // Define an instance property "name" with the value 'Scene'
  name = 'Scene';

  // Stores all game objects
  GameObjects = new Map();
  
  // Create a new Map object to store objects to be rendered
  RenderQueue = new Map();
  
  // Create a new Map object to store cameras
  Cameras = new Map();
  
  // Create a new Physics object
  Physics = new Physics();

  CollisionManager = this.Physics.CollisionManager;
  
  // Initialize the number of added objects to 0
  addedObjects = 0;
  
  // Create a new GlobalLight object with a reference to the current Scene object
  GlobalLight = new GlobalLight(this);

  encoder = new TextEncoder();

  decoder = new TextDecoder();

  /**
   * Constructor for the class.
   * @param {Renderer} renderer - The renderer object.
   */
  constructor(renderer) {
    this.Renderer = renderer;

    // Create a new camera object and add it to the scene.
    this.addCamera(new Camera("main"));

    // Setup the renderer with the camera and global light.
    this.Renderer.setupScene(this.Camera, this.GlobalLight);
  }

  async save(){
    const save = {
      GameObjects: [],
      GlobalLight: this.GlobalLight.toJSON(),
      Cameras: [],
      Camera: this.Camera.name,
      name: this.name
    };

    for(const camera of this.Cameras.values()) {
      save.Cameras.push(camera.save());
    }

    for(const gameObject of this.GameObjects.values()) {
      if(!gameObject.canSave) continue;
      const object = gameObject.save();

      if(!object) continue;

      save.GameObjects.push(object);
    }
    
    this.savefile = this.encoder.encode(circularJSON(save));
    console.log(this.decoder.decode(this.savefile));
  }

  async load(sceneData){
    this.clear();

    const { GameObjects, GlobalLight, Cameras } = sceneData;

    this.GlobalLight.load(GlobalLight);

    for(const cam of Cameras) {
      const camera = this.getCamera(cam.name) || new Camera(cam.name);
      
      if(!this.getCamera(cam.name)) {
        this.addCamera(camera);
      }

      camera.load(cam);
    }

    if(this.Camera?.name == sceneData.Camera) this.Camera = this.getCamera(sceneData.Camera);

    this.name = sceneData.name;

    filter(GameObjects);
    
    for(const gameObjectData of GameObjects) {
      const GAMEOBJECT = await getFileImport(gameObjectData.path, gameObjectData.fileName.split("/")[0], gameObjectData.fileName.split("/")[1] || "default");
      const gameObject = new GAMEOBJECT();

      await gameObject.load(gameObjectData);

      this.add(gameObject);
    }
  }

  /**
   * Sets up the canvas for rendering.
   *
   * @param {Object} canvas - The canvas element used for rendering.
   */
  setup(canvas){
    this.Camera.updateSize(canvas.width, canvas.height);
    this.GameObjects.forEach(gameObject => {
      gameObject.setup?.();
    });
  }

  /**
   * Adds a camera to the scene.
   *
   * @param {Camera} camera - The camera to be added.
   */
  addCamera(camera){
    this.Cameras.set(camera.name, camera);

    if(!this.Camera){
      this.Camera = camera;
      this.Camera.focus = true;
    }

    camera.updateSize(this.Renderer.canvas.width, this.Renderer.canvas.height);
  }

  /**
   * Changes the camera to the specified camera.
   *
   * @param {type} camera - the camera to change to
   * @return {type} undefined
   */
  changeCamera(camera){
    this.Camera.focus = false;
    this.Camera = this.Cameras.get(camera);
    this.Camera.focus = true;
    this.Renderer.updateCamera(this.Camera.toObject());
  }

  getCamera(name){
    return this.Cameras.get(name);
  }

  /**
   * Add a game object to the scene.
   *
   * @param {GameObject} gameObject - The game object to be added.
   */
  add(gameObject, tile = false){
    if(!(gameObject instanceof GameObject)) return;

    this.addedObjects++;

    const { updateMode, id } = gameObject;
    if(updateMode === "all" || updateMode === "world"){
      this.CollisionManager.add(gameObject);
    }
    
    this.GameObjects.set(id, gameObject);

    if(tile){
      gameObject.canSave = false;
    }
    
    if(updateMode === "all" || updateMode === "render") this.Renderer.add(gameObject);
  }



  /**
   * Deletes a game object from the scene.
   *
   * @param {GameObject} gameObject - The game object to be deleted.
   */
  delete(gameObject){
    if(!(gameObject instanceof GameObject)) return;

    this.addedObjects--;

    gameObject.Scene = null;

    gameObject.destroy();

    this.GameObjects.delete(gameObject.id);

    this.CollisionManager.delete(gameObject);

    this.RenderQueue.delete(gameObject.id);
  }

  /**
   * Checks if the given game object is present in the collection.
   *
   * @param {GameObject} gameObject - The game object to check.
   * @return {boolean} Returns true if the game object is present, false otherwise.
   */
  has(gameObject){
    if(!(gameObject instanceof GameObject)) return;
    return this.GameObjects.has(gameObject.id);
  }

  get(id){
    return this.GameObjects.get(id);
  }

/**
 * Updates the visibility of a game object based on its bounds and light source radius.
 *
 * @param {GameObject} gameObject - The game object to update visibility for.
 */
  updateVisibility(gameObject){
    if(this.Camera.isWithinBounds(gameObject.bounds, gameObject.LightSource?.radius))
      gameObject.visible = true;
    else
      gameObject.visible = false;
  }

  /**
   * Updates the render information for a game object.
   *
   * @param {Object} gameObject - The game object to update the render information for.
   */
  updateRenderInformation(gameObject){
    if(gameObject.active) this.RenderQueue.set(gameObject.id, gameObject.Render);
    else this.RenderQueue.delete(gameObject.id);
  }

  beforeUpdate = () => {
    this.Camera.beforeUpdate?.();
  }
  
  update = async () => {
    // Update the default camera
    this.Camera.defaultUpdate?.();
    // Update the camera
    this.Camera.update?.();

    for(const camera of this.Cameras.values()){
      if(camera.targetID){
        const target = this.GameObjects.get(camera.targetID);

        if(!target) continue;
        
        camera.target = target;
        camera.targetID = null;
      }
    }
  
    // Iterate through all game objects
    for(const gameObject of this.GameObjects.values()){
      if(gameObject.destroyed) continue;
  
      if(gameObject.updateMode === "render" && !this.Renderer.clearing){
        if(gameObject.active){
          this.RenderQueue.set(gameObject.id, gameObject.Render);
          gameObject.active = false;
        }else{
          this.RenderQueue.delete(gameObject.id);
        }
 
        continue;
      }

      // Update the visibility of the game object
      this.updateVisibility(gameObject);
  
      this.Physics.applyPhysics(gameObject);

      // Call the beforeUpdate functions of the game object
      gameObject.defaultBeforeUpdate?.();
      gameObject.beforeUpdate?.();
  
      // Call the defaultUpdate function of the game object
      gameObject.defaultUpdate();
  
      // Call the update function of the game object
      gameObject.update?.();
  
      // Call the afterUpdate functions of the game object
      gameObject.defaultAfterUpdate?.();
      gameObject.afterUpdate?.();
  
      this.CollisionManager.updateHash(gameObject);
      // Update render information for the game object
      this.updateRenderInformation(gameObject);
    }

    await this.CollisionManager.update(this.Camera)
    // Update the renderer with the queue of objects to render
    this.Renderer.update(this.RenderQueue);
  }

  /**
   * Updates the size of the camera and invokes the beforeRender method of the camera.
   */
  beforeRender = () => {
    this.Camera.updateSize(this.Renderer.canvas.width, this.Renderer.canvas.height);
    this.Camera.beforeRender();

    //Sets the position of the mouse based on the camera's mouse position.
    Events.mouse.setPosition(this.Camera.mouse);
  }

  /**
   * Renders the scene using the Renderer object.
   *
   * @return {undefined} This function does not return a value.
   */
  render = () => {
    if(this.Renderer.clearing) return;
    this.Renderer.updateCamera(this.Camera.toObject());
    this.Renderer.render();
  }

  clear(){
    for(const gameObject of this.GameObjects.values()){
      this.delete(gameObject);
    }

    this.Renderer.clear();
  }
}

/**
 * Represents a GlobalLight object.
 */
class GlobalLight {
  #color = "#000000";
  #brightness = 1.0;

  /**
   * Creates a new GlobalLight instance.
   * @param {Scene} Scene - The scene to which the light belongs.
   */
  constructor(Scene) {
    this.Scene = Scene;
  }

  /**
   * Gets the color of the light.
   * @returns {string} - The color of the light.
   */
  get color() {
    return this.#color;
  }

  /**
   * Gets the brightness of the light.
   * @returns {number} - The brightness of the light.
   */
  get brightness() {
    return this.#brightness;
  }

  /**
   * Sets the color of the light.
   * @param {string} color - The new color of the light.
   */
  set color(color) {
    this.#color = color;
    // Update the light in the renderer
    this.Scene.Renderer.updateLight(this.#color, this.#brightness);
  }

  /**
   * Sets the brightness of the light.
   * @param {number} brightness - The new brightness of the light.
   */
  set brightness(brightness) {
    this.#brightness = brightness;
    // Update the light in the renderer
    this.Scene.Renderer.updateLight(this.#color, this.#brightness);
  }

  load(data){
    this.color = data.color;
    this.brightness = data.brightness;
  }

  toJSON(){
    return {
      color: this.color,
      brightness: this.brightness
    }
  }
}

function filter(obj) {
  if (typeof obj === 'object') {
    for (const key in obj) {
      if(obj[key] == "[Circular]" || key == "GameObject"){
        delete obj[key];
        continue;
      }
      if(obj[key]?.x != null && obj[key]?.y != null){
        obj[key] = new Vector(obj[key].x, obj[key].y);
      } else if (typeof obj[key] === 'object') {
        filter(obj[key]);
      }
    }
  } else if (Array.isArray(obj)) {
    obj.forEach(item => filter(item));
  }
}