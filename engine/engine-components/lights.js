export default class Lights{
  lights = new Set();
  disabled = false;
  globalLight = {
    enabled: true,
    color: "transparent",
    darknessColor: "#000",
    mode: "lighter",
    brightness: 1
  };
  canvas = new OffscreenCanvas(1, 1);
  context = this.canvas.getContext('2d');

  add = (lightSource) => this.lights.add(lightSource);
  delete = (lightSource) => this.lights.delete(lightSource);
  has = (lightSource) => this.lights.has(lightSource);

  renderLights(context, camera){
    if(this.disabled) return;

    this.canvas.width = camera.size.x + 1;
    this.canvas.height = camera.size.y + 1;
    
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if(this.globalLight.enabled) this.context.fillStyle = this.globalLight.color;
    else this.context.fillStyle = this.globalLight.darknessColor;

    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (const lightSource of this.lights) {
      if (lightSource.disabled || !lightSource.GameObject.onCameraView) continue;
      const position = camera.worldToScreen(lightSource.position).multiply(1 / camera.scale.x, 1 / camera.scale.y);

      this.renderLight(context, camera.position, lightSource.position, lightSource, lightSource.mode, lightSource.brightness);

      this.renderLight(this.context, { x:0, y:0 }, position, lightSource, "destination-out", 1);
    }

    context.save();
    context.globalAlpha = this.globalLight.brightness;
    context.globalCompositeOperation = this.globalLight.mode;
    context.drawImage(this.canvas, camera.position.x, camera.position.y);
    context.restore();
  }

  renderLight(context, rectPosition, lightPosition, lightSource, gco, globalAlpha){
    const gradient = context.createRadialGradient(lightPosition.x, lightPosition.y, lightSource.radius, lightPosition.x, lightPosition.y, 0);

    gradient.addColorStop(0, "transparent");
    lightSource.steps.forEach(step => gradient.addColorStop(step.start, step.color));

    context.globalCompositeOperation = gco;
    context.globalAlpha = globalAlpha;
    context.fillStyle = gradient;
    context.fillRect(rectPosition.x, rectPosition.y, this.canvas.width, this.canvas.height);
  }
}