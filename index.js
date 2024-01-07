import Engine from "./engine/engine.js";
import Ellipse from "./engine/objects/ellipse.js";
import Rectangle from "./engine/objects/rectangle.js"; // game object ready with collider
import RectangleShape from "./engine/objects/components/shapes/rectangle-shape.js"; //without collider but only a shape not a game object
import GameObject from "./engine/objects/game-object.js";
import Capsule from "./engine/objects/capsule.js";
import Player from "./game-assets/player.js";
import Polygon from "./engine/objects/polygon.js";
import Test from "./game-assets/test.js";
import Sprite from "./engine/objects/components/sprite.js";
import EllipseShape from "./engine/objects/components/shapes/ellipse-shape.js";
import Shape from "./engine/objects/components/shape.js";
import LightSource from "./engine/objects/components/light-source.js";

const engine = new Engine();
const { SceneManager, Runner, Events, Vector } = engine;
const scene = engine.SceneManager.createScene('main');

scene.globalLight.brightness = 0;

SceneManager.changeScene('main');

const camera = scene.Camera;
const player = new Player(innerWidth / 2, innerHeight / 2 - 200);
const map = new GameObject();

map.size.set(2000);

player.add(new LightSource(player, 250));
// player.LightSource.mode = "lighter";
// player.LightSource.disabled = true;
// player.LightSource.brightness = 0.5;1
player.LightSource.type = "cone";
player.LightSource.angle = 0;
player.LightSource.distance = 400;


player.LightSource.add([
  { start: 0, color: "rgba(255, 255, 255, 0.3)" },
  { start: 1, color: "transparent" },
]);

scene.add(player);

function createWall(x, y, width, height) {
  const wall = new Rectangle(width, height);
  wall.position.set(x, y);
  wall.RigidBody.static = true;
  scene.add(wall);
  return wall;
}

const centerX = innerWidth / 2;
const centerY = innerHeight / 2;
const wallWidth = 2000;
const wallHeight = 150;

const numBalls = 1;
const balls = [];
const spawnArea = 1000;

for (let i = 0; i < numBalls; i++) {
  const randomX = Math.random() * (spawnArea * 2) - spawnArea + innerWidth / 2;
  const randomY = Math.random() * (spawnArea * 2) - spawnArea + innerHeight / 2;

  const newBall = new Test(randomX, randomY);

  newBall.name = "ball"

  if(Math.random() > 0.8){
    // newBall.add(new LightSource(newBall, 250));
    // newBall.LightSource.add([
    //   { start: 0, color: "transparent" },
    //   // { start: 0.7, color: "transparent" }
    // ]);
  }

  newBall.Render.addSprite('/game-assets/tile.jpeg', { x: 0, y: 0, width: 64, height: 64 });
  newBall.Render.mode = "shape";

  scene.add(newBall);
  balls.push(newBall);
}

const tileSize = scene.Physics.SpatialHash.cellSize;
const size = 1600;
const startX = -size * 2;
const startY = -size * 2;
const endX = innerWidth + size * 2;
const endY = innerHeight + size * 2;

const rects = new Map();

if(true){
  for (let x = startX; x < endX; x += tileSize) {
    for (let y = startY; y < endY; y += tileSize) {
      const rect = new GameObject();
  
      rect.layer = -2;
      rect.updateMode = "render";
  
      rect.Render.shape.fillColor = "transparent";
      
      rect.size.set(tileSize);
      rect.position.set(x + tileSize/2, y + tileSize/2);
      rect.add(new RectangleShape(rect));
      rect.Render.addSprite('/game-assets/tile.jpeg', { x: 0, y: 0, width: tileSize, height: tileSize });
      rect.Render.mode = "shape";
      scene.add(rect);
      
      const hash = scene.Physics.SpatialHash.getHashFromPoint(x, y);
      
      const X = hash.split(',')[0];
      const Y = hash.split(',')[1];
  
      rect.name = `X: ${X}, Y: ${Y}`;
  
      rects.set(hash, rect);
    }
  }
}


Runner.onSetup(() => {
  // camera.scale.set(1.5, 1.5);
  camera.followMode = "instant";
  // camera.followMode = "smooth";
  camera.follow(player);
  // camera.goTo(obstacle.position);
})



Runner.onUpdate(Time => {
  document.getElementById('fps').innerText = Runner.frameRate.toFixed(0);

  // const max = 1;
  // const min = 0;

  // scene.globalLight.brightness = ((max - min) / 2) * Math.sin(Time.frameCount * 0.01) + (max + min) / 2;

  if(false){
    rects.forEach((value, key) => {
      if(scene.Physics.SpatialHash.get(key)?.size > 0){
        value.debug.lineWidth = 3;
        value.debug.lineColor = '#555';
        value.debug.nameColor = '#888';
        // value.debug.name = true;
        value.layer = -1;
      }else{
        value.debug.lineWidth = 1;
        value.debug.lineColor = '#444';
        value.debug.name = false;
        value.layer = -2;
      }
    });
  }

  document.getElementById('added-objects').innerText = "Objects in scene: " +scene.addedObjects;

  // player.LightSource.angle = player.position.angleBetween(balls[0].position) - 0.8;
  // player.LightSource.distance = Math.min(Infinity, player.position.distance(balls[0].position));
});

Events.on("mousemove", e => {
  player.LightSource.angle = player.position.angleBetween(Events.mouse.position) - 0.8;
  player.LightSource.distance = Math.min(400, player.position.distance(Events.mouse.position));
})

engine.setStyle();

engine.setup();

engine.run();

Events.on("keydown", e => {
  if(e.key == 'F5'){
    location.reload();
  }
  if(e.key == ' ') {
    player.LightSource.enabled = !player.LightSource.enabled;
  }
  if(e.key == '0') {
    scene.globalLight.brightness = 0;
  }
  if(e.key == '1') {
    scene.globalLight.brightness = 1;
  }
})