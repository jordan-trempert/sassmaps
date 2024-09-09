const API_KEY = 'AIzaSyCtfPeFwc_auTwb-Vjw1iXSzWCM_CGyoeI'; // Replace with your actual API key

mapboxgl.accessToken = "pk.eyJ1Ijoic3ViaGFtcHJlZXQiLCJhIjoiY2toY2IwejF1MDdodzJxbWRuZHAweDV6aiJ9.Ys8MP5kVTk5P9V2TDvnuDg";

navigator.geolocation.getCurrentPosition(successLocation, errorLocation, {
    enableHighAccuracy: true
});

let currentAudio = null; // Global variable to track current audio playback
let routeStarted = false; // Flag to track whether the route has started

function successLocation(position) {
    setupMap([position.coords.longitude, position.coords.latitude]);
}

function errorLocation() {
    setupMap([-2.24, 53.48]);
}

function setupMap(center) {
    const map = new mapboxgl.Map({
        container: "map",
        style: "mapbox://styles/mapbox/streets-v11",
        center: center,
        zoom: 15
    });

    const nav = new mapboxgl.NavigationControl();
    map.addControl(nav);

    const directions = new MapboxDirections({
        accessToken: mapboxgl.accessToken
    });

    map.addControl(directions, "top-left");

    // Announce route start
    directions.on('route', function(event) {
        if (!routeStarted) {
            announceRouteStart(event.route[0], directions);
            routeStarted = true; // Set flag to true after the first route is set
        } else {
            announceMissedTurn(); // Handle rerouting due to missed turns
        }
    });

    // Announce directions with sass
    directions.on('step', function(event) {
        announceDirection(event.step);
    });
}

function announceRouteStart(route, directions) {
    const eta = route.duration / 60; // ETA in minutes
    const randomNum = getRandomInt(3);
    let text = "";
    if(randomNum == 0){
        text = "Well, isn’t this just fabulous? You’re all set to start your route! You'll get there in " + `${Math.round(eta)}` + " minutes if you behave and don't act like a bumbling idiot.";
    }
    else if(randomNum == 1){
        text = "Someone finally decided to leave the house and touch grass! You'll arrive in " + `${Math.round(eta)}` + " minutes if you actually listen to me this time.";
    }
    else{
        text = "Not this guy again... You'll arrive in " + `${Math.round(eta)}` + " minutes. Actually, add 5 minutes onto that since we both know you'll miss a turn.";
    }
    fetchGoogleTTS(text);
}

function announceMissedTurn() {
    const randomNum = getRandomInt(3);
    let text = "";
    if(randomNum == 0){
        text = "And there you go! You missed the turn. I saw it coming.";
    }
    else if(randomNum == 1){
        text = "Well, well, well. Guess who wasn’t paying attention? Yeah, that’s you. Turn missed!";
    }
    else{
        text = "Missed the turn? Classic. We’ll be here all day at this rate.";
    }
    fetchGoogleTTS(text);
}

// Announce sassy directions
function announceDirection(step) {
    const direction = step.maneuver.instruction.toLowerCase();
    let text = "";

    if (direction.includes("left")) {
        text = "Alright, genius, take a left here. Try not to miss it, okay?";
    } else if (direction.includes("right")) {
        text = "Take a right up ahead, unless of course you enjoy getting lost.";
    } else if (direction.includes("straight")) {
        text = "Just go straight for once, can’t be that hard, right?";
    } else if (direction.includes("roundabout")) {
        text = "A roundabout. Good luck figuring that one out without screwing up.";
    } else {
        text = "Follow the instructions, simple as that, or just keep wandering aimlessly.";
    }

    fetchGoogleTTS(text);
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function fetchGoogleTTS(text) {
    // Check if current audio is playing, stop it before playing new audio
    if (currentAudio && !currentAudio.paused) {
        currentAudio.pause(); // Stop current playback
        currentAudio = null; // Clear reference
    }

    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`;

    const body = JSON.stringify({
        input: { text: text },
        voice: { languageCode: 'en-US', name: 'en-US-Wavenet-H' }, // Use the specific voice name
        audioConfig: { audioEncoding: 'MP3' }
    });

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: body
    })
    .then(response => response.json())
    .then(data => {
        const audioContent = data.audioContent;
        currentAudio = new Audio(`data:audio/mp3;base64,${audioContent}`);
        currentAudio.play();
    })
    .catch(error => console.error('Error fetching Google TTS:', error));
}
