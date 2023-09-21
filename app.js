const fs = require('fs');
const ytdl = require('ytdl-core');

const inputFile = 'urls.txt';
if (!fs.existsSync(inputFile)) {
    fs.writeFileSync(inputFile, '', 'utf8');
}

// Diretório onde os vídeos serão salvos
const outputDirectory = './videos/';
if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory);
}

async function downloadVideo(url) {
    try {
        const title = await getVideoTitle(url);
        const outputFilePath = `${outputDirectory}${title}.mp4`; // Nome do arquivo de saída com o título do vídeo

        console.log(`${title} | ⏳ Baixando vídeo`);

        const stream = ytdl(url, { quality: 'highest' });
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
            await downloadVideo(url);
        }
    }
    console.log('✅ Downloads concluídos com sucesso!')
});
