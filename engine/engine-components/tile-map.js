import Collider from "../objects/components/collider.js";
import { Rectangle } from "../objects/components/shape.js";
import Sprite from "../objects/components/sprite.js";
import GameObject from "../objects/game-object.js";
import Events from "./events.js";
import Vector from "./vector.js";

export default class TileMap {
  infinite = false;
  worldSize = new Vector(0, 0); // How many tiles wide and tall the map is
  tileSize = new Vector(0, 0); // Pixel size of each tile
  layers = new Map();
  tileSets = new Set();

  constructor(path, fileName){
    this.path = path;
    this.getTileMapData(fileName);
  }

  async getTileMapData(fileName){
    const json = await (await import(__dirname + this.path + fileName, { assert: { type: "json" }})).default;
    const { tilewidth, tileheight, width, height, layers, tilesets } = json;

    this.tileSize.set(tilewidth, tileheight);
    this.worldSize.set(width, height);

    for(let i = 0; i < tilesets.length; i++){
      const tileset = await this.getTileSet(tilesets[i].source)

      tileset.firstgid = tilesets[i].firstgid;

      this.tileSets.add(tileset);
    }

    for(let i = 0; i < layers.length; i++){
      const layer = await this.parseLayer(layers[i], i);
      this.layers.set(i, layer);
    }
  }

  async getTileSet(fileName){
    const json = await (await import(__dirname + this.path + fileName, { assert: { type: "json" } })).default;
    return json;
  }

  getTileSetFromId(id){
    let index = 0
    for(const tileset of this.tileSets){
      const { firstgid, tilecount } = tileset;
      index++;
      if(id >= firstgid && id < firstgid + tilecount) return { tileset, offset: index };
    }
  }

  async parseLayer(layer, zIndex){
    const { data: layerData } = layer;
    
    for(let i = 0; i < layerData.length; i++){
      if(layerData[i] === 0) continue;
      
      const { tileset } = this.getTileSetFromId(layerData[i]);;
      const index = layerData[i] - tileset.firstgid;
      const x = (i % this.worldSize.x) * this.tileSize.x;
      const y = Math.floor(i / this.worldSize.x) * this.tileSize.y;
      const sliceX = (index % tileset.columns) * this.tileSize.x;
      const sliceY = Math.floor(index / tileset.columns) * this.tileSize.y;

      const gameObject = new GameObject();

      gameObject.layer = zIndex;

      gameObject.Render.mode = "sprite";
      
      gameObject.Transform.position.set(x, y);

      gameObject.Transform.size.set(this.tileSize.x, this.tileSize.y);

      gameObject.add(Rectangle, { size: this.tileSize });

      gameObject.add(new Sprite(gameObject, {
        src: this.path + tileset.image,
        anchor: new Vector(0, 0),
        size: this.tileSize,
        slice: {
          x: sliceX,
          y: sliceY,
          width: this.tileSize.x,
          height: this.tileSize.y
        }
      }));

      if(layer.class?.includes("collider")){
        gameObject.add(Collider);
        gameObject.RigidBody.static = true;
      }

      Events.emit("addObject", gameObject);
    }
  }
}