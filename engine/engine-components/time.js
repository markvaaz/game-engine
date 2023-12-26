export default class Time{
  lastFrameTime = 0;
  deltaTimeMS = 0;
  deltaTimeS = 0;
  deltaTime = 0;
  totalTimeMS = 0;
  totalTimeS = 0;
  frameCount = 0;

  update = (now) => {
    this.deltaTimeMS = now - this.lastFrameTime;
    this.deltaTimeS = this.deltaTimeMS / 1000;
    this.deltaTime = this.deltaTimeS;
    this.totalTimeMS += this.deltaTimeMS;
    this.totalTimeS = this.totalTimeMS / 1000;
    this.lastFrameTime = now;
    this.frameRate = 1000.0 / this.deltaTimeMS;
    this.frameCount++;
    this.frameRateLimit = 60;
  }
}