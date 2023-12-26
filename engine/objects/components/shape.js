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

  get position(){ return this.GameObject.position; }
  get rotation(){ return this.GameObject.rotation; }
  set rotation(value){ this.GameObject.rotation = value; }
  get anchor(){ return this.GameObject.anchor; }
  get size(){ return this.GameObject.size; }
  get centerOfMass(){ return this.getCenterOfMass(); }
  get bounds(){ return { min: this.#bounds.min.copy, max: this.#bounds.max.copy } }

  setListener(){
    this.GameObject.Transform.Rotation.onChange(this.updateVertices);
    this.position.onChange(this.updateVertices);
    this.anchor.onChange(this.updateVertices);
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
  }

  replaceVertices = (vertices) => this.addVertices(vertices, true);

  addVertex = (vertex) => {
    if(!(vertex instanceof Vector)) return;
    vertex = vertex.copy;
    vertex.rotate(this.rotation);
    vertex.add(this.position);
    vertex.subtract(this.anchor);

    this.vertices.push(vertex);
  }

  updateVertices = () => {
    if(!this.#added || this.GameObject.inactive) return;

    this.vertices = [];
    
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
  
    for(let i = 0; i < this.edges.length; i++){
      const vertex = this.edges[i].copy;
      
      vertex.rotate(this.rotation);
      vertex.add(this.position);
      vertex.subtract(this.anchor);
  
      this.vertices.push(vertex);
  
      minX = Math.min(minX, vertex.x);
      minY = Math.min(minY, vertex.y);
      maxX = Math.max(maxX, vertex.x);
      maxY = Math.max(maxY, vertex.y);
    }
  
    this.#bounds.min.set(new Vector(minX, minY));
    this.#bounds.max.set(new Vector(maxX, maxY));
  }

  updateNormalAxes = () => {
    if(!this.#added) return;

    if(this.#added && this.GameObject.inactive) return;

    this.normalAxes = [];
    
    for(let i = 0; i < this.edges.length; i++){
      const j = (i + 1) % this.edges.length;
      const edge = this.edges[j].copy.rotate(this.rotation).subtract(this.edges[i].rotate(this.rotation));
      const normal = new Vector(edge.y, -edge.x).normalized;
      this.normalAxes.push(normal);
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

  isWithinBounds = (shape, offset = 0) => {
    if(!shape) return false;
    return this.bounds.min.x - offset < shape.bounds.max.x && this.bounds.max.x + offset > shape.bounds.min.x && this.bounds.min.y - offset < shape.bounds.max.y && this.bounds.max.y + offset > shape.bounds.min.y;
  }  
}