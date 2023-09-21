const fs = require('fs');
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');

type = "audio"; // video/audio

let filetype = 'mp3';
let quality = 'highestaudio';
if (type == "video") {
    filetype = 'mp4';
    quality = 'highest';
}

const inputFile = 'urls.txt';
if (!fs.existsSync(inputFile)) {
    fs.writeFileSync(inputFile, '', 'utf8');
}

// Diretório onde os vídeos serão salvos
const outputDirectory = './media/';
if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory);
}

function getSafeFileName(title) {
    return title.replace(/[^\p{L}\d\s-]/gu, '').replace(/\s+/g, ' ');
}

async function downloadVideo(url, playlist) {
    playlist = getSafeFileName(playlist);
    playlist = (playlist ? `${playlist}/` : '');

    if (!fs.existsSync(`${outputDirectory}${playlist}`)) {
        fs.mkdirSync(`${outputDirectory}${playlist}`);
    }

    try {
        const title = getSafeFileName(await getVideoTitle(url));
        const outputFilePath = `${outputDirectory}${playlist}${title}.${filetype}`; // Nome do arquivo de saída com o título do vídeo

        console.log(`${title} | ⏳ Baixando vídeo`);

        const stream = ytdl(url, { quality });
        const writeStream = fs.createWriteStream(outputFilePath);

        stream.pipe(writeStream);

        await new Promise((resolve, reject) => {
            stream.on('end', () => {
                console.log(`${title} | ✔️  Download concluído`);
                resolve();
            });

            stream.on('error', (err) => {
                console.error(`${title} | ❌ Erro ao baixar o vídeo:`, err);
                reject(err);
            });
        });
    } catch (err) {
        console.error('Erro durante o download:', err);
    }
}

async function downloadPlaylist(playlistUrl) {
    try {
        const playlistInfo = await ytpl(playlistUrl);
        const videos = playlistInfo.items;
        console.log("📄 Baixando Playlist | " + playlistInfo.title);

        for (const video of videos) {
            const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
            await downloadVideo(videoUrl, playlistInfo.title);
        }
    } catch (err) {
        console.error('Erro ao baixar a lista de reprodução:', err);
    }
}

function getVideoTitle(videoUrl) {
    const videoId = ytdl.getURLVideoID(videoUrl);
    return ytdl.getInfo(videoId).then((info) => {
        return info.videoDetails.title;
    });
}

// Lê o arquivo de texto e inicia o processo de download para cada URL
fs.readFile(inputFile, 'utf8', async (err, data) => {
    if (err) {
        console.error('Erro ao ler o arquivo:', err);
        return;
    }

    const urls = data.trim().split('\r\n');
    for (const url of urls) {
        if (url != '') {
            if (url.includes('list=')) {
                // Se a URL contém "list=", é uma lista de reprodução
                await downloadPlaylist(url);
            } else {
                // Caso contrário, é um vídeo único
                await downloadVideo(url);
            }
        }
    }
    console.log('✅ Downloads concluídos com sucesso!')
});
