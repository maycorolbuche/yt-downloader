# Instruções

## Instalação do ffmpeg

1. Baixe o `ffmpeg` de [ffmpeg.org](https://ffmpeg.org/download.html).
2. Extraia os arquivos baixados em um diretório de sua escolha, por exemplo `C:\ffmpeg`.
3. Adicione o caminho `C:\ffmpeg\bin` ao PATH do sistema:
   - Abra o Painel de Controle.
   - Vá para Sistema e Segurança > Sistema > Configurações Avançadas do Sistema.
   - Clique em "Variáveis de Ambiente".
   - Em "Variáveis do sistema", encontre a variável `Path`, selecione e clique em "Editar".
   - Adicione `C:\ffmpeg\bin` ao final da lista e clique em "OK".

## YT Downloader

Coloque todas as urls do youtube a serem baixadas dentro do arquivo `urls.txt`,  um embaixo do outro. Em seguida, execute o comando `npm run start` para baixar os vídeos.
