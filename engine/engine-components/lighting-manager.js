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

  getScaledPosition(position){
    return new Vector((position.x - this.camera.position.x) * this.camera.scale.x, (position.y - this.camera.position.y) * this.camera.scale.y);
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

  renderShadow(light, shape, shapePosition){
    const { context } = this;
    shape = {
      ...shape,
      center: shapePosition
    }
    const vertices = this.getVerticesFromExtremes(shape, light);
    const vertexA = this.getScaledPosition({ x:shape.vertices[vertices.min].x + shapePosition.x, y:shape.vertices[vertices.min].y + shapePosition.y });
    const vertexB = this.getScaledPosition({ x:shape.vertices[vertices.max].x + shapePosition.x, y:shape.vertices[vertices.max].y + shapePosition.y });
  
    const angleBetweenVertexAAndLight = new Vector(light.position).angleBetween(vertexA);
    const angleBetweenVertexBAndLight = new Vector(light.position).angleBetween(vertexB);

    const length = light.distance + light.radius; // the length of the trepazoid
    const vertexC = this.getScaledPosition({ x:vertexA.x + Math.cos(-angleBetweenVertexAAndLight) * length, y:vertexA.y + Math.sin(angleBetweenVertexAAndLight) * length });
    const vertexD = this.getScaledPosition({ x:vertexB.x + Math.cos(-angleBetweenVertexBAndLight) * length, y:vertexB.y + Math.sin(angleBetweenVertexBAndLight) * length });
  
    context.globalCompositeOperation = "destination-out";
    context.globalAlpha = 1;
    context.fillStyle = "black";
  
    if(shapePosition.x !== light.position.x && shapePosition.y !== light.position.y){
      context.beginPath();
      context.moveTo(vertexA.x, vertexA.y);
      context.lineTo(vertexB.x, vertexB.y);
      context.lineTo(vertexD.x, vertexD.y);
      context.lineTo(vertexC.x, vertexC.y);
      context.lineTo(vertexA.x, vertexA.y);
      context.closePath();
      context.fill();
    }

    // context.beginPath();
    // for (let i = 0; i < shape.vertices.length; i++) {
    //   const vertex = this.getScaledPosition({ x:shape.vertices[i].x + shapePosition.x, y:shape.vertices[i].y + shapePosition.y });

    //   if(i === 0){
    //     context.moveTo(vertex.x, vertex.y);
    //     continue;
    //   }
        
    //   context.lineTo(vertex.x, vertex.y);
    // }
    // context.closePath();
    // context.fill();
    // context.stroke();
  }

  /**
   * Gets the extremes of the shape in relation to the plane of the angle between the light and the shape
   * @param {Object} shape
   * @param {Object} light
   * @method getVerticesFromExtremes
   */
  getVerticesFromExtremes(shape, light) {
    const { center, vertices } = shape;
    const shapePosition = new Vector(center);
    const lightPosition = new Vector(light.position);
    const angleBetween = shapePosition.angleBetween(lightPosition);

    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    let minIndex = 0;
    let maxIndex = 0;

    vertices.forEach((vertex, index) => {
      vertex = new Vector(vertex.x, vertex.y);
      vertex.rotate(-angleBetween);

      if (vertex.y < minY) {
        minY = vertex.y;
        minIndex = index;
      }
      if (vertex.y > maxY) {
        maxY = vertex.y;
        maxIndex = index;
      }
    });

    return {
      min: minIndex,
      max: maxIndex
    };
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