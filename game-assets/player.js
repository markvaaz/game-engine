import GameObject from "../engine/objects/game-object.js";
import Events from "../engine/engine-components/events.js";
import { Capsule } from "../engine/objects/components/shape.js";
import Collider from "../engine/objects/components/collider.js";
import Vector from "../engine/engine-components/vector.js";
import LightSource from "../engine/objects/components/light-source.js";
import AnimatedSprite from "../engine/objects/components/animated-sprite-sheet.js";
import Time from "../engine/engine-components/time.js";

export default class Player extends GameObject{
  name = "Player";
  direction = new Vector(0, 0);

  constructor(x, y){
    super();
    this.position.set(x, y);
    this.add(Capsule);
    this.add(Collider);
    this.debug = true;
    this.size.set(60, 80);
    this.layer = 1
    this.add(LightSource, 200);
    // this.add(Shadow);
    this.LightSource.enabled = false;
    this.LightSource.type = "spot"; 
    this.LightSource.add([
      { start: 0, color: "#fff" },
      { start: 1, color: "transparent" }
    ]);
    this.LightSource.brightness = 1;
    // this.LightSource.mode = "soft-light";

    this.Render.mode = "sprite";

    let holding = false;

    Events.on("keydown", () => {
      if((Events.keys.has("f") || Events.keys.has("F")) && !holding){
        this.LightSource.enabled = !this.LightSource.enabled;
        holding = true;
      }
    });

    Events.on("keyup", () => holding = false);
  }

  setup(){
    this.add(AnimatedSprite, {
      src: "/game-assets/swordman/swordman.png",
      cellSize: new Vector(64, 64),
      frameRate: 8,
      rowIndex: 0,
      name: "idle",
      collumns: 6,
      scale: new Vector(3),
      anchor: new Vector(0.05, -0.05),
      debug: true
    });

    this.AnimatedSprite.copy("idle", { name: "walk", rowIndex: 1 });
    this.AnimatedSprite.copy("idle", { name: "attack", rowIndex: 3, fallback: "idle", once: true, skipFrames: [0,1] });
  }

  move(){
    const speed = 300;
    let forceX = 0;
    let forceY = 0;

    if(Events.keys.has("KeyW") || Events.keys.has("ArrowUp")) forceY -= 1;
    if(Events.keys.has("KeyA") || Events.keys.has("ArrowLeft")) forceX -= 1;
    if(Events.keys.has("KeyD") || Events.keys.has("ArrowRight")) forceX += 1;
    if(Events.keys.has("KeyS") || Events.keys.has("ArrowDown")) forceY += 1;

    const force = new Vector(forceX * speed, forceY * speed);

    this.position.add(force.multiply(Time.deltaTime));
  }

  update(){
    this.move();
    this.attack();
    const maxDistance = 800;

    // this.LightSource.steps[0].color = `hsl(${Time.frameCount % 360} 100% 50% / 100%)`;
    this.LightSource.angle = this.position.angleBetween(Events.mouse.position);
    this.LightSource.distance = Math.min(maxDistance, this.position.distance(Events.mouse.position));
    // this.active = true;

    // this.LightSource.brightness = Math.sin(Time.frameCount / 100) * 0.5 + 0.5;

    this.setCurrentAnimation();
  }

  setCurrentAnimation(){
    if(this.Transform.velocity.magnitude > 2){
      this.AnimatedSprite.set("walk");
    } else { 
      this.AnimatedSprite.set("idle");
    }

    if(Events.keys.has("KeyA") || Events.keys.has("ArrowLeft")) this.AnimatedSprite.facing = "left";
    if(Events.keys.has("KeyD") || Events.keys.has("ArrowRight")) this.AnimatedSprite.facing = "right";
  }

  attack(){
    if(!Events.keys.has("Space")) return;
    this.AnimatedSprite.set("attack");
    if(Events.keys.has("KeyA") || Events.keys.has("ArrowLeft")) this.AnimatedSprite.facing = "left";
    if(Events.keys.has("KeyD") || Events.keys.has("ArrowRight")) this.AnimatedSprite.facing = "right";
  }
}