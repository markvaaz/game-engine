import TileMap from "./engine/engine-components/tile-map.js";
import Engine from "./engine/engine.js";
import Player from "./game-assets/player.js";

const { SceneManager, Runner, Events } = Engine;
const scene = Engine.SceneManager.createScene('main');
const player = new Player(300,300);

Runner.onUpdate(() => {
  document.getElementById("fps").innerHTML = Runner.frameRate.toFixed(0);
})

SceneManager.changeScene('main');

Events.on("keydown", () => {
  if(Events.keys.has('F5')){
    location.reload();
  }

  if(Events.keys.has('F3')){
    // scene.save();
    // Events.emit("loadScene", "./save.json");
    SceneManager.currentScene.clear()
    console.log(SceneManager.currentScene)
  }

  if(Events.keys.has('F4')){
    Events.emit("loadScene", "./save.json");
  }
});

// scene.load(await (await fetch("./save.json")).json());
// SceneManager.loadScene("./save.json");

Events.on("sceneLoaded", (event) => {
  const { id, scene } = event.data;
  scene.Camera.goTo(600, 750);
})

player.zIndex = 15;

scene.add(player)

console.log(new TileMap("/game-assets/map/", "tile-map.json"));
// Events.emit("loadScene", "./save.json");

Engine.run();