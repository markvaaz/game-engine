import GameObject from "../engine/objects/game-object.js";
import Events from "../engine/engine-components/events.js";
import CapsuleShape from "../engine/objects/components/shapes/capsule-shape.js";
import Collider from "../engine/objects/components/collider.js";
import Vector from "../engine/engine-components/vector.js";
import EllipseShape from "../engine/objects/components/shapes/ellipse-shape.js";
import Rectangle from "../engine/objects/components/shapes/rectangle-shape.js";
import Ellipse from "../engine/objects/ellipse.js";

export default class Player extends GameObject{

  name = "Player";

  constructor(x, y){
    super();
    this.position.set(x, y);
    this.size.set(60);
    this.add(new EllipseShape(this));
    // this.add(new EllipseShape(this));
    this.add(new Collider(this));
    this.speed = 5;
    this.RigidBody.maxSpeed = this.speed;
    this.lastJumpTime = 0;
    this.debug = {
      enabled: true,
      // position: true,
      // velocity: true,
      lineColor: "transparent",
      // fillColor: "#fb5e5e",
      fillColor: "#fff",
      shadow: true
    }
    // this.position.setConstraints(0, 200, 0, 200);
  }

  move(Time){
    let forceX = 0;
    let forceY = 0;

    if(Events.keys.has("w") || Events.keys.has("W") || Events.keys.has("ArrowUp")) forceY -= 1;
    if(Events.keys.has("a") || Events.keys.has("A") || Events.keys.has("ArrowLeft")) forceX -= 1;
    if(Events.keys.has("s") || Events.keys.has("S") || Events.keys.has("ArrowDown")) forceY += 1;
    if(Events.keys.has("d") || Events.keys.has("D") || Events.keys.has("ArrowRight")) forceX += 1;

    const force = new Vector(forceX * this.speed, forceY * this.speed);
  
    force.limit(this.speed);

    this.position.add(force.multiply(Time.deltaTime * 100));
  }

  update(Time){
    this.move(Time);
  }

  render(context){
    if(!this.LightSource || true) return;
    const lightSource = this.LightSource;
    const position = lightSource.position;
    const radius = Math.max(this.size.x, this.size.y);

    const gradient = context.createRadialGradient( position.x, position.y, radius, position.x, position.y, 0 );
    
    gradient.addColorStop(Math.max(lightSource.start, 0.0), lightSource.color);
    gradient.addColorStop(Math.min(lightSource.stop, 1.0), "transparent");

    context.save();
    context.globalAlpha = lightSource.opacity * 0.5;
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(this.position.x, this.position.y, this.size.x / 2, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
}