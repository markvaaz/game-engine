import { app, BrowserWindow, Menu } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import menu from './editor/menu.js';

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

const __dirname = dirname(fileURLToPath(import.meta.url));
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 1024,
    x: 1920,
    y: 0,
    darkTheme: true
  });

  mainWindow.webContents.openDevTools();
  
  mainWindow.maximize();

  mainWindow.loadFile(join(__dirname, '/editor/index.html'));

  const menuBuild = Menu.buildFromTemplate(menu);
  
  Menu.setApplicationMenu(menuBuild);

  console.log("App Running");
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.whenReady().then(createWindow);

export default mainWindow