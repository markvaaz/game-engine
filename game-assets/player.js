import GameObject from "../engine/objects/game-object.js";
import Events from "../engine/engine-components/events.js";
import CapsuleShape from "../engine/objects/components/shapes/capsule-shape.js";
import Collider from "../engine/objects/components/collider.js";
import Vector from "../engine/engine-components/vector.js";
import LightSource from "../engine/objects/components/light-source.js";
import AnimatedSprite from "../engine/objects/components/animated-sprite.js";
import Sprite from "../engine/objects/components/sprite.js";
import EllipseShape from "../engine/objects/components/shapes/ellipse-shape.js";
import RectangleShape from "../engine/objects/components/shapes/rectangle-shape.js";


export default class Player extends GameObject{
  name = "Player";
  direction = new Vector(0, 0);

  constructor(x, y){
    super();
    this.add(CapsuleShape);
    this.add(Collider);
    // this.debug = true;
    this.position.set(x, y);
    this.size.set(60, 80);
    this.layer = 1
    this.add(LightSource, 500);
    this.LightSource.enabled = false;
    this.LightSource.type = "radial"; 
    // this.LightSource.angle = -Math.PI / 6.85;
    this.LightSource.distance = 0;
    this.LightSource.add([
      { start: 0, color: "rgba(255, 255, 255, 1)" },
      { start: 1, color: "transparent" },
    ]);

    // this.rotation = Math.PI / 2;

    // this.add(AnimatedSprite, {
    //   srcs: ["/game-assets/swordman/swordman.png"],
    //   position: new Vector(0, 0),
    //   size: new Vector(64, 64),
    //   frameRate: 8,
    //   type: "sheet",
    //   scale: new Vector(3),
    //   anchor: new Vector(0.05, -0.05),
    //   debug: true
    // });

    // this.Render.mode = "sprite";

    let holding = false;

    Events.on("keydown", () => {
      if((Events.keys.has("f") || Events.keys.has("F")) && !holding){
        this.LightSource.enabled = !this.LightSource.enabled;
        holding = true;
      }
    });

    Events.on("keyup", () => holding = false);
  }

  move(Time){
    const speed = 600;
    let forceX = 0;
    let forceY = 0;

    if(Events.keys.has("w") || Events.keys.has("W") || Events.keys.has("ArrowUp")) forceY -= 1;
    if(Events.keys.has("a") || Events.keys.has("A") || Events.keys.has("ArrowLeft") || Events.windowMouse.deltaX < 0) forceX -= 1;
    if(Events.keys.has("s") || Events.keys.has("S") || Events.keys.has("ArrowDown")) forceY += 1;
    if(Events.keys.has("d") || Events.keys.has("D") || Events.keys.has("ArrowRight") || Events.windowMouse.deltaX > 0) forceX += 1;

    const force = new Vector(forceX * speed, forceY * speed);

    this.position.add(force.multiply(Time.deltaTime));
  }

  update(Time){
    this.move(Time);
    const maxDistance = 400;

    this.LightSource.steps[0].color = `hsl(${Time.frameCount % 360} 100% 50% / 100%)`;
    this.LightSource.angle = this.position.angleBetween(Events.mouse.position);
    this.LightSource.distance = Math.min(maxDistance, this.position.distance(Events.mouse.position));
    // this.active = true;

    // this.rotation += Time.deltaTime * 0.5;
  }
}