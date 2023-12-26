import Vector from "../../../engine-components/vector.js";
import Shape from "../shape.js";

export default class EllipseShape extends Shape{
  type = 'ellipse';
  
  constructor(gameObject){
    super(gameObject);
    this.createShape();
  }

  createShape(){
    const vertices = [];
    const sidesCount = Math.round(this.size.x * 0.3);
    const sides = Math.min(Math.max(sidesCount, 8), 50);

    for(let i = 0; i < sides; i++){
      const angle = Math.PI * 2 / sides * i - Math.PI / 2;
      const x = Math.cos(angle) * this.size.x / 2;
      const y = Math.sin(angle) * this.size.y / 2;
      vertices.push(new Vector(x, y));
    }

    this.addVertices(vertices);
  }

  renderShape(context) {
    context.save();
    context.translate(this.position.x, this.position.y);
    context.rotate(this.rotation);
    context.beginPath();
    context.ellipse(0, 0, this.size.x / 2, this.size.y / 2, 0, 0, Math.PI * 2);
    context.stroke();
    context.fill();
    context.closePath();
    context.restore();
  }
}