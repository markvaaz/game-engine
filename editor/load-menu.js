import editorState from "./editor-state.json" assert { type: 'json' };
import paths from "./paths.json" assert { type: 'json' };

async function loadMenu(){
  const menu = editorState.menu;
  
  for(const item of Object.values(menu)){
    const { submenu, label } = item;

  }
}

function createItem(label){
  
}

export default loadMenu