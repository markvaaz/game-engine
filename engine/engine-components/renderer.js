export default class Renderer{
  constructor(){
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('bitmaprenderer');
    this.buffer = new OffscreenCanvas(innerWidth, innerHeight).getContext('2d');
    this.canvas.width = innerWidth;
    this.canvas.height = innerHeight;
    this.buffer.canvas.width = innerWidth;
    this.buffer.canvas.height = innerHeight;
    // this.canvas.addEventListener('contextmenu', e => e.preventDefault());

    document.body.appendChild(this.canvas);
    window.addEventListener('resize', this.resize);
  }

  clear(){
    // this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.buffer.clearRect(0, 0, this.buffer.canvas.width, this.buffer.canvas.height);
  }

  render(callback){
    callback(this.buffer);
  }

  draw(){
    this.context.transferFromImageBitmap(this.buffer.canvas.transferToImageBitmap(), 0, 0);
  }

  resize = () => {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.buffer.canvas.width = window.innerWidth;
    this.buffer.canvas.height = window.innerHeight;
  }
}