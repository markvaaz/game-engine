import Vector from "../../../engine-components/vector.js";
import Shape from "../shape.js";

export default class RectangleShape extends Shape{
  type = 'rectangle';
  
  constructor(gameObject){
    super(gameObject);
    this.createShape();
    this.GameObject.Render.shape.type = 'rectangle';
  }

  createShape(){
    const vertices = [];
    const size = this.GameObject.size;

    vertices.push(new Vector(-size.x / 2, -size.y / 2));
    vertices.push(new Vector(size.x / 2, -size.y / 2));
    vertices.push(new Vector(size.x / 2, size.y / 2));
    vertices.push(new Vector(-size.x / 2, size.y / 2));

    this.addVertices(vertices);
  }
}