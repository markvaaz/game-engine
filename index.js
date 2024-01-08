import Engine from "./engine/engine.js";
import RectangleShape from "./engine/objects/components/shapes/rectangle-shape.js";
import GameObject from "./engine/objects/game-object.js";
import Player from "./game-assets/player.js";
import Ball from "./game-assets/ball.js";

const engine = new Engine();
const { SceneManager, Runner, Events, Vector } = engine;
const scene = engine.SceneManager.createScene('main');

SceneManager.changeScene('main');

const player = new Player(innerWidth / 2, innerHeight / 2 - 200);
const map = new GameObject();

scene.Camera.follow(player);

map.size.set(2000);

scene.add(player);

const numBalls = 100;
const spawnArea = 1000;

for (let i = 0; i < numBalls; i++) {
  const randomX = Math.random() * (spawnArea * 2) - spawnArea + innerWidth / 2;
  const randomY = Math.random() * (spawnArea * 2) - spawnArea + innerHeight / 2;

  const newBall = new Ball(randomX, randomY);

  scene.add(newBall);
}

const tileSize = scene.Physics.SpatialHash.cellSize;
const size = 3200;
const startX = -size * 2;
const startY = -size * 2;
const endX = innerWidth + size * 2;
const endY = innerHeight + size * 2;

for (let x = startX; x < endX; x += tileSize) {
  for (let y = startY; y < endY; y += tileSize) {
    const rect = new GameObject();

    rect.layer = -2;
    rect.updateMode = "render";

    rect.Render.shape.fillColor = "transparent";
    rect.Render.shape.lineColor = "#666";
    
    rect.position.set(x + tileSize/2, y + tileSize/2);
    rect.size.set(tileSize);
    rect.add(new RectangleShape(rect));
    scene.add(rect);
  }
}

Runner.onUpdate(() => {
  document.getElementById('fps').innerText = `FPS: ${Runner.frameRate.toFixed(0)}`;
  document.getElementById('added-objects').innerText = `Objects in scene: ${scene.addedObjects}`;
});

engine.setStyle();

engine.setup();

engine.run();

let onoff = true;

Events.on("keydown", e => {
  if(e.key == 'F5'){
    location.reload();
  }

  if(e.key == ' '){
    if(onoff) scene.globalLight.brightness = 0;
    else scene.globalLight.brightness = 1;
    onoff = !onoff;
  }
})