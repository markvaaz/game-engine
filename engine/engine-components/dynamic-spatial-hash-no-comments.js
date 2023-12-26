export default class DynamicSpatialHash{
  #cellSize = 1 / 32;
  #table = new Map();
  #objects = new Set();

  constructor(cellSize = 32){
    this.cellSize = cellSize;
    this.overflow = 0; // Adds a amount os extra cells that the object can be in
  }

  set cellSize(value){
    if(typeof value !== 'number') throw new TypeError('cellSize must be a number');
    if(value <= 0) throw new RangeError('cellSize must be greater than 0');
    this.#cellSize = 1 / value;
  }

  get cellSize(){
    return this.#cellSize;
  }

  get table(){
    return this.#table;
  }

  add(object){
    const hashes = this.getHashesFromObject(object);
    
    object.__spatialHashes = hashes;

    hashes.forEach(hash => {
      if(!this.#table.has(hash)) this.#table.set(hash, new Set());
      this.#table.get(hash).add(object);
    });

    this.#objects.add(object);

    return this;
  }

  delete(object){
    if(!object.__spatialHashes) return;
    object.__spatialHashes.forEach(hash => {
      if(!this.#table.has(hash)) return;

      this.#table.get(hash).delete(object);

      if(this.#table.get(hash).size === 0) this.clear(hash);
    });

    this.#objects.delete(object);

    delete object.__spatialHashes;

    return this;
  }

  get(hash){
    return this.#table.get(hash);
  }

  query(object){
    let hashes = object.__spatialHashes;

    if(!hashes) hashes = this.getHashesFromObject(object);

    const objects = new Set();

    hashes.forEach(hash => {
      if(!this.#table.has(hash)) return;
      this.#table.get(hash).forEach(otherobject => {
        if(object === otherobject) return;
       objects.add(otherobject);
      });
    });

    return objects;
  }

  update(object){
    this.delete(object).add(object);
  }

  clear(hash){
    this.#table.delete(hash);
  }

  clearAll(){
    this.#table.clear();
  }

  getHashFromPosition(x, y){
    if(x.x != null && x.y != null) return this.getHashFromPosition(x.x, x.y);
    if(x === undefined || y === undefined) return false;

    return `${Math.floor(x * this.#cellSize) - this.overflow},${Math.floor(y * this.#cellSize) - this.overflow}`;
  }

  getHashesFromObject(object) {
    const { x, y, width, height, position, size } = object;
    const hashes = new Set();
    const X = position ? position.x : x;
    const Y = position ? position.y : y;
    const sizeX = size ? size.x : width;
    const sizeY = size ? size.y : height;
  
    // const maxSize = Math.max(sizeX, sizeY);

    // const minX = Math.floor((X - maxSize * 0.5) * this.#cellSize) - this.overflow;
    // const minY = Math.floor((Y - maxSize * 0.5) * this.#cellSize) - this.overflow;
    // const maxX = Math.floor((X + maxSize * 0.5) * this.#cellSize) + this.overflow;
    // const maxY = Math.floor((Y + maxSize * 0.5) * this.#cellSize) + this.overflow;

    const minX = Math.floor((X - sizeX * 0.5) * this.#cellSize) - this.overflow;
    const minY = Math.floor((Y - sizeY * 0.5) * this.#cellSize) - this.overflow;
    const maxX = Math.floor((X + sizeX * 0.5) * this.#cellSize) + this.overflow;
    const maxY = Math.floor((Y + sizeY * 0.5) * this.#cellSize) + this.overflow;
  
    for (let posX = minX; posX <= maxX; posX++) {
      for (let posY = minY; posY <= maxY; posY++) {
        hashes.add(`${posX},${posY}`);
      }
    }
  
    return hashes;
  }  
}

/*
export default class DynamicSpatialHash{
  #cellSize = 1 / 32;
  #table = new Map();
  #objects = new Set();

  constructor(cellSize = 32){
    this.cellSize = cellSize;
    this.overflow = 0; // Adds a amount os extra cells that the object can be in
  }

  set cellSize(value){
    if(typeof value !== 'number') throw new TypeError('cellSize must be a number');
    if(value <= 0) throw new RangeError('cellSize must be greater than 0');
    this.#cellSize = 1 / value;
  }

  get cellSize(){
    return this.#cellSize;
  }

  get table(){
    return this.#table;
  }

  add(object){
    const hashes = this.getHashesFromObject(object);
    
    object.__spatialHashes = hashes;

    hashes.forEach(hash => {
      if(!this.#table.has(hash)) this.#table.set(hash, new Set());
      this.#table.get(hash).add(object);
    });

    this.#objects.add(object);

    return this;
  }

  delete(object){
    if(!object.__spatialHashes) return;
    object.__spatialHashes.forEach(hash => {
      if(!this.#table.has(hash)) return;

      this.#table.get(hash).delete(object);

      if(this.#table.get(hash).size === 0) this.clear(hash);
    });

    this.#objects.delete(object);

    delete object.__spatialHashes;

    return this;
  }

  get(hash){
    return this.#table.get(hash);
  }

  query(object){
    let hashes = object.__spatialHashes;

    if(!hashes) hashes = this.getHashesFromObject(object);

    const objects = new Set();

    hashes.forEach(hash => {
      if(!this.#table.has(hash)) return;
      this.#table.get(hash).forEach(otherobject => {
        if(object === otherobject) return;
       objects.add(otherobject);
      });
    });

    return objects;
  }

  update(object){
    this.delete(object).add(object);
  }

  clear(hash){
    this.#table.delete(hash);
  }

  clearAll(){
    this.#table.clear();
  }

  getHashFromPosition(x, y){
    if(x.x != null && x.y != null) return this.getHashFromPosition(x.x, x.y);
    if(x === undefined || y === undefined) return false;

    return `${Math.floor(x * this.#cellSize) - this.overflow},${Math.floor(y * this.#cellSize) - this.overflow}`;
  }

  getHashesFromObject(object) {
    const { x, y, width, height, position, size } = object;
    const hashes = new Set();
    const X = position ? position.x : x;
    const Y = position ? position.y : y;
    const sizeX = size ? size.x : width;
    const sizeY = size ? size.y : height;
  
    // const maxSize = Math.max(sizeX, sizeY);

    // const minX = Math.floor((X - maxSize * 0.5) * this.#cellSize) - this.overflow;
    // const minY = Math.floor((Y - maxSize * 0.5) * this.#cellSize) - this.overflow;
    // const maxX = Math.floor((X + maxSize * 0.5) * this.#cellSize) + this.overflow;
    // const maxY = Math.floor((Y + maxSize * 0.5) * this.#cellSize) + this.overflow;

    const minX = Math.floor((X - sizeX * 0.5) * this.#cellSize) - this.overflow;
    const minY = Math.floor((Y - sizeY * 0.5) * this.#cellSize) - this.overflow;
    const maxX = Math.floor((X + sizeX * 0.5) * this.#cellSize) + this.overflow;
    const maxY = Math.floor((Y + sizeY * 0.5) * this.#cellSize) + this.overflow;
  
    for (let posX = minX; posX <= maxX; posX++) {
      for (let posY = minY; posY <= maxY; posY++) {
        hashes.add(`${posX},${posY}`);
      }
    }
  
    return hashes;
  }  
}

*/