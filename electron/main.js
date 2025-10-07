/*
 * Electron main process — hardened & Vite-friendly (ES Modules)
 */
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// IPC Handlers
ipcMain.handle('app:getVersion', () => app.getVersion());

ipcMain.handle('app:openExternal', async (_event, url) => {
  if (typeof url === 'string' && (url.startsWith('http:') || url.startsWith('https:'))) {
    await shell.openExternal(url);
    return true;
  }
  return false;
});

// On Windows, set a stable AppUserModelID
if (process.platform === 'win32') {
  app.setAppUserModelId('MetalSheetsManager');
}

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    show: false,
    title: 'نظام إدارة الصفائح المعدنية',
    backgroundColor: '#ffffff',
    icon: join(__dirname, '../public/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true,
      spellcheck: false,
      preload: join(__dirname, 'preload.cjs'),  // ← HERE
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'));
  }

  mainWindow.setMenuBarVisibility(false);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.webContents.on('will-navigate', (e, url) => {
    const current = mainWindow.webContents.getURL();
    if (url !== current && (url.startsWith('http:') || url.startsWith('https:'))) {
      e.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});