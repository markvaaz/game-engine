import Mouse from "./mouse.js";

class Events{
  static listeners = new Map();
  static keys = new Set();
  static windowMouse = new Mouse(true);
  static mouse = new Mouse();
  static mouseWheelTimeout = 0;
  static id = 0;

  /**
   * @param {boolean} value
   */
  static set mouseLocked(value){
    Events.windowMouse.locked = value;
  }

  /**
   * @property {number} length - the number of listeners.
   * @readonly
   */
  static get length(){ return Events.listeners.forEach((value, key) => count += value.size) }

  /**
   * Adds a listener to the event.       
   * @param {string} event - the event to listen to       
   * @param {function} callback - the callback to run when the event is fired       
   * @returns {EventManager} - the event manager instance.
   * @example
   * 
   * gameEvents.on("keydown", (event) => console.log(event.key));
   * gameEvents.on("death", (event) => console.log("You died!"));
   * gameEvents.dispatch("death");
   */
  static on(...args){
    if(typeof args[args.length - 1] !== "function") throw new Error(`Expected a function, received ${typeof args[args.length - 1]} instead`)

    if(args.length === 2){
      if(!Events.listeners.has(args[0])) Events.listeners.set(args[0], new Set());
      Events.listeners.get(args[0]).add(args[1]);
    }
    else{
      for(let i = 0; i < args.length - 1; i++){
        if(i === args.length - 1) break;
        Events.listeners.get(args[i]).add(args[args.length - 1]);
      }
    }
    
    return Events;
  }

  /**
   * Removes a callback from the event listener list.       
   * @param {string} event - the event to remove the callback from       
   * @param {function} callback - the callback to remove from the event listener list       
   * @returns {EventManager} - the event manager instance.
   * @example
   * const callback = (event) => {
   *   if(event.key === "a") gameEvents.off("keydown", callback);
   * }
   * gameEvents.on("keydown", callback);
   */
  static off(...args){
    if(typeof args[args.length - 1] !== "function") throw new Error(`Expected a function, received ${typeof args[args.length - 1]} instead`);
    
    if(args.length === 2){
      if(Events.listeners.has(args[0])) Events.listeners.get(args[0]).delete(args[1]);
    }
    else{
      for(let i = 0; i < args.length - 1; i++){
        if(i === args.length - 1) break;
        Events.listeners.get(args[i]).delete(args[args.length - 1]);
      }
    }
  }

  /**
   * Dispatch an event to the listeners.       
   * @param {Event} event - the event to dispatch.       
   * @returns {EventManager} - the event manager instance.
   * @example
   * gameEvents.dispatch("death");
   */
  static dispatch = (event, data) => {
    let eventType = typeof event === "string" ? event : event.type;

    if(event.type === "pointermove") Events.windowMouse.setPosition(event.clientX, event.clientY, event.movementX, event.movementY);
    if(event.type === "wheel"){
      Events.windowMouse.wheel.x = event.deltaX;
      Events.windowMouse.wheel.y = event.deltaY;
      Events.mouse.wheel.x = event.deltaX;
      Events.mouse.wheel.y = event.deltaY;

      clearTimeout(Events.mouseWheelTimeout);

      Events.mouseWheelTimeout = setTimeout(() => {
        Events.windowMouse.wheel.x = 0;
        Events.windowMouse.wheel.y = 0;
        Events.mouse.wheel.x = 0;
        Events.mouse.wheel.y = 0;
      }, 100);
    }

    if(event.type === "pointerdown" && event?.target.tagName === "CANVAS"){
      Events.windowMouse.down = true;
      Events.mouse.down = true;
      Events.windowMouse.buttons.add(event.button);
      Events.mouse.buttons.add(event.button);
    }
    if(event.type === "pointerup" && event?.target.tagName === "CANVAS"){
      Events.windowMouse.down = false;
      Events.mouse.down = false;
      Events.windowMouse.buttons.delete(event.button);
      Events.mouse.buttons.delete(event.button);
    }
    if(event.type === "keydown"){
      Events.keys.add(event.key);
      Events.keys.add(event.code);
    }
    if(event.type === "keyup"){
      Events.keys.delete(event.key);
      Events.keys.delete(event.code);
    }
    if(event.type === "blur"){
      Events.keys.clear();
      Events.windowMouse.buttons.clear();
    }

    if(Events.listeners.get(eventType)){
      Events.listeners.get(eventType).forEach(callback => callback({ data, id: Events.id }));
    }

    return Events.id++;
  }

  static emit(event, data){
    return Events.dispatch(event, data);
  }

  static clear(event) {
    Events.listeners.delete(event);
  }

  static get(event) {
    return Events.listeners.get(event);
  }

  static has(event) {
    return Events.listeners.has(event);
  }

  static getCount(event){
    if(Events.listeners.has(event)) return Events.listeners.get(event).size;
    else if(event == null) return Events.length;
  }

  /**
   * Adds a callback to the input event.
   * @param {Function} callback - the callback to be called when the input event is fired.       
   * @returns {EventManager} - the event manager instance.
   */
  static input(callback){
    return Events.on("input", callback);
  }

  /**
   * Adds a callback to the keydown event.
   * @param {Function} callback - the callback to be called when the user presses a key.           
   * @returns {EventManager} - the event manager instance.
   */
  static keydown(callback){
    return Events.on("keydown", callback);
  }

  /**
   * Adds a callback to the keyup event.         
   * @param {Function} callback - the callback function to be called when the keyup event is triggered.           
   * @returns {EventManager} - the event manager instance.
   */
  static keyup(callback){
    return Events.on("keyup", callback);
  }

  /**
  * Adds a callback to the click event.
   * @param {Function} callback - the callback function to be called when the element is clicked.           
   * @returns {EventManager} - the event manager instance.
   */
  static click(callback){
    return Events.on("click", callback);
  }
  
  /**
   * Adds a callback to the mousemove event.           
   * @param {function} callback - the callback to add to the mousemove event.           
   * @returns {EventManager} - the event manager instance.
   */
  static mousemove(callback){
    return Events.on("pointermove", callback);
  }

  /**
   * Adds a callback to the mousedown event.
   * @param {Function} callback - the callback function to be called when the event is triggered.           
   * @returns {EventManager} - the event manager instance.
   */
  static mousedown(callback){
    return Events.on("pointerdown", callback);
  }

  /**
   * Adds a callback to the mouseup event.           
   * @param {Function} callback - the callback to add to the mouseup event.           
   * @returns {EventManager} - the event manager instance.
   */
  static mouseup(callback){
    return Events.on("pointerup", callback);
  }

  /**
   * Adds a callback to the wheel event.       
   * @param {Function} callback - the callback to add to the wheel event.       
   * @returns {EventManager} - the event manager instance.
   */
  static wheel(callback){
    return Events.on("wheel", callback);
  }
  
  /**
   * Adds a callback to the touchstart event.           
   * @param {Function} callback - the callback to add to the event.           
   * @returns {EventManager} - the event manager instance.
   */
  static touchstart(callback){
    return Events.on("touchstart", callback);
  }
  
  /**
   * Adds a callback to the touchend event.           
   * @param {Function} callback - the callback to bind to the event.           
   * @returns {EventManager} - the event manager instance.
   */
  static touchend(callback){
    return Events.on("touchend", callback);
  }

  /**
   * Adds a callback to the touchmove event.           
   * @param {Function} callback - the callback to add to the touchmove event.           
   * @returns {EventManager} - the event manager instance.
   */
  static touchmove(callback){
    return Events.on("touchmove", callback);
  }

  /**
   * Adds a callback to be called when the window is resized.           
   * @param {Function} callback - the callback to be called when the window is resized.           
   * @returns {EventManager} - the event manager instance.
   */
  static resize(callback){
    return Events.on("resize", callback);
  }
}

["input", "keydown", "keyup", "click", "pointerdown", "pointerup", "pointermove", "mousedown", "mouseup", "mousemove", "wheel", "touchend", "touchstart", "touchmove", "resize"].forEach(event => {
  Events.listeners.set(event, new Set());
  addEventListener(event, Events.dispatch);
});

addEventListener("pointerlockchange", () => {
  if(document.pointerLockElement != null) Events.mouseLocked = true;
  else Events.mouseLocked = false;
}, true)

export default Events;