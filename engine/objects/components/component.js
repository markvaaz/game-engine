import { circularJSON } from "../../../utilities.js";
import Vector from "../../engine-components/vector.js";

export default class Component {
  name = "Component";
  static name = "Component";
  path = "/engine/objects/components/";
  fileName = "component";

  save(){
    return JSON.parse(circularJSON(this));
  }

  load(data){
    Object.keys(data).forEach(key => {
      const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), key);

      if (descriptor && descriptor.get) return;

      if(this[key] && this[key] instanceof Vector) return this[key].set(data[key]);

      this[key] = data[key];
    });
  }
}

