import { BrowserWindow } from "electron";
import { dirname } from "path";
import { fileURLToPath } from "url";

const about = () => {
  const mainWindow = BrowserWindow.getFocusedWindow();
  const __dirname = dirname(fileURLToPath(import.meta.url));
  let aboutWindow = new BrowserWindow({
    width: 350,
    height: 250,
    parent: mainWindow,
    // modal: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true
    }
  });

  aboutWindow.setMenuBarVisibility(false);

  //check the aboutWindow position in relation to the mainWindow
  if (mainWindow) {
    let x = mainWindow.getBounds().x + (mainWindow.getBounds().width / 2) - (aboutWindow.getBounds().width / 2);
    let y = mainWindow.getBounds().y + (mainWindow.getBounds().height / 2) - (aboutWindow.getBounds().height / 2);
    aboutWindow.setPosition(x, y);
  }

  aboutWindow.addListener('position-changed', () => {
    console.log(aboutWindow.getPosition());
  })

  aboutWindow.on('closed', () => {
    aboutWindow = null
  });

  aboutWindow.loadURL(`file://${__dirname}/../about.html`);
}

export default about;