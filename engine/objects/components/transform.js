import Vector from "../../engine-components/vector.js";
import Component from "./component.js";

export default class Transform extends Component{
  // Name of the Transform
  static name = 'Transform';
  // Name of the Transform instance
  name = 'Transform';
  // Position of the Transform
  position = new Vector();
  // Previous position of the Transform
  previousPosition = new Vector();
  // Relative position of the Transform
  relativePosition = new Vector();
  // Previous relative position of the Transform
  previousRelativePosition = new Vector();
  // Rotation of the Transform (private)
  #rotation = new Vector();
  // Anchor point of the Transform
  anchor = new Vector();
  // Size of the Transform
  size = new Vector();
  // Velocity of the Transform
  velocity = new Vector();
  // Previous velocity of the Transform
  previousVelocity = new Vector();
  // Output velocity of the Transform
  outputVelocity = new Vector();
  // Number of frames without movement
  framesWithoutMovement = 0;
  // Active status of the Transform (private)
  #active = true;
  // Previous rotation of the Transform
  previousRotation = 0;
  // Number of frames
  frames = 0;

  constructor(){
    super();
    this.position.onChange(this.updateFramesWithoutMovement);
    this.Rotation.onChange(() => this.updateFramesWithoutMovement(true));
  }

  /**
   * Retrieves the value of the 'active' property.
   *
   * @return {type} The value of the 'active' property.
   */
  get active(){
    return this.#active;
  }

  /**
   * Set the value of the active property.
   *
   * @param {type} value - The new value for the active property.
   * @return {undefined} This function does not return a value.
   */
  set active(value){
    this.#active = value;
    if(value) this.framesWithoutMovement = 0;
    else this.framesWithoutMovement = Infinity;
  }

  /**
   * Get the value of the Rotation property.
   *
   * @return {any} The value of the Rotation property.
   */
  get Rotation(){
    return this.#rotation;
  }

  /**
   * Get the value of the rotation.
   *
   * @return {number} The x value of the rotation.
   */
  get rotation(){
    return this.#rotation.x;
  }

  /**
   * Sets the rotation value.
   *
   * @param {type} value - The value to set the rotation.
   * @return {undefined} No return value.
   */
  set rotation(value){
    this.#rotation.x = value;
  }

  /**
   * Returns the bounds of the object.
   *
   * @return {Object} An object containing the minimum and maximum coordinates of the object.
   */
  get bounds(){
    return {
      min: this.position.copy.subtract(this.size.copy.divide(2)),
      max: this.position.copy.add(this.size.copy.divide(2))
    }
  }

  /**
   * Update method to calculate velocity, position, rotation, and check for movement.
   */
  update(){
    // Save the previous velocity
    this.previousVelocity.set(this.velocity.x, this.velocity.y);

    // Calculate the current velocity
    this.velocity.set(this.position.x - this.previousPosition.x, this.position.y - this.previousPosition.y);

    // Save the previous position
    this.previousPosition.set(this.position.x, this.position.y);

    // Save the previous rotation
    this.previousRotation = this.rotation;

    // Increment the frames without movement counter
    this.framesWithoutMovement++;

    // Check if there has been no movement for more than one frame
    if(this.framesWithoutMovement > 1){
      this.#active = false;
    }
  }

  /**
   * Updates the frames without movement counter.
   * @param {boolean} rotation - Indicates if the update is due to rotation.
   * @returns {number} The updated framesWithoutMovement value.
   */
  updateFramesWithoutMovement = (rotation = false) => {
    if(rotation){
      this.#active = true;
      return this.framesWithoutMovement = 0;
    }

    const precisionLimit = 0.00001;

    const positionChanged =
      Math.abs(this.previousPosition.x - this.position.x) > precisionLimit ||
      Math.abs(this.previousPosition.y - this.position.y) > precisionLimit ||
      Math.abs(this.previousPosition.z - this.position.z) > precisionLimit;

    if(positionChanged){
      this.#active = true;
      this.framesWithoutMovement = 0;
    }
  }
}