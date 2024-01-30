/**
 * Class to handle time-related calculations and measurements
 */
export default class Time {
  // Initialize properties
  static lastFrameTime = 0; // Time of the last frame
  static deltaTimeMS = 0; // Time elapsed between frames in milliseconds
  static deltaTimeS = 0; // Time elapsed between frames in seconds
  static deltaTime = 0; // Time elapsed between frames (same as deltaTimeS)
  static totalTimeMS = 0; // Total time elapsed since the start in milliseconds
  static totalTimeS = 0; // Total time elapsed since the start in seconds
  static frameCount = 0; // Total number of frames

  /**
   * Update the time properties based on the current frame time
   * @param {number} now - Current frame time
   */
  static update = (now) => {
    // Calculate the time elapsed since the last frame
    Time.deltaTimeMS = now - Time.lastFrameTime;
    Time.deltaTimeS = Time.deltaTimeMS / 1000;
    Time.deltaTime = Time.deltaTimeS;

    // Calculate the total time elapsed
    Time.totalTimeMS += Time.deltaTimeMS;
    Time.totalTimeS = Time.totalTimeMS / 1000;

    // Update the last frame time
    Time.lastFrameTime = now;

    // Calculate the frame rate
    Time.frameRate = 1000.0 / Time.deltaTimeMS;

    // Increment the frame count
    Time.frameCount++;
  }
}