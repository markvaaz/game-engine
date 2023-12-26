import Runner from "./engine-components/runner.js";
import Events from "./engine-components/events.js";
import Vector from "./engine-components/vector.js";
import SceneManager from "./engine-components/scene-manager.js";

export default class Engine{
  constructor(){
    this.SceneManager = new SceneManager();
    this.Renderer = this.SceneManager.Renderer;
    this.Runner = new Runner();
    this.Vector = Vector;
    this.Events = Events;
  }

  get Time(){
    return this.Runner.Time;
  }

  setup(){
    this.SceneManager.setup();
    this.Runner.onBeforeUpdate(this.SceneManager.beforeUpdate);
    this.Runner.onUpdate(this.SceneManager.update);
    this.Runner.onAfterUpdate(this.SceneManager.afterUpdate);
  }

  run(){
    this.Runner.start();
  }

  stop(){
    this.Runner.stop();
  }

  setStyle(){
    document.body.style.margin = 0;
    document.body.style.padding = 0;
    document.body.style.overflow = 'hidden';
  }
}