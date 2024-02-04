class CustomConsole{
  constructor(ID){
    const log = console.log.bind(console);
    console.log = (...args) => {
      log(...args);
  
      const consoleContainer = document.getElementById(ID);
      const listItem = document.createElement('li');
      
      listItem.classList.add('log');
      listItem.innerHTML = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg).join(' ');
  
      consoleContainer.appendChild(listItem);
      // Scroll automático para a parte inferior
      consoleContainer.scrollTop = consoleContainer.scrollHeight;
    };
  
    const error = console.error.bind(console);
    console.error = (...args) => {
      error(...args);
  
      const consoleContainer = document.getElementById(ID);
      const listItem = document.createElement('li');
      
      listItem.classList.add('error');
      listItem.innerHTML = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg).join(' ');
  
      consoleContainer.appendChild(listItem);
      // Scroll automático para a parte inferior
      consoleContainer.scrollTop = consoleContainer.scrollHeight;
    };
  
    const warn = console.warn.bind(console);
    console.warn = (...args) => {
      warn(...args);
  
      const consoleContainer = document.getElementById(ID);
      const listItem = document.createElement('li');
      
      listItem.classList.add('warn');
      listItem.innerHTML = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg).join(' ');
  
      consoleContainer.appendChild(listItem);
      // Scroll automático para a parte inferior
      consoleContainer.scrollTop = consoleContainer.scrollHeight;
    };
  
    const info = console.info.bind(console);
    console.info = (...args) => {
      info(...args);
  
      const consoleContainer = document.getElementById(ID);
      const listItem = document.createElement('li');
      
      listItem.classList.add('info');
      listItem.innerHTML = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg).join(' ');
  
      consoleContainer.appendChild(listItem);
      // Scroll automático para a parte inferior
      consoleContainer.scrollTop = consoleContainer.scrollHeight;
    };

    const head = document.head || document.getElementsByTagName('head')[0];

    // Cria uma tag <style> e adiciona o estilo retornado por getStyle()
    const style = document.createElement('style');
    style.appendChild(document.createTextNode(this.#getStyle()));

    // Adiciona a tag <style> à tag <head>
    head.appendChild(style);
  }

  #getStyle(){
    return `#console-container{position:fixed;top:0;left:0;width:100%;max-height:150px;overflow-y:auto;background-color:#333;color:#fff;padding:0;font-family:monospace}#console{list-style:none;padding:0;margin:0}#console li{display:flex;align-items:center;padding:8px 16px;border-bottom:1px solid;width:100%}#console li:last-child{border:none}.log{color:#fff}.error{color:#f33}.warn{color:#f90}.info{color:#6cf}.log::before{content:"\\1F4D6 ";color:#fff}.error::before{content:"\\1F6AB ";color:#f33}.warn::before{content:"\\26A0 ";color:#f90}.info::before{content:"\\1F30E ";color:#6cf}`;
  }
}