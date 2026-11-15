const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("nexora", {
  openExternal: (url) => ipcRenderer.invoke("nexora:external-link", url),
  setAdBlock: (enabled) => ipcRenderer.invoke("nexora:set-adblock", enabled),
  getAdBlock: () => ipcRenderer.invoke("nexora:get-adblock")
});
