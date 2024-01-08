import GameObject from "../engine/objects/game-object.js";
import Events from "../engine/engine-components/events.js";
import CapsuleShape from "../engine/objects/components/shapes/capsule-shape.js";
import Collider from "../engine/objects/components/collider.js";
import Vector from "../engine/engine-components/vector.js";
import LightSource from "../engine/objects/components/light-source.js";

export default class Player extends GameObject{
  name = "Player";
  direction = new Vector(0, 0);

  constructor(x, y){
    super();
    this.add(new CapsuleShape(this));
    this.add(new Collider(this));
    this.position.set(x, y);
    this.size.set(64, 100);
    this.add(new LightSource(this, 150));
    this.LightSource.type = "cone";
    this.LightSource.angle = 0;
    this.LightSource.distance = 400;
    this.LightSource.enabled = false;
    this.LightSource.add([
      { start: 0, color: "rgba(255, 255, 255, 0.8)" },
      { start: 1, color: "transparent" },
    ]);

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
    const speed = 300;
    let forceX = 0;
    let forceY = 0;

    if(Events.keys.has("w") || Events.keys.has("W") || Events.keys.has("ArrowUp")) forceY -= 1;
    if(Events.keys.has("a") || Events.keys.has("A") || Events.keys.has("ArrowLeft") || Events.windowMouse.deltaX < 0) forceX -= 1;
    if(Events.keys.has("s") || Events.keys.has("S") || Events.keys.has("ArrowDown")) forceY += 1;
    if(Events.keys.has("d") || Events.keys.has("D") || Events.keys.has("ArrowRight") || Events.windowMouse.deltaX > 0) forceX += 1;

    const force = new Vector(forceX * speed, forceY * speed);
  
    force.limit(speed);

    this.position.add(force.multiply(Time.deltaTime));
  }

  update(Time){
    this.move(Time);
    const maxDistance = 400;

    this.LightSource.angle = this.position.angleBetween(Events.mouse.position);
    this.LightSource.distance = Math.min(maxDistance, this.position.distance(Events.mouse.position));
  }
}