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
  path = [
    new Vector({x: 518.5033673856663, y: 387.0294771546181}),
    new Vector({x: 938.3289606147515, y: 543.3477475878315}),
    new Vector({x: 1479.192255967281, y: 448.18507109530526}),
    new Vector({x: 1941.0784892593617, y: -193.98981799983514}),
    new Vector({x: 2003.6234206666825, y: -911.1744261202567}),
    new Vector({x: 1553.5316824191304, y: -1513.1347891762427}),
    new Vector({x: 872.801117570924, y: -2287.877437406461}),
    new Vector({x: 3.2904976584344467, y: -2824.815929876809}),
    new Vector({x: -1513.9682087925198, y: -3081.5202360718545}),
    new Vector({x: -2608.890821146161, y: -1952.4279391408138})
  ]

  constructor(x, y){
    super();
    this.position.set(x, y);
    this.size.set(64);
    this.add(new EllipseShape(this));
    // this.add(new EllipseShape(this));
    this.add(new Collider(this));
    this.speed = 5;
    this.RigidBody.maxSpeed = this.speed;
    this.lastJumpTime = 0;
    // this.position.setConstraints(0, 200, 0, 200);
  }

  move(Time){
    let forceX = 0;
    let forceY = 0;

    if(Events.keys.has("w") || Events.keys.has("W") || Events.keys.has("ArrowUp")) forceY -= 1;
    if(Events.keys.has("a") || Events.keys.has("A") || Events.keys.has("ArrowLeft") || Events.windowMouse.deltaX < 0) forceX -= 1;
    if(Events.keys.has("s") || Events.keys.has("S") || Events.keys.has("ArrowDown")) forceY += 1;
    if(Events.keys.has("d") || Events.keys.has("D") || Events.keys.has("ArrowRight") || Events.windowMouse.deltaX > 0) forceX += 1;

    const force = new Vector(forceX * this.speed, forceY * this.speed);
  
    force.limit(this.speed);

    this.position.add(force.multiply(Time.deltaTime * 100));
  }

  followPath(Time){
    // Verificar se ainda há pontos no caminho a seguir
    if (this.path.length > 0) {
      // Determinar a direção do próximo ponto no caminho em relação à posição atual do jogador
      const direction = this.path[0].copy.subtract(this.position).normalize();
      
      // Calcular a velocidade baseada na direção e na velocidade do jogador
      const velocity = direction.multiply(this.speed);
  
      // Mover o jogador na direção do próximo ponto no caminho
      this.position.add(velocity.multiply(Time.deltaTime * 100));
  
      // Verificar se o jogador está próximo o suficiente do próximo ponto no caminho
      const distance = this.position.distance(this.path[0]);
      const threshold = 5; // Ajuste conforme necessário para definir a proximidade
  
      if (distance <= threshold) {
        // Remover o ponto atual do caminho
        this.path.push(this.path.shift());
      }
    }
  }

  update(Time){
    this.move(Time);
    // this.followPath(Time);
  }
}