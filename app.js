const fs = require("fs");
const ytdl = require("ytdl-core");
const ytpl = require("ytpl");

const inputFile = "urls.txt";
if (!fs.existsSync(inputFile)) {
  fs.writeFileSync(inputFile, "", "utf8");
}

// Diretório onde os vídeos serão salvos
const outputDirectory = "./media/";
if (!fs.existsSync(outputDirectory)) {
  fs.mkdirSync(outputDirectory);
}

function getSafeFileName(title) {
  if (title) {
    return title.replace(/[^\p{L}\d\s-]/gu, "").replace(/\s+/g, " ");
  }
  return title;
}

async function downloadVideo(url, playlist) {
  let downloaded;

  playlist = getSafeFileName(playlist);
  playlist = playlist ? `${playlist}/` : "";

  if (!fs.existsSync(`${outputDirectory}${playlist}`)) {
    fs.mkdirSync(`${outputDirectory}${playlist}`);
  }

  try {
    const info = await ytdl.getInfo(url);
    const title = getSafeFileName(info.videoDetails.title);
    console.log(
      "================================================================="
    );
    console.log("🎞️  Baixando conteúdo | " + title);

    const output = `${outputDirectory}${playlist}${title}.mp4`; // Arquivo final

    console.log(`🎥 Baixando arquivo de vídeo`);
    downloaded = 0;

    await new Promise((resolve, reject) => {
      const videoStream = ytdl(url, {
        filter: "videoandaudio",
        quality: "highest",
      });
      const videoWriteStream = fs.createWriteStream(output);

      videoStream.pipe(videoWriteStream);

      videoStream.on("data", (chunk) => {
        downloaded += chunk.length;

        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(
          `⏳ Baixando: ${(downloaded / (1024 * 1024)).toFixed(2)} MB`
        );
      });

      videoWriteStream.on("finish", resolve);
      videoWriteStream.on("error", reject);
    });

    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    console.log(`✔️  Baixado: ${(downloaded / (1024 * 1024)).toFixed(2)} MB`);
  } catch (err) {
    console.error("Erro durante o download:", err);
  }
}

async function downloadPlaylist(playlistUrl) {
  try {
    let nextPageToken = null;

    do {
      const playlistInfo = await ytpl(playlistUrl, {
        pages: Infinity,
        limit: 100,
        nextpageRef: nextPageToken,
      });
      const videos = playlistInfo.items;
      console.log(
        "================================================================="
      );
      console.log("📄 Baixando Playlist | " + playlistInfo.title);

      if (playlistInfo.isMixed) {
        console.log(
          "Esta é uma lista de reprodução automática do YouTube (mix). Não é suportada."
        );
        return;
      }

      for (const video of videos) {
        const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
        await downloadVideo(videoUrl, playlistInfo.title);
      }

      nextPageToken = playlistInfo.nextPageToken;
    } while (nextPageToken);
  } catch (err) {
    console.error("Erro ao baixar a lista de reprodução:", err);
  }
}

function getVideoTitle(videoUrl) {
  const videoId = ytdl.getURLVideoID(videoUrl);
  return ytdl.getInfo(videoId).then((info) => {
    return info.videoDetails.title;
  });
}

// Lê o arquivo de texto e inicia o processo de download para cada URL
fs.readFile(inputFile, "utf8", async (err, data) => {
  if (err) {
    console.error("Erro ao ler o arquivo:", err);
    return;
  }

  const urls = data.trim().split("\r\n");
  for (const url of urls) {
    if (url != "") {
      if (url.includes("list=")) {
        // Se a URL contém "list=", é uma lista de reprodução
        await downloadPlaylist(url);
      } else {
        // Caso contrário, é um vídeo único
        await downloadVideo(url);
      }
    }
  }
  console.log("✅ Downloads concluídos com sucesso!");
});
