console.log("Aplicação Electron iniciada!");

function adjust() {
  const header = document.querySelector("header");
  const footer = document.querySelector("footer");
  document.querySelector(".main").style.cssText = `
        margin-top: ${header.offsetHeight}px;
        margin-bottom: ${footer.offsetHeight}px;
        height: calc(100vh - ${header.offsetHeight + footer.offsetHeight}px);
    `;
}
function showInfoLink() {
  document.querySelector(".info-link").style.display = "block";
  document.getElementById("urlInput").value = "";
  adjust();
}
function hideInfoLink() {
  document.querySelector(".info-link").style.display = "none";
  adjust();
}
function loadLink(bool) {
  if (bool) {
    document.getElementById("loadLinkButton").style.display = "block";
    document.getElementById("pasteButton").style.display = "none";
    document.getElementById("urlInput").disabled = true;
  } else {
    document.getElementById("loadLinkButton").style.display = "none";
    document.getElementById("pasteButton").style.display = "block";
    document.getElementById("urlInput").disabled = false;
  }
}
function videoBar(data) {
  const id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    }
  );
  let title = data.title
    .replace(/["']/g, "")
    .replace(/[^\w\s-.&!áàãâéèêíìîóòõôúùûç]/gi, "");
  let playlist = data.playlist
    .replace(/["']/g, "")
    .replace(/[^\w\s-.&!áàãâéèêíìîóòõôúùûç]/gi, "");
  const html = `
        <div id="${id}"
            class="item-download"
            data-url="${data.url}"
            data-title="${title}"
            data-playlist="${playlist}"
            data-type="${data.type}"
        >
            <div class="cover">
                <img src="${data.thumb}">
            </div>
            <div class="info">
                <span class="video-playlist">
                    ${data.playlist}
                </span>
                <a href="${data.url}" target="_blank" class="video-title">
                    ${data.title}
                </a>
                <div style="padding-bottom:3px;">
                    <span class="badge">
                        ${data.type == "mp4" ? "Vídeo [mp4]" : "Áudio [mp3]"}
                    </span>
                    <span class="right msg-info-download">Aguardando...</span>
                </div>
                <!--
                <div class="progress">
                    <div class="progress-value" style="width:40%"></div>
                </div>
                -->
            </div>
            <div class="buttons">
                <button class="svg danger btClose" onclick="closeItem('${id}')">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <title>Cancelar</title>
                        <path
                            d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                    </svg>
                </button>
                <button class="svg spinner btWait">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <title>loading</title>
                        <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
                    </svg>
                </button>
                <button class="svg btSuccess" onclick="closeItem('${id}')">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <title>check-bold</title>
                        <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                    </svg>
                </button>
            </div>
        </div>`;
  return html;
}

function download() {
  const downloading = document.querySelector(".item-download.downloading");
  if (downloading) return;

  const item = document.querySelector(
    ".item-download:not(.success):not(.error):not(.downloading):not(.started)"
  );
  if (!item) return;

  item.classList.add("downloading");

  const data = {
    id: item.id,
    url: item.getAttribute("data-url"),
    title: item.getAttribute("data-title"),
    playlist: item.getAttribute("data-playlist"),
    type: item.getAttribute("data-type"),
  };
  console.log(data);
  window.electronAPI.download(data);
}

function closeItem(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}
adjust();
window.electronAPI.getDirectory();
window.electronAPI.getVersion();
var item = null;

/* ***************************************************************************************** */

document.getElementById("pasteButton").addEventListener("click", () => {
  window.electronAPI.getClipboard();
});

document
  .getElementById("changeDirectoryButton")
  .addEventListener("click", () => {
    window.electronAPI.changeDirectory();
  });
document.getElementById("openDirectoryButton").addEventListener("click", () => {
  window.electronAPI.openDirectory();
});

document
  .getElementById("downloadButton")
  .addEventListener("click", async () => {
    let type = Array.from(document.getElementsByName("radio-list")).find(
      (radio) => radio.checked
    ).value;

    const formatMedia = document.getElementById("formatMedia").value;

    document.getElementById("loading").style.display = "block";
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (type == "V") {
      document.getElementById("videoList").innerHTML += videoBar({
        thumb: item.videoDetails.thumbnails[0].url,
        title: item.videoDetails.title,
        playlist: "",
        url: item.videoDetails.video_url,
        type: formatMedia,
      });
    } else {
      let playlistTitle = item.playlist.title;
      item.playlist.items.forEach((video) => {
        document.getElementById("videoList").innerHTML += videoBar({
          thumb: video.thumbnails[0].url,
          title: video.title,
          playlist: playlistTitle,
          url: video.url,
          type: formatMedia,
        });
      });
    }

    document.getElementById("loading").style.display = "none";
    hideInfoLink();
    download();
  });

document.getElementById("urlInput").addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    document.getElementById("urlInput").blur();
  }
});

document.getElementById("urlInput").addEventListener("blur", () => {
  window.electronAPI.validateLink(document.getElementById("urlInput").value);
  hideInfoLink();
  loadLink(true);
});

/* ***************************************************************************************** */

window.electronAPI.onError((error) => {
  alert("error: " + error);
  loadLink(false);
});

window.electronAPI.onClipboardResponse((clipboardText) => {
  document.getElementById("urlInput").focus();
  document.getElementById("urlInput").value = clipboardText;
  document.getElementById("urlInput").blur();
});
window.electronAPI.onDirectoryResponse((dir) => {
  document.getElementById("directoryInfo").innerHTML = dir;
});
window.electronAPI.onVersionResponse((ver) => {
  document.getElementById("version").innerHTML = ver;
});
window.electronAPI.onDownloaded((data) => {
  console.log(data);
  let item = document.getElementById(data.id);

  if (data.status == "downloading") {
    item.classList.add("started");
    item.querySelector(".msg-info-download").innerHTML = data.current;
  } else if (data.status == "success") {
    item.classList.remove("started");
    item.classList.remove("downloading");
    item.classList.add("success");
    download();
  } else if (data.status == "error") {
    item.classList.remove("started");
    item.classList.remove("downloading");
    item.classList.add("error");
    item.querySelector(".msg-info-download").innerHTML = data.error;
    download();
  }
});

window.electronAPI.onInfoLink((data) => {
  item = data;
  document.getElementById("infoThumbnail").src =
    data.videoDetails.thumbnails[0].url;
  document.getElementById("infoTitle").innerHTML = data.videoDetails.title;
  document
    .getElementById("infoTitle")
    .setAttribute("href", data.videoDetails.video_url);
  document.getElementById("infoChannel").innerHTML =
    data.videoDetails.ownerChannelName;

  if (data.playlist) {
    document.getElementById("radioListP").disabled = false;
    document.getElementById("radioListP").checked = true;
  } else {
    document.getElementById("radioListV").checked = true;
    document.getElementById("radioListP").disabled = true;
  }
  showInfoLink();
  loadLink(false);
});
