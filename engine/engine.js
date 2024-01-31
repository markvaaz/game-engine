import Runner from "./engine-components/runner.js";
import Events from "./engine-components/events.js";
import Vector from "./engine-components/vector.js";
import SceneManager from "./engine-components/scene-manager.js";
import Time from "./engine-components/time.js";

export default class Engine{
  // Create a new instance of SceneManager
  static SceneManager = new SceneManager();

  // Set the Renderer property to the Renderer instance of SceneManager
  static Renderer = Engine.SceneManager.Renderer;

  // Create a new instance of Runner
  static Runner = new Runner();

  // Assign Vector class to the Vector property
  static Vector = Vector;

  // Assign Events class to the Events property
  static Events = Events;

  static Time = Time;

  /**
   * Sets up the function by calling the SceneManager's setup method and 
   * attaching the SceneManager's beforeUpdate, update, and afterUpdate
   * methods to the Runner's onBeforeUpdate, onUpdate, and onAfterUpdate 
   * events respectively.
   */
  static setup(){
    Engine.SceneManager.setup();
    Engine.Runner.onBeforeUpdate(Engine.SceneManager.beforeUpdate);
    Engine.Runner.onUpdate(Engine.SceneManager.update);
    Engine.Runner.onAfterUpdate(Engine.SceneManager.afterUpdate);
  }

  /**
   * Starts the Runner, which will run the game loop.
   */
  static run(){
    Engine.setStyle();
    Engine.setup();
    Engine.Runner.start();
  }

  /**
   * Stop the execution of the Runner.
   *
   * @param {type} paramName - description of parameter
   * @return {type} description of return value
   */
  static stop(){
    Engine.Runner.stop();
  }

  /**
   * Set the style properties of the document body.
   *
   * @param {} - This function does not take any parameters.
   * @return {} - This function does not return a value.
   */
  static setStyle(){
    document.body.style.margin = 0;
    document.body.style.padding = 0;
    document.body.style.overflow = 'hidden';
  }
}