import Engine from "./engine/engine.js";
import { Rectangle as RectangleShape } from "./engine/objects/components/shape.js";
import GameObject from "./engine/objects/game-object.js";
import Player from "./game-assets/player.js";
import Ball from "./game-assets/ball.js";
import Rectangle from "./engine/objects/rectangle.js";
import LightSource from "./engine/objects/components/light-source.js";
import Shadow from "./engine/objects/components/shadow.js";
import Sprite from "./engine/objects/components/sprite.js";
import Collider from "./engine/objects/components/collider.js";

const { SceneManager, Runner, Events, Vector } = Engine;
const scene = Engine.SceneManager.createScene('main');

SceneManager.changeScene('main');
// scene.globalLight.brightness = 0;

const player = new Player(innerWidth / 2, innerHeight / 2);
const map = new GameObject();

// scene.Camera.follow(player);
// scene.Camera.followMode = "instant";

SceneManager.Renderer.antiAliasing = false;

map.size.set(2000);

// scene.add(player);

const numBalls = 0;
const spawnArea = 10;
const balls = [];

function createBall(x, y) {
  const ball = new Ball(x, y);

  ball.add(LightSource, 200);

  ball.add(Sprite, {
    src: "/pixaria-logo.png",
    position: new Vector(0, 0),
    size: 120
  })

  ball.Sprite.direction = Math.random() > 0.5 ? 1 : -1;

  ball.Render.mode = "shape";

  ball.LightSource.enabled = false;
  ball.LightSource.add({
    start: 0,
    color: "rgba(255, 255, 255, 1)"
  });

  // ball.target = player;
  
  // ball.LightSource.mode = "difference";

  scene.add(ball);
  balls.push(ball);
}

for (let i = 0; i < numBalls; i++) {
  const randomX = Math.random() * (spawnArea * 2) - spawnArea + innerWidth / 2;
  const randomY = Math.random() * (spawnArea * 2) - spawnArea + innerHeight / 2;

  createBall(randomX, randomY);
}

function createWall(x, y, width, height, rotation = 0) {
  const wall = new GameObject(width, height);
  wall.size.set(width, height);
  wall.add(RectangleShape);
  wall.add(Collider);
  wall.position.set(x, y);
  wall.RigidBody.static = true;

  wall.add(Shadow);

  wall.rotation = rotation;

  wall.Shadow.opacity = 1;

  // wall.Render.shape.darkZone = true;

  scene.add(wall);
  return wall;
}

const centerX = innerWidth / 2;
const centerY = innerHeight / 2;
const wallWidth = 2000;
const wallHeight = 400;
const half = wallWidth / 2 + wallHeight / 2 - 400;

createWall(centerX - half, centerY, wallHeight, wallWidth);
createWall(centerX + half, centerY, wallHeight, wallWidth);
createWall(centerX, centerY - half, wallWidth, wallHeight);
createWall(centerX, centerY + half, wallWidth, wallHeight);

// const tileSize = scene.CollisionManager.SpatialHash.cellSize;
// const size = 800;
// const startX = -size * 2;
// const startY = -size * 2;
// const endX = innerWidth + size * 2;
// const endY = innerHeight + size * 2;

// for (let x = startX; x < endX; x += tileSize) {
//   for (let y = startY; y < endY; y += tileSize) {
//     const rect = new GameObject();

//     rect.layer = -1;
//     rect.updateMode = "render";
    
//     rect.position.set(x + tileSize/2, y + tileSize/2)
//     rect.size.set(tileSize);
//     rect.add(RectangleShape);
//     rect.Render.shape.color = "transparent";
//     rect.Render.shape.borderColor = "#666";

//     rect.Render.mode = "shape";

//     scene.add(rect);
//   }
// }

Runner.onUpdate(() => {
  if(Events.mouse.down && Events.mouse.buttons.has(0)){
    createBall(Events.mouse.x, Events.mouse.y);
  }

  document.getElementById("fps").innerHTML = Runner.frameRate.toFixed(0);
});

Engine.run();

window.Engine = Engine;
window.EventF = Event;