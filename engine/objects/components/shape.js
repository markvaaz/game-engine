import Vector from "../../engine-components/vector.js";
import Component from "./component.js";

class CustomShape extends Component{
  static name = 'Shape';
  name = 'Shape';
  fileName = 'shape';

  staticVertices = [];
  vertices = [];
  verticesObject = [];
  #type = 'polygon';
  #added = false;
  #centerOfMass = null;
  #bounds = {
    min: new Vector(0, 0),
    max: new Vector(0, 0)
  };

  #borderColor = 'rgba(255, 255, 255, 0)';
  #color = `hsl(${Math.floor(Math.random() * 360)} 100% ${Math.floor(Math.random() * (80 - 40)) + 40}% / 100%)`;
  #borderWidth = 0;
  #opacity = 1;
  #darkZone = false;

  constructor(gameObject, shape = null){
    super();
    this.GameObject = gameObject;

    this.GameObject.Render.shape = {
      vertices: [],
      borderColor: this.#borderColor,
      color: this.#color,
      type: this.#type,
      borderWidth: this.#borderWidth,
      darkZone: this.#darkZone,
      opacity: this.#opacity,
      bounds: {
        min: { x: 0, y: 0 },
        max: { x: 0, y: 0 }
      },
  
      centerOfMass: { x: 0, y: 0 }
    };

    if(shape) this.addVertices(shape);
    this.setListener();
  }

  save(){
    return {
      ...this,
      type: this.#type,
      centerOfMass: this.#centerOfMass,
      bounds: this.#bounds,
      borderColor: this.#borderColor,
      color: this.#color,
      borderWidth: this.#borderWidth,
      opacity: this.#opacity,
      darkZone: this.#darkZone
    }
  }

  load(data){
    Object.keys(data).forEach(key => {
      if(['centerOfMass', 'bounds'].includes(key)) return;
      this[key] = data[key];
    });
    this.addVertices(data.vertices, true);    
  }

  get centerOfMass(){ return this.getCenterOfMass() || this.#centerOfMass; }
  get bounds(){ return { min: this.#bounds.min.copy.add(this.GameObject.position), max: this.#bounds.max.copy.add(this.GameObject.position) } }
  get borderColor(){ return this.#borderColor }
  get color(){ return this.#color }
  get borderWidth(){ return this.#borderWidth }
  get type(){ return this.#type }
  get darkZone(){ return this.#darkZone }
  get opacity(){ return this.#opacity }

  set borderColor(color){
    this.#borderColor = color;
    this.GameObject.Render.shape.borderColor = color;
    this.GameObject.active = true;
  }

  set color(color){
    this.#color = color;
    this.GameObject.Render.shape.color = color;
    this.GameObject.active = true;
  }

  set borderWidth(width){
    this.#borderWidth = width;
    this.GameObject.Render.shape.lineWidth = width;
    this.GameObject.active = true;
  }

  set type(type){
    this.#type = type;
    this.GameObject.Render.shape.type = type;
    this.GameObject.active = true;
  }

  set darkZone(dark){
    this.#darkZone = dark;
    this.GameObject.Render.shape.darkZone = dark;
    this.GameObject.active = true;
  }

  set opacity(opacity){
    this.#opacity = opacity;
    this.GameObject.Render.shape.opacity = opacity;
    this.GameObject.active = true;
  }

  setListener(){
    this.GameObject.Transform.Rotation.onChange(this.updateVertices);
    this.GameObject.Transform.anchor.onChange(this.updateVertices);
  }

  /**
   * Calculate the area of a polygon.
   * @returns {number} The area of the polygon.
   */
  getArea = () => {
    // Initialize the area variable
    let area = 0;
    // Set the last vertex index
    let j = this.staticVertices.length - 1;
    
    // Iterate over each vertex of the polygon
    for(let i = 0; i < this.staticVertices.length; i++){
      // Calculate the area using the Shoelace formula
      area += (this.staticVertices[j].x + this.staticVertices[i].x) * (this.staticVertices[j].y - this.staticVertices[i].y);
      // Update the last vertex index
      j = i;
    }
    
    // Return the absolute value of the area divided by 2
    return Math.abs(area / 2);
  }

  /**
   * Adds a shape to the collection of shapes.
   *
   * @param {any} shape - The shape to be added.
   * @return {undefined} This function does not return a value.
   */
  addShape(shape){
    if(typeof shape === 'array') return;
    this.addVertices(shape);
  }

  /**
   * Copies the given shape by adding its vertices to the current shape.
   *
   * @param {CustomShape} shape - The shape to be copied.
   */
  copyShape(shape){
    if(!(shape instanceof CustomShape)) return;
    this.addVertices(shape.vertices);
  }

  /**
   * Adds vertices to the shape.
   * 
   * @param {Array} vertices - The vertices to be added.
   * @param {Boolean} reset - Whether to reset the shape before adding vertices.
   */
  addVertices = (vertices, reset = false) => {
    // Reset the shape if specified
    if(reset){
      this.staticVertices = [];
      this.vertices = [];
      this.verticesObject = [];
    }
    // Add vertices to the render object
    this.GameObject.Render.addVertices(vertices);

    // Iterate over each vertex and add it to the shape
    vertices.forEach((vertex, i) => {
      // Skip non-Vector vertices
      if(!(vertex instanceof Vector)) return;

      // Add the vertex to the edges array
      this.staticVertices.push(vertex.copy.lock());
    });

    // Set the 'added' flag to true
    this.#added = true;

    // Update the vertices
    this.updateVertices();

    this.GameObject.Render.shape.centerOfMass = this.getCenterOfMass().toObject();
  }

  /**
   * Replaces the existing vertices in the graph with the given vertices.
   *
   * @param {Array} vertices - The new set of vertices to replace the existing ones.
   */
  replaceVertices(vertices){
    this.addVertices(vertices, true);
  }

  /**
   * Updates the vertices of the object based on the edges, rotation, position, and anchor.
   */
  updateVertices = () => {
    // Check if the object has been added or is active
    if (!this.#added) return;

    this.vertices = [];
    this.verticesObject = [];

    // Initialize the minimum and maximum coordinates
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    // Iterate over the edges and process each vertex
    for (let i = 0; i < this.staticVertices.length; i++) {
      const vertex = new Vector(this.staticVertices[i]);

      // Rotate the vertex based on the object's rotation
      vertex.rotate(this.GameObject.rotation);
      
      // Subtract the object's anchor from the vertex
      vertex.subtract(this.GameObject.anchor);

      // Add the vertex to the vertices array
      this.vertices.push(vertex);
      this.verticesObject.push(vertex.toObject());
      
      // Update the minimum and maximum coordinates
      minX = Math.min(minX, vertex.x);
      minY = Math.min(minY, vertex.y);
      maxX = Math.max(maxX, vertex.x);
      maxY = Math.max(maxY, vertex.y);
    }
    // Set the bounds using the minimum and maximum coordinates
    this.#bounds.min.set(minX, minY);
    this.#bounds.max.set(maxX, maxY);

    if(this.GameObject.Transform.previousRotation !== this.GameObject.rotation){
      this.GameObject.Render.addVertices(this.vertices);
    }

    // Update the bounds of the object's renderer
    this.GameObject.Render.updateBounds(this.#bounds);

    if(this.GameObject.Shadow && !this.GameObject.Shadow.added){
      this.GameObject.Shadow.add(this.vertices, true);
    }
  }

  /**
   * Calculates the center of mass of the object.
   * @returns {Vector} The center of mass as a Vector.
   */
  getCenterOfMass = (reset = false) => {
    // If the object has not been added, return early.
    if (!this.#added) return;

    // If the center of mass has already been calculated, return it.
    if (this.#centerOfMass && !reset) return this.#centerOfMass.copy.add(this.GameObject.position);

    let x = 0;
    let y = 0;

    // Calculate the sum of the x and y coordinates of all vertices.
    for (let vertex of this.staticVertices) {
      x += vertex.x;
      y += vertex.y;
    }

    // Calculate the center of mass as the average of the x and y coordinates.
    this.#centerOfMass = new Vector(x / this.vertices.length, y / this.vertices.length);

    // Adjust the center of mass by the position of the GameObject.
    return this.#centerOfMass.copy.add(this.GameObject.position);
  }

  /**
   * Checks if the current bounds are within the given bounds.
   * @param {Object} bounds - The bounds to compare against.
   * @param {number} [expansionAmount =0] - Optional expansionAmount value to expand or shrink the bounds.
   * @returns {boolean} - Returns true if the current bounds are within the given bounds, false otherwise.
   */
  isWithinBounds = (bounds, expansionAmount = 0) => {
    // If bounds is falsy, return false
    if(!bounds) return false;
    // Check if the current bounds are within the given bounds
    return this.bounds.min.x - expansionAmount < bounds.max.x && 
           this.bounds.max.x + expansionAmount > bounds.min.x && 
           this.bounds.min.y - expansionAmount < bounds.max.y && 
           this.bounds.max.y + expansionAmount > bounds.min.y;
  }
}

class Capsule extends CustomShape{
  type = 'capsule';
  fileName = "shape/Capsule";
  
  constructor(gameObject){
    super(gameObject);
    this.createShape();
    this.GameObject.size.onChange(() => this.createShape());
  }

  createShape(){
    const vertices = [];

    let { x, y } = this.GameObject.size;

    if(x === y) x *= 0.99; // Vertex overlap fix;

    const radius = Math.min(x, y) / 2;

    const topCircleCenter = new Vector(0, -y / 2 + radius);
    const bottomCircleCenter = new Vector(0, y / 2 - radius);
    let vertexCount = Math.round(x * 0.1);

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
  
    this.addVertices(vertices, true);
  }
}

class Ellipse extends CustomShape{
  type = 'ellipse';
  fileName = "shape/Ellipse";
  
  constructor(gameObject){
    super(gameObject);
    this.createShape();

    this.GameObject.Render.shape.type = 'ellipse';
    this.GameObject.size.onChange(() => this.createShape());
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

    this.addVertices(vertices, true);
  }
}

class Polygon extends CustomShape{
  type = 'polygon';
  fileName = "shape/Polygon";

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

class Rectangle extends CustomShape{
  type = 'rectangle';
  fileName = "shape/Rectangle";
  
  constructor(gameObject){
    super(gameObject);
    this.createShape();
    // this.GameObject.Render.shape.type = 'rectangle';

    this.GameObject.size.onChange(() => this.createShape());
  }

  createShape(){
    const vertices = [];
    const size = this.GameObject.size;

    vertices.push(new Vector(-size.x / 2, -size.y / 2));
    vertices.push(new Vector(size.x / 2, -size.y / 2));
    vertices.push(new Vector(size.x / 2, size.y / 2));
    vertices.push(new Vector(-size.x / 2, size.y / 2));

    this.addVertices(vertices, true);
  }
}

export { CustomShape, Capsule, Ellipse, Polygon, Rectangle };

export default CustomShape