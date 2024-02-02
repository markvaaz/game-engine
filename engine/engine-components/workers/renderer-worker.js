import SpriteManager from "../sprite-manager.js";
import LightingManager from "../lighting-manager.js";

class RendererWorker{
  frameCount = -1;
  layers = new Map();
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
    const { layer, id } = gameObject;

    this.LightingManager.delete(id);

    if(!this.layers.has(layer)) return; 

    this.layers.get(layer).delete(id);

    if(this.layers.get(layer).size === 0) this.layers.delete(layer);
  }

  update({ gameObjects }){
    gameObjects.forEach(gameObject => this.setLayer(gameObject));
  }

  updateVisibility(gameObject) {
    const bounds = gameObject.shape.bounds || gameObject.transform.bounds;
    const offset = 200 + (gameObject.lightSource ? (gameObject.lightSource.radius * 2 + gameObject.lightSource.distance) : 0);
    const cameraBounds = this.camera.bounds;
    const position = gameObject.transform.position;
    const isWithinXBounds = bounds.max.x + position.x >= cameraBounds.min.x - offset && bounds.min.x + position.x <= cameraBounds.max.x + (offset * 2);
    const isWithinYBounds = bounds.max.y + position.y >= cameraBounds.min.y - offset && bounds.min.y + position.y <= cameraBounds.max.y + (offset * 2);
    
    gameObject.visible = isWithinXBounds && isWithinYBounds;
    if(gameObject.lightSource != null){
      gameObject.lightSource.visible = gameObject.visible;
    }

    if(gameObject.shadow != null){
      gameObject.shadow.visible = gameObject.visible;
    }

    if(gameObject.shape.darkZone){
      gameObject.shape.visible = gameObject.visible;
    }
  }

  setLayer(gameObject) {
    const { layer, id, lightSource, shadow } = gameObject;
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

    if(!gameObject.shape?.darkZone){
      const currentLayer = this.layers.get(layer);
      this.LightingManager.darkZones.delete(id);
      
      if(currentLayer.has(id)){
        for (const key in gameObject) {
          currentLayer.get(id)[key] = gameObject[key];
        }
      }
      else currentLayer.set(id, gameObject);  
    }else{
      gameObject.shape.id = id;
      gameObject.shape.visible = gameObject.visible;
      gameObject.shape.position = gameObject.transform.position;
      this.LightingManager.darkZones.set(id, gameObject.shape);
    }

    if(lightSource){
      lightSource.id = id;
      this.LightingManager.lights.set(id, lightSource);
    }else{
      this.LightingManager.lights.delete(id);
    }

    if(shadow){
      shadow.id = id;
      this.LightingManager.shadows.set(id, shadow);
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

    for(const layer of this.layers.values()){
      for(const gameObject of layer.values()){
        if(!gameObject.debug.enabled) continue;
        
        this.renderDebug(gameObject);
      }
    }
  }

  async renderSprite(gameObject) {
    if(gameObject.sprite && gameObject.sprite.src == null) return;

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

    context.translate(gameObjectPosition.x, gameObjectPosition.y);
    context.rotate(gameObject.transform.rotation);
    context.scale(direction, 1);

    context.drawImage(
      bitmap,
      slice.x, slice.y, sliceWidth, sliceHeight,
      (0 * direction) - width / 2 + (anchor.x * width),
      (0 - height / 2) + (anchor.y * height),
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

    context.fillStyle = gameObject.shape.color;
    context.strokeStyle = gameObject.shape.borderColor;
    context.lineWidth = gameObject.shape.borderWidth;
    context.globalAlpha = gameObject.shape.opacity;
    context.globalCompositeOperation = gameObject.gco;

    if(gameObject.shape.type === "ellipse"){
      this.drawEllipse(gameObject);
    }

    if(gameObject.shape.type === "rectangle"){
      this.drawRectangle(gameObject);
    }

    if(gameObject.shape.type === "polygon" && gameObject.shape.vertices.length > 0){
      this.drawShape(gameObject);
    }
  }

  renderDebug(gameObject){
    const { position, velocity, size } = gameObject.transform;
    const { context } = this;
    const offset = size.x/2 + 5;

    // draw velocity and position text

    context.fillStyle = "white";
    context.font = "10px Arial";

    context.fillText(`Position: ${position.x.toFixed(2)}, ${position.y.toFixed(2)}`, position.x + offset, position.y);

    // draw a line between the position text and the velocity text
    
    context.strokeStyle = "white";
    context.beginPath();
    context.moveTo(position.x + offset, position.y + 5);
    context.lineTo(position.x + 120 + offset, position.y + 5);
    context.stroke();

    context.fillText(`Velocity: ${velocity.x.toFixed(2)}, ${velocity.y.toFixed(2)}`, position.x + offset, position.y + 15);
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
    const { position, size, rotation } = gameObject.transform;

    const originalTransform = context.getTransform();

    context.translate(position.x, position.y);
    context.rotate(rotation);

    context.beginPath();
    context.rect(-size.x / 2, -size.y / 2, size.x, size.y);
    context.fill();
    context.stroke();

    context.setTransform(originalTransform);
  }

  drawEllipse(gameObject) {
    const { context } = this;
    const { position, size, rotation } = gameObject.transform;

    // Save the current state of the context
    const originalTransform = context.getTransform();

    // Apply translation and rotation
    context.translate(position.x, position.y);
    context.rotate(rotation);

    // Draw the rotated ellipse
    context.beginPath();
    context.ellipse(0, 0, size.x / 2, size.y / 2, 0, 0, 2 * Math.PI);
    context.fill();
    context.stroke();

    // Undo the translation and rotation manually
    context.setTransform(originalTransform);
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
    this.LightingManager.cacheCanvas.width = this.canvas.width;
    this.LightingManager.cacheCanvas.height = this.canvas.height;
    this.updateGlobalLight(globalLight);
  }

  resize({ width, height }){
    this.canvas.width = width;
    this.canvas.height = height;
    this.LightingManager.canvas.width = width;
    this.LightingManager.canvas.height = height;
    this.LightingManager.cacheCanvas.width = width;
    this.LightingManager.cacheCanvas.height = height;
  }
}

new RendererWorker();