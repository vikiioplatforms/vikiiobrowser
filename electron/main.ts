import { app, BrowserWindow, ipcMain, session, webContents } from 'electron'
import path from 'path'

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0f1117',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      sandbox: false,
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Window control IPC
  ipcMain.on('window-minimize', () => win.minimize())
  ipcMain.on('window-maximize', () => {
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
  })
  ipcMain.on('window-close', () => win.close())

  // Privacy: block trackers/ads via session filter
  session.defaultSession.webRequest.onBeforeRequest(
    { urls: ['<all_urls>'] },
    (details, callback) => {
      const url = details.url
      const blocked = isTrackerOrAd(url)
      callback({ cancel: blocked })
    }
  )
}

// Basic tracker/ad blocking list
const BLOCK_PATTERNS = [
  /doubleclick\.net/,
  /googlesyndication\.com/,
  /googletagmanager\.com/,
  /google-analytics\.com/,
  /analytics\.google\.com/,
  /facebook\.com\/tr/,
  /connect\.facebook\.net/,
  /scorecardresearch\.com/,
  /quantserve\.com/,
  /outbrain\.com/,
  /taboola\.com/,
  /adnxs\.com/,
  /ads\.twitter\.com/,
  /static\.ads-twitter\.com/,
  /pixel\.advertising\.com/,
  /tracking\./,
  /tracker\./,
  /telemetry\./,
  /analytics\./,
]

function isTrackerOrAd(url: string): boolean {
  return BLOCK_PATTERNS.some((p) => p.test(url))
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
