import Vector from "../../../engine-components/vector.js";
import Shape from "../shape.js";

export default class PolygonShape extends Shape{
  type = 'polygon';

  constructor(gameObject, sides = 3){
    super(gameObject);
    this.radius = this.GameObject.size.x / 2;
    this.createShape(sides);
  }

  createShape(sides){
    const vertices = [];

    for(let i = 0; i < sides; i++){
      const angle = (i * 2 * Math.PI / sides) - (Math.PI / 2);
      const x = this.radius * Math.cos(angle);
      const y = this.radius * Math.sin(angle);
      vertices.push(new Vector(x, y));
    }

    this.addVertices(vertices);
  }
}