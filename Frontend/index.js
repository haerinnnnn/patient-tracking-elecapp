const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    
    // THÊM DÒNG NÀY: Khai báo màu nền giống với CSS (màu #f0f4f9)
    backgroundColor: '#f0f4f9', 

    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false 
    }
  });

  win.setMenuBarVisibility(false);
  win.loadFile('login.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});