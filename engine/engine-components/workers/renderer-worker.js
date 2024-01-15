import SpriteManager from "../sprite-manager.js";
import LightingManager from "../lighting-manager.js";

class RendererWorker{
  frameCount = -1;
  layers = new Map();
  gameObjects = new Map();
  camera = null;
  antiAliasing = false;
  LightingManager = new LightingManager(this);

  constructor(){
    self.onmessage = this.onmessage;
  }

  /**
   * Handles the messages received by the worker.
   * @param {MessageEvent} event - The message event object.
   */
  onmessage = async (event) => {
    /**
     * An object containing different actions and their corresponding functions.
     * @type {Object}
     */
    const actions = {
      /**
       * Sets up the canvas, camera, and global light.
       * @param {Object} data - The data object containing the canvas, camera, and global light.
       */
      setup: (data) => this.setup(data),

      antiAliasing: ({ value }) => this.antiAliasing = value,

      /**
       * Updates the camera.
       * @param {Object} data - The data object containing the camera.
       */
      updateCamera: (data) => this.updateCamera(data),

      /**
       * Resizes the canvas.
       * @param {number} data.width - The new width of the canvas.
       * @param {number} data.height - The new height of the canvas.
       */
      resize: (data) => this.resize(data),

      /**
       * Adds a game object.
       * @param {Object} data - The data object containing the game object.
       */
      add: (data) => this.add(data),

      /**
       * Deletes a game object.
       * @param {Object} data - The data object containing the game object.
       */
      delete: (data) => this.delete(data),

      /**
       * Updates multiple game objects.
       * @param {Object[]} data.gameObjects - An array of game objects.
       */
      update: (data) => this.update(data),

      /**
       * Renders the scene.
       */
      render: () => this.render(),

      /**
       * Updates the global light.
       * @param {Object} data - The data object containing the global light.
       */
      updateLight: data => this.updateGlobalLight(data)
    };

    if(actions[event.data.action]) actions[event.data.action](event.data);
  };

  async add({ gameObject }){
    this.setLayer(gameObject);
  }

  delete({ gameObject }){
    if(!this.layers.has(gameObject.layer)) return;

    this.layers.get(gameObject.layer).delete(gameObject.id);

    if(this.layers.get(gameObject.layer).size === 0) this.layers.delete(gameObject.layer);
  }

  update({ gameObjects }){
    gameObjects.forEach(gameObject => this.setLayer(gameObject));
  }

  updateVisibility(gameObject) {
    const bounds = gameObject.shape.bounds;
    const offset = 10 + (gameObject.lightSource ? gameObject.lightSource.radius + gameObject.lightSource.distance : 0);
    const cameraBounds = this.camera.bounds;
    const isWithinXBounds = bounds.max.x >= cameraBounds.min.x - offset && bounds.min.x <= cameraBounds.max.x + (offset * 2);
    const isWithinYBounds = bounds.max.y >= cameraBounds.min.y - offset && bounds.min.y <= cameraBounds.max.y + (offset * 2);
    
    gameObject.visible = isWithinXBounds && isWithinYBounds;
    if(gameObject.lightSource != null){
      gameObject.lightSource.visible = gameObject.visible;
    }
  }

  setLayer(gameObject) {
    const { layer, id, lightSource } = gameObject;
    let layerAdded = false;

    // Add the layer if it doesn't exist
    if (!this.layers.has(layer)) {
      this.layers.set(layer, new Map());
      layerAdded = true; // Set the flag to true if the layer is added so that the sortLayers function can be called
    }

    // Check if the game object already exists in other layers and delete it
    for (const layerNumber of this.layers.keys()) {
      if (layerNumber !== layer) {
        this.layers.get(layerNumber).delete(id);
      }
    }

    const currentLayer = this.layers.get(layer);

    // Update the existing game object or add a new one if it doesn't exist
    if(currentLayer.has(id)){
      for (const key in gameObject) {
        currentLayer.get(id)[key] = gameObject[key];
      }
    }
    else currentLayer.set(id, gameObject);

    if(lightSource){
      this.LightingManager.lights.set(id, lightSource);
    }else{
      this.LightingManager.lights.delete(id);
    }

    if(gameObject.shape.shadow.enabled){
      this.LightingManager.shadows.set(id, gameObject);
    }else{
      this.LightingManager.shadows.delete(id);
    }

    if(layerAdded){
      this.sortLayers();
    }
  }

  sortLayers(){
    this.layers = new Map([...this.layers.entries()].sort((a, b) => a[0] - b[0]));
  }

  clear(){
    const tearingFix = 100;
    const { position, size } = this.camera;

    this.context.clearRect(position.x - tearingFix, position.y -tearingFix, size.x + (tearingFix * 2), size.y + (tearingFix * 2));
  }

  translate(){
    const { context } = this;

    if(!this.camera.active) return;

    const { position, scale, rotation } = this.camera;
    
    context.setTransform(scale.x, 0, 0, scale.y, -position.x * scale.x, -position.y * scale.y);
  
    context.rotate(rotation * (Math.PI / 180));
  }

  updateCamera({ camera }){
    this.camera = camera;
    this.LightingManager.canvas.width = this.canvas.width;
    this.LightingManager.canvas.height = this.canvas.height;
  }

  async render(){
    this.context.imageSmoothingEnabled = this.antiAliasing;
    this.clear();
    this.translate();

    for(const layer of this.layers.values()){
      for(const gameObject of layer.values()){
        this.updateVisibility(gameObject);
        if(!gameObject.visible) continue;

        if(gameObject.mode === "shape")
          this.renderShape(gameObject);

        else if(gameObject.mode === "sprite")
          await this.renderSprite(gameObject);
      }
    }

    this.renderLights();
  }

  async renderSprite(gameObject) {
    if(gameObject.sprite.src == null) return;

    const { anchor, size: spriteSize, slice, scale, debug, direction } = gameObject.sprite; // the position and size of the portion that will be rendered
    const { position: gameObjectPosition, size: gameObjectSize } = gameObject.transform; // the position of the game object
    const bitmap = await SpriteManager.get(gameObject.sprite.src);
    const gapFix = 0.1;

    const width = spriteSize.x * scale.x;
    const height = spriteSize.y * scale.y;
    const sliceWidth = slice.width === 0 ? bitmap.width : slice.width;
    const sliceHeight = slice.height === 0 ? bitmap.height : slice.height;
    const { context } = this;

    context.save();
    context.scale(direction, 1);

    context.drawImage(
      bitmap,
      slice.x, slice.y, sliceWidth, sliceHeight,
      (gameObjectPosition.x * direction) - width / 2 + (anchor.x * width),
      (gameObjectPosition.y - height / 2) + (anchor.y * height),
      width + gapFix,
      height + gapFix
    );

    context.restore();

    if(debug){
      context.strokeStyle = "red";
      context.strokeRect(gameObjectPosition.x - gameObjectSize.x / 2, gameObjectPosition.y - gameObjectSize.y / 2, gameObjectSize.x, gameObjectSize.y);
    }
  }

  renderShape(gameObject){
    const { context } = this;

    context.fillStyle = gameObject.shape.fillColor;
    context.strokeStyle = gameObject.shape.lineColor;
    context.lineWidth = gameObject.shape.lineWidth;
    context.globalAlpha = gameObject.opacity;
    context.globalCompositeOperation = gameObject.gco;

    if(gameObject.shape.type === "ellipse"){
      this.drawEllipse(gameObject);
    }

    if(gameObject.shape.type === "rectangle"){
      this.drawRectangle(gameObject);
    }

    if(gameObject.shape.type === "shape" && gameObject.shape.vertices.length > 0){
      this.drawShape(gameObject);
    }
  }

  drawShape(gameObject){
    const { context } = this;

    context.beginPath();
    context.moveTo(gameObject.transform.position.x + gameObject.shape.vertices[0].x, gameObject.transform.position.y + gameObject.shape.vertices[0].y);
    for (let i = 1; i < gameObject.shape.vertices.length; i++) {
      context.lineTo(gameObject.transform.position.x + gameObject.shape.vertices[i].x, gameObject.transform.position.y + gameObject.shape.vertices[i].y);
    }
    context.closePath();
    context.fill();
    context.stroke();
  }

  drawRectangle(gameObject) {
    const { context } = this;

    context.beginPath();
    context.rect(gameObject.transform.position.x - gameObject.transform.size.x / 2, gameObject.transform.position.y - gameObject.transform.size.y / 2, gameObject.transform.size.x, gameObject.transform.size.y);
    context.fill();
    context.stroke();
  }

  drawEllipse(gameObject){
    const { context } = this;

    context.beginPath();
    context.ellipse(gameObject.transform.position.x, gameObject.transform.position.y, gameObject.transform.size.x / 2, gameObject.transform.size.y / 2, 0, 0, 2 * Math.PI);
    context.fill();
    context.stroke();
  }

  renderLights() {
    this.LightingManager.renderLights();
  }

  updateGlobalLight(globalLight){
    this.LightingManager.color = globalLight.color;
    this.LightingManager.brightness = 1 - globalLight.brightness;
  }

  setup({ canvas, camera, globalLight, antiAliasing }){
    this.camera = camera;
    this.canvas = canvas;
    this.context = this.canvas.getContext('2d');
    this.context.imageSmoothingEnabled = antiAliasing;
    this.antiAliasing = antiAliasing;
    this.LightingManager.canvas.width = this.canvas.width;
    this.LightingManager.canvas.height = this.canvas.height;
    this.updateGlobalLight(globalLight);
  }

  resize({ width, height }){
    this.canvas.width = width;
    this.canvas.height = height;
    this.LightingManager.canvas.width = width;
    this.LightingManager.canvas.height = height;
  }
}

new RendererWorker();