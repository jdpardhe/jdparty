/**
 * JDParty Desktop Application
 * Electron main process
 */

import { app, BrowserWindow, Menu, Tray, nativeImage } from 'electron';
import { spawn, type ChildProcess } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let serverProcess: ChildProcess | null = null;

const isDev = !app.isPackaged;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0f172a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
    },
  });

  if (isDev) {
    // Retry loading the URL a few times
    let loaded = false;
    for (let i = 0; i < 5; i++) {
      try {
        await mainWindow.loadURL('http://localhost:8080');
        loaded = true;
        break;
      } catch (e) {
        console.log(`Retrying to load URL... (${i + 1}/5)`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    if (!loaded) {
      throw new Error('Failed to load development server URL');
    }
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Prevent window from being garbage collected when hidden
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });
}

function createTray() {
  // Create tray icon (you'll need to add icon files)
  const icon = nativeImage.createFromPath(join(__dirname, '../assets/tray-icon.png'));
  tray = new Tray(icon.resize({ width: 16, height: 16 }));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        mainWindow?.show();
      },
    },
    {
      label: 'Blackout',
      type: 'checkbox',
      click: (menuItem) => {
        // TODO: Implement blackout toggle
        console.log('Blackout:', menuItem.checked);
      },
    },
    {
      label: 'Auto Mode',
      type: 'checkbox',
      click: (menuItem) => {
        // TODO: Implement auto mode toggle
        console.log('Auto mode:', menuItem.checked);
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip('JDParty');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    mainWindow?.show();
  });
}

function startServer() {
  console.log('Starting JDParty server...');

  // Start the server as a child process
  // In production, this would be bundled differently
  serverProcess = spawn('node', [join(__dirname, '../../server/dist/index.js')], {
    stdio: 'inherit',
  });

  serverProcess.on('error', (error) => {
    console.error('Server process error:', error);
  });

  serverProcess.on('exit', (code) => {
    console.log(`Server process exited with code ${code}`);
  });
}

function stopServer() {
  if (serverProcess) {
    console.log('Stopping server...');
    serverProcess.kill();
    serverProcess = null;
  }
}

// App lifecycle
app.on('ready', async () => {
  // Start server
  startServer();

  // Wait a bit for server to start
  await new Promise((resolve) => setTimeout(resolve, 3000));

  try {
    // Create window and tray
    await createWindow();
    createTray();
  } catch (error) {
    console.error('Error creating window:', error);
    // If window creation fails, we should probably quit the app.
    app.quit();
    return;
  }

  // Create application menu
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'New Show',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            // TODO: Implement new show
          },
        },
        {
          label: 'Open Show',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            // TODO: Implement open show
          },
        },
        {
          label: 'Save Show',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            // TODO: Implement save show
          },
        },
        { type: 'separator' },
        { role: 'close' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'DMX',
      submenu: [
        {
          label: 'Blackout',
          accelerator: 'CmdOrCtrl+B',
          click: () => {
            // TODO: Implement blackout
          },
        },
        {
          label: 'Test Universe',
          click: () => {
            // TODO: Implement universe test
          },
        },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            const { shell } = require('electron');
            await shell.openExternal('https://github.com/yourusername/jdparty');
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
});

app.on('window-all-closed', () => {
  // On macOS, keep app running in menu bar
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
  stopServer();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});
