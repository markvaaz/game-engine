import Vector from "../../engine-components/vector.js";

export default class Shape{
  static name = 'Shape';
  name = 'Shape';
  edges = [];
  vertices = [];
  normalAxes = [];
  type = 'polygon';
  #added = false;
  #centerOfMass = null;
  #bounds = {
    min: new Vector(0, 0),
    max: new Vector(0, 0)
  };

  constructor(gameObject, shape = null){
    this.GameObject = gameObject;
    if(shape) this.addVertices(shape);
    this.setListener();
  }

  get centerOfMass(){ return this.getCenterOfMass(); }
  get bounds(){ return { min: this.#bounds.min.copy, max: this.#bounds.max.copy } }

  setListener(){
    this.GameObject.Transform.Rotation.onChange(this.updateVertices);
    this.GameObject.position.onChange(this.updateVertices);
    this.GameObject.Transform.anchor.onChange(this.updateVertices);
    this.GameObject.Transform.Rotation.onChange(this.updateNormalAxes);
  }

  getArea = () => {
    let area = 0;
    let j = this.vertices.length - 1;
    for(let i = 0; i < this.vertices.length; i++){
      area += (this.vertices[j].x + this.vertices[i].x) * (this.vertices[j].y - this.vertices[i].y);
      j = i;
    }
    return Math.abs(area / 2);
  }

  addShape(shape){
    if(typeof shape === 'array') return;
    this.addVertices(shape);
  }

  copyShape(shape){
    if(!(shape instanceof Shape)) return;
    this.addVertices(shape.vertices);
  }

  addVertices = (vertices, reset = false) => {
    if(reset){
      this.edges = [];
      this.vertices = [];
      this.normalAxes = [];
    }

    vertices.forEach((vertex, i) => {
      if(!(vertex instanceof Vector)) return
      this.edges.push(vertex.copy.lock());
      this.addVertex(vertex);
    });
    
    this.#added = true;

    this.updateNormalAxes();
    this.updateVertices();

    this.GameObject.Render.addVertices(vertices);
  }

  replaceVertices = (vertices) => this.addVertices(vertices, true);

  addVertex = (vertex) => {
    if(!(vertex instanceof Vector)) return;
    
    vertex.rotate(this.GameObject.rotation);
    vertex.add(this.GameObject.position);
    vertex.subtract(this.GameObject.Transform.anchor);

    this.vertices.push(vertex);
  }

  updateVertices = () => {
    if(!this.#added || !this.GameObject.active) return;

    this.vertices = [];
    
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
  
    for(let i = 0; i < this.edges.length; i++){
      const vertex = new Vector(this.edges[i]);
      
      vertex.rotate(this.GameObject.rotation);
      vertex.add(this.GameObject.position);
      vertex.subtract(this.GameObject.anchor);
  
      this.vertices.push(vertex);
  
      minX = Math.min(minX, vertex.x);
      minY = Math.min(minY, vertex.y);
      maxX = Math.max(maxX, vertex.x);
      maxY = Math.max(maxY, vertex.y);
    }
  
    this.#bounds.min.set(minX, minY);
    this.#bounds.max.set(maxX, maxY);

    this.GameObject.Render.updateBounds(this.#bounds);
  }

  updateNormalAxes = () => {
    if(!this.#added) return;

    if(this.#added && !this.GameObject.active) return;

    this.normalAxes = [];
    
    for(let i = 0; i < this.edges.length; i++){
      const j = (i + 1) % this.edges.length;
      const edge = this.edges[j].copy.rotate(this.GameObject.rotation).subtract(this.edges[i].rotate(this.GameObject.rotation));
      edge.y = -edge.y;
      this.normalAxes.push(edge.normalize());
    }
  }

  getCenterOfMass = () => {
    if(!this.#added) return;
    if(this.#centerOfMass) return this.#centerOfMass.copy.add(this.GameObject.position);
    let x = 0;
    let y = 0;
    for(let vertex of this.edges){
      x += vertex.x;
      y += vertex.y;
    }

    this.#centerOfMass = new Vector(x / this.vertices.length, y / this.vertices.length);

    return this.#centerOfMass.copy.add(this.GameObject.position);
  }

  isWithinBounds = (bounds, offset = 0) => {
    if(!bounds) return false;
    return this.bounds.min.x - offset < bounds.max.x && this.bounds.max.x + offset > bounds.min.x && this.bounds.min.y - offset < bounds.max.y && this.bounds.max.y + offset > bounds.min.y;
  }  
}