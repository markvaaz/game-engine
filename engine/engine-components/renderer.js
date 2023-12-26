export default class Renderer{
  constructor(){
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    document.body.appendChild(this.canvas);
    // this.canvas.addEventListener('contextmenu', e => e.preventDefault());

    window.addEventListener('resize', this.resize);
  }

  clear(){
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  render(gameObject){
    gameObject.render(this.context);
  }

  resize = () => {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
}