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

    if(shape.shadow.blur > 0){
      context.shadowColor = shape.shadow.color;
      context.shadowBlur = shape.shadow.blur;
      context.shadowOffsetX = 0.1;
      context.shadowOffsetY = 0.1;
    }
    
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

    context.shadowColor = "transparent";
    context.shadowBlur = 0;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
  }

  getShadowShape(shape, light, shapePosition) {
    const { min, max } = this.getVerticesFromExtremes(shape, light, shapePosition);
    const vertices = [];
    const lightPosition = this.getScaledPosition(light.position);

    const vertexA = this.getScaledPosition({
      x: shape.vertices[min].x + shapePosition.x,
      y: shape.vertices[min].y + shapePosition.y
    });
    const vertexB = this.getScaledPosition({
      x: shape.vertices[max].x + shapePosition.x,
      y: shape.vertices[max].y + shapePosition.y
    });
  
    const directionVectorA = new Vector(vertexA.x - lightPosition.x, vertexA.y - lightPosition.y);
    const directionVectorB = new Vector(vertexB.x - lightPosition.x, vertexB.y - lightPosition.y);
    const maxLength = 1000000;
    const normalizedDirectionA = directionVectorA.normalized;
    const normalizedDirectionB = directionVectorB.normalized;
  
    const vertexC = this.getScaledPosition({
      x: shapePosition.x + normalizedDirectionA.x * maxLength,
      y: shapePosition.y + normalizedDirectionA.y * maxLength
    });
  
    const vertexD = this.getScaledPosition({
      x: shapePosition.x + normalizedDirectionB.x * maxLength,
      y: shapePosition.y + normalizedDirectionB.y * maxLength
    });
  
    vertices.push(vertexA, vertexB, vertexD, vertexC);
  
    return vertices;
  }

  /**
   * This method calculates the vertices of a shape that are at the extremes of the light source.
   * It returns the indices of the vertices that have the minimum and maximum angles with respect to the light source.
   *
   * @param {Object} shape - The shape object which contains the vertices.
   * @param {Object} light - The light object which contains the position of the light source.
   * @param {Object} shapePosition - The position of the shape.
   * @returns {Object} - An object containing the indices of the vertices with the minimum and maximum angles. Returns false if the shape has no vertices.
   */
  getVerticesFromExtremes(shape, light, shapePosition) {
    // If the shape has no vertices, return false
    if(shape.vertices.length === 0) return false;
    
    // Destructure the vertices from the shape
    const { vertices } = shape;
    // Define the center position of the shape and the position of the light
    const center = shapePosition;
    const position = light.position;

    // Initialize the minimum and maximum angles to extreme values
    let minAngle = Infinity;
    let maxAngle = -Infinity;

    // Initialize the indices of the minimum and maximum angles to -1
    let minIndex = -1;
    let maxIndex = -1;

    for(let index = 0; index < vertices.length; index++){
      // Calculate the position of the current vertex
      const vertex = {
        x: vertices[index].x + center.x,
        y: vertices[index].y + center.y
      };

      // Create vectors from the light source to the vertex and the center of the shape
      const vectorToVertex = new Vector(vertex.x - position.x, vertex.y - position.y);
      const vectorToCenter = new Vector(center.x - position.x, center.y - position.y);

      // Calculate the difference between the angles
      let angle = Math.atan2(vectorToVertex.y, vectorToVertex.x) - Math.atan2(vectorToCenter.y, vectorToCenter.x);

      // Normalize the angle to be within the range [-PI, PI]
      if (angle < -Math.PI) {
        angle += Math.PI * 2;
      }

      if (angle > Math.PI) {
        angle -= Math.PI * 2;
      }

      // Update the minimum and maximum angles and their corresponding indices
      if (angle < minAngle) {
        minAngle = angle;
        minIndex = index;
      }

      if (angle > maxAngle) {
        maxAngle = angle;
        maxIndex = index;
      }
    }

    // Return the indices of the vertices with the minimum and maximum angles
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
      if(gameObject.shape.shadow.type !== "wall") return;
      context.fillStyle = gameObject.shape.shadow.color;
      this.renderShadow(light, gameObject.shape, gameObject.transform.position, "source-over");
    });

    context.globalCompositeOperation = "destination-out";
    context.fillStyle = "fff";

    context.beginPath();
      
    // this.shadows.forEach(gameObject => {
    //   gameObject.shape.vertices.forEach((vertex, index) => {
    //     vertex = this.getScaledPosition({
    //       x: vertex.x + gameObject.transform.position.x,
    //       y: vertex.y + gameObject.transform.position.y
    //     });
    //     if(index === 0){
    //       context.moveTo(vertex.x, vertex.y);
    //     }else{
    //       context.lineTo(vertex.x, vertex.y);
    //     }
    //   });
    // });

    context.closePath();
    context.fill();
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