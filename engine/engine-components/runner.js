import Events from "./events.js";
import Time from "./time.js";

export default class Runner{
  // Initialize private variables

  // Unique identifier for the instance
  #id = 0;

  // Map of setup callbacks
  #onSetupCallbacks = new Map();

  // Map of update callbacks
  #updateCallbacks = new Map();

  // Map of before update callbacks
  #beforeUpdateCallbacks = new Map();

  // Map of after update callbacks
  #afterUpdateCallbacks = new Map();

  // Maximum frame rate limit
  #frameRateLimit = 60;

  // Total frames per second
  #totalFPS = 0;

  // Number of frames
  #numFrames = 0;

  // Debug mode configuration
  #debug = {
    enabled: false, // Whether debug mode is enabled or not
    framesToAverage: 600 // Number of frames to average for FPS calculation
  };
  // Time of the last frame
  #lastFrameTime = 0;

  // Whether the instance is running or not
  running = false;

  // Instance of the Time class
  Time = new Time();

  // Request Animation Frame ID
  RAF = null;

  // Average frames per second
  averageFPS = 0;

  autoPause = true;

  constructor(){
    Events.on("blur", () => {
      if(this.autoPause){
        this.stop();
      }
    });

    Events.on("focus", () => {
      if(this.autoPause){
        this.start();
      }
    })
  }

  /**
   * Get the value of the debug property.
   *
   * @return {any} The value of the debug property.
   */
  get debug(){
    return this.#debug;
  }

  /**
   * Sets the debug configuration for the object.
   *
   * @param {object} value - The debug configuration object.
   */
  set debug(value){
    if(typeof value !== "object") return;
    
    for(const key in value){
      if(this.#debug[key] !== undefined) this.#debug[key] = value[key];
    }
  }

  /**
   * Get the frame rate.
   *
   * @return {number} The frame rate.
   */
  get frameRate(){
    return this.Time.frameRate;
  }

  /**
   * Get the frame rate limit.
   *
   * @return {type} The frame rate limit.
   */
  get frameRateLimit(){
    return this.#frameRateLimit;
  }

  /**
   * Sets the frame rate limit for the function.
   *
   * @param {number} value - The value to set as the frame rate limit.
   */
  set frameRateLimit(value){
    if(isNaN(value)) return;
    this.#frameRateLimit = value;
  }

  /**
   * Gets the frame count.
   *
   * @return {number} The frame count.
   */
  get frameCount(){
    return this.Time.frameCount;
  }

  /**
   * Asynchronously sets up a callback function.
   *
   * @param {function} callback - The callback function to set up.
   */
  async onSetup(callback){
    const id = this.newID;
    callback.id = id;
    this.#onSetupCallbacks.set(id, callback);
  }

  /**
   * Adds a callback to the list of callbacks that will be called before the loop runs.
   * @param {Function} callback - the callback to be called before the loop runs.
   * @returns {Runner} - the runner instance.
   * @example
   * runner.onBeforeUpdate(time => {
   *   console.log(time); // { deltaTimeMS: 16.666666666666668, deltaTimeS: 0.016666666666666666, totalTimeMS: 16.666666666666668, totalTimeS: 0.016666666666666666 }
   * });
   */
  onBeforeUpdate(callback){
    const id = this.newID;
    this.#beforeUpdateCallbacks.set(id, callback);
    callback.id = id;
    return this;
  }

  /**
   * Adds a callback to the list of callbacks that will be called whenever the loop runs.
   * @param {Function} callback - the callback to be called whenever the loop runs.
   * @returns {Runner} - the runner instance.
   * @example
   * runner.onUpdate(time => {
   *   console.log(time); // { deltaTimeMS: 16.666666666666668, deltaTimeS: 0.016666666666666666, totalTimeMS: 16.666666666666668, totalTimeS: 0.016666666666666666 }
   * });
   */
  onUpdate(callback){
    const id = this.newID;
    this.#updateCallbacks.set(id, callback);
    callback.id = id;
    return this;
  }

  /**
   * Adds a callback to the list of callbacks that will be called after the loop runs.
   * @param {Function} callback - the callback to be called after the loop runs.
   * @returns {Runner} - the runner instance.
   * @example
   * runner.onAfterUpdate(time => {
   *   console.log(time); // { deltaTimeMS: 16.666666666666668, deltaTimeS: 0.016666666666666666, deltaTime: 0.016666666666666666, totalTimeMS: 16.666666666666668, totalTimeS: 0.016666666666666666 }
   * });
   */
  onAfterUpdate(callback){
    const id = this.newID;
    this.#afterUpdateCallbacks.set(id, callback);
    callback.id = id;
    return this;
  }

  /**
   * Removes a callback from the update callbacks array.       
   * @param {Function} callback - the callback to remove from the update callbacks array.       
   * @returns {Runner} - the runner instance.
   */
  remove(callback){
    if(callback.id){
      this.#updateCallbacks.delete(id);
      this.#beforeUpdateCallbacks.delete(id);
      this.#afterUpdateCallbacks.delete(id);
    }
    return this;
  }

  /**
   * Main loop function that is called on each frame.
   */
  loop = () => {
    if(this.autoPause && !document.hasFocus()){
      this.stop();
    }

    // Get the current time
    const now = performance.now();

    // Calculate the elapsed time since the last frame
    const elapsedTimeMS = now - this.Time.lastFrameTime;

    // Calculate the target time for each frame based on the desired frame rate
    const targetTimeMS = 1000.0 / this.#frameRateLimit;

    // Define a tolerance for the frame rate to allow for variations
    const toleranceMS = 5;

    // Check if the elapsed time meets the target time with tolerance
    if (elapsedTimeMS >= targetTimeMS - toleranceMS){
      // Update the time object with the current time
      this.Time.update(now);

      // Call the before update callbacks
      for(const callback of this.#beforeUpdateCallbacks.values()) callback(this.Time);

      // Call the update callbacks
      for(const callback of this.#updateCallbacks.values()) callback(this.Time);

      // Call the after update callbacks
      for(const callback of this.#afterUpdateCallbacks.values()) callback(this.Time);

      // Calculate the average FPS
      this.#totalFPS += this.Time.frameRate;
      this.#numFrames++;

      // Check if debug mode is enabled and it's time to display the average FPS
      if(this.debug.enabled && this.Time.frameCount > this.#lastFrameTime + this.debug.framesToAverage){
        // Calculate the average FPS
        this.averageFPS = this.#totalFPS / this.#numFrames;

        // Log the average FPS to the console
        console.log(
          `%cAverage FPS from the last ${this.debug.framesToAverage} frames: \n%cFPS: ${this.averageFPS.toFixed(2)}`,
          'color: red; font-weight: bold; font-size: 20px',
          'color: #eee'
        )

        // Reset the total FPS and frame count
        this.#totalFPS = 0;
        this.#numFrames = 0;

        // Update the last frame time
        this.#lastFrameTime = this.Time.frameCount;
      }
    }

    // Request the next frame
    this.RAF = requestAnimationFrame(this.loop);
  }
  
  /**
   * Starts the animation loop and sets the last frame time to the current time.
   * @returns {Runner} - the runner instance.
   */
  start = () => {
    this.running = true;
    this.Time.lastFrameTime = performance.now();

    this.#onSetupCallbacks.forEach((callback, id) => {
      callback(this.Time);
      this.#onSetupCallbacks.delete(id);
    });

    requestAnimationFrame(this.loop);

    return this;
  }

  /**
   * Stops the animation frame loop, sets the running property to false, and sets the RAF property to null.
   * @returns {Runner} - the runner instance.
   */
  stop = () => {
    this.running = false;
    cancelAnimationFrame(this.RAF);
    this.RAF = null;

    return this;
  }

  /**
   * A function that runs the loop function a specified number of times.           
   * @param {number} times - the number of times to run the loop function.           
   * @returns None           
   */
  step = (times) => {
    const runLoop = () => {
      this.loop();
      if (--times > 0) {
        requestAnimationFrame(runLoop);
      }
    };
    
    runLoop();
  };

  /**
   * Returns a new ID and increments the internal ID counter.
   *
   * @return {number} The new ID.
   */
  get newID(){
    return this.#id++;
  }
}
