let currentsong = new Audio()
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
        .replace(/^\\+/, "")          // remove leading backslashes
        .replace(/^\/+/, "")          // remove leading slashes (just in case)
        .replace(/\.mp3$/i, "")       // remove extension
        .replace(/^\s+|\s+$/g, "");   // trim
}

async function getSongs(folder) {

     let res = await fetch(`${folder}`);
    let html = await res.text();

    let div = document.createElement("div");
    div.innerHTML = html;

    let links = div.getElementsByTagName("a");
    let songs = [];

    for (let link of links) {
        if (link.href.endsWith(".mp3")) {
            const filename = decodeURIComponent(link.href.split("/").pop());
            songs.push(filename);
        }
    }
    return songs;
}



const playMusic = (track) => {
    if (!track) return;

    currentsong.src = `songs/${currfolder}/${encodeURIComponent(track)}`;
    // currentsong.play();

    document.querySelector(".songinfo").innerText =formatSongName(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

function renderSongs() {
    let songUL = document.querySelector(".songlist ul");
    songUL.innerHTML = "";

    for (const song of songs) {
        songUL.innerHTML += `
            <li data-track="${song}">
                <img src="music.svg" class="invert">
                <div class="info">
                    <div>${formatSongName(song)}</div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img src="play.svg" class="invert">
                </div>
            </li>`;
    }

    Array.from(songUL.children).forEach(li => {
        li.addEventListener("click", () => {
            playMusic(li.dataset.track);
            play.src = "pause.svg";
        });
    });
}

async function displayAlbums() {
    let a = await fetch(`/songs/`)
    let response = await a.text();
    let div = document.createElement("div")
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a")
    
    let array = Array.from(anchors)
    for (let index = 1; index < array.length; index++) {
        const e = array[index];
        
            let folder = e.href.split("/").slice(-2)[0]
            
            let a = await fetch(`/${folder}/info.json`)
            let response = await a.json();
            let cardContainer = document.querySelector(".cardContainer")
            cardContainer.innerHTML = cardContainer.innerHTML + ` <div data-folder="${folder}" class="card">
            <div class="play">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                        stroke-linejoin="round" />
                </svg>
            </div>

            <img src="/${folder}/cover.jpg" alt="">
            <h2>${response.title}</h2>
            <p>${response.description}</p>
        </div>`
        
        }
    }

    // Load the playlist whenever card is clicked
    Array.from(document.getElementsByClassName("card")).forEach(card => {
    card.addEventListener("click", async (e) => {
        const folder = e.currentTarget.dataset.folder;

        currfolder = `songs/${folder}`;
        songs = await getSongs(`songs/${folder}`);
        renderSongs();
        playMusic(songs[0]);
    });
});



async function main() {

     let a = await fetch(`/songs/`)
    let response = await a.text();
    let div = document.createElement("div")
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a")
    
    let array = Array.from(anchors)
    for (let index = 1; index < array.length; index++) {
        const e = array[index];
        
            let folder = e.href.split("/").slice(-2)[0]

    currfolder=`songs/${folder}`
    songs = await getSongs(`songs/${folder}`);
    renderSongs();
    playMusic(songs[0], true)}

    play.addEventListener("click", () => {
        if (currentsong.paused) {
            currentsong.play()
            play.src = "pause.svg"
        } else {
            currentsong.pause()
            play.src = "play.svg"
        }
    })
    currentsong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentsong.currentTime)}/${secondsToMinutesSeconds(currentsong.duration)}`
        document.querySelector(".circle").style.left = currentsong.currentTime * 100 / currentsong.duration + "%"


        document.querySelector(".seekbar").addEventListener("click", e => {
            let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
            document.querySelector(".circle").style.left = percent + "%";
            currentsong.currentTime = ((currentsong.duration) * percent) / 100
        })
    })

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0"
    })
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%"
    })

    previous.addEventListener("click", () => {
        currentsong.pause()
        let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0])
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1])
        }
    })

    next.addEventListener("click", () => {
        currentsong.pause()
        let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0])
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1])
        }
    })

    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        currentsong.volume = parseInt(e.target.value) / 100
    })

    Array.from(document.getElementsByClassName("card")).forEach(card => {
        card.addEventListener("click", async (e) => {
            const folder = e.currentTarget.dataset.folder;

            songs = await getSongs(`songs/${folder}`);
            renderSongs();  
        });
    });
    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg")
            currentsong.volume = 0
            document.querySelector(".range").getElementsByTagName("input")[0] = 0
        } else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg")
            currentsong.volume = .10
            document.querySelector(".range").getElementsByTagName("input")[0] = 10
        }
    })

    

}
displayAlbums()
main()