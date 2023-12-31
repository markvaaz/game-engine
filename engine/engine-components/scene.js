import Camera from "../objects/camera.js";
import GameObject from "../objects/game-object.js";
import Lights from "./lights.js";
import Physics from "./physics.js";

export default class Scene{
  static name = 'Scene';
  name = 'Scene';
  gameObjects = new Map();
  layers = new Map();
  Cameras = new Map();
  Physics = new Physics();
  Camera = new Camera("Main");
  Lights = new Lights();
  #debug = {
    enabled: false,
    lineColor: null,
    lineWidth: null,
    fillColor: null,
    position: null,
    velocity: null,
    velocityVector: null,
    centerOfMass: null,
    vertices: null,
    line: null,
    name: null,
    nameColor: null
  };

  constructor(){
    this.addCamera(this.Camera);
  }

  get debug(){ return this.#debug; }

  set debug(value){
    if(typeof value !== "object") return;
    
    for(const key in value){
      if(this.#debug[key] !== undefined) this.#debug[key] = value[key];
    }
  }

  get SpatialHash(){
    return this.Physics.SpatialHash;
  }

  setup(context){
    this.Camera.draw(context);
    this.Camera.endDraw(context);
    this.gameObjects.forEach(gameObject => {
      gameObject.setup?.();
    });
  }

  addCamera(camera){
    this.Cameras.set(camera.name, camera);
    if(!this.Camera) this.Camera = camera;
  }

  changeCamera(camera){
    this.Camera = this.Cameras.get(camera);
  }

  add(gameObject){
    if(!(gameObject instanceof GameObject)) return;
    this.gameObjects.set(gameObject.id, gameObject);
    
    gameObject.Scene = this;

    this.setLayer(gameObject);

    if(gameObject.children.size > 0) gameObject.children.forEach(child => this.add(child));

    this.Physics.add(gameObject);
  }

  delete(gameObject){
    if(!(gameObject instanceof GameObject)) return;

    gameObject.Scene = null;

    this.gameObjects.delete(gameObject.id);

    this.layers.get(gameObject.layer).delete(gameObject);

    this.Physics.remove(gameObject);

    if(gameObject.children.size > 0){
      gameObject.children.forEach(child => {
        child.destroy();
        this.delete(child);
      });
    }
  }

  has(gameObject){
    if(!(gameObject instanceof GameObject)) return;
    return this.gameObjects.has(gameObject.id);
  }

  setLayer(gameObject){
    if(!this.layers.has(gameObject.layer)) this.layers.set(gameObject.layer, new Set());

    this.layers.get(gameObject.layer).add(gameObject);

    gameObject.previousLayer = gameObject.layer;

    this.sortLayers();
  }

  changeLayer(gameObject){
    if(gameObject.previousLayer === gameObject.layer) return;
    this.layers.get(gameObject.previousLayer).delete(gameObject);

    this.setLayer(gameObject);
  }

  sortLayers(){
    this.layers = new Map([...this.layers.entries()].sort((a, b) => a[0] - b[0]));
  }

  checkVisibility(gameObject) {
    if(this.Camera.isWithinBounds(gameObject)) gameObject.onCameraView = true;
    else gameObject.onCameraView = false;
  }

  beforeUpdate = (Time) => {
    this.Camera.beforeUpdate?.(Time);
  }
  
  update = (Time) => {
    this.Camera.defaultUpdate?.(Time);
    this.Camera.update?.(Time);
  
    for (const gameObject of this.gameObjects.values()){
      if(gameObject.destroyed) continue;
  
      this.checkVisibility(gameObject, Time);
      
      gameObject.defaultBeforeUpdate?.(Time);
      gameObject.beforeUpdate?.(Time);
  
      this.changeLayer(gameObject, gameObject.layer);
  
      // this.Physics.applyPhysics(gameObject);
      
      gameObject.defaultUpdate(Time);
      
      gameObject.update?.(Time);
      
      this.Physics.update(gameObject);

      gameObject.defaultAfterUpdate?.(Time);
      gameObject.afterUpdate?.(Time);
      
      this.Physics.collisions(gameObject, Time);
      this.Physics.update(gameObject);
    }
  }
  
  afterUpdate = (Time) => {
    this.Camera.afterUpdate?.(Time);
  }

  beforeRender = (context) => {
    this.Camera.beforeRender?.(context);
  }

  render = (context) => {
    for(const layer of this.layers.values()){
      for(const gameObject of layer){
        if (gameObject.destroyed || !gameObject.onCameraView) continue;
      
        gameObject.defaultBeforeRender?.(context);
        gameObject.beforeRender?.(context);
      
        this.Camera.draw(context);

        if(gameObject.LightSource && !this.Lights.has(gameObject.LightSource)) this.Lights.add(gameObject.LightSource);

        gameObject.defaultRender(context);
        gameObject.render?.(context);
      
        if(this.debug.enabled) gameObject.debugRender?.(context, this.debug);
      
        this.Camera.endDraw(context);
      
        gameObject.defaultAfterRender?.(context);
        gameObject.afterRender?.(context);
      }
    }
  }

  afterRender = (context) => {
    this.Camera.draw(context);
    this.Lights.renderLights(context, this.Camera);
    this.Camera.endDraw(context);
  }
}