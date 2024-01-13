import Vector from "./vector.js";

export default class LightingManager{
  lights = new Map();
  shadows = new Map();
  canvas = new OffscreenCanvas(1, 1);
  context = this.canvas.getContext('2d');
  color = "#000";
  brightness = 1;

  constructor(Renderer){
    this.Renderer = Renderer;
  }

  get camera(){
    return this.Renderer.camera;
  }

  get rendererContext(){
    return this.Renderer.context;
  }

  getScaledPosition(x, y) {
    if(typeof x === 'object' && !isNaN(x.x) && !isNaN(x.y))
      return this.getScaledPosition(x.x, x.y);

    return new Vector((x - this.camera.position.x) * this.camera.scale.x, (y - this.camera.position.y) * this.camera.scale.y);
  }

  renderLights() {
    const { canvas, context } = this;

    context.clearRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "transparent";

    context.fillRect(0, 0, canvas.width, canvas.height);

    for (const light of this.lights.values()) {
      if (!light.visible || !light.enabled) continue;

      this.renderLight(light);
    }

    this.draw(1, "lighter");

    context.clearRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = this.color;

    context.fillRect(0, 0, canvas.width, canvas.height);

    for (const light of this.lights.values()) {
      if (!light.visible || !light.enabled) continue;

      this.renderGlobalLightOverlay(light);
    }

    this.draw();
  }

  draw(brightness = this.brightness, gco = "source-over") {
    const { rendererContext } = this;

    rendererContext.globalCompositeOperation = gco;

    rendererContext.globalAlpha = brightness;

    rendererContext.imageSmoothingEnabled = true;

    rendererContext.drawImage(
      this.canvas,
      0,
      0,
      this.canvas.width,
      this.canvas.height,
      this.camera.position.x,
      this.camera.position.y,
      this.camera.size.x,
      this.camera.size.y
    );

    rendererContext.globalAlpha = 1;

    rendererContext.imageSmoothingEnabled = this.Renderer.antiAliasing;
  }

  renderLight(light) {
    const { context } = this;
    const lightPosition = this.getScaledPosition(light.position);

    const gradient = this.getGradient({ context, light, position: lightPosition, radius: light.radius * this.camera.scale.x, distance: light.distance * this.camera.scale.x });

    gradient.addColorStop(0, "transparent");

    light.steps.forEach(step => gradient.addColorStop(step.start, step.color));

    context.globalAlpha = light.brightness;
    context.fillStyle = gradient;
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for(const gameObject of this.shadows.values()){
      this.renderShadow(light, gameObject.shape, gameObject.transform.position);
    }
  }

  renderShadow(light, shape, shapePosition, gco = "destination-out") {
    const { context } = this;

    context.save();

    this.renderShadowShape(shape, light, shapePosition, gco);

    context.beginPath();
    for (let i = 0; i < shape.vertices.length; i++) {
      const vertex = this.getScaledPosition({ x:shape.vertices[i].x + shapePosition.x, y:shape.vertices[i].y + shapePosition.y });

      if(i === 0){
        context.moveTo(vertex.x, vertex.y);
        continue;
      }
        
      context.lineTo(vertex.x, vertex.y);
    }
    context.closePath();
    context.fill();
    context.restore();
  }

  renderShadowShape(shape, light, shapePosition, gco = "destination-out") {
    const { context } = this;
    const shadowShape = this.getShadowShape(shape, light, shapePosition);

    context.globalCompositeOperation = gco;
    context.globalAlpha = 1;
    context.fillStyle = "black";
    context.beginPath();

    if (shapePosition.x !== light.position.x && shapePosition.y !== light.position.y) {
      for (let i = 0; i < shadowShape.length; i++) {
        const vertex = shadowShape[i];

        if (i === 0) {
          context.moveTo(vertex.x, vertex.y);
          continue;
        }

        context.lineTo(vertex.x, vertex.y);
      }
    }
    context.closePath();
    context.fill();
  }

  getShadowShape(shape, light, shapePosition) {
    const { min, max } = this.getVerticesFromExtremes(shape, light, shapePosition); // Obtém os índices das vértices min e max
    const vertices = [];
    const lightPosition = this.getScaledPosition(light.position);

    // shapePosition = shapePosition;
  
    // Obtém as posições escalonadas para as vértices A e B
    const vertexA = this.getScaledPosition({
      x: shape.vertices[min].x + shapePosition.x,
      y: shape.vertices[min].y + shapePosition.y
    });
    const vertexB = this.getScaledPosition({
      x: shape.vertices[max].x + shapePosition.x,
      y: shape.vertices[max].y + shapePosition.y
    });
  
    // Calcula os vetores direção entre as vértices e a luz
    const directionVectorA = new Vector(vertexA.x - lightPosition.x, vertexA.y - lightPosition.y);
    const directionVectorB = new Vector(vertexB.x - lightPosition.x, vertexB.y - lightPosition.y);
  
    // Define o comprimento máximo do trapézio (pode ser ajustado conforme necessário)
    const maxLength = 10000; // Ajuste conforme necessário
  
    // Normaliza os vetores direção
    const normalizedDirectionA = directionVectorA.normalized;
    const normalizedDirectionB = directionVectorB.normalized;
  
    // Calcula as vértices C e D baseadas nas direções normalizadas e no comprimento máximo
    const vertexC = this.getScaledPosition({
      x: lightPosition.x + normalizedDirectionA.x * maxLength,
      y: lightPosition.y + normalizedDirectionA.y * maxLength
    });
  
    const vertexD = this.getScaledPosition({
      x: lightPosition.x + normalizedDirectionB.x * maxLength,
      y: lightPosition.y + normalizedDirectionB.y * maxLength
    });
  
    vertices.push(vertexA, vertexB, vertexD, vertexC);
  
    return vertices;
  }

  /**
   * Gets the extremes of the shape in relation to the plane of the angle between the light and the shape
   * @param {Object} shape
   * @param {Object} light
   * @method getVerticesFromExtremes
   */
  getVerticesFromExtremes(shape, light, shapePosition) {
    const { vertices } = shape;
    const center = shapePosition;
    const position = light.position;

    // Construct a vector pointing from the light to the object.
    const axis = new Vector(center.x - position.x, center.y - position.y); 

    // Compute offsets to center the light in this axis-oriented coordinates system.
    const onShift = position.x * axis.x + position.y * axis.y;
    const offShift = position.x * axis.y - position.y * axis.x;

    let minSlope = Infinity;
    let maxSlope = -Infinity;
 
    let minIndex = 0;
    let maxIndex = 0;

    for(let index = 0; index < vertices.length; index++){
      const vertex = {
        x: vertices[index].x + center.x,
        y: vertices[index].y + center.y
      };

      // Put this vertex into a light-centered coordinate system.
      // First, measuring its (scaled) distance in front of the light:
      const onAxis = vertex.x * axis.x + vertex.y * axis.y - onShift;

      // Skip vertices behind / in the plane of the light.
      if (onAxis <= 0) continue;

      // Then measuring its (scaled) offset above or below the line through
      // the center of this object.
      const offAxis = vertex.x * axis.y - vertex.y * axis.x - offShift;

      // Compute the slope of the line from the light to the vertex.
      const slope = offAxis / onAxis;
      
      if (slope < minSlope){
        minSlope = slope;
        minIndex = index;
      }

      if (slope > maxSlope) {
        maxSlope = slope;
        maxIndex = index;
      }
    }

    return { min: minIndex, max: maxIndex }
  }
  
  renderGlobalLightOverlay(light){
    const { context } = this;
    const position = this.getScaledPosition(light.position);
    const radius = light.radius * this.camera.scale.x * 0.8;
    const gradient = this.getGradient({
      context: this.context,
      light,
      position,
      radius,
      distance: light.distance * this.camera.scale.x,
      scaledRadius: light.radius * this.camera.scale.x
    });

    gradient.addColorStop(0, "transparent");
    gradient.addColorStop(1, "#fff");

    context.globalCompositeOperation = "destination-out";
    context.fillStyle = gradient;
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.shadows.forEach(gameObject => {
      this.renderShadow(light, gameObject.shape, gameObject.transform.position, "source-over")

      context.globalCompositeOperation = "destination-out";
      context.fillStyle = "fff";

      context.beginPath();
      gameObject.shape.vertices.forEach((vertex, index) => {
        vertex = this.getScaledPosition({
          x: vertex.x + gameObject.transform.position.x,
          y: vertex.y + gameObject.transform.position.y
        });
        if(index === 0){
          context.moveTo(vertex.x, vertex.y);
        }else{
          context.lineTo(vertex.x, vertex.y);
        }
      });

      context.closePath();
      context.fill();
    });
  }

  getGradient({ context, light, position, radius, distance, scaledRadius = radius }){
    let gradient = null;
    
    if(light.type === "spot"){
      gradient = context.createRadialGradient(position.x, position.y, radius, position.x, position.y, 0);
    }else if (light.type === "cone"){
      const angleFix = Math.PI / 4;
      const direction = new Vector(distance).rotate(light.angle - angleFix).add(position);
        
      gradient = context.createRadialGradient(
        direction.x, direction.y, scaledRadius, position.x, position.y, 0
      );
    }

    return gradient;
  }
}