import Vector from "../../engine-components/vector.js";

export default class Sprite{
  constructor(gameObject, imageSrc){
    this.GameObject = gameObject;
    this.size = this.GameObject.size;
    this.image = new Image();
    this.image.src = imageSrc;
  }

  render(context){
    const gapFix = 0.1;
    context.drawImage(this.image, this.GameObject.position.x - this.size.x / 2, this.GameObject.position.y - this.size.y / 2, this.size.x + gapFix, this.size.y + gapFix);
  }
}