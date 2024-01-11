import Engine from "./engine/engine.js";
import RectangleShape from "./engine/objects/components/shapes/rectangle-shape.js";
import GameObject from "./engine/objects/game-object.js";
import Player from "./game-assets/player.js";
import Ball from "./game-assets/ball.js";
import Sprite from "./engine/objects/components/sprite.js";

const engine = new Engine();
const { SceneManager, Runner, Events, Vector } = engine;
const scene = engine.SceneManager.createScene('main');

SceneManager.changeScene('main');

const player = new Player(innerWidth / 2 - 150, innerHeight / 2 - 0.1);
const map = new GameObject();

scene.Camera.follow(player);

SceneManager.Renderer.antiAliasing = false;

map.size.set(2000);

scene.add(player);

const numBalls = 1;
const spawnArea = 100;

// for (let i = 0; i < numBalls; i++) {
  const randomX = Math.random() * (spawnArea * 2) - spawnArea + innerWidth / 2;
  const randomY = Math.random() * (spawnArea * 2) - spawnArea + innerHeight / 2;

  const newBall = new Ball(innerWidth / 2, innerHeight / 2);

  newBall.Render.mode = "shape";

  scene.add(newBall);
// }

const tileSize = scene.Physics.SpatialHash.cellSize;
const size = 300;
const startX = -size * 2;
const startY = -size * 2;
const endX = innerWidth + size * 2;
const endY = innerHeight + size * 2;

let lastRect = null;

for (let x = startX; x < endX; x += tileSize) {
  for (let y = startY; y < endY; y += tileSize) {
    const rect = new GameObject();

    rect.layer = -1;
    rect.updateMode = "render";

    rect.Render.shape.fillColor = "transparent";
    rect.Render.shape.lineColor = "#666";
    
    rect.position.set(x + tileSize/2, y + tileSize/2)
    rect.size.set(tileSize);
    rect.add(new RectangleShape(rect));

    rect.add(new Sprite(rect, { src: '/game-assets/texture.png', size: tileSize }));
    rect.Render.mode = "shape";

    lastRect = rect;

    scene.add(rect);
  }
}

Runner.onUpdate(() => {
  document.getElementById('fps').innerText = `FPS: ${Runner.frameRate.toFixed(0)}`;
  document.getElementById('added-objects').innerText = `Objects in scene: ${scene.addedObjects}`;

  player.LightSource.angle = player.position.angleBetween(newBall.position);
  player.LightSource.distance = player.position.distance(newBall.position);
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
    // if(onoff) scene.globalLight.brightness = 0;
    // else scene.globalLight.brightness = 1;
    // onoff = !onoff;

    console.log(JSON.stringify(player.Render.lightSource, null, 2))
    // console.log(rect, player)
  }
})