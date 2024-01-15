import Engine from "./engine/engine.js";
import RectangleShape from "./engine/objects/components/shapes/rectangle-shape.js";
import GameObject from "./engine/objects/game-object.js";
import Player from "./game-assets/player.js";
import Ball from "./game-assets/ball.js";
import Sprite from "./engine/objects/components/sprite.js";
import Rectangle from "./engine/objects/rectangle.js";

const engine = new Engine();
const { SceneManager, Runner, Events, Vector } = engine;
const scene = engine.SceneManager.createScene('main');

SceneManager.changeScene('main');

const player = new Player(innerWidth / 2 - 0.1, innerHeight / 2 - 200);
const map = new GameObject();

scene.Camera.follow(player);

SceneManager.Renderer.antiAliasing = false;

map.size.set(2000);

scene.add(player);

const numBalls = 20;
const spawnArea = 300;

for (let i = 0; i < numBalls; i++) {
  const randomX = Math.random() * (spawnArea * 2) - spawnArea + innerWidth / 2;
  const randomY = Math.random() * (spawnArea * 2) - spawnArea + innerHeight / 2;

  const newBall = new Ball(randomX, randomY);

  newBall.Render.mode = "shape";

  scene.add(newBall);
}

function createWall(x, y, width, height) {
  const wall = new Rectangle(width, height);
  wall.position.set(x, y);
  wall.RigidBody.static = true;
  wall.Render.shape.shadow.enabled = true;
  wall.Render.shape.shadow.type = "wall";
  // wall.Render.shape.fillColor = "#000";

  scene.add(wall);
  return wall;
}

const centerX = innerWidth / 2;
const centerY = innerHeight / 2;
const wallWidth = 2000;
const wallHeight = 150;

createWall(centerX - 1000, centerY, wallHeight, wallWidth);
createWall(centerX + 1000, centerY, wallHeight, wallWidth);
createWall(centerX, centerY - 1000, wallWidth, wallHeight);
createWall(centerX, centerY + 1000, wallWidth, wallHeight);

const tileSize = scene.Physics.SpatialHash.cellSize;
const size = 800;
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

  // player.LightSource.angle = player.position.angleBetween(newBall.position);
  // player.LightSource.distance = player.position.distance(newBall.position);
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

    // console.log(rect, player)
  }
})