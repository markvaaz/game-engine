import Vector from "../../engine-components/vector.js";
import Component from "./component.js";

export default class Shape extends Component{
  static name = 'Shape';
  name = 'Shape';
  staticVertices = [];
  rotatedVertices = [];
  vertices = [];
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

  get centerOfMass(){ return this.getCenterOfMass(); }
  get bounds(){ return { min: this.#bounds.min.copy, max: this.#bounds.max.copy } }
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
    this.GameObject.position.onChange(this.updateVertices);
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
   * @param {Shape} shape - The shape to be copied.
   */
  copyShape(shape){
    if(!(shape instanceof Shape)) return;
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
      this.rotatedVertices = [];
    }

    // Add vertices to the render object
    this.GameObject.Render.addVertices(vertices);

    // Iterate over each vertex and add it to the shape
    vertices.forEach((vertex, i) => {
      // Skip non-Vector vertices
      if(!(vertex instanceof Vector)) return;

      // Add the vertex to the edges array
      this.staticVertices.push(vertex.copy.lock());

      // Add the vertex to the shape
      this.addVertex(vertex);
    });

    // Set the 'added' flag to true
    this.#added = true;

    // Update the vertices
    this.updateVertices();

    this.GameObject.Render.shape.centerOfMass = this.getCenterOfMass(true).toObject();
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
   * Adds a vertex to the list of vertices.
   *
   * @param {Vector} vertex - The vertex to be added.
   */
  addVertex(vertex){
    if(!(vertex instanceof Vector)) return;
    
    vertex.rotate(this.GameObject.rotation);
    vertex.subtract(this.GameObject.Transform.anchor);
    this.rotatedVertices.push(vertex.copy);
    vertex.add(this.GameObject.position);

    this.vertices.push(vertex);
  }

  /**
   * Updates the vertices of the object based on the edges, rotation, position, and anchor.
   */
  updateVertices = () => {
    // Check if the object has been added or is active
    if (!this.#added || !this.GameObject.active) return;

    this.vertices = [];
    this.rotatedVertices = [];

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
      
      this.rotatedVertices.push(vertex.copy);

      // Add the object's position to the vertex
      vertex.add(this.GameObject.position);

      // Update the minimum and maximum coordinates
      minX = Math.min(minX, vertex.x);
      minY = Math.min(minY, vertex.y);
      maxX = Math.max(maxX, vertex.x);
      maxY = Math.max(maxY, vertex.y);

      // Add the vertex to the vertices array
      this.vertices.push(vertex);
    }

    // Set the bounds using the minimum and maximum coordinates
    this.#bounds.min.set(minX, minY);
    this.#bounds.max.set(maxX, maxY);

    if(this.GameObject.Transform.previousRotation !== this.GameObject.rotation){
      this.GameObject.Render.addVertices(this.rotatedVertices);
    }

    // Update the bounds of the object's renderer
    this.GameObject.Render.updateBounds(this.#bounds);

    if(this.GameObject.Shadow && !this.GameObject.Shadow.added){
      this.GameObject.Shadow.add(this.rotatedVertices, true);
    }
  }

  /**
   * Calculates the center of mass of the object.
   * @returns {Vector} The center of mass as a Vector.
   */
  getCenterOfMass = (dontAddPosition = false) => {
    // If the object has not been added, return early.
    if (!this.#added) return;

    // If the center of mass has already been calculated, return it.
    if (this.#centerOfMass) return this.#centerOfMass.copy.add(this.GameObject.position);

    let x = 0;
    let y = 0;

    // Calculate the sum of the x and y coordinates of all vertices.
    for (let vertex of this.staticVertices) {
      x += vertex.x;
      y += vertex.y;
    }

    // Calculate the center of mass as the average of the x and y coordinates.
    this.#centerOfMass = new Vector(x / this.vertices.length, y / this.vertices.length);

    if(dontAddPosition) return this.#centerOfMass;

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