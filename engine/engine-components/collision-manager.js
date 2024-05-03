import Time from "./time.js";
import Vector from "./vector.js";

export default class CollisionManager{
  GameObjects = new Map();
  workerQueue = new Map();
  workers = [];

  constructor(){
    if (navigator.hardwareConcurrency > 1) {
      for (let i = 0; i < navigator.hardwareConcurrency; i++) {
        const worker = new Worker(new URL('./workers/sat-worker.js', import.meta.url), { type: "module" });
    
        worker.postMessage({ action: "init" });
        worker.onmessage = this.onmessage;
        this.workers.push(worker);
        this.workerQueue.set(worker, []);
      }
    }
    window.addEventListener('resize', this.resize);
  }

  onmessage = (event) => {
    const actions = {
      updateObjects: (data) => this.updateObjects(data),
    }

    if(actions[event.data.action]) actions[event.data.action](event.data);
  }

  add(gameObject){
    this.GameObjects.set(gameObject.id, gameObject);
  }

  delete(gameObject){
    this.GameObjects.delete(gameObject.id);
  }

  async update(camera){
    for(const gameObject of this.GameObjects.values()){
      const workers = this.getWorkers(gameObject.Shape.bounds, camera);
      const collider = {
        id: gameObject.id,
        position: {
          x: gameObject.Shape.centerOfMass.x,
          y: gameObject.Shape.centerOfMass.y
        },
        movement: {
          x: 0,
          y: 0
        },
        Shape:{
          bounds: {
            min: gameObject.Shape.bounds.min.toObject(),
            max: gameObject.Shape.bounds.max.toObject()
          },
          vertices: gameObject.Shape.verticesObject,
          centerOfMass: gameObject.Shape.centerOfMass.toObject()
        },
        RigidBody: {
          static: gameObject.RigidBody.static,
          inverseMass: gameObject.RigidBody.inverseMass
        }
      }

      for(const worker of workers){
        this.workerQueue.get(worker).push(collider);
      }
    }

    for(const [worker, queue] of this.workerQueue){
      worker.postMessage({ action: "update", gameObjects: queue });
      queue.length = 0;
    }
  }

  updateHash(){
    return;
  }

  getWorkers(bounds, camera) {
    const workersInBounds = [];
  
    // Loop through each worker and check if its region intersects with the bounds
    for(const [index, worker] of this.workers.entries()){
      const width = camera.bounds.max.x - camera.bounds.min.x;
      const workerRegionWidth = Math.ceil((width) / this.workers.length);
      const workerRegionStart = camera.bounds.min.x + (index * workerRegionWidth);
      const workerRegionEnd = camera.bounds.min.x + ((index + 1) * workerRegionWidth);
      const regionBounds = {
        min:{
          x: workerRegionStart,
          y: camera.bounds.min.y
        },
        max:{
          x: workerRegionEnd,
          y: camera.bounds.max.y
        }
      }
  
      // Check if the bounds overlap with the worker's region
      if(!(regionBounds.min.x < bounds.max.x && 
        regionBounds.max.x > bounds.min.x && 
        regionBounds.min.y < bounds.max.y && 
        regionBounds.max.y > bounds.min.y)) continue;
        workersInBounds.push(worker);
    }
  
    return workersInBounds;
  }
  

  updateObjects({ gameObjects }){
    for(const updatedGameObject of gameObjects){
      const gameObject = this.GameObjects.get(updatedGameObject.id);
      const movement = new Vector(updatedGameObject.Shape.centerOfMass).sub(gameObject.Shape.centerOfMass);
      gameObject.position.add(movement);
    }
  }

  resize = () => {
    
  };
}