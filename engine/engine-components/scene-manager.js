import Renderer from "./renderer.js";
import Scene from "./scene.js";

export default class SceneManager {
  scenes = new Map();
  Renderer = new Renderer();
  #currentScene = null;

  createScene(scene){
    const newScene = new Scene();
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
      scene.setup(this.Renderer.context);
    });
  }

  beforeUpdate = (Time) => {
    if(this.#currentScene) this.#currentScene.beforeUpdate(Time);

    this.scenes.forEach(scene => {
      if(scene.updateOnBackground) scene.beforeUpdate(Time);
    });
  }

  update = (Time) => {
    this.#currentScene.update(Time);

    this.scenes.forEach(scene => {
      if(scene.updateOnBackground) scene.update(Time);
    });
  }

  afterUpdate = (Time) => {
    this.#currentScene.afterUpdate(Time);

    this.scenes.forEach(scene => {
      if(scene.updateOnBackground) scene.afterUpdate(Time);
    });

    this.beforeRender();
    this.render();
    this.afterRender();
  }

  beforeRender = (Time) => {
    this.Renderer.clear();
    this.#currentScene.beforeRender(this.Renderer.context);
  }

  render(){
    
    this.#currentScene.render(this.Renderer.context);
  }

  afterRender = (Time) => {
    this.#currentScene.afterRender(this.Renderer.context);
  }
}