import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';
import { enableLiveReload } from 'electron-compile';
import { CHANNELS, PROGRESS_STATUS } from './constant';
// import extract from './extractZh';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

const isDevMode = process.execPath.match(/[\\/]electron/);

if (isDevMode) enableLiveReload({ strategy: 'react-hmr' });

const createWindow = async () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegrationInWorker: true,
    },
    width: 800,
    height: 600,
  });

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // Open the DevTools.
  if (isDevMode) {
    await installExtension(REACT_DEVELOPER_TOOLS);
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
  return mainWindow;
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// const selectDirectory = () => {
//   dialog.showOpenDialog(mainWindow, {
//     properties: ['openDirectory'],
//   });
// };
ipcMain.on(CHANNELS.openFolder, (event, key) => {
  console.log('ipcMain openFolder', key);
  function respondWithPath(paths) {
    event.sender.send(CHANNELS.folderData, key, paths);
  }
  dialog.showOpenDialog(
    mainWindow,
    {
      properties: ['openFile', 'openDirectory', 'multiSelections'],
    },
    paths => respondWithPath(paths),
  );
});

// ipcMain.on(CHANNELS.extractZh, (event, [srcPaths, outputPath]) => {
//   console.log('ipcMain', CHANNELS.extractZh, srcPaths, outputPath);
//   // 直接在主线程中做这种耗时的操作会阻塞渲染线程
//   extract({
//     include: srcPaths,
//     exclude: [],
//     outputPath,
//   }).catch((error) => {
//     console.error(error);
//   });
// });

export function getMainWindow() {
  return mainWindow;
}
