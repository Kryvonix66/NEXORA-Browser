const { app, BrowserWindow, ipcMain, session, shell } = require("electron");
const path = require("path");

let mainWindow;
let adBlockEnabled = true;

const blockedHosts = [
  "doubleclick.net", "googlesyndication.com", "googletagmanager.com",
  "google-analytics.com", "adservice.google.com", "adnxs.com",
  "taboola.com", "outbrain.com", "popads.net", "popcash.net",
  "zedo.com", "criteo.com", "scorecardresearch.com"
];

function installAdBlocker() {
  const ses = session.fromPartition("persist:nexora");
  ses.webRequest.onBeforeRequest((details, callback) => {
    if (!adBlockEnabled) return callback({ cancel: false });
    let hostname = "";
    try { hostname = new URL(details.url).hostname.toLowerCase(); } catch {}
    const blocked = blockedHosts.some(host => hostname === host || hostname.endsWith("." + host));
    callback({ cancel: blocked });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 980,
    minHeight: 640,
    backgroundColor: "#090b13",
    title: "NEXORA",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: true
    }
  });
  mainWindow.loadFile(path.join(__dirname, "index.html"));
  mainWindow.on("closed", () => { mainWindow = null; });
}

app.whenReady().then(() => {
  installAdBlocker();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("nexora:external-link", async (_event, url) => {
  try {
    const parsed = new URL(url);
    if (["https:", "http:", "mailto:"].includes(parsed.protocol)) await shell.openExternal(url);
  } catch {}
});

ipcMain.handle("nexora:set-adblock", (_event, enabled) => {
  adBlockEnabled = Boolean(enabled);
  return adBlockEnabled;
});

ipcMain.handle("nexora:get-adblock", () => adBlockEnabled);
