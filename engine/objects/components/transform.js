import Vector from "../../engine-components/vector.js";

export default class Transform{
  static name = 'Transform';
  name = 'Transform';

  position = new Vector();
  previousPosition = new Vector();
  relativePosition = new Vector();
  previousRelativePosition = new Vector();
  #rotation = new Vector();
  anchor = new Vector();
  size = new Vector();
  velocity = new Vector();
  previousVelocity = new Vector();
  outputVelocity = new Vector();
  framesWithoutMovement = 0;
  #active = true;
  previousRotation = 0;
  frames = 0;

  constructor(){
    this.position.onChange(this.updateFramesWithoutMovement);
    this.Rotation.onChange(() => this.updateFramesWithoutMovement(true));
  }

  get active(){
    return this.#active;
  }

  set active(value){
    this.#active = value;
    this.framesWithoutMovement = 0;
  }

  get Rotation(){
    return this.#rotation;
  }

  get rotation(){
    return this.#rotation.x;
  }

  set rotation(value){
    this.#rotation.x = value;
  }

  get bounds(){
    return {
      min: this.position.copy.subtract(this.size.copy.divide(2)),
      max: this.position.copy.add(this.size.copy.divide(2))
    }
  }

  update(){
    this.previousVelocity.set(this.velocity.x, this.velocity.y);
    this.velocity.set(this.position.x - this.previousPosition.x, this.position.y - this.previousPosition.y);
    this.previousPosition.set(this.position.x, this.position.y);
    this.previousRotation = this.rotation;

    this.framesWithoutMovement++;

    if(this.framesWithoutMovement > 1){
      this.#active = false;
    }
  }

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