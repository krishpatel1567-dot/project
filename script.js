
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
        .replace(/^\\+/, "") // remove leading backslashes
        .replace(/^\/+/, "") // remove leading slashes
        .replace(/\.mp3$/i, "") // remove extension
        .replace(/^\s+|\s+$/g, ""); // trim
}

async function getSongs(folder) {
    currfolder = folder;
    let res = await fetch(`${folder}/`); 
    
    let html = await res.text();
    let div = document.createElement("div");
    div.innerHTML = html;
    let links = div.getElementsByTagName("a");
    songs = [];
    
    for (let link of links) {
        if (link.href.endsWith(".mp3")) {
            // FIX: Split by BOTH / and \ to handle Windows paths correctly
            // This ensures we get JUST the filename "song.mp3" and not "songs\phonk1\song.mp3"
            let fileName = decodeURIComponent(link.href)
    .split(/[/\\]/)
    .pop();

songs.push(fileName);

        }
    }
    return songs;
}

function setCurrentSong(folder, track) {
    currfolder = folder;

    const cleanTrack = track
        .replace(/\\/g, "")
        .replace(/^.*songs\//, "");

    currentsong.src = `/${folder}/${cleanTrack}`;
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
    let a = await fetch(`/songs/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");
    
    let array = Array.from(anchors);
    
    // Clear container
    cardContainer.innerHTML = ""; 

    for (let index = 0; index < array.length; index++) {
        const e = array[index];
        let href = e.getAttribute("href");

        // Skip non-folders
        if (href === "/" || href.startsWith("..") || href.includes(".htaccess")) {
            continue;
        }

        // FIX: Remove all slashes and backslashes to get clean folder name
        let folder = href.replaceAll("%5C","/").split("/")[2];

        if(folder) {
             try {
                let a = await fetch(`/songs/${folder}/info.json`);
                if(!a.ok) throw new Error("info.json missing");
                
                let response = await a.json();
                
                cardContainer.innerHTML = cardContainer.innerHTML + ` 
                <div data-folder="${folder}" class="card">
                    <div class="play">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                                stroke-linejoin="round" />
                        </svg>
                    </div>
                    <img src="/songs/${folder}/cover.jpg" alt="">
                    <h2>${response.title}</h2>
                    <p>${response.description}</p>
                </div>`;
            } catch (error) {
                console.log("Skipping folder (no info.json):", folder);
            }
        }
    }

    // Attach Event Listeners to Cards
    Array.from(document.getElementsByClassName("card")).forEach(card => {
        card.addEventListener("click", async (e) => {
            const folder = e.currentTarget.dataset.folder;
            // Standardize path usage
            songs = await getSongs(`songs/${folder}`);
            playMusic(songs[0]); 
            renderSongs();
        });
    });
}

async function main() {

     const defaultFolder = "songs/phonk1";
    const defaultSongs = await getSongs(defaultFolder);

    songs = defaultSongs;
    renderSongs();
    
     // JUST SET IT
    setCurrentSong(defaultFolder, songs[0]);

    // play button controls playback
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
        currentsong.pause();
        let currentFilename = currentsong.src.split("/").pop();
        let index = songs.findIndex(song => currentFilename.includes(song));

        if ((index + 1) < songs.length) {
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

// Start
displayAlbums();
main();