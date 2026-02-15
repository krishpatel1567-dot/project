
let currentsong = new Audio();
let songs;
let currfolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
}

function formatSongName(track) {
    return decodeURIComponent(track)
        .replace(/^\\+/, "") 
        .replace(/^\/+/, "") 
        .replace(/\.mp3$/i, "") 
        .replace(/^\s+|\s+$/g, "");
}

async function getSongs(folder) {
    currfolder = folder;

    const res = await fetch("/songs/songs.json");
    const data = await res.json();

    const folderName = folder.split("/").pop();
    songs = data[folderName] || [];

    return songs;
}

function setCurrentSong(folder, track) {
    currfolder = folder;

    const cleanTrack = track
        .replace(/\\/g, "")
        .replace(/^.*songs\//, "");

    currentsong.src = `${folder}/${cleanTrack}`;

    currentsong.load();

    document.querySelector(".songinfo").innerText = formatSongName(cleanTrack);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}



function playMusic(track) {
    setCurrentSong(currfolder, track);
    currentsong.play();
    play.src = "img/pause.svg";
}


function renderSongs() {
    let songUL = document.querySelector(".songlist ul");
    songUL.innerHTML = "";
    
    if (!songs || songs.length === 0) {
        songUL.innerHTML = "<li>No songs found</li>";
        return;
    }

    for (const song of songs) {
        songUL.innerHTML += `
            <li data-track="${song}">
                <img src="img/music.svg" class="invert">
                <div class="info">
                    <div>${formatSongName(song)}</div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img src="img/play.svg" class="invert">
                </div>
            </li>`;
    }

    Array.from(songUL.children).forEach(li => {
        li.addEventListener("click", () => {
            
            playMusic(li.dataset.track);
        });
    });
}

async function displayAlbums() {
    const res = await fetch("songs/albums.json");
    const albums = await res.json();

    const cardContainer = document.querySelector(".cardContainer");
    cardContainer.innerHTML = "";

    albums.forEach(album => {
        cardContainer.innerHTML += `
        <div data-folder="${album.folder}" class="card">
            <div class="play">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 20V4L19 12L5 20Z" fill="#000"/>
                </svg>
            </div>
            <img src="songs/${album.folder}/cover.jpg" alt="">
            <h2>${album.title}</h2>
            <p>${album.description}</p>
        </div>`;
    });

    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", async () => {
            songs = await getSongs(`songs/${card.dataset.folder}`);
            renderSongs();
            playMusic(songs[0]);
        });
    });
}


async function main() {

     const defaultFolder = "songs/phonk1";
    const defaultSongs = await getSongs(defaultFolder);

    songs = defaultSongs;
    renderSongs();
    
    setCurrentSong(defaultFolder, songs[0]);

    play.addEventListener("click", () => {
        if (currentsong.paused) {
            currentsong.play();
            play.src = "img/pause.svg";
        } else {
            currentsong.pause();
            play.src = "img/play.svg";
        }
    });


    currentsong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentsong.currentTime)}/${secondsToMinutesSeconds(currentsong.duration)}`;
        document.querySelector(".circle").style.left = (currentsong.currentTime / currentsong.duration) * 100 + "%";
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentsong.currentTime = ((currentsong.duration) * percent) / 100;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    previous.addEventListener("click", () => {
        currentsong.pause();
        let currentFilename = currentsong.src.split("/").pop();
        let index = songs.findIndex(song => currentFilename.includes(song));
        
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1]);
        }
    });

    next.addEventListener("click", () => {
    if (!songs || songs.length === 0) return;

    let currentFilename = decodeURIComponent(currentsong.src.split("/").pop());
    let index = songs.findIndex(song => song === currentFilename);

    if (index !== -1 && index + 1 < songs.length) {
        playMusic(songs[index + 1]);
    }
});


    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        currentsong.volume = parseInt(e.target.value) / 100;
        if(currentsong.volume > 0){
            document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("img/mute.svg", "img/volume.svg");
        }
    });

    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("img/volume.svg")) {
            e.target.src = e.target.src.replace("img/volume.svg", "img/mute.svg");
            currentsong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        } else {
            e.target.src = e.target.src.replace("img/mute.svg", "img/volume.svg");
            currentsong.volume = 0.10;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
        }
    });
}

displayAlbums();
main();