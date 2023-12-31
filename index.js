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

// scene.Lights.disabled = true;
scene.Lights.globalLight.enabled = false;

SceneManager.changeScene('main');

// Runner.debug = {
//   enabled: true,
//   framesToAverage: 5
// }

scene.debug = {
  // enabled: true,
  // lineColor: "#fff",
  // name: true
}

const camera = scene.Camera;
const player = new Player(innerWidth / 2, innerHeight / 2 - 200);
const map = new GameObject();

map.size.set(2000);

player.add(new LightSource(player, 400));
// player.LightSource.mode = "lighter";
// player.LightSource.disabled = true;
player.LightSource.brightness = 0.5;
player.LightSource.oscillate = true;

player.LightSource.add([
  { start: 0, color: "rgba(255, 0, 255, 1)" },
  { start: 0.7, color: "transparent" }
]);

scene.add(player);

function createWall(x, y, width, height) {
  const wall = new Rectangle(width, height);
  wall.position.set(x, y);
  wall.RigidBody.static = true;
  wall.debug.enabled = true;
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

const numBalls = 10;
const balls = [];
const spawnArea = 950;

for (let i = 0; i < numBalls; i++) {
  const randomX = Math.random() * (spawnArea * 2) - spawnArea + innerWidth / 2;
  const randomY = Math.random() * (spawnArea * 2) - spawnArea + innerHeight / 2;

  const newBall = new Test(randomX, randomY);

  newBall.name = "ball"
  newBall.add(new LightSource(newBall, 200));

  scene.add(newBall);
  balls.push(newBall);
}

// const tileSize = scene.Physics.SpatialHash.cellSize;
// const startX = -1280 * 2;
// const startY = -1280 * 2;
// const endX = innerWidth + 1280 * 2;
// const endY = innerHeight + 1280 * 2;

// const rects = new Map();

// for (let x = startX; x < endX; x += tileSize) {
//   for (let y = startY; y < endY; y += tileSize) {
//     const rect = new GameObject();

//     rect.debug = {
//       enabled: true,
//       // fillColor: `hsl(${Math.random() * 360} 100% 50% / 100%)`,
//       lineColor: "#444",
//       vertices: false,
//       centerOfMass: false,
//       lineWidth: 1
//     }

//     rect.layer = -2;
    
//     rect.size.set(tileSize);
//     rect.position.set(x + tileSize/2, y + tileSize/2);
//     rect.add(new RectangleShape(rect));
//     // rect.add(new Sprite(rect, 'game-assets/tile.jpeg'));
//     scene.add(rect);
    
//     const hash = scene.Physics.SpatialHash.getHashFromPoint(x, y);
    
//     const X = hash.split(',')[0];
//     const Y = hash.split(',')[1];

//     rect.name = `X: ${X}, Y: ${Y}`;

//     rects.set(hash, rect);
//   }
// }

Runner.onSetup(() => {
  // camera.scale.set(1.5, 1.5);
  // camera.followMode = "instant";
  camera.followMode = "smooth";
  camera.follow(player);
  // camera.goTo(obstacle.position);
})



Runner.onUpdate(Time => {
  document.getElementById('fps').innerText = Runner.frameRate.toFixed(0);

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
});

engine.setStyle();

engine.setup();

engine.run();

Events.on("keydown", e => {
  if(e.key == 'F5'){
    location.reload();
  }
  if(e.key == ' ') {
    scene.Lights.disabled = !scene.Lights.disabled
  }
})