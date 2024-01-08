import Vector from "../../../engine-components/vector.js";
import Shape from "../shape.js";

export default class PolygonShape extends Shape{
  type = 'polygon';

  constructor(gameObject, sides = 3){
    super(gameObject);
    this.sides = sides;
    this.createShape();

    this.GameObject.size.onChange(() => this.createShape());
  }

  createShape(){
    const vertices = [];
    const radius = this.GameObject.size.x / 2;

    for(let i = 0; i < this.sides; i++){
      const angle = (i * 2 * Math.PI / this.sides) - (Math.PI / 2);
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      vertices.push(new Vector(x, y));
    }

    this.addVertices(vertices, true);
  }
}