const { contextBridge, ipcRenderer } = require("electron");

// Expor APIs específicas ao renderizador
contextBridge.exposeInMainWorld("electronAPI", {
  // SEND
  getClipboard: () => ipcRenderer.send("get-clipboard"),
  validateLink: (url) => ipcRenderer.send("validate-link", url),
  download: (data) => ipcRenderer.send("download", data),

  //ON
  onClipboardResponse: (callback) =>
    ipcRenderer.on("get-clipboard-response", (event, text) => callback(text)),
  onError: (callback) =>
    ipcRenderer.on("error", (event, text) => callback(text)),
  onInfoLink: (callback) =>
    ipcRenderer.on("info-link", (event, data) => callback(data)),
  onDownloaded: (callback) =>
    ipcRenderer.on("downloaded", (event, data) => callback(data)),
});
