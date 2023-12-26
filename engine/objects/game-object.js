import Vector from "../engine-components/vector.js";
import Transform from "./components/transform.js";

export default class GameObject {
  static name = 'GameObject';
  name = 'GameObject';
  components = new Map();
  children = new Map();
  collidesOnlyWith = new Set();
  ignoredCollisions = new Set();
  triggerOnlyCollisions = new Set();
  destroyed = false;
  Scene = null;
  onCameraView = true;
  #layer = 0;
  #previousLayer = 0;
  #id = "";
  #debug = {
    enabled: false,
    lineColor: "green",
    lineWidth: 2,
    fillColor: "transparent",
    position: false,
    velocity: false,
    velocityVector: false,
    centerOfMass: true,
    vertices: false,
    line: true,
    name: false,
    nameColor: "white",
    shadow: false
  }
  
  constructor(){
    this.add(new Transform(this));
  }

  get debug(){ return this.#debug; }

  set debug(value){
    if(typeof value !== "object") return;
    
    for(const key in value){
      if(this.#debug[key] !== undefined) this.#debug[key] = value[key];
    }
  }

  get id(){
    if(this.#id === "") for(let i = 0; i < 10; i++) this.#id += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+<>?,.;:[]{}|~".charAt(Math.floor(Math.random() * "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+<>?,.;:[]{}|~".length));
    return this.#id;
  }

  set id(value){
    this.#id = value;
  }

  get position(){ return this.Transform.position; }
  get previousPosition(){ return this.Transform.previousPosition; }
  get relativePosition(){ return this.Transform.relativePosition; }
  get velocity(){ return this.Transform.velocity; }
  get rotation(){ return this.Transform.rotation; }
  set rotation(value){ this.Transform.rotation = value; }
  get anchor(){ return this.Transform.anchor; }
  get size(){ return this.Transform.size; }
  get layer(){ return this.#layer; }
  set layer(value){
    this.#previousLayer = this.#layer;
    this.#layer = value;
  }
  get previousLayer(){ return this.#previousLayer; }
  set previousLayer(value){ this.#previousLayer = value; }
  get zIndex(){ return this.layer; }
  set zIndex(value){ this.layer = value; }
  get framesWithoutMovement(){ return this.Transform.framesWithoutMovement; }
  get inactive(){ return this.Transform.inactive; }
  get bounds(){
    if(this.Shape) return this.Shape.bounds;
    return this.Transform.bounds;
  }

  add(component){
    if(component instanceof GameObject){
      component.Parent = this;

      this.triggerOnlyCollisions.add(component);
      component.triggerOnlyCollisions.add(this);
      
      return this.children.set(component.id, component);
    }

    this[component.name] = component;
    this.components.set(component.name, component);
  }

  delete(component) {
    if(component instanceof GameObject){
      component.Parent = null;
      return this.children.delete(component.id);
    }
    delete this[component.name];
    this.components.delete(component.name);
  }

  has(component){
    if(component instanceof GameObject){
      return this.children.has(component.id);
    }
    if(typeof component === "string") return this.components.has(component);
    return this.components.has(component.name);
  }

  destroy(){
    this.destroyed = true;

    this.Scene.delete(this);
  }

  defaultBeforeUpdate(Time){
    this.components.forEach(component => {
      if(this.destroyed) return;
      component.defaultBeforeUpdate?.(Time);
      component.beforeUpdate?.(Time);
    }); 
  }

  defaultUpdate(Time){
    this.components.forEach(component => {
      if(this.destroyed) return;
      component.defaultUpdate?.(Time);
      component.update?.(Time);
    });
  }

  defaultAfterUpdate(Time){
    this.components.forEach(component => {
      if(this.destroyed) return;
      component.defaultAfterUpdate?.(Time);
      component.afterUpdate?.(Time);
    });

    this.children.forEach(child => {
      if(child.destroyed) return this.remove(child)

      child.position.set(this.Transform.position.copy.add(child.relativePosition));
    });
  }

  defaultRender(context){
    this.components.forEach(component => {
      component.defaultRender?.(context);
      component.render?.(context);
    });

    if(this.debug.enabled) this.debugRender(context);
  }

  debugRender(context, debug = {}){
    if(!this.Shape || this.Shape.vertices.length === 0) return;

    const lineColor = debug.lineColor || this.debug.lineColor;
    const fillColor = debug.fillColor || this.debug.fillColor;
    const vertices = this.Shape.vertices;
    
    context.save();

    context.beginPath();
    context.fillStyle = fillColor;
    context.strokeStyle = lineColor;
    context.lineWidth = debug.lineWidth || this.debug.lineWidth;

    if(!this.Shape.renderShape){ 
      context.moveTo(vertices[0].x, vertices[0].y);

      for(let i = 1; i < vertices.length; i++){
        context.lineTo(vertices[i].x, vertices[i].y);
      }

      context.closePath();
      context.fill();
      context.stroke();
    }else this.Shape.renderShape(context);

    const centerOfMass = this.Shape.centerOfMass;    

    // draw center of mass
    if(debug.centerOfMass || this.debug.centerOfMass){
      let color = this.Collider?.collisions?.size > 0 ? 'rgb(0, 255, 0)' : 'rgb(255, 0, 0)';

      if(this.inactive) color = 'rgb(0, 0, 255)';

      context.lineWidth = 1;
      context.strokeStyle = "rgba(255, 255, 255, 0.5)";
      context.fillStyle = color;
      context.beginPath();
      context.arc(centerOfMass.x, centerOfMass.y, 3, 0, 2 * Math.PI);
      context.closePath();
      context.fill();
      context.stroke();
    }

    // draw velocity vector
    if(debug.velocityVector || this.debug.velocityVector){
      const velocityVector = this.velocity.copy;

      velocityVector.magnitude *= 2;

      context.strokeStyle = 'rgb(150, 150, 255)';
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(centerOfMass.x, centerOfMass.y);
      context.lineTo(centerOfMass.x + velocityVector.x, centerOfMass.y + velocityVector.y);
      context.closePath();
      context.stroke();
    }

    if(debug.vertices || this.debug.vertices){
      let first = true;
      for(let vertex of vertices){
        context.fillStyle = lineColor;
        let radius = 2;
        if(first){
          context.fillStyle = 'rgb(0, 0, 255)';
          first = false;
          radius = 2.5;
        }
        context.beginPath();
        context.arc(vertex.x, vertex.y, radius, 0, 2 * Math.PI);
        context.closePath();
        context.fill();
      }
    }

    if(debug.position || debug.velocity || this.debug.position || this.debug.velocity){
      const offset = 50;
      const textX = centerOfMass.x - offset;
      const textY = centerOfMass.y - offset;
      const textBackgroundColor = '#666';

      if(debug.position || this.debug.position){
        context.font = "10px Arial";

        const positionText = `${this.position.copy.toFixed(0).toString("Position")}`;
        const textWidth = context.measureText(positionText).width;

        context.textAlign = "right";

        // Draw black background behind the text
        context.fillStyle = textBackgroundColor;
        context.fillRect(textX - textWidth - 3, textY - 12, textWidth + 6, 18);

        // Draw text on top of the black background
        context.fillStyle = '#fff';
        context.fillText(positionText, textX, textY);
      }

      if (debug.velocity || this.debug.velocity) {
        context.font = "10px Arial";
        
        const velocityText = `${this.velocity.copy.toFixed(2, true).toString("Velocity")}`;
        const metrics = context.measureText(velocityText);
        
        context.textAlign = "right";

        // Draw black background behind the text
        context.fillStyle = textBackgroundColor;
        context.fillRect(textX - metrics.width - 3, textY + 10, metrics.width + 6, 18);

        // Draw text on top of the black background
        context.fillStyle = 'rgb(255, 255, 255)';
        context.fillText(velocityText, textX, textY + 23);
      }

      const underlineY = textY + 8;

      context.beginPath();
      context.moveTo(textX - 90, underlineY);
      context.lineTo(textX + 5, underlineY);
      context.strokeStyle = '#999';
      context.stroke();

      context.beginPath();
      context.moveTo(textX + 5, underlineY);
      context.lineTo(centerOfMass.x, centerOfMass.y);
      // context.strokeStyle = 'rgb(255, 255, 255)';
      context.stroke();
    }

    if(debug.name || this.debug.name){
      context.fillStyle = debug.nameColor || this.debug.nameColor;
      context.font = "10px Arial";

      context.textAlign = "center";
      context.fillText(this.name, centerOfMass.x, centerOfMass.y+5);
    }

    context.restore();
  }
}