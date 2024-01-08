import Renderer from "./renderer.js";
import Scene from "./scene.js";

export default class SceneManager {
  scenes = new Map();
  Renderer = new Renderer();
  #currentScene = null;

  /**
   * Creates a new scene and adds it to the renderer.
   *
   * @param {string} scene - The name of the scene.
   * @return {Scene} The newly created scene.
   */
  createScene(scene){
    const newScene = new Scene(this.Renderer);
    newScene.name = scene;
    this.addScene(newScene);

    return newScene;
  }

  /**
   * Adds a scene to the map of scenes.
   *
   * @param {Scene} scene - The scene object to be added.
   */
  addScene(scene){
    this.scenes.set(scene.name, scene);
  }

  /**
   * Change the current scene to the specified scene.
   *
   * @param {string} scene - The name of the scene to change to.
   * @return {undefined} This function does not return a value.
   */
  changeScene(scene){
    this.#currentScene = this.scenes.get(scene);
  }

  /**
   * Returns the current scene.
   *
   * @return {type} The current scene.
   */
  get currentScene(){
    return this.#currentScene;
  }

  /**
   * Sets up the function.
   *
   * @param {type} paramName - description of parameter
   * @return {type} description of return value
   */
  setup(){
    this.scenes.forEach(scene => {
      scene.setup(this.Renderer.canvas);
    });
  }

  /**
   * Performs actions before updating the scenes.
   * @param {number} Time - The current time.
   */
  beforeUpdate = (Time) => {
    // Calls the beforeUpdate function of the current scene, if it exists
    if(this.#currentScene) this.#currentScene.beforeUpdate(Time);

    // Calls the beforeUpdate function of each scene that has updateOnBackground set to true
    this.scenes.forEach(scene => {
      if(scene.updateOnBackground) scene.beforeUpdate(Time);
    });
  }

  /**
   * Updates the current scene and other scenes if they should be updated in the background.
   * @param {number} Time - The current time.
   */
  update = (Time) => {
    // Update the current scene if it exists
    if(this.#currentScene) this.#currentScene.update(Time);

    // Update other scenes if they should be updated in the background
    this.scenes.forEach(scene => {
      if(scene.updateOnBackground) scene.update(Time);
    });
  }

  /**
   * Executes after the update of the time.
   * @param {number} Time - The time value.
   */
  afterUpdate = (Time) => {
    // Executes the beforeRender method.
    this.beforeRender();

    // Executes the render method.
    this.render(Time);

    // Executes the afterRender method.
    this.afterRender();
  }

  /**
   * Executes the "beforeRender" method.
   *
   * This method calls the "beforeRender" method of the current scene if it exists.
   */
  beforeRender(){
    if(this.#currentScene) this.#currentScene.beforeRender();
  }

  /**
   * Render the current scene.
   */
  render(){
    if(this.#currentScene) this.#currentScene.render();
  }

  /**
   * Calls the afterRender function of the current scene if it exists.
   */
  afterRender(){
    if(this.#currentScene) this.#currentScene.afterRender?.();
  }
}