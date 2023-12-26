import Vector from "../../../engine-components/vector.js";
import Shape from "../shape.js";

export default class RectangleShape extends Shape{
  type = 'rectangle';
  
  constructor(gameObject){
    super(gameObject);
    this.createShape();
  }

  createShape(){
    const vertices = [];

    vertices.push(new Vector(-this.size.x / 2, -this.size.y / 2));
    vertices.push(new Vector(this.size.x / 2, -this.size.y / 2));
    vertices.push(new Vector(this.size.x / 2, this.size.y / 2));
    vertices.push(new Vector(-this.size.x / 2, this.size.y / 2));

    this.addVertices(vertices);
  }

  renderShape = (context) => {
    context.save();
    context.translate(this.position.x, this.position.y);
    context.rotate(this.rotation);
    context.strokeRect(-this.size.x / 2, -this.size.y / 2, this.size.x, this.size.y);
    context.fillRect(-this.size.x / 2, -this.size.y / 2, this.size.x, this.size.y);
    context.restore();
  }
}