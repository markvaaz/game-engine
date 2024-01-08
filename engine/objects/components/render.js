import SpriteManager from "../../engine-components/sprite-manager.js";

export default class Render{
  // Specifies the name of the Render class
  static name = "Render";
  // Specifies the name property of the Render class
  name = "Render";
  // Specifies the opacity of the rendered object (default is 1)
  opacity = 1;
  // Specifies the global composite operation to be used for rendering (default is "source-over")
  gco = "source-over";
  // Specifies whether the rendered object is visible (default is false)
  visible = false;
  // Specifies the rendering mode (default is "shape")
  mode = "shape";
  // Specifies whether the rendered object is disabled (default is false)
  disabled = false;
  // Specifies the layer of the rendered object (default is null)
  layer = null;
  // Specifies the light source associated with the rendered object (default is null)
  lightSource = null;

  // Specifies the shape of the rendered object
  shape = {
    // Specifies the vertices of the shape (default is an empty array)
    vertices: [],
    // Specifies the line color of the shape (default is "rgba(255, 255, 255, 1)")
    lineColor: "rgba(255, 255, 255, 1)",
    // Specifies the fill color of the shape (default is a random HSL color)
    fillColor: `hsl(${Math.random() * 360} 100% 50% / 100%)`,
    // Specifies the type of the shape (default is "shape")
    type: "shape",
    // Specifies the bounds of the shape (default is { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } })
    bounds: {
      min: { x: 0, y: 0 },
      max: { x: 0, y: 0 }
    }
  };

  // Specifies the transform of the rendered object
  transform = {
    // Specifies the position of the object (default is { x: 0, y: 0 })
    position: { x: 0, y: 0 },
    // Specifies the size of the object (default is { x: 0, y: 0 })
    size: { x: 0, y: 0 }
  };

  // Specifies the sprite of the rendered object
  sprite = {
    // Specifies the source of the sprite image (default is null)
    src: null,
    // Specifies the x-coordinate of the sprite image (default is 0)
    x: 0,
    // Specifies the y-coordinate of the sprite image (default is 0)
    y: 0,
    // Specifies the width of the sprite image (default is 64)
    width: 64,
    // Specifies the height of the sprite image (default is 64)
    height: 64
  };

  /**
   * Constructor for the GameObject class.
   * @param {GameObject} gameObject - The game object to initialize the instance with.
   */
  constructor(gameObject) {
    // Assign the id and layer properties of the GameObject instance to the corresponding properties of this instance.
    this.id = gameObject.id;
    this.layer = gameObject.layer;

    // Convert the size and position properties of the GameObject instance to objects and assign them to the corresponding properties of the transform instance.
    this.transform = {
      size: gameObject.size.toObject(),
      position: gameObject.position.toObject()
    };

    // Subscribe to the onChange event of the position property of the GameObject instance.
    // Update the x and y properties of the position property of the transform instance when the position changes.
    gameObject.position.onChange((x, y, vector) => {
      this.transform.position.x = vector.x;
      this.transform.position.y = vector.y;
    });

    // Subscribe to the onChange event of the size property of the GameObject instance.
    // Update the x and y properties of the size property of the transform instance when the size changes.
    gameObject.size.onChange((x, y, vector) => {
      this.transform.size.x = vector.x;
      this.transform.size.y = vector.y;
    });
  }

  /**
   * Set the shape properties.
   * @param {array} vertices - The vertices of the shape.
   * @param {string} lineColor - The color of the shape's outline.
   * @param {string} fillColor - The color to fill the shape with.
   * @param {string} type - The type of the shape.
   */
  setShape({ vertices, lineColor, fillColor, type }){
    // Update the vertices of the shape
    this.shape.vertices = vertices;
    
    // Update the line color of the shape
    this.shape.lineColor = lineColor;
    
    // Update the fill color of the shape
    this.shape.fillColor = fillColor;
    
    // Update the type of the shape
    this.shape.type = type;
  }

  /**
   * Adds vertices to the shape by updating the `vertices` property in the `shape` object.
   *
   * @param {Array} vertices - An array of vertices to be added to the shape.
   */
  addVertices(vertices){
    this.shape.vertices = [];
    vertices.forEach((vertex, i) => {
      this.shape.vertices.push({ x: vertex.x, y: vertex.y });
    });
  }

  /**
   * Sets the source, position, width, and height of the sprite.
   *
   * @param {string} src - The source of the sprite image.
   * @param {Object} coords - The coordinates and size of the sprite.
   * @param {number} coords.x - The x-coordinate of the sprite.
   * @param {number} coords.y - The y-coordinate of the sprite.
   * @param {number} coords.width - The width of the sprite.
   * @param {number} coords.height - The height of the sprite.
   */
  addSprite(src, coords){
    this.sprite.src = src;
    this.sprite.x = coords.x;
    this.sprite.y = coords.y;
    this.sprite.width = coords.width;
    this.sprite.height = coords.height;
  }

  /**
   * Adds a light source to the object.
   *
   * @param {type} lightSource - The light source to be added.
   * @return {undefined} This function does not return a value.
   */
  addLightSource(lightSource){
    this.lightSource = lightSource;
  }

  /**
   * Updates the bounds of the shape.
   *
   * @param {object} bounds - The new bounds for the shape.
   */
  updateBounds(bounds){
    this.shape.bounds.min = bounds.min.toObject();
    this.shape.bounds.max = bounds.max.toObject();
  }
}