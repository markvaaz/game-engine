/**
 * The Renderer class is responsible for rendering game objects on a canvas using a web worker.
 */
export default class Renderer {
  /**
   * The canvas element used for rendering.
   * @type {HTMLCanvasElement}
   */
  canvas = document.createElement("canvas");

  /**
   * The web worker used for rendering.
   * @type {Worker}
   */
  worker = new Worker(new URL('./workers/renderer-worker.js', import.meta.url), { type: "module" });

  clearing = false;

  #antiAliasing = false;

  /**
   * Constructs a new Renderer instance.
   * Initializes the canvas, attaches event listeners, and sets up the web worker.
   */
  constructor() {
    // Set canvas dimensions
    this.canvas.width = innerWidth;
    this.canvas.height = innerHeight;

    // Prevent context menu on canvas
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());

    // Append canvas to the document body
    document.body.appendChild(this.canvas);

    // this.canvas.addEventListener('click', e => {
    //   this.canvas.requestPointerLock({
    //     unadjustedMovement: true,
    //   });
    // })

    // Transfer control of the canvas to the web worker
    this.offscreenCanvas = this.canvas.transferControlToOffscreen();

    // Set up message event listener for the web worker
    this.worker.onmessage = this.onmessage;

    // Add window resize event listener
    window.addEventListener('resize', () => this.resize());
  }

  get antiAliasing() {
    return this.#antiAliasing;
  }

  set antiAliasing(value) {
    this.#antiAliasing = value;
    this.worker.postMessage({ action: "antiAliasing", value });
  }

  onmessage = (event) => {
    const actions = {
      cleared: () => this.clearing = false
    }

    if(actions[event.data.action]) actions[event.data.action](event.data);
  }

  /**
   * Adds a game object for rendering.
   * @param {GameObject} gameObject - The game object to be added.
   */
  add(gameObject) {
    this.worker.postMessage({ action: "add", gameObject: gameObject.Render });
  }

  /**
   * Updates the state of multiple game objects for rendering.
   * @param {GameObject[]} gameObjects - The array of game objects to be updated.
   */
  update(gameObjects) {
    this.worker.postMessage({ action: "update", gameObjects });
  }

  /**
   * Sets up the renderer with the camera, global light settings, and offscreen canvas.
   * @param {Camera} camera - The camera configuration for rendering.
   * @param {Light} globalLight - The global light configuration for rendering.
   */
  setupCanvas() {
    this.worker.postMessage({
      action: "setup",
      canvas: this.offscreenCanvas,
      antiAliasing: this.#antiAliasing
    }, [this.offscreenCanvas]);
  }

  setupScene(camera, globalLight) {
    if(!camera || !globalLight) return;

    this.worker.postMessage({ 
      action: "setupScene",
      camera: camera.toObject(), 
      globalLight: { color: globalLight.color, brightness: globalLight.brightness }
    });
  }

  /**
   * Updates the camera settings.
   * @param {Camera} camera - The updated camera configuration.
   */
  updateCamera(camera) {
    if(!camera) return;
    this.worker.postMessage({ action: "updateCamera", camera });
  }

  /**
   * Updates the global light settings.
   * @param {string} color - The updated light color.
   * @param {number} brightness - The updated light brightness.
   */
  updateLight(color, brightness) {
    this.worker.postMessage({ action: "updateLight", color, brightness });
  }

  /**
   * Initiates the rendering process.
   */
  render() {
    this.worker.postMessage({ action: "render" });
  }

  /**
   * Resizes the canvas based on the current inner width and height of the window.
   */
  resize() {
    this.worker.postMessage({ action: "resize", width: innerWidth, height: innerHeight });
  }

  clear(){
    this.clearing = true;
    this.worker.postMessage({ action: "clear" });
  }
}