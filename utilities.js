const stringify = require('safe-stable-stringify');

function splitCamelCase(text){
  text = text.replace(/([a-z])([A-Z])/g, '$1 $2');
  text = capitalize(text);
  return text;
}

function joinCamelCase(text){
  return text.replace(/\s(.)/g, function(match, group1) {
    return group1.toUpperCase();
  });
}

function capitalize(text){
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function circularJSON(obj) {
  function filter(obj) {
    if (typeof obj === 'object') {
      for (const key in obj) {
        if(obj[key] == "[Circular]" || key == "GameObject"){
          delete obj[key];
          continue;
        }
        if (typeof obj[key] === 'object') {
          filter(obj[key]);
        }
      }
    } else if (Array.isArray(obj)) {
      obj.forEach(item => filter(item));
    }
  }

  filter(obj);

  return stringify(obj);
}

async function getFileImport(path, fileName, importName){
  return (await import(`${__dirname}${path}${fileName}.js`))[importName];
}

export {
  splitCamelCase,
  joinCamelCase,
  capitalize,
  circularJSON,
  getFileImport
}
