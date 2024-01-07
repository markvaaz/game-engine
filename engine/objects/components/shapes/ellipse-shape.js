import Vector from "../../../engine-components/vector.js";
import Shape from "../shape.js";

export default class EllipseShape extends Shape{
  type = 'ellipse';
  
  constructor(gameObject){
    super(gameObject);
    this.createShape();

    this.GameObject.Render.shape.type = 'ellipse';
    this.GameObject.Render.shape.vertices = [];
  }

  createShape(){
    const vertices = [];
    const size = this.GameObject.size;
    const sidesCount = Math.round(size.x * 0.3);
    const sides = Math.min(Math.max(sidesCount, 8), 50);

    for(let i = 0; i < sides; i++){
      const angle = Math.PI * 2 / sides * i - Math.PI / 2;
      const x = Math.cos(angle) * size.x / 2;
      const y = Math.sin(angle) * size.y / 2;
      vertices.push(new Vector(x, y));
    }

    this.addVertices(vertices);
  }
}