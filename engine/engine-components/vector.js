/**
 * @class Vector
 * @description A 2D vector class.
 * @param {number | object | Vector} x - The x value of the vector or an object with x and y properties or a Vector object.
 * @param {number} [y] - The y value of the vector.
 * @property {number} x - The x value of the vector.
 * @property {number} y - The y value of the vector.
 * @property {object} constraints - The constraints of the vector.
 * @property {number} constraints.x.min - The minimum x value of the vector.
 * @property {number} constraints.x.max - The maximum x value of the vector.
 * @property {number} constraints.y.min - The minimum y value of the vector.
 * @property {number} constraints.y.max - The maximum y value of the vector.
 * @property {number} magnitude - The magnitude of the vector.
 * @property {number} angle - The angle of the vector.
 * @property {Vector} copy - A copy of the vector.
 * @example new Vector(10, 10);
 */

export default class Vector{
  #x;
  #y;
  #locked = false;
  #constraints = { x: { min: null, max: null }, y: { min: null, max: null } };
  #constrained = false;
  #callbacks = new Set();
  
  constructor(x, y){
    this.set(x, y);
  }

  /**
   * @method get x
   * @description Gets the x value of the vector.
   * @returns {number} The x value of the vector.
   */
  get x(){
    return this.#x;
  }

  /**
   * @method get y
   * @description Gets the y value of the vector.
   * @returns {number} The y value of the vector.
   */
  get y(){
    return this.#y;
  }

  /**
   * @method set x
   * @description Sets the x value of the vector.
   * @param {number} x - The x value of the vector.
   * @returns {number} The x value of the vector.
   */
  set x(x){
    if(this.#locked) return this.#x;

    if(isNaN(x)) return new TypeError("x must be a number");

    const lastX = this.#x;
    const lastY = this.#y;

    this.#x = x;
    
    if(this.#constrained) this.#constrain();

    this.#onChange(lastX, lastY);

    return this.#x;
  }

  /**
   * @method set y
   * @description Sets the y value of the vector.
   * @param {number} y - The y value of the vector.
   * @returns {number} The y value of the vector.
   */
  set y(y){
    if(this.#locked) return this.#y;

    if(isNaN(y)) return new TypeError("y must be a number");

    const lastX = this.#x;
    const lastY = this.#y;

    this.#y = y;
    
    if(this.#constrained) this.#constrain();

    this.#onChange(lastX, lastY);

    return this.#y;
  }

  /**
   * @method get constraints
   * @description Gets the constraints of the vector.
   * @returns {object} The constraints of the vector.
   * @readonly
   */
  get constraints(){
    return {...this.#constraints};
  }

  /**
   * @method get angle
   * @description Gets the angle of the vector.
   * @returns {number} The angle of the vector.
   */
  get angle(){
    return Math.atan2(this.y, this.x);
  }

  /**
   * @method set angle
   * @description Sets the angle of the vector.
   * @param {number} angle - The angle of the vector.
   * @returns {number} The angle of the vector.
   */
  set angle(angle){
    this.x = Math.cos(angle) * this.magnitude;
    this.y = Math.sin(angle) * this.magnitude;

    return angle;
  }

  /**
   * @method get magnitude
   * @description Gets the magnitude of the vector.
   * @returns {number} The magnitude of the vector.
   */
  get magnitude(){
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
  }

  /**
   * @method set magnitude
   * @description Sets the magnitude of the vector.
   * @param {number} magnitude - The magnitude of the vector.
   * @returns {number} The magnitude of the vector.
   */
  set magnitude(magnitude){
    this.x = Math.cos(this.angle) * magnitude;
    this.y = Math.sin(this.angle) * magnitude;
    
    return this.magnitude;
  }

  /**
   * @method get magnitudeSquared
   * @description Gets the magnitude squared of the vector.
   * @returns {number} The magnitude squared of the vector.
   * @readonly
   */
  get magnitudeSquared(){
    return Math.pow(this.x, 2) + Math.pow(this.y, 2);
  }

  /**
   * @method length
   * @description Gets the magnitude of the vector.
   * @returns {number} The magnitude of the vector.
   * @readonly
   */
  get length(){
    return this.magnitude;
  }

  /**
   * @method get lengthSquared
   * @description Gets the magnitude squared of the vector.
   * @returns {number} The magnitude squared of the vector.
   * @readonly
   */
  get lengthSquared(){
    return this.magnitudeSquared;
  }

  /**
   * @method get magSq
   * @description Gets the magnitude squared of the vector.
   * @returns {number} The magnitude squared of the vector.
   * @readonly
   */
  get magSq(){
    return this.magnitudeSquared;
  }

  /**
   * @method get heading
   * @description Gets the heading of the vector.
   * @returns {number} The heading of the vector.
   */
  get heading(){
    return this.angle;
  }

  /**
   * @method set heading
   * @description Sets the heading of the vector.
   * @param {number} heading - The heading of the vector.
   * @returns {number} The heading of the vector.
   */
  set heading(heading){
    return this.angle = heading;
  }

  /**
   * @method get copy
   * @description Gets a copy of the vector.
   * @returns {Vector} A copy of the vector.
   * @readonly
   */
  get copy() {
    if (this.#constrained) {
      const copy = new Vector(this.x, this.y);
      copy.setConstraints(
        this.#constraints.x.min,
        this.#constraints.x.max,
        this.#constraints.y.min,
        this.#constraints.y.max
      );
      return copy;
    } else {
      return new Vector(this.x, this.y);
    }
  }
  

  /**
   * @method get locked
   * @description Gets whether the vector is locked.
   * @returns {boolean} Whether the vector is locked.
   * @readonly
   */
  get locked(){
    return this.#locked;
  }

  /**
   * @method get debug
   * @description Gets the debug information of the vector.
   * @returns {object} The debug information of the vector.
   * @readonly
   */
  get debug(){
    return {
      x: this.x,
      y: this.y,
      magnitude: this.magnitude,
      angle: this.angle,
      heading: this.heading,
      locked: this.locked,
      constraints: this.constraints
    };
  }

  /**
   * @method get string
   * @description Gets the string representation of the vector.
   * @returns {string} The string representation of the vector.
   * @readonly
   */
  get string(){
    return this.toString();
  }

  /**
   * @method normal
   * @description Normalizes the vector.
   * @example
   * const vector = new Vector(10, 15);
   * vector.normal; // Vector { x: 0.5547001962252291, y: 0.8320502943378436 }
   * @returns {Vector} A normalized copy of the vector.
   * @readonly
   */
  get normal(){
    const length = this.magnitude;
    const normal = new Vector(this.x, this.y);
    if (length !== 0) normal.multiply(1 / length);
    return normal;
  }

  /**
   * @method normalized
   * @description Returns a normalized copy of the vector.
   * @example
   * const vector = new Vector(10, 15);
   * vector.normalized; // Vector { x: 0.5547001962252291, y: 0.8320502943378436 }
   * @returns {Vector} A normalized copy of the vector.
   * @readonly
   */
  get normalized() {
    return this.copy.normal;
  }

  /**
   * @method get negated
   * @description Returns a negated copy of the vector.
   * @example 
   * const vector = new Vector(1, 1);
   * vector.negated; // Vector { x: -1, y: -1 }
   * @returns {Vector} A negated copy of the vector.
   * @readonly
   */
  get negated(){
    return this.copy.multiply(-1);
  }

  get half(){
    return this.copy.multiply(0.5);
  }

  /**
   * @method abs
   * @description Returns the absolute value of the vector.
   * @returns {Vector} The absolute value of the vector.
   * @readonly
   */
  get abs(){
    return new Vector(Math.abs(this.x), Math.abs(this.y));
  }

  onChange(callback){
    this.#callbacks.add(callback);
    return this;
  }

  offChange(callback){
    this.#callbacks.delete(callback);
    return this;
  }

  #onChange(x, y){
    if(x === this.x && y === this.y) return;
    this.#callbacks.forEach((callback) => callback(x, y, this));
  }

  /**
   * @method set
   * @description Sets the x and y values of the vector.
   * @param {number | object | Vector} x - The x value of the vector or an object with x and y properties or a Vector object.
   * @param {number} [y] - The y value of the vector.
   * @returns {Vector} The vector.
   */
  set(x, y){
    if(this.#locked) return this.copy.set(x, y);
    if(x instanceof Vector || typeof x === 'object'){
      if(!isNaN(x.x) && !isNaN(x.y)) return this.set(x.x, x.y);
    }else if(!isNaN(x) && y == null)
      return this.set(x, x);

    this.x = x || 0;
    this.y = y || 0;

    return this;
  }

  project(vector){
    if(this.#locked) return this.copy.project(vector);
    const dot = this.dot(vector);
    const magSq = vector.magnitudeSquared;

    return vector.copy.set(dot / magSq, 0);
  }

  /**
   * @method projectOnto
   * @description Projects the vector onto the given vector.
   * @param {Vector} vector - The vector to project onto.
   * @returns {Vector} The projected vector.
   */
  projectOnto(vector){
    const unitV = vector.normalized;
    const projectionLength = this.dot(unitV);
    return unitV.multiply(projectionLength);
  }

  /**
   * @method rotate
   * @description Rotates the vector by the given angle.
   * @param {number} angle - The angle to rotate the vector by.
   * @returns {Vector} The vector.
   */
  rotate(angle, origin = { x: 0, y: 0 }){
    if(this.#locked) return this.copy.rotate(angle, origin);
    const x = this.x - origin.x;
    const y = this.y - origin.y;

    this.x = x * Math.cos(angle) - y * Math.sin(angle) + origin.x;
    this.y = x * Math.sin(angle) + y * Math.cos(angle) + origin.y;

    return this;
  }

  /**
   * @method setConstraints
   * @description Sets the constraints of the vector.
   * @param {number | object | Vector} minX - The minimum x value of the vector or an object with x and y properties or a Vector object.
   * @param {number | object | Vector} maxX - The maximum x value of the vector or an object with x and y properties or a Vector object.
   * @param {number} [minY] - The minimum y value of the vector.
   * @param {number} [maxY] - The maximum y value of the vector.
   * @returns {Vector} The vector.
   * @example
   * vector.setConstraints(0, 100, 0, 100);
   * @example
   * vector.setConstraints({x: 0, y: 0}, {x: 100, y: 100});
   * @example
   * vector.setConstraints(new Vector(0, 0), new Vector(100, 100));
   */
  setConstraints(minX, maxX, minY, maxY){
    if(minX instanceof Vector || typeof minX === 'object'){
      if(!isNaN(minX?.x) && !isNaN(minX?.y) && !isNaN(maxX?.x) && !isNaN(maxX?.y)){}
        return this.setConstraints(minX.x, maxX.x, minX.y, maxX.y);
    }

    this.#constrained = true;

    this.#constraints.x.min = minX;
    this.#constraints.x.max = maxX;
    this.#constraints.y.min = minY;
    this.#constraints.y.max = maxY;

    this.#constrain();

    return this;
  }

  unsetConstraints(){
    this.#constrained = false;
    return this;
  }

  /**
   * @method constrain
   * @description Constrains the vector to the constraints.
   */
  #constrain(){
    if(this.#constraints.x.min != null && this.x < this.#constraints.x.min) this.#x = this.#constraints.x.min;
    if(this.#constraints.x.max != null && this.x > this.#constraints.x.max) this.#x = this.#constraints.x.max;
    if(this.#constraints.y.min != null && this.y < this.#constraints.y.min) this.#y = this.#constraints.y.min;
    if(this.#constraints.y.max != null && this.y > this.#constraints.y.max) this.#y = this.#constraints.y.max;
  }

  /**
   * @method add
   * @description Adds the given x and y values to the vector.
   * @param {number | object | Vector} x - The x value to add to the vector or an object with x and y properties or a Vector object.
   * @param {number} [y] - The y value to add to the vector.
   * @returns {Vector} The vector.
   */
  add(x, y){
    if(this.#locked) return this.copy.add(x, y);
    if((x instanceof Vector || typeof x === 'object') && !isNaN(x.x) && !isNaN(x.y))
      return this.add(x.x, x.y);
    
    else if(!isNaN(x) && y == null)
      return this.add(x, x);

    this.x += x;
    this.y += y;

    return this;
  }

  /**
   * @method subtract
   * @description Subtracts the given x and y values from the vector.
   * @param {number | object | Vector} x - The x value to subtract from the vector or an object with x and y properties or a Vector object.
   * @param {number} [y] - The y value to subtract from the vector.
   * @returns {Vector} The vector.
   */
  subtract(x, y){
    if(this.#locked) return this.copy.subtract(x, y);
    if((x instanceof Vector || typeof x === 'object') && !isNaN(x.x) && !isNaN(x.y))
      return this.subtract(x.x, x.y);
    
    else if(!isNaN(x) && y == null)
      return this.subtract(x, x);

    this.x -= x;
    this.y -= y;

    return this;
  }

  /**
   * @method sub
   * @description Subtracts the given x and y values from the vector.
   * @param {number | object | Vector} x - The x value to subtract from the vector or an object with x and y properties or a Vector object.
   * @param {number} [y] - The y value to subtract from the vector.
   * @returns {Vector} The vector.
   */
  sub(x, y){
    return this.subtract(x, y);
  }

  /**
   * @method multiply
   * @description Multiplies the vector by the given x and y values.
   * @param {number | object | Vector} x - The x value to multiply the vector by or an object with x and y properties or a Vector object.
   * @param {number} [y] - The y value to multiply the vector by.
   * @returns {Vector} The vector.
   */
  multiply(x, y){
    if(this.#locked) return this.copy.multiply(x, y);
    if((x instanceof Vector || typeof x === 'object') && !isNaN(x.x) && !isNaN(x.y))
      return this.multiply(x.x, x.y);
    
    else if(!isNaN(x) && y == null)
      return this.multiply(x, x);

    this.x *= x;
    this.y *= y;

    return this;
  }

  /**
   * @method mult
   * @description Multiplies the vector by the given x and y values.
   * @param {number | object | Vector} x - The x value to multiply the vector by or an object with x and y properties or a Vector object.
   * @param {number} [y] - The y value to multiply the vector by.
   * @returns {Vector} The vector.
   */
  mult(x, y){
    return this.multiply(x, y);
  }

  /**
   * @method divide
   * @description Divides the vector by the given x and y values.
   * @param {number | object | Vector} x - The x value to divide the vector by or an object with x and y properties or a Vector object.
   * @param {number} [y] - The y value to divide the vector by.
   * @returns {Vector} The vector.
   */
  divide(x, y){
    if(this.#locked) return this.copy.divide(x, y);
    if((x instanceof Vector || typeof x === 'object') && !isNaN(x.x) && !isNaN(x.y))
      return this.divide(x.x, x.y);
    
    else if(!isNaN(x) && y == null)
      return this.divide(x, x);

    if(x == 0 || y == 0) throw new Error(`x:${x}, y:${y} | Cannot divide by zero. (Vector.divide)`);

    this.x /= x;
    this.y /= y;

    return this;
  }

  /** 
   * @method div
   * @description Divides the vector by the given x and y values.
   * @param {number | object | Vector} x - The x value to divide the vector by or an object with x and y properties or a Vector object.
   * @param {number} [y] - The y value to divide the vector by.
   * @returns {Vector} The vector.
   */
  div(x, y){
    return this.divide(x, y);
  }

  /**
   * @method equals
   * @description Checks if the vector is equal to the given x and y values.
   * @param {number | object | Vector} x - The x value to check if the vector is equal to or an object with x and y properties or a Vector object.
   * @param {number} [y] - The y value to check if the vector is equal to.
   * @returns {boolean} True if the vector is equal to the given x and y values.
   */
  equals(x, y){
    if((x instanceof Vector || typeof x === 'object') && !isNaN(x.x) && !isNaN(x.y))
      return this.equals(x.x, x.y);

    return this.x == x && this.y == y;
  }

  /**
   * @method distance
   * @description Calculates the distance between the vector and the given x and y values.
   * @param {number | object | Vector} x - The x value to calculate the distance to or an object with x and y properties or a Vector object.
   * @param {number} [y] - The y value to calculate the distance to.
   * @returns {number} The distance.
   */
  distance(x, y){
    if((x instanceof Vector || typeof x === 'object') && !isNaN(x.x) && !isNaN(x.y))
      return this.distance(x.x, x.y);

    return Math.sqrt(this.distanceSquared(x, y));
  }

  distanceSquared(x, y){
    if((x instanceof Vector || typeof x === 'object') && !isNaN(x.x) && !isNaN(x.y))
      return this.distanceSquared(x.x, x.y);

    return Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2);
  }

  /**
   * @method perpendicular
   * @description Returns a perpendicular vector.
   * @returns {Vector} The perpendicular vector.
   */
  perpendicular(x, y){
    if((x instanceof Vector || typeof x === 'object') && !isNaN(x.x) && !isNaN(x.y))
      return this.perpendicular(x.x, x.y);

    return new Vector(-(y - this.y), x - this.x);
  }

  /**
   * @method dist
   * @description Calculates the distance between the vector and the given x and y values.
   * @param {number | object | Vector} x - The x value to calculate the distance to or an object with x and y properties or a Vector object.
   * @param {number} [y] - The y value to calculate the distance to.
   * @returns {number} The distance.
   */
  dist(x, y){
    return this.distance(x, y);
  }

  direction(x, y){
    if((x instanceof Vector || typeof x === 'object') && !isNaN(x.x) && !isNaN(x.y))
      return this.direction(x.x, x.y);

    return this.copy.subtract(x, y).normalized;
  }

  /**
   * @method setMagnitude
   * @description Sets the magnitude of the vector.
   * @param {number} magnitude - The magnitude to set the vector to.
   * @returns {Vector} The vector.
   */
  setMagnitude(magnitude){
    this.magnitude = magnitude;

    return this;
  }

  /**
   * @method setMag
   * @description Sets the magnitude of the vector.
   * @param {number} magnitude - The magnitude to set the vector to.
   * @returns {Vector} The vector.
   */
  setMag(magnitude){
    this.magnitude = magnitude;

    return this;
  }

  /**
   * @method setAngle
   * @description Sets the angle of the vector.
   * @param {number} angle - The angle to set the vector to.
   * @returns {Vector} The vector.
   */
  setAngle(angle){
    this.angle = angle;

    return this;
  }

  /**
   * @method scale
   * @description Scales the vector by the given x and y values (same as multiply).
   * @param {number | object | Vector} x - The x value to scale the vector by or an object with x and y properties or a Vector object.
   * @param {number} [y] - The y value to scale the vector by.
   * @returns {Vector} The vector.
   */
  scale(x, y){
    return this.mult(x, y);
  }

  /**
   * @method limit
   * @description Limits the magnitude of the vector.
   * @param {number} max - The maximum magnitude of the vector.
   * @returns {Vector} The vector.
   */
  limit(max){
    if(this.magnitude > max){
      this.magnitude = max;
    }

    return this;
  }

  /**
   * @method lock
   * @description Locks the vector x and y values to the current values.
   * @returns {Vector} The vector.
   */
  lock(){
    this.#locked = true;
    return this;
  }

  normalize(){
    const length = this.magnitude;
    if (length !== 0) this.multiply(1 / length);
    return this;
  }

  negate(){
    this.x = -this.x;
    this.y = -this.y;
    return this;
  }

  /**
   * @method unlock
   * @description Unlocks the vector x and y values.
   * @returns {Vector} The vector.
   */
  unlock(){
    this.#locked = false;
    return this;
  }

  /**
   * @method clamp
   * @description Clamps the magnitude of the vector.
   * @param {number} min - The minimum magnitude of the vector.
   * @param {number} max - The maximum magnitude of the vector.
   * @returns {Vector} The vector.
   */
  clamp(min, max){
    if(this.magnitude < min){
      this.magnitude = min;
    }else if(this.magnitude > max){
      this.magnitude = max;
    }

    return this;
  }

  /**
   * @method lerp
   * @description Lerps the vector to the given x and y values.
   * @param {number | object | Vector} x - The x value to lerp to or an object with x and y properties or a Vector object.
   * @param {number} [y] - The y value to lerp to.
   * @param {number} [amount] - The amount to lerp by.
   * @returns {Vector} The vector.
   */
  lerp(x, y, amount){
    if((x instanceof Vector || typeof x === 'object') && !isNaN(x.x) && !isNaN(x.y))
      return this.lerp(x.x, x.y, y);

    if(amount == null) amount = 0.1;

    this.x += (x - this.x) * amount;
    this.y += (y - this.y) * amount;

    return this;
  }

  /**
   * @method dot
   * @description Calculates the dot product of the vector and the given x and y values.
   * @param {number | object | Vector} x - The x value to calculate the dot product with or an object with x and y properties or a Vector object.
   * @param {number} [y] - The y value to calculate the dot product with.
   * @returns {number} The dot product.
   */
  dot(x, y){
    if((x instanceof Vector || typeof x === 'object') && !isNaN(x.x) && !isNaN(x.y))
      return this.dot(x.x, x.y);
    else if(!isNaN(x) && y == null)
      return this.dot(x, x);

    return this.x * x + this.y * y;
  }

  /**
   * @method cross
   * @description Calculates the cross product of the vector and the given x and y values.
   * @param {number | object | Vector} x - The x value to calculate the cross product with or an object with x and y properties or a Vector object.
   * @param {number} [y] - The y value to calculate the cross product with.
   * @returns {number} The cross product.
   */
  cross(x, y){
    if((x instanceof Vector || typeof x === 'object') && !isNaN(x.x) && !isNaN(x.y))
      return this.cross(x.x, x.y);
    else if(!isNaN(x) && y == null)
      return this.cross(x, x);

    return this.x * y - this.y * x;
  }

  /**
   * @method angleBetween
   * @description Calculates the angle between the vector and the given x and y values.
   * @param {number | object | Vector} x - The x value to calculate the angle to or an object with x and y properties or a Vector object.
   * @param {number} [y] - The y value to calculate the angle to.
   * @returns {number} The angle.
   */
  angleBetween(x, y){
    if((x instanceof Vector || typeof x === 'object') && !isNaN(x.x) && !isNaN(x.y))
      return this.angleBetween(x.x, x.y);

    return Math.atan2(y - this.y, x - this.x);
  }

  /**
   * @method angleTo
   * @description Calculates the angle between the vector and the given x and y values.
   * @param {number | object | Vector} x - The x value to calculate the angle to or an object with x and y properties or a Vector object.
   * @param {number} [y] - The y value to calculate the angle to.
   * @returns {number} The angle.
   */
  angleTo(x, y){
    return this.angleBetween(x, y);
  }

  /**
   * @method clone
   * @description Clones the vector.
   * @returns {Vector} The cloned vector.
   */
  clone(){
    return this.copy;
  }

  /**
   * @method toFixed
   * @description Returns a fixed representation of the vector.
   * @param {number} fractionDigits - The number of digits to appear after the decimal point.
   * @param {boolean} [strict] - If true, the vector will not be fixed if its magnitude is 0.
   * @returns {Vector} The fixed representation of the vector.
   */
  toFixed(fractionDigits, strict){
    if(strict && this.magnitude === 0) return this;
    return new Vector(this.x.toFixed(fractionDigits), this.y.toFixed(fractionDigits));
  }

  floor(){
    this.x = Math.floor(this.x);
    this.y = Math.floor(this.y);
    return this;
  }

  ceil(){
    this.x = Math.ceil(this.x);
    this.y = Math.ceil(this.y);
    return this;
  }

  round(){
    this.x = Math.round(this.x);
    this.y = Math.round(this.y);
    return this;
  }

  /**
   * @method toString
   * @description Returns a string representation of the vector.
   * @returns {string} The string representation of the vector.
   * 
   */
  toString(name = 'Vector', fractionDigits = 0){
    if(fractionDigits > 0)
      return `${name}(${this.x.toFixed(fractionDigits)}, ${this.y.toFixed(fractionDigits)})`;
    
    return `${name}(${this.x}, ${this.y})`;
  }

  /**
   * @method toArray
   * @description Returns an array representation of the vector.
   * @returns {array} The array representation of the vector.
   */
  toArray(){
    return [this.x, this.y];
  }

  /**
   * @method toObject
   * @description Returns an object representation of the vector.
   * @returns {object} The object representation of the vector.
   */
  toObject(){
    return {x: this.x, y: this.y};
  }

  /**
   * @method toJSON
   * @description Returns a JSON representation of the vector.
   * @returns {string} The JSON representation of the vector.
   */
  toJSON(){
    return JSON.stringify(this.toObject());
  }

  toConsole(name){
    return console.log(this.toString(name));
  }

  // Static methods

  /**
   * @method add
   * @description Adds two vectors together.
   * @param {Vector} vector1 - The first vector.
   * @param {Vector} vector2 - The second vector.
   * @returns {Vector} The sum of the two vectors.
   */
  static add(vector1, vector2){
    if(vector1 instanceof Vector && vector2 instanceof Vector)
      return new Vector(vector1.x + vector2.x, vector1.y + vector2.y);
    else if(vector1 instanceof Vector && !isNaN(vector2))
      return new Vector(vector1.x + vector2, vector1.y + vector2);
    else
      throw new Error(`vector1:${vector1}, vector2:${vector2} | Cannot add non Vector objects. (Vector.add)`);
  }

  /**
   * @method subtract
   * @description Subtracts two vectors.
   * @param {Vector} vector1 - The first vector.
   * @param {Vector} vector2 - The second vector.
   * @returns {Vector} The difference of the two vectors.
   */
  static subtract(vector1, vector2){
    if(vector1 instanceof Vector && vector2 instanceof Vector)
      return new Vector(vector1.x - vector2.x, vector1.y - vector2.y);
    else if(vector1 instanceof Vector && !isNaN(vector2))
      return new Vector(vector1.x - vector2, vector1.y - vector2);
    else
      throw new Error(`vector1:${vector1}, vector2:${vector2} | Cannot subtract non Vector objects. (Vector.subtract)`);
  }

  static sub(vector1, vector2){
    return Vector.subtract(vector1, vector2);
  }

  /**
   * @method multiply
   * @description Multiplies two vectors.
   * @param {Vector} vector1 - The first vector.
   * @param {Vector} vector2 - The second vector.
   * @returns {Vector} The product of the two vectors.
   */
  static multiply(vector1, vector2){
    if(vector1 instanceof Vector && vector2 instanceof Vector)
      return new Vector(vector1.x * vector2.x, vector1.y * vector2.y);
    else if(vector1 instanceof Vector && !isNaN(vector2))
      return new Vector(vector1.x * vector2, vector1.y * vector2);
    else
      throw new Error(`vector1:${vector1}, vector2:${vector2} | Cannot multiply non Vector objects. (Vector.multiply)`);
  }

  static mult(vector1, vector2){
    return Vector.multiply(vector1, vector2);
  }

  /**
   * @method divide
   * @description Divides two vectors.
   * @param {Vector} vector1 - The first vector.
   * @param {Vector} vector2 - The second vector.
   * @returns {Vector} The quotient of the two vectors.
   */
  static divide(vector1, vector2){
    if(vector1 instanceof Vector && vector2 instanceof Vector)
      if(vector1.x == 0 || vector1.y == 0 || vector2.x == 0 || vector2.y == 0) throw new Error(`vector1:${vector1}, vector2:${vector2} | Cannot divide by zero. (Vector.divide)`);
      else return new Vector(vector1.x / vector2.x, vector1.y / vector2.y);
    else if(vector1 instanceof Vector && !isNaN(vector2))
      if(vector2 == 0) throw new Error(`vector1:${vector1}, vector2:${vector2} | Cannot divide by zero. (Vector.divide)`);
      else return new Vector(vector1.x / vector2, vector1.y / vector2);
    else
      throw new Error(`vector1:${vector1}, vector2:${vector2} | Cannot divide non Vector objects. (Vector.divide)`);
  }

  static div(vector1, vector2){
    return Vector.divide(vector1, vector2);
  }

  /**
   * @method distance
   * @description Calculates the distance between two vectors.
   * @param {Vector} vector1 - The first vector.
   * @param {Vector} vector2 - The second vector.
   * @returns {number} The distance between the two vectors.
   */
  static distance(vector1, vector2){
    if(vector1 instanceof Vector && vector2 instanceof Vector)
      return Math.sqrt(Math.pow(vector1.x - vector2.x, 2) + Math.pow(vector1.y - vector2.y, 2));
    else
      throw new Error(`vector1:${vector1}, vector2:${vector2} | Cannot get distance between non Vector objects. (Vector.distance)`);
  }

  static distanceSquared(vector1, vector2){
    if(vector1 instanceof Vector && vector2 instanceof Vector)
      return Math.pow(vector1.x - vector2.x, 2) + Math.pow(vector1.y - vector2.y, 2);
    else
      throw new Error(`vector1:${vector1}, vector2:${vector2} | Cannot get distance squared between non Vector objects. (Vector.distanceSquared)`);
  }

  /**
   * @method magnitude
   * @description Calculates the magnitude of a vector.
   * @param {Vector} vector - The vector.
   * @returns {number} The magnitude of the vector.
   */
  static magnitude(vector){
    if(vector instanceof Vector)
      return Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2));
    else
      throw new Error(`vector:${vector} | Cannot get magnitude of non Vector object. (Vector.magnitude)`);
  }

  /**
   * @method angle
   * @description Calculates the angle of a vector.
   * @param {Vector} vector - The vector.
   * @returns {number} The angle of the vector.
   */
  static angle(vector){
    if(vector instanceof Vector)
      return Math.atan2(vector.y, vector.x);
    else
      throw new Error(`vector:${vector} | Cannot get angle of non Vector object. (Vector.angle)`);
  }

  /**
   * @method rotate
   * @description Rotates a vector.
   * @param {Vector} vector - The vector.
   * @param {number} angle - The angle to rotate the vector by.
   * @returns {Vector} The rotated vector.
   */

  static rotate(vector, angle, origin = new Vector(0, 0)){
    if(vector instanceof Vector){
      let x = vector.x - origin.x;
      let y = vector.y - origin.y;
      let cos = Math.cos(angle);
      let sin = Math.sin(angle);
      return new Vector(x * cos - y * sin + origin.x, x * sin + y * cos + origin.y);
    }
    else
      throw new Error(`vector:${vector} | Cannot rotate non Vector object. (Vector.rotate)`);
  }

  /**
   * @method normalize
   * @description Normalizes a vector.
   * @param {Vector} vector - The vector.
   * @returns {Vector} The normalized vector.
   */
  static normalize(vector){
    if(vector instanceof Vector){
      const length = vector.magnitude;
      if(length !== 0) vector.multiply(1 / length);

      return vector;
    }else
      throw new Error(`vector:${vector} | Cannot normalize non Vector object. (Vector.normalize)`);
  }

  /**
   * @method limit
   * @description Limits the magnitude of a vector.
   * @param {Vector} vector - The vector.
   * @param {number} max - The maximum magnitude.
   * @returns {Vector} The limited vector.
   */
  static limit(vector, max){
    if(vector instanceof Vector){
      if(vector.magnitude > max){
        vector.magnitude = max;
      }
    }else
      throw new Error(`vector:${vector} | Cannot limit non Vector object. (Vector.limit)`);
  }

  /**
   * @method dot
   * @description Calculates the dot product of two vectors.
   * @param {Vector} vector1 - The first vector.
   * @param {Vector} vector2 - The second vector.
   * @returns {number} The dot product of the two vectors.
   * @see {@link https://en.wikipedia.org/wiki/Dot_product}
   */
  static dot(vector1, vector2){
    if(vector1 instanceof Vector && vector2 instanceof Vector)
      return vector1.x * vector2.x + vector1.y * vector2.y;
    else if(!isNaN(vector1) && vector2 instanceof Vector)
      return new Vector(vector2.x * vector1, vector2.y * vector1);
    else if(vector1 instanceof Vector && !isNaN(vector2))
      return new Vector(vector1.x * vector2, vector1.y * vector2);
    else
      throw new Error(`vector1:${vector1}, vector2:${vector2} | Cannot dot non Vector objects. (Vector.dot)`);
  }

  /**
   * @method cross
   * @description Calculates the cross product of two vectors.
   * @param {Vector} vector1 - The first vector.
   * @param {Vector} vector2 - The second vector.
   * @returns {number} The cross product of the two vectors.
   * @see {@link https://en.wikipedia.org/wiki/Cross_product}
   */
  static cross(vector1, vector2){
    if(vector1 instanceof Vector && vector2 instanceof Vector)
      return vector1.x * vector2.y - vector1.y * vector2.x;
    else if(!isNaN(vector1) && vector2 instanceof Vector)
      return new Vector(vector2.y * vector1, -vector2.x * vector1);
    else if(vector1 instanceof Vector && !isNaN(vector2))
      return new Vector(-vector1.y * vector2, vector1.x * vector2);
    else
      throw new Error(`vector1:${vector1}, vector2:${vector2} | Cannot cross non Vector objects. (Vector.cross)`);
  }

  /**
   * @method lerp
   * @description Linearly interpolates between two vectors.
   * @param {Vector} vector1 - The first vector.
   * @param {Vector} vector2 - The second vector.
   * @param {number} amount - The amount to interpolate.
   * @returns {Vector} The interpolated vector.
   */
  static lerp(vector1, vector2, amount){
    if(vector1 instanceof Vector && vector2 instanceof Vector)
      return Vector.add(vector1, Vector.multiply(Vector.subtract(vector2, vector1), amount));
    else
      throw new Error(`vector1:${vector1}, vector2:${vector2} | Cannot lerp non Vector objects. (Vector.lerp)`);
  }

  /**
   * @method angleBetween
   * @description Calculates the angle between two vectors.
   * @param {Vector} vector1 - The first vector.
   * @param {Vector} vector2 - The second vector.
   * @returns {number} The angle between the two vectors.
   */
  static angleBetween(vector1, vector2){
    if(vector1 instanceof Vector && vector2 instanceof Vector)
      return Math.acos(Vector.dot(vector1, vector2) / (vector1.magnitude * vector2.magnitude));
    else
      throw new Error(`vector1:${vector1}, vector2:${vector2} | Cannot get angle between non Vector objects. (Vector.angleBetween)`);
  }

  /**
   * @method random
   * @description Gets a random vector between two vectors.
   * @param {Vector} min - The minimum vector.
   * @param {Vector} max - The maximum vector.
   * @returns {Vector} The random vector.
   */
  static random(min, max){
    if(min instanceof Vector && max instanceof Vector)
      return new Vector(Math.random() * (max.x - min.x) + min.x, Math.random() * (max.y - min.y) + min.y);
    else
      throw new Error(`min:${min}, max:${max} | Cannot get random Vector between non Vector objects. (Vector.random)`);
  }

  /**
   * @method randomInCircle
   * @description Gets a random vector in a circle.
   * @param {number} radius - The radius of the circle.
   * @returns {Vector} The random vector.
   */
  static randomInCircle(radius){
    if(typeof radius === 'number')
      return new Vector(Math.random() * radius * 2 - radius, Math.random() * radius * 2 - radius);
    else
      throw new Error(`radius:${radius} | Cannot get random Vector in circle with non number radius. (Vector.randomInCircle)`);
  }

  /**
   * @method clone
   * @description Clones a vector.
   * @param {Vector} vector - The vector.
   * @returns {Vector} The cloned vector.
   */
  static clone(vector){
    if(vector instanceof Vector)
      return new Vector(vector.x, vector.y);
    else
      throw new Error(`vector:${vector} | Cannot clone non Vector object. (Vector.clone)`);
  }

  /**
   * @method copy
   * @description Copies a vector.
   * @param {Vector} vector - The vector.
   * @returns {Vector} The copied vector.
   */
  static copy(vector){
    if(vector instanceof Vector)
      return new Vector(vector.x, vector.y);
    else
      throw new Error(`vector:${vector} | Cannot copy non Vector object. (Vector.copy)`);
  }

  static map(number, min1, max1, min2, max2){
    return (number - min1) * (max2 - min2) / (max1 - min1) + min2;
  }

  /**
   * @method toString
   * @description Converts a vector to a string.
   * @param {Vector} vector - The vector.
   * @returns {string} The string representation of the vector.
   */
  static toString(vector){
    if(vector instanceof Vector)
      return `Vector(${vector.x}, ${vector.y})`;
    else
      throw new Error(`vector:${vector} | Cannot convert non Vector object to string. (Vector.toString)`);
  }

  /**
   * @method toArray
   * @description Converts a vector to an array.
   * @param {Vector} vector - The vector.
   * @returns {array} The array representation of the vector.
   */
  static toArray(vector){
    if(vector instanceof Vector)
      return [vector.x, vector.y];
    else
      throw new Error(`vector:${vector} | Cannot convert non Vector object to array. (Vector.toArray)`);
  }

  /**
   * @method toObject
   * @description Converts a vector to an object.
   * @param {Vector} vector - The vector.
   * @returns {object} The object representation of the vector.
   */
  static toObject(vector){
    if(vector instanceof Vector)
      return {x: vector.x, y: vector.y};
    else
      throw new Error(`vector:${vector} | Cannot convert non Vector object to object. (Vector.toObject)`);
  }

  /**
   * @method toJson
   * @description Converts a vector to a JSON string.
   * @param {Vector} vector - The vector.
   * @returns {string} The JSON string representation of the vector.
   */
  static toJson(vector){
    if(vector instanceof Vector)
      return JSON.stringify({x: vector.x, y: vector.y});
    else
      throw new Error(`vector:${vector} | Cannot convert non Vector object to JSON string. (Vector.toJson)`);
  }

  /**
   * @method fromString
   * @description Converts a string to a vector.
   * @param {string} string - The string.
   * @returns {Vector} The vector representation of the string.
  */
  static fromJSON(json){
    if(typeof json == "string"){
      const parsed = JSON.parse(json);

      if(!isNaN(parsed.x) && !isNaN(parsed.y))
        return new Vector(parsed.x, parsed.y);
    }
    else
      throw new Error(`json:${json} | Cannot convert non JSON string to Vector object. (Vector.fromJSON)`);
  }

  /**
   * @method fromArray
   * @description Converts an array to a vector.
   * @param {array} array - The array.
   * @returns {Vector} The vector representation of the array.
   */
  static fromArray(array){
    if(array instanceof Array)
      return new Vector(array[0], array[1]);
    else
      throw new Error(`array:${array} | Cannot convert non Array to Vector object. (Vector.fromArray)`);
  }

  /**
   * @method fromObject
   * @description Converts an object to a vector.
   * @param {object} object - The object.
   * @returns {Vector} The vector representation of the object.
   */
  static fromObject(object){
    if(object instanceof Object)
      return new Vector(object.x, object.y);
    else
      throw new Error(`object:${object} | Cannot convert non Object to Vector object. (Vector.fromObject)`);
  }

  /**
   * @method fromAngle
   * @description Creates a vector from an angle.
   * @param {number} angle - The angle.
   * @returns {Vector} The vector.
   */
  static fromAngle(angle){
    return new Vector(Math.cos(angle), Math.sin(angle));
  }

  /**
   * @method fromAngleAndMagnitude
   * @description Creates a vector from an angle and magnitude.
   * @param {number} angle - The angle.
   * @param {number} magnitude - The magnitude.
   * @returns {Vector} The vector.
   */
  static fromAngleAndMagnitude(angle, magnitude){
    return Vector.multiply(Vector.fromAngle(angle), magnitude);
  }

  /**
   * @method create
   * @description Creates a vector.
   * @param {number} x - The x component.
   * @param {number} y - The y component.
   * @returns {Vector} The vector.
   */
  static create(x, y){
    return new Vector(x, y);
  }
}