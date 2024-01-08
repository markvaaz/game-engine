import Runner from "./engine-components/runner.js";
import Events from "./engine-components/events.js";
import Vector from "./engine-components/vector.js";
import SceneManager from "./engine-components/scene-manager.js";

export default class Engine{
  /**
   * Initialize the class with necessary dependencies.
   */
  constructor() {
    // Create a new instance of SceneManager
    this.SceneManager = new SceneManager();

    // Set the Renderer property to the Renderer instance of SceneManager
    this.Renderer = this.SceneManager.Renderer;

    // Create a new instance of Runner
    this.Runner = new Runner();

    // Assign Vector class to the Vector property
    this.Vector = Vector;

    // Assign Events class to the Events property
    this.Events = Events;
  }

  /**
   * Retrieves the value of the Time property.
   *
   * @return {type} The value of the Time property.
   */
  get Time(){
    return this.Runner.Time;
  }

  /**
   * Sets up the function by calling the SceneManager's setup method and 
   * attaching the SceneManager's beforeUpdate, update, and afterUpdate
   * methods to the Runner's onBeforeUpdate, onUpdate, and onAfterUpdate 
   * events respectively.
   */
  setup(){
    this.SceneManager.setup();
    this.Runner.onBeforeUpdate(this.SceneManager.beforeUpdate);
    this.Runner.onUpdate(this.SceneManager.update);
    this.Runner.onAfterUpdate(this.SceneManager.afterUpdate);
  }

  /**
   * Starts the Runner, which will run the game loop.
   */
  run(){
    this.Runner.start();
  }

  /**
   * Stop the execution of the Runner.
   *
   * @param {type} paramName - description of parameter
   * @return {type} description of return value
   */
  stop(){
    this.Runner.stop();
  }

  /**
   * Set the style properties of the document body.
   *
   * @param {} - This function does not take any parameters.
   * @return {} - This function does not return a value.
   */
  setStyle(){
    document.body.style.margin = 0;
    document.body.style.padding = 0;
    document.body.style.overflow = 'hidden';
  }
}