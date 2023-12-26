import Time from "./time.js";

export default class Runner{
  #id = 0;
  #onSetupCallbacks = new Map();
  #updateCallbacks = new Map();
  #beforeUpdateCallbacks = new Map();
  #afterUpdateCallbacks = new Map();
  #frameRateLimit = 60;
  #totalFPS = 0;
  #numFrames = 0;
  #debug = {
    enabled: false,
    framesToAverage: 600
  };
  #lastFrameTime = 0;
  running = false;
  Time = new Time();
  RAF = null;
  averageFPS = 0;

  get debug(){ return this.#debug; }

  set debug(value){
    if(typeof value !== "object") return;
    
    for(const key in value){
      if(this.#debug[key] !== undefined) this.#debug[key] = value[key];
    }
  }

  get frameRate(){
    return this.Time.frameRate;
  }

  get frameRateLimit(){
    return this.#frameRateLimit;
  }

  set frameRateLimit(value){
    if(isNaN(value)) return;
    this.#frameRateLimit = value;
  }

  get frameCount(){
    return this.Time.frameCount;
  }

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

  loop = () => {
    const now = performance.now();
    const elapsedTimeMS = now - this.Time.lastFrameTime;
    const targetTimeMS = 1000.0 / this.#frameRateLimit;
    const toleranceMS = 5;

    if (elapsedTimeMS >= targetTimeMS - toleranceMS){
      this.Time.update(now); // Update the time object.

      // Call the callbacks.
      for(const callback of this.#beforeUpdateCallbacks.values()) callback(this.Time);
      for(const callback of this.#updateCallbacks.values()) callback(this.Time);
      for(const callback of this.#afterUpdateCallbacks.values()) callback(this.Time);

      this.Time.frameCount++; // Increment the frame count.

      this.#totalFPS += this.Time.frameRate;
      this.#numFrames++;

      if(this.debug.enabled && this.Time.frameCount > this.#lastFrameTime + this.debug.framesToAverage){
        this.averageFPS = this.#totalFPS / this.#numFrames;
        
        console.clear(true);
        console.log(
          `%cAverage FPS from the last ${this.debug.framesToAverage} frames: \n%cFPS: ${this.averageFPS.toFixed(2)}`,
          'color: red; font-weight: bold; font-size: 20px',
          'color: #eee'
        )

        this.#totalFPS = 0;
        this.#numFrames = 0;
        this.#lastFrameTime = this.Time.frameCount;
      }
    }

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

    this.loop();

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

  get newID(){
    return this.#id++;
  }
}
