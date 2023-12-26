import Vector from "../../../engine-components/vector.js";
import Shape from "../shape.js";

export default class CapsuleShape extends Shape{
  type = 'capsule';
  
  constructor(gameObject){
    super(gameObject);
    this.createShape();
  }

  createShape(){
    const vertices = [];

    const { x, y } = this.GameObject.size;

    const radius = Math.min(x, y) / 2;

    const topCircleCenter = new Vector(0, -y / 2 + radius);
    const bottomCircleCenter = new Vector(0, y / 2 - radius);
    let vertexCount = Math.round(this.size.x * 0.1);

    if(vertexCount % 2 !== 0) vertexCount += 1;

    const angleStep = Math.PI / Math.max(vertexCount + 1, 7);

    // Add the vertices of the top circle
    for(let i = Math.PI; i < Math.PI * 2 + 0.1; i += angleStep){
      const x = topCircleCenter.x + radius * Math.cos(i);
      const y = topCircleCenter.y + radius * Math.sin(i);
      vertices.push(new Vector(x, y));
    }
  
    // Add the vertices of the bottom circle
    for(let i = 0; i < Math.PI + 0.1; i += angleStep){
      const x = bottomCircleCenter.x + radius * Math.cos(i);
      const y = bottomCircleCenter.y + radius * Math.sin(i);
      vertices.push(new Vector(x, y));
    }
  
    this.addVertices(vertices);
  }
}