import Renderer from "./renderer.js";
import Scene from "./scene.js";

export default class SceneManager {
  scenes = new Map();
  Renderer = new Renderer();
  #currentScene = null;

  createScene(scene){
    const newScene = new Scene(this.Renderer);
    newScene.name = scene;
    this.addScene(newScene);

    return newScene;
  }

  addScene(scene){
    this.scenes.set(scene.name, scene);
  }

  changeScene(scene){
    this.#currentScene = this.scenes.get(scene);
  }

  get currentScene(){
    return this.#currentScene;
  }

  setup(){
    this.scenes.forEach(scene => {
      scene.setup(this.Renderer.canvas);
    });
  }

  beforeUpdate = (Time) => {
    if(this.#currentScene) this.#currentScene.beforeUpdate(Time);

    this.scenes.forEach(scene => {
      if(scene.updateOnBackground) scene.beforeUpdate(Time);
    });
  }

  update = (Time) => {
    if(this.#currentScene) this.#currentScene.update(Time);

    this.scenes.forEach(scene => {
      if(scene.updateOnBackground) scene.update(Time);
    });
  }

  afterUpdate = (Time) => {
    if(this.#currentScene) this.#currentScene.afterUpdate(Time);

    this.scenes.forEach(scene => {
      if(scene.updateOnBackground) scene.afterUpdate(Time);
    });

    this.beforeRender();
    this.render(Time);
    this.afterRender();
  }

  beforeRender = () => {
    if(this.#currentScene) this.#currentScene.beforeRender();
  }

  render(){
    if(this.#currentScene) this.#currentScene.render();
  }

  afterRender = () => {
    if(this.#currentScene) this.#currentScene.afterRender?.();
  }
}