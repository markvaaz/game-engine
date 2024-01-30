import { app, BrowserWindow, globalShortcut, screen } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
let mainWindow;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    darkTheme: true
  });

  mainWindow.setMenuBarVisibility(false);

  mainWindow.loadFile(join(__dirname, 'index.html'));

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