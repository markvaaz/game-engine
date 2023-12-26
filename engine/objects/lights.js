export default class Lights{
  lights = new Set();
  disabled = false;
  globalLight = {
    enabled: true,
    color: "transparent",
    darknessColor: "#000",
    mode: "source-over",
    brightness: 0.5
  };
  canvas = document.createElement('canvas')
  context = this.canvas.getContext('2d');

  add = (lightSource) => this.lights.add(lightSource);
  delete = (lightSource) => this.lights.delete(lightSource);
  has = (lightSource) => this.lights.has(lightSource);

  renderLights(context, camera){
    if(this.disabled) return;

    this.canvas.width = camera.size.x + 1;
    this.canvas.height = camera.size.y + 1;
    
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    context.save();

    for (const lightSource of this.lights) {
      if (lightSource.disabled || !lightSource.GameObject.onCameraView) continue;
      
      const position = lightSource.position;
      const radius = this.globalLight ? lightSource.radius : lightSource.radius;

      const gradient = context.createRadialGradient( position.x, position.y, radius, position.x, position.y, 0 );
      gradient.addColorStop(Math.max(lightSource.start, 0.0), "transparent");
      gradient.addColorStop(Math.min(lightSource.stop, 1.0), lightSource.color);

      context.save();
      context.globalCompositeOperation = lightSource.mode;
      context.globalAlpha = lightSource.brightness;
      context.fillStyle = gradient;
      context.fillRect(camera.position.x, camera.position.y, this.canvas.width, this.canvas.height);
      context.restore();
    }
  
    context.restore();

    if(this.globalLight.enabled) this.context.fillStyle = this.globalLight.color;
    else this.context.fillStyle = this.globalLight.darknessColor;

    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (const lightSource of this.lights) {
      if (lightSource.disabled || !lightSource.GameObject.onCameraView) continue;
      const position = camera.worldToScreen(lightSource.position).multiply(1 / camera.scale.x, 1 / camera.scale.y);

      const gradient = this.context.createRadialGradient(
        position.x,
        position.y,
        lightSource.radius,
        position.x,
        position.y,
        0
      );

      gradient.addColorStop(Math.max(lightSource.start, 0.0), "transparent");
      gradient.addColorStop(Math.min(lightSource.stop, 1.0), "#fff");

      this.context.globalCompositeOperation = 'destination-out';
      this.context.fillStyle = gradient;
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    context.save();
    context.globalAlpha = this.globalLight.brightness;
    context.globalCompositeOperation = this.globalLight.mode;
    context.drawImage(this.canvas, camera.position.x, camera.position.y, this.canvas.width, this.canvas.height);
    context.restore();
  }
}