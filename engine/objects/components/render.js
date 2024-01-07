import SpriteManager from "../../engine-components/sprite-manager.js";
import Vector from "../../engine-components/vector.js";

export default class Render{
  static name = "Render";
  name = "Render";
  opacity = 1;
  gco = "source-over";
  visible = false;
  mode = "shape";
  disabled = false;
  layer = null;
  lightSource = null;

  shape = {
    vertices: [],
    lineColor: "rgba(255, 255, 255, 1)",
    fillColor: `hsl(${Math.random() * 360} 100% 50% / 100%)`,
    type: "shape",
    bounds: {
      min: { x: 0, y: 0 },
      max: { x: 0, y: 0 }
    }
  };

  transform = {
    position: { x: 0, y: 0 },
    size: { x: 0, y: 0 }
  };

  sprite = {
    src: null,
    x: 0,
    y: 0,
    width: 64,
    height: 64
  };

  constructor(GameObject){
    this.id = GameObject.id;
    this.layer = GameObject.layer;
    this.transform.size = GameObject.size.toObject();
    this.transform.position = GameObject.position.toObject();

    GameObject.position.onChange((x, y, vector) => {
      this.transform.position.x = vector.x;
      this.transform.position.y = vector.y;
    });
    GameObject.size.onChange((x, y, vector) => {
      this.transform.size.x = vector.x;
      this.transform.size.y = vector.y;
    });
  }

  async setImage({ src, position, coords, bitmap }){
    if(bitmap instanceof ImageBitmap) this.sprite.bitmap = bitmap;
    else this.sprite.bitmap = await SpriteManager.get(src, coords);
    this.sprite.position.set(position);
  }

  setShape({ vertices, lineColor, fillColor, type }){
    this.shape.vertices = vertices;
    this.shape.lineColor = lineColor;
    this.shape.fillColor = fillColor;
    this.shape.type = type;
  }

  addVertices(vertices){
    vertices.forEach((vertex, i) => {
      this.shape.vertices.push({ x: vertex.x, y: vertex.y });
    });
  }

  addSprite(src, coords){
    this.sprite.src = src;
    this.sprite.x = coords.x;
    this.sprite.y = coords.y;
    this.sprite.width = coords.width;
    this.sprite.height = coords.height;
  }

  addLightSource(lightSource){
    this.lightSource = lightSource;
  }

  updateBounds(bounds){
    this.shape.bounds.min = bounds.min.toObject();
    this.shape.bounds.max = bounds.max.toObject();
  }
}