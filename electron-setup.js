import { app, BrowserWindow } from 'electron';
import { fileURLToPath } from 'url';
import path, { dirname, join } from 'path';
import dotenv from 'dotenv';

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

const __dirname = dirname(fileURLToPath(import.meta.url));
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 1024,
    x: 1920,
    y: 0,
    darkTheme: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    ELECTRON_DISABLE_SECURITY_WARNINGS: true
  });

  //solve Electron Security Warning
  mainWindow.ELECTRON_DISABLE_SECURITY_WARNINGS = true

  mainWindow.setMenuBarVisibility(false);

  mainWindow.webContents.openDevTools();
  
  mainWindow.maximize();

  mainWindow.loadFile(join(__dirname, '/index.html'));

  // mainWindow.loadURL('http://localhost:5500');

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