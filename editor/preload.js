const engine = document.getElementById("engine");
const iframe = document.querySelector("#engine iframe");
const engineWindow = iframe.contentWindow;

window.engineWindow = engineWindow;

let isResizing = false;
let pointerDown = false;
let currentSize = {
  width: engine.clientWidth,
  height: engine.clientHeight,
};

engineWindow.addEventListener("load", () => {
  import("./index.js");

  engine.addEventListener("pointerdown", () => pointerDown = false);

  engine.addEventListener("pointermove", () => {
    if(pointerDown && (engine.clientWidth !== currentSize.width || engine.clientHeight !== currentSize.height)) {
      isResizing = true;
      currentSize = {
        width: engine.clientWidth,
        height: engine.clientHeight,
      }
    }
  });

  engine.addEventListener("pointerup", () => {
    if(isResizing){
      engineWindow.dispatchEvent(new Event("resize"));
    }
    isResizing = false;
  })
});
