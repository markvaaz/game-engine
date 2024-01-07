import Vector from "../../engine-components/vector.js";

export default class Sprite{
  constructor(gameObject, imageSrc){
    this.GameObject = gameObject;
    this.size = this.GameObject.size;
    this.GameObject.Render.sprite.src = imageSrc;
  }


}