import Vector from "./vector.js";

export default class LightingManager{
  lights = new Map();
  shadows = new Map();
  darkZones = new Map();
  canvas = new OffscreenCanvas(1, 1);
  context = this.canvas.getContext('2d');
  cacheCanvas = new OffscreenCanvas(1, 1);
  cacheContext = this.cacheCanvas.getContext('2d');
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

  getCanvasPosition(x, y) {
    if(typeof x === 'object' && !isNaN(x.x) && !isNaN(x.y))
      return this.getCanvasPosition(x.x, x.y);

    return new Vector((x - this.camera.position.x) * this.camera.scale.x, (y - this.camera.position.y) * this.camera.scale.y);
  }

  renderLights() {
    const { canvas, context, cacheContext: lightCacheContext } = this;

    context.clearRect(0, 0, canvas.width, canvas.height);
    lightCacheContext.clearRect(0, 0, canvas.width, canvas.height);

    for (const light of this.lights.values()) {
      if (!light.visible || !light.enabled) continue;

      this.renderLight(light);
      this.draw(1, light.mode);
  
      context.clearRect(0, 0, canvas.width, canvas.height);
    }

    this.renderDarkZones();

    this.renderGlobalLightOverlay();
  }

  draw(brightness = this.brightness, gco = "source-over") {
    const { rendererContext, cacheContext } = this;

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

    cacheContext.globalAlpha = 1;

    cacheContext.globalCompositeOperation = "source-over";

    cacheContext.drawImage(this.canvas, 0, 0);
  }

  renderLight(light) {
    const { context } = this;
    const gradient = this.getGradient(light);

    context.globalAlpha = light.brightness;
    context.fillStyle = gradient;
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for(const shadow of this.shadows.values()){
      if(!shadow.visible) continue;
      const shadowBounds = {
        min: { x: shadow.position.x + shadow.bounds.min.x, y: shadow.position.y + shadow.bounds.min.y },
        max: { x: shadow.position.x + shadow.bounds.max.x, y: shadow.position.y + shadow.bounds.max.y }
      };
      const lightBounds = {
        min: { x: light.position.x - (light.radius * 2) - light.distance, y: light.position.y - (light.radius * 2) - light.distance, },
        max: { x: light.position.x + (light.radius * 2) + light.distance, y: light.position.y + (light.radius * 2) + light.distance, }
      };
      
      const isWithinXBounds = shadowBounds.max.x >= lightBounds.min.x && shadowBounds.min.x <= lightBounds.max.x;
      const isWithinYBounds = shadowBounds.max.y >= lightBounds.min.y && shadowBounds.min.y <= lightBounds.max.y;

      if(!(isWithinXBounds && isWithinYBounds)) continue;
      
      this.renderShadow(light, shadow);
    }
  }

  renderGlobalLightOverlay(){
    const { canvas, context, rendererContext, camera, cacheCanvas } = this;
    
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.globalCompositeOperation = "source-over";
    context.globalAlpha = 1;
    context.fillStyle = this.color;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.globalCompositeOperation = "destination-out";

    context.drawImage(cacheCanvas, 0, 0);
    
    rendererContext.globalCompositeOperation = "source-over";
    rendererContext.globalAlpha = this.brightness;
    
    rendererContext.drawImage(
      canvas,
      0,
      0,
      canvas.width,
      canvas.height,
      camera.position.x,
      camera.position.y,
      camera.size.x,
      camera.size.y
    );

    rendererContext.globalAlpha = 1;
  }

  renderDarkZones() {
    const { context, cacheCanvas, rendererContext, camera, canvas } = this;

    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    context.globalCompositeOperation = "source-over";

    for(const darkZone of this.darkZones.values()){
      // if(!darkZone.visible) continue;
      
      context.fillStyle = darkZone.color;
      context.globalAlpha = darkZone.opacity;
      
      context.beginPath();
      
      darkZone.vertices.forEach((vertex, i) => {
        const position = this.getCanvasPosition({
          x: vertex.x + darkZone.position.x,
          y: vertex.y + darkZone.position.y
        });

        if(i === 0){
          return context.moveTo(position.x, position.y);
        }

        context.lineTo(position.x, position.y);
      });

      context.closePath();
      context.fill();
    }

    context.globalCompositeOperation = "destination-out";

    context.drawImage(cacheCanvas, 0, 0);

    rendererContext.globalCompositeOperation = "source-over";
    
    rendererContext.drawImage(
      canvas,
      0,
      0,
      canvas.width,
      canvas.height,
      camera.position.x,
      camera.position.y,
      camera.size.x,
      camera.size.y
    );
  }

  renderShadow(light, shadow) {
    if(shadow.position.x === light.position.x && shadow.position.y === light.position.y) return;

    const { context } = this;
    
    context.save();

    const shadowShape = this.getShadowShape(light, shadow);

    context.globalCompositeOperation = "destination-out";
    context.fillStyle = "black";
    context.globalAlpha = shadow.opacity;

    if(shadow.blur > 0){
      context.shadowColor = "#000";
      context.shadowBlur = shadow.blur;
      context.shadowOffsetX = 0.1;
      context.shadowOffsetY = 0.1;
    }
    
    context.beginPath();

    for (let i = 0; i < shadowShape.length; i++) {
      const vertex = shadowShape[i];

      if (i === 0) {
        context.moveTo(vertex.x, vertex.y);
        continue;
      }

      context.lineTo(vertex.x, vertex.y);
    }
    
    context.closePath();
    context.fill();

    context.restore();
  }

  getShadowShape(light, shadow) {
    const { min, max } = this.getVerticesFromExtremes(light, shadow);
    const vertices = [];
    const lightPosition = this.getCanvasPosition(light.position);
    const { shape, position } = shadow;

    const vertexA = this.getCanvasPosition({
      x: shape[min].x + position.x,
      y: shape[min].y + position.y
    });
    const vertexB = this.getCanvasPosition({
      x: shape[max].x + position.x,
      y: shape[max].y + position.y
    });
  
    const directionVectorA = new Vector(vertexA.x - lightPosition.x, vertexA.y - lightPosition.y);
    const directionVectorB = new Vector(vertexB.x - lightPosition.x, vertexB.y - lightPosition.y);
    const maxLength = 1000000;
    const normalizedDirectionA = directionVectorA.normalized;
    const normalizedDirectionB = directionVectorB.normalized;
  
    const vertexC = this.getCanvasPosition({
      x: position.x + normalizedDirectionA.x * maxLength,
      y: position.y + normalizedDirectionA.y * maxLength
    });
  
    const vertexD = this.getCanvasPosition({
      x: position.x + normalizedDirectionB.x * maxLength,
      y: position.y + normalizedDirectionB.y * maxLength
    });
  
    vertices.push(vertexA);

    const length = shape.length;

    let i = min;
    while(true) {
      if(i === min){
        if(i === max) break;
        i = (i + 1) % length;
      }

      const vertex = this.getCanvasPosition({
        x: shape[i].x + position.x,
        y: shape[i].y + position.y
      })
  
      if(i === max) break;
      i = (i + 1) % length;

      vertices.push(vertex);
    }

    vertices.push(vertexB, vertexD, vertexC);
  
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
  getVerticesFromExtremes(light, shadow) {
    // If the shape has no vertices, return false
    if(shadow.shape.length === 0) return false;
    
    // Destructure the vertices from the shape
    const { shape } = shadow;
    // Define the center position of the shape and the position of the light
    const shadowPosition = shadow.position;
    const lightPosition = light.position;

    // Initialize the minimum and maximum angles to extreme values
    let minAngle = Infinity;
    let maxAngle = -Infinity;

    // Initialize the indices of the minimum and maximum angles to -1
    let minIndex = -1;
    let maxIndex = -1;

    for(let index = 0; index < shape.length; index++){
      // Calculate the position of the current vertex
      const vertex = {
        x: shape[index].x + shadowPosition.x,
        y: shape[index].y + shadowPosition.y
      };

      // Create vectors from the light source to the vertex and the center of the shape
      const vectorToVertex = new Vector(vertex.x - lightPosition.x, vertex.y - lightPosition.y);
      const vectorToCenter = new Vector(shadowPosition.x - lightPosition.x, shadowPosition.y - lightPosition.y);

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

  // getVerticesFromExtremes(light, shadow) {
  //   const left = {
  //     x: light.position.x - shadow.position.x,
  //     y: light.position.y - shadow.position.y
  //   };
  //   const right = {
  //     x: left.x,
  //     y: left.y
  //   };
  //   const workingVector = {
  //     x: 0,
  //     y: 0
  //   };
  //   let minIndex = -1;
  //   let maxIndex = -1;

  //   for (let i = 0; i < shadow.shape.length; i++) {
  //     const vertex = shadow.shape[i];

  //     workingVector.x = vertex.x + shadow.position.x - light.position.x;
  //     workingVector.y = vertex.y + shadow.position.y - light.position.y;
      
  //     if(left.x * workingVector.y - left.y * workingVector.x < 0){
  //       maxIndex = i;
  //       left.x = -workingVector.x;
  //       left.y = -workingVector.y;
  //     }
      
  //     if(right.x * workingVector.y - right.y * workingVector.x > 0){
  //       minIndex = i;
  //       right.x = -workingVector.x;
  //       right.y = -workingVector.y;
  //     }
  //     i++;
  //   }

  //   return { min: minIndex, max: maxIndex };
  // }

  getGradient(light){
    let gradient = null;
    const { context } = this;
    const radius = light.radius * 2 * this.camera.scale.x;
    const distance = light.distance * this.camera.scale.x;
    const position = this.getCanvasPosition(light.position);
    const { angle, type } = light;
    
    if(type === "radial"){
      gradient = context.createRadialGradient(position.x, position.y, radius, position.x, position.y, 0);
    }else if (type === "spot"){
      const angleFix = Math.PI / 4;
      const direction = new Vector(distance).rotate(angle - angleFix).add(position);
        
      gradient = context.createRadialGradient(
        direction.x, direction.y, radius, position.x, position.y, 0
      );
    }

    gradient.addColorStop(0, "transparent");

    light.steps.forEach(step => gradient.addColorStop(step.start, step.color));

    return gradient;
  }
}