const { app, BrowserWindow, ipcMain, clipboard } = require("electron");
const ytdl = require("ytdl-core");
const ytpl = require("ytpl");
const path = require("path");
const fs = require("fs");

let mainWindow;

function saveDirectory(value) {
  const tempDir = require("os").tmpdir();
  const filePath = path.join(tempDir, "yt-downloader.json");
  console.log("Salvo em", filePath);
  fs.writeFileSync(filePath, JSON.stringify({ dir: value }));
}
function readDirectory() {
  const tempDir = require("os").tmpdir();
  const filePath = path.join(tempDir, "yt-downloader.json");
  try {
    const data = fs.readFileSync(filePath);
    return path.join(JSON.parse(data).dir);
  } catch (error) {
    return path.join(app.getAppPath(), "media");
  }
}

app.on("ready", () => {
  mainWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    autoHideMenuBar: true,
    icon: path.join(__dirname, "assets/icon.png"),
  });
  mainWindow.maximize();
  mainWindow.show();

  mainWindow.loadFile("home.html");

  // Capturar o evento F12
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.type === "keyDown" && input.key === "F12") {
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools();
      } else {
        mainWindow.webContents.openDevTools();
      }
    }
  });

  // Capturar eventos
  ipcMain.on("get-clipboard", (event) => {
    try {
      const text = clipboard.readText();
      event.reply("get-clipboard-response", text);
    } catch (err) {
      console.log("Erro", err);
    }
  });
  ipcMain.on("get-directory", (event) => {
    try {
      event.reply("get-directory-response", readDirectory());
    } catch (err) {
      console.log("Erro", err);
    }
  });
  ipcMain.on("get-version", (event) => {
    try {
      const packageJson = require("./package.json");
      event.reply("get-version-response", packageJson.version);
    } catch (err) {
      console.log("Erro", err);
    }
  });
  ipcMain.on("change-directory", (event) => {
    try {
      const dialog = require("node-file-dialog");
      const config = { type: "directory" };
      dialog(config)
        .then((dir) => {
          saveDirectory(dir[0]);
          event.reply("get-directory-response", readDirectory());
        })
        .catch((err) => console.log(err));
    } catch (err) {
      console.log("Erro", err);
    }
  });
  ipcMain.on("open-directory", (event) => {
    try {
      require("child_process").exec(`explorer "${readDirectory()}"`);
    } catch (err) {
      console.log("Erro", err);
    }
  });
  ipcMain.on("validate-link", async (event, url) => {
    url = url.trim();
    if (url !== "") {
      try {
        new URL(url);
      } catch (err) {
        event.reply("error", `"${url}" não é uma url válida!`);
        return;
      }

      if (!url.includes("youtube.com") && !url.includes("youtu.be")) {
        event.reply("error", `"${url}" não é uma url do YouTube!`);
        return;
      }

      let info = {};
      let playlistInfo = null;

      try {
        info = await ytdl.getInfo(url);
      } catch (err) {}
      try {
        playlistInfo = await ytpl(url);
      } catch (err) {}
      event.reply("info-link", { ...info, playlist: playlistInfo });
    }
  });
  ipcMain.on("download", async (event, data) => {
    try {
      console.log("🎞️  Baixando conteúdo", data);

      let ext = "";
      if (data.type == "mp4") {
        ext = "mp4";
      } else {
        ext = "mp3";
      }

      let file = `${data.title}.${ext}`;
      if (data.playlist) {
        file = path.join(data.playlist, file);
      }
      const output = path.join(readDirectory(), file);
      const dir = path.dirname(output);
      if (!fs.existsSync(dir)) {
        console.log("Criando diretorio", dir);
        fs.mkdirSync(dir, { recursive: true });
      }

      console.log(`🎥 Baixando arquivo de vídeo`);
      let downloaded = 0;

      let params = {};
      if (data.type == "mp4") {
        params = {
          filter: "videoandaudio",
          quality: "highest",
        };
      } else {
        params = {
          filter: "audioonly",
          quality: "highest",
        };
      }

      await new Promise((resolve, reject) => {
        const videoStream = ytdl(data.url, params);
        const videoWriteStream = fs.createWriteStream(output);

        videoStream.pipe(videoWriteStream);

        videoStream.on("data", (chunk) => {
          downloaded += chunk.length;

          event.reply("downloaded", {
            ...data,
            current: (downloaded / (1024 * 1024)).toFixed(2) + " MB",
            status: "downloading",
          });
        });

        videoWriteStream.on("finish", resolve);
        videoWriteStream.on("error", reject);
      });

      const stats = fs.statSync(output);
      event.reply("downloaded", {
        ...data,
        current: (downloaded / (1024 * 1024)).toFixed(2) + " MB",
        status: "success",
      });
    } catch (err) {
      event.reply("downloaded", {
        ...data,
        error: err.message,
        status: "error",
      });
      console.error("Erro durante o download:", err);
    }
  });
});
