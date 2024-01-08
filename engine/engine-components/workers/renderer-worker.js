import SpriteManager from "../sprite-manager.js";
import Vector from "../vector.js";

class RendererWorker{
  frameCount = -1;
  layers = new Map();
  gameObjects = new Map();
  camera = null;
  lights = new Map();
  lightCanvas = new OffscreenCanvas(1, 1);
  lightContext = this.lightCanvas.getContext('2d');
  lightColor = "#000";
  lightBrightness = 1;

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
      setup: ({ canvas, camera, globalLight }) => this.setup(canvas, camera, globalLight),

      /**
       * Updates the camera.
       * @param {Object} data - The data object containing the camera.
       */
      updateCamera: ({ camera }) => this.updateCamera(camera),

      /**
       * Resizes the canvas.
       * @param {number} data.width - The new width of the canvas.
       * @param {number} data.height - The new height of the canvas.
       */
      resize: ({ width, height }) => this.resize(width, height),

      /**
       * Adds a game object.
       * @param {Object} data - The data object containing the game object.
       */
      add: ({ gameObject }) => this.add(gameObject),

      /**
       * Deletes a game object.
       * @param {Object} data - The data object containing the game object.
       */
      delete: ({ gameObject }) => this.delete(gameObject),

      /**
       * Updates multiple game objects.
       * @param {Object[]} data.gameObjects - An array of game objects.
       */
      update: ({ gameObjects }) => this.update(gameObjects),

      /**
       * Renders the scene.
       */
      render: () => this.render(),

      /**
       * Updates the global light.
       * @param {Object} data - The data object containing the global light.
       */
      updateLight: globalLight => this.updateGlobalLight(globalLight)
    };

    if(actions[event.data.action]) actions[event.data.action](event.data);
  };

  /**
   * Adds a game object to the layers.
   *
   * @param {type} gameObject - the game object to be added
   */
  async add(gameObject){
    this.setLayer(gameObject);
  }

  /**
   * Deletes a gameObject from the layers.
   *
   * @param {Object} gameObject - The gameObject to be deleted.
   */
  delete(gameObject){
    if(!this.layers.has(gameObject.layer)) return;

    this.layers.get(gameObject.layer).delete(gameObject.id);

    if(this.layers.get(gameObject.layer).size === 0) this.layers.delete(gameObject.layer);
  }

  /**
   * Updates all the gameObjects received from the main thread.
   * @param {Object[]} gameObjects - An array of game objects.
   */
  update(gameObjects){
    gameObjects.forEach(gameObject => this.setLayer(gameObject));
  }

  /**
   * Updates the visibility of a game object based on its position relative to the camera bounds.
   *
   * @param {Object} gameObject - The game object to update.
   */
  updateVisibility(gameObject) {
    const bounds = gameObject.shape.bounds;
    const offset = 10 + (gameObject.lightSource ? gameObject.lightSource.radius + gameObject.lightSource.distance : 0);
    const cameraBounds = this.camera.bounds;
    const isWithinXBounds = bounds.max.x >= cameraBounds.min.x - offset && bounds.min.x <= cameraBounds.max.x + (offset * 2);
    const isWithinYBounds = bounds.max.y >= cameraBounds.min.y - offset && bounds.min.y <= cameraBounds.max.y + (offset * 2);
    
    gameObject.visible = isWithinXBounds && isWithinYBounds;
    if (gameObject.lightSource != null) {
      gameObject.lightSource.visible = gameObject.visible;
    }
  }

  /**
   * Sets the layer of a game object.
   *
   * @param {object} gameObject - The game object to set the layer for.
   * @param {number} gameObject.layer - The layer to set.
   * @param {string} gameObject.id - The ID of the game object.
   * @param {string} gameObject.lightSource - The light source of the game object.
   */
  setLayer(gameObject) {
    const { layer, id, lightSource } = gameObject;
    let layerAdded = false;

    if (!this.layers.has(layer)) {
      this.layers.set(layer, new Map());
      layerAdded = true;
    }

    for (const layerNumber of this.layers.keys()) {
      if (layerNumber !== layer) {
        this.layers.get(layerNumber).delete(id);
      }
    }

    this.layers.get(layer).set(id, gameObject);

    if (lightSource) {
      this.lights.set(id, lightSource);
    } else {
      this.lights.delete(id);
    }

    if (layerAdded) {
      this.sortLayers();
    }
  }

  /**
   * Sorts the layers in ascending order based on their keys.
   *
   * This function uses the JavaScript `Map` object to store the layers, 
   * and sorts them using the `sort` method. The sorting is done in 
   * ascending order based on the keys of the layers. The function 
   * updates the `layers` property of the renderer.
   */
  sortLayers(){
    this.layers = new Map([...this.layers.entries()].sort((a, b) => a[0] - b[0]));
  }

  /**
   * Clears the canvas by clearing a rectangular area around the camera position + offset to prevent flickering.
   *
   * @param {type} paramName - description of parameter
   * @return {type} description of return value
   */
  clear(){
    const offset = 200;
    this.context.clearRect(this.camera.position.x - offset, this.camera.position.y -offset, this.camera.size.x + (offset * 2), this.camera.size.y + (offset * 2));
  }

  /**
   * Translates the rendering context based on the camera properties.
   */
  translate(){
    const { context } = this;

    if(!this.camera.active) return;
    
    context.setTransform(this.camera.scale.x, 0, 0, this.camera.scale.y, -this.camera.position.x * this.camera.scale.x, -this.camera.position.y * this.camera.scale.y);
  
    context.rotate(this.camera.rotation * (Math.PI / 180));
  }

  /**
   * Updates the camera used by the canvas, and the light canvas size.
   *
   * @param {Camera} camera - The new camera to be used.
   */
  updateCamera(camera){
    this.camera = camera;
    this.lightCanvas.width = this.canvas.width;
    this.lightCanvas.height = this.canvas.height;
  }

  /**
   * Renders the game by iterating through each layer and game object,
   * updating visibility and rendering shapes, sprites, and lights accordingly.
   */
  async render(){
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

  /**
   * Renders a sprite on the canvas.
   *
   * @param {object} gameObject - The game object containing the sprite to render.
   * @return {Promise} - A promise that resolves when the sprite has been rendered.
   */
  async renderSprite(gameObject) {
    const { x, y, width, height } = gameObject.sprite;
    const bitmap = await SpriteManager.get(gameObject.sprite.src);
    const gapFix = 0.1;

    this.context.drawImage(bitmap, x, y, bitmap.width, bitmap.height, gameObject.transform.position.x - width / 2, gameObject.transform.position.y - height / 2, width + gapFix, height + gapFix);
  }

  /**
   * Renders a shape on the canvas.
   *
   * @param {object} gameObject - The game object containing the shape to be rendered.
   */
  renderShape(gameObject) {
    this.context.fillStyle = gameObject.shape.fillColor;
    this.context.strokeStyle = gameObject.shape.lineColor;
    this.context.globalAlpha = gameObject.opacity;
    this.context.globalCompositeOperation = gameObject.gco;

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

  /**
   * Draws a shape on the canvas.
   *
   * @param {object} gameObject - The game object containing the shape vertices and transform information.
   */
  drawShape(gameObject) {
    this.context.beginPath();
    this.context.moveTo(gameObject.transform.position.x + gameObject.shape.vertices[0].x, gameObject.transform.position.y + gameObject.shape.vertices[0].y);
    for (let i = 1; i < gameObject.shape.vertices.length; i++) {
      this.context.lineTo(gameObject.transform.position.x + gameObject.shape.vertices[i].x, gameObject.transform.position.y + gameObject.shape.vertices[i].y);
    }
    this.context.closePath();
    this.context.fill();
    this.context.stroke();
  }

  /**
   * Draws a rectangle on the canvas.
   *
   * @param {Object} gameObject - The game object containing the transform and size information.
   * @return {void} This function does not return a value.
   */
  drawRectangle(gameObject) {
    this.context.beginPath();
    this.context.rect(gameObject.transform.position.x - gameObject.transform.size.x / 2, gameObject.transform.position.y - gameObject.transform.size.y / 2, gameObject.transform.size.x, gameObject.transform.size.y);
    this.context.fill();
    this.context.stroke();
  }

  /**
   * Draws an ellipse on the canvas.
   *
   * @param {GameObject} gameObject - The game object that represents the ellipse.
   */
  drawEllipse(gameObject) {
    this.context.beginPath();
    this.context.ellipse(gameObject.transform.position.x, gameObject.transform.position.y, gameObject.transform.size.x / 2, gameObject.transform.size.y / 2, 0, 0, 2 * Math.PI);
    this.context.fill();
    this.context.stroke();
  }

  /**
   * Renders the lights on a canvas.
   */
  renderLights() {
    /**
     * Clears the canvas.
     * @param {number} x - The x-coordinate of the top-left corner of the rectangle to clear.
     * @param {number} y - The y-coordinate of the top-left corner of the rectangle to clear.
     * @param {number} width - The width of the rectangle to clear.
     * @param {number} height - The height of the rectangle to clear.
     */
    this.lightContext.clearRect(0, 0, this.lightCanvas.width, this.lightCanvas.height);

    /**
     * Sets the fill style for the canvas.
     * @type {string}
     */
    this.lightContext.fillStyle = this.lightColor;

    /**
     * Fills the canvas with the specified color.
     * @param {number} x - The x-coordinate of the top-left corner of the rectangle to fill.
     * @param {number} y - The y-coordinate of the top-left corner of the rectangle to fill.
     * @param {number} width - The width of the rectangle to fill.
     * @param {number} height - The height of the rectangle to fill.
     */
    this.lightContext.fillRect(0, 0, this.lightCanvas.width, this.lightCanvas.height);

    /**
     * Iterates over the collection of lights and renders each light.
     */
    for (const light of this.lights.values()) {
      /**
       * Skips rendering the light if it is not visible or enabled.
       */
      if (!light.visible || !light.enabled) continue;

      /**
       * Renders the specified light.
       * @param {Light} light - The light to render.
       */
      this.renderLight(light);

      /**
       * Renders an overlay for the specified light.
       * @param {Light} light - The light for which to render the overlay.
       */
      this.renderGlobalLightOverlay(light);
    }

    /**
     * Sets the global composite operation for rendering.
     * @type {string}
     */
    this.context.globalCompositeOperation = "source-over";

    /**
     * Sets the global alpha value for rendering.
     * @type {number}
     */
    this.context.globalAlpha = this.lightBrightness;

    /**
     * Draws the light canvas onto the main canvas.
     * @param {HTMLCanvasElement} image - The canvas to draw.
     * @param {number} sx - The x-coordinate of the top-left corner of the source rectangle.
     * @param {number} sy - The y-coordinate of the top-left corner of the source rectangle.
     * @param {number} swidth - The width of the source rectangle.
     * @param {number} sheight - The height of the source rectangle.
     * @param {number} x - The x-coordinate of the top-left corner of the destination rectangle.
     * @param {number} y - The y-coordinate of the top-left corner of the destination rectangle.
     * @param {number} width - The width of the destination rectangle.
     * @param {number} height - The height of the destination rectangle.
     */
    this.context.drawImage(
      this.lightCanvas,
      0,
      0,
      this.lightCanvas.width,
      this.lightCanvas.height,
      this.camera.position.x,
      this.camera.position.y,
      this.camera.size.x,
      this.camera.size.y
    );
  }

  /**
   * Renders a light effect on the canvas.
   *
   * @param {Object} light - The light object containing properties such as position, radius, distance, brightness, and steps.
   * @returns {void}
   */
  renderLight(light) {
    const gradient = this.getGradient({ context: this.context, light, position:light.position, radius:light.radius, distance:light.distance });

    gradient.addColorStop(0, "transparent");
    light.steps.forEach(step => gradient.addColorStop(step.start, step.color));

    this.context.globalCompositeOperation = "lighter";
    this.context.globalAlpha = light.brightness;
    this.context.fillStyle = gradient;
    this.context.fillRect(this.camera.position.x, this.camera.position.y, this.camera.size.x, this.camera.size.y);
  }

  /**
   * Renders a global light overlay on the canvas.
   *
   * @param {Object} light - The light object containing properties such as position, radius, and distance.
   * @returns {void}
   */
  renderGlobalLightOverlay(light) {
    // Calculates the scaled position based on the camera's position and scale.
    const position = {
      x: (light.position.x - this.camera.position.x) * this.camera.scale.x,
      y: (light.position.y - this.camera.position.y) * this.camera.scale.y
    };

    // Calculates the scaled radius based on the light's radius and camera's scale.
    const radius = light.radius * this.camera.scale.x * 0.8;

    // Creates a gradient object using the provided properties.
    const gradient = this.getGradient({
      context: this.lightContext,
      light,
      position,
      radius,
      distance: light.distance * this.camera.scale.x,
      scaledRadius: light.radius * this.camera.scale.x
    });

    // Adds transparent color stop to the gradient.
    gradient.addColorStop(0, "transparent");

    // Adds white color stop to the gradient.
    gradient.addColorStop(1, "#fff");

    // Sets the global composite operation to "destination-out" to create a light overlay effect.
    this.lightContext.globalCompositeOperation = "destination-out";

    // Sets the fill style to the gradient.
    this.lightContext.fillStyle = gradient;

    // Fills a rectangle on the light canvas.
    this.lightContext.fillRect(0, 0, this.lightCanvas.width, this.lightCanvas.height);
  }

  /**
   * Creates a gradient based on the provided parameters.
   * @param {Object} options - The options object.
   * @param {Object} options.context - The context object used to create the gradient.
   * @param {Object} options.light - The light object that determines the type of gradient to create.
   * @param {Object} options.position - The position object specifying the center of the gradient.
   * @param {number} options.radius - The radius of the gradient.
   * @param {number} options.distance - The distance parameter used for calculating the gradient direction.
   * @param {number} [options.scaledRadius=options.radius] - The scaled radius of the gradient. Defaults to the provided radius.
   * @returns {Object} The created gradient.
   */
  getGradient({ context, light, position, radius, distance, scaledRadius = radius }){
    let gradient = null;
    
    if(light.type === "spot"){
      gradient = context.createRadialGradient(position.x, position.y, radius, position.x, position.y, 0);
    }else if (light.type === "cone"){
      const angleFix = Math.PI / 4;
      const direction = new Vector(distance).rotate(light.angle - angleFix).add(position);
        
      gradient = context.createRadialGradient(
        direction.x, direction.y, scaledRadius, position.x, position.y, 0
      );
    }

    return gradient;
  }


  /**
   * Updates the global light settings.
   *
   * @param {object} globalLight - The global light object.
   * @param {string} globalLight.color - The color of the global light.
   * @param {number} globalLight.brightness - The brightness of the global light (between 0 and 1).
   */
  updateGlobalLight(globalLight){
    this.lightColor = globalLight.color;
    this.lightBrightness = 1 - globalLight.brightness;
  }

  /**
   * Set up the canvas, camera, and global light for the scene.
   *
   * @param {Canvas} canvas - The canvas element to render on.
   * @param {Camera} camera - The camera object for the scene.
   * @param {GlobalLight} globalLight - The global light settings for the scene.
   */
  setup(canvas, camera, globalLight){
    this.camera = camera;
    this.canvas = canvas;
    this.context = this.canvas.getContext('2d');
    this.lightCanvas.width = this.canvas.width;
    this.lightCanvas.height = this.canvas.height;
    this.updateGlobalLight(globalLight);
  }

  /**
   * Resizes the canvas and lightCanvas to the specified width and height.
   *
   * @param {number} width - The new width for the canvas and lightCanvas.
   * @param {number} height - The new height for the canvas and lightCanvas.
   */
  resize(width, height){
    this.canvas.width = width;
    this.canvas.height = height;
    this.lightCanvas.width = width;
    this.lightCanvas.height = height;
  }
}

new RendererWorker();