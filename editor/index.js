import Vector from "../engine/engine-components/vector.js";
import Rectangle from "../engine/objects/rectangle.js";

const { SceneManager, Events } = engineWindow.Engine;
const windowSize = new Vector(engineWindow.innerWidth, engineWindow.innerHeight);

const scene = SceneManager.createScene("EditorScene");
SceneManager.changeScene(scene);

const rect = new Rectangle(100, 100);

rect.position.set(windowSize.x / 2, windowSize.y / 2);

scene.add(rect, true);

Events.on("update", () => {
  
});