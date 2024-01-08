import Vector from "../../engine-components/vector.js";

export default class Shape{
  // The name of the Shape
  static name = 'Shape';
      
  // The name of the Shape instance
  name = 'Shape';

  // The edges of the Shape
  edges = [];

  // The vertices of the Shape
  vertices = [];

  // The normal axes of the Shape
  normalAxes = [];

  // The type of the Shape
  type = 'polygon';

  // Whether the Shape has been added
  #added = false;

  // The center of mass of the Shape
  #centerOfMass = null;

  // The bounds of the Shape
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

  /**
   * Calculate the area of a polygon.
   * @returns {number} The area of the polygon.
   */
  getArea = () => {
    // Initialize the area variable
    let area = 0;
    // Set the last vertex index
    let j = this.vertices.length - 1;
    
    // Iterate over each vertex of the polygon
    for(let i = 0; i < this.vertices.length; i++){
      // Calculate the area using the Shoelace formula
      area += (this.vertices[j].x + this.vertices[i].x) * (this.vertices[j].y - this.vertices[i].y);
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
      this.edges = [];
      this.vertices = [];
      this.normalAxes = [];
    }

    // Add vertices to the render object
    this.GameObject.Render.addVertices(vertices);

    // Iterate over each vertex and add it to the shape
    vertices.forEach((vertex, i) => {
      // Skip non-Vector vertices
      if(!(vertex instanceof Vector)) return;

      // Add the vertex to the edges array
      this.edges.push(vertex.copy.lock());

      // Add the vertex to the shape
      this.addVertex(vertex);
    });

    // Set the 'added' flag to true
    this.#added = true;

    // Update the normal axes
    this.updateNormalAxes();

    // Update the vertices
    this.updateVertices();
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
    vertex.add(this.GameObject.position);
    vertex.subtract(this.GameObject.Transform.anchor);

    this.vertices.push(vertex);
  }

  /**
   * Updates the vertices of the object based on the edges, rotation, position, and anchor.
   */
  updateVertices = () => {
    // Check if the object has been added or is active
    if (!this.#added || !this.GameObject.active) return;

    this.vertices = [];

    // Initialize the minimum and maximum coordinates
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    // Iterate over the edges and process each vertex
    for (let i = 0; i < this.edges.length; i++) {
      const vertex = new Vector(this.edges[i]);

      // Rotate the vertex based on the object's rotation
      vertex.rotate(this.GameObject.rotation);

      // Add the object's position to the vertex
      vertex.add(this.GameObject.position);

      // Subtract the object's anchor from the vertex
      vertex.subtract(this.GameObject.anchor);

      // Add the vertex to the vertices array
      this.vertices.push(vertex);

      // Update the minimum and maximum coordinates
      minX = Math.min(minX, vertex.x);
      minY = Math.min(minY, vertex.y);
      maxX = Math.max(maxX, vertex.x);
      maxY = Math.max(maxY, vertex.y);
    }

    // Set the bounds using the minimum and maximum coordinates
    this.#bounds.min.set(minX, minY);
    this.#bounds.max.set(maxX, maxY);

    // Update the bounds of the object's renderer
    this.GameObject.Render.updateBounds(this.#bounds);
  }

  /**
   * Update the normal axes of the shape.
   */
  updateNormalAxes = () => {
    // Skip if not added
    if (!this.#added) return;

    // Skip if added but not active
    if (this.#added && !this.GameObject.active) return;

    this.normalAxes = [];

    // Calculate normal axes for each edge
    for (let i = 0; i < this.edges.length; i++) {
      const j = (i + 1) % this.edges.length;
      // Calculate the edge vector
      const edge = this.edges[j].copy.rotate(this.GameObject.rotation).subtract(this.edges[i].rotate(this.GameObject.rotation));
      edge.y = -edge.y;
      // Normalize the edge vector and add it to the normal axes array
      this.normalAxes.push(edge.normalize());
    }
  }

  /**
   * Calculates the center of mass of the object.
   * @returns {Vector} The center of mass as a Vector.
   */
  getCenterOfMass = () => {
    // If the object has not been added, return early.
    if (!this.#added) return;

    // If the center of mass has already been calculated, return it.
    if (this.#centerOfMass) return this.#centerOfMass.copy.add(this.GameObject.position);

    let x = 0;
    let y = 0;

    // Calculate the sum of the x and y coordinates of all vertices.
    for (let vertex of this.edges) {
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
   * @param {number} [offset=0] - Optional offset value to expand or shrink the bounds.
   * @returns {boolean} - Returns true if the current bounds are within the given bounds, false otherwise.
   */
  isWithinBounds = (bounds, offset = 0) => {
    // If bounds is falsy, return false
    if(!bounds) return false;

    // Check if the current bounds are within the given bounds
    return this.bounds.min.x - offset < bounds.max.x && 
           this.bounds.max.x + offset > bounds.min.x && 
           this.bounds.min.y - offset < bounds.max.y && 
           this.bounds.max.y + offset > bounds.min.y;
  }
}