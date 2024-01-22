/**
 * Class to handle time-related calculations and measurements
 */
export default class Time {
  // Initialize properties
  lastFrameTime = 0; // Time of the last frame
  deltaTimeMS = 0; // Time elapsed between frames in milliseconds
  deltaTimeS = 0; // Time elapsed between frames in seconds
  deltaTime = 0; // Time elapsed between frames (same as deltaTimeS)
  totalTimeMS = 0; // Total time elapsed since the start in milliseconds
  totalTimeS = 0; // Total time elapsed since the start in seconds
  frameCount = 0; // Total number of frames

  /**
   * Update the time properties based on the current frame time
   * @param {number} now - Current frame time
   */
  update = (now) => {
    // Calculate the time elapsed since the last frame
    this.deltaTimeMS = now - this.lastFrameTime;
    this.deltaTimeS = this.deltaTimeMS / 1000;
    this.deltaTime = this.deltaTimeS;

    // Calculate the total time elapsed
    this.totalTimeMS += this.deltaTimeMS;
    this.totalTimeS = this.totalTimeMS / 1000;

    // Update the last frame time
    this.lastFrameTime = now;

    // Calculate the frame rate
    this.frameRate = 1000.0 / this.deltaTimeMS;

    // Increment the frame count
    this.frameCount++;
  }
}