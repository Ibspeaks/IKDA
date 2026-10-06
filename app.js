// ===============================
// IKDA LIVE - Main App Controls
// ===============================

let micOn = false;
let audioOn = true;
let handRaised = false;
let chatOpen = false;

// -------------------------------
// Toast notification
// -------------------------------
function showToast(message) {
    let toast = document.getElementById("ikdaToast");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "ikdaToast";

        toast.style.position = "fixed";
        toast.style.bottom = "25px";
        toast.style.left = "50%";
        toast.style.transform = "translateX(-50%)";
        toast.style.background = "#123c2a";
        toast.style.color = "#fff";
        toast.style.padding = "14px 22px";
        toast.style.borderRadius = "10px";
        toast.style.zIndex = "99999";
        toast.style.boxShadow = "0 8px 25px rgba(0,0,0,.3)";
        toast.style.fontSize = "14px";

        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.display = "block";

    clearTimeout(window.ikdaToastTimer);

    window.ikdaToastTimer = setTimeout(() => {
        toast.style.display = "none";
    }, 2500);
}


// -------------------------------
// Microphone
// -------------------------------
async function toggleMic(button) {

    if (!micOn) {

        try {

            const stream =
                await navigator.mediaDevices.getUserMedia({
                    audio: true
                });

            window.ikdaMicStream = stream;

            micOn = true;

            if (button) {
                button.classList.add("active");
                button.innerHTML = "🎤 Microphone ON";
            }

            showToast("Microphone enabled");

        } catch (error) {

            console.error(error);

            showToast(
                "Microphone permission was denied or unavailable."
            );
        }

    } else {

        if (window.ikdaMicStream) {

            window.ikdaMicStream
                .getTracks()
                .forEach(track => track.stop());

        }

        micOn = false;

        if (button) {
            button.classList.remove("active");
            button.innerHTML = "🎤 Microphone";
        }

        showToast("Microphone muted");
    }
}


// -------------------------------
// Audio
// -------------------------------
function toggleAudio(button) {

    audioOn = !audioOn;

    if (button) {

        if (audioOn) {

            button.classList.add("active");
            button.innerHTML = "🔊 Audio ON";

        } else {

            button.classList.remove("active");
            button.innerHTML = "🔇 Audio OFF";

        }
    }

    showToast(
        audioOn
            ? "Meeting audio enabled"
            : "Meeting audio muted"
    );
}


// -------------------------------
// Raise hand
// -------------------------------
function toggleRaiseHand(button) {

    handRaised = !handRaised;

    if (button) {

        if (handRaised) {

            button.classList.add("active");
            button.innerHTML = "✋ Hand Raised";

            showToast(
                "Your request to speak has been sent"
            );

        } else {

            button.classList.remove("active");
            button.innerHTML = "✋ Raise Hand";

            showToast(
                "Raise-hand request cancelled"
            );
        }
    }
}


// -------------------------------
// Participants
// -------------------------------
function openParticipants() {

    window.location.href = "participants.html";
}


// -------------------------------
// Chat
// -------------------------------
function toggleChat() {

    const chat =
        document.getElementById("chatPanel");

    if (!chat) {

        window.location.href = "meeting.html#chat";

        return;
    }

    chatOpen = !chatOpen;

    if (chatOpen) {

        chat.style.display = "block";

        chat.scrollIntoView({
            behavior: "smooth"
        });

    } else {

        chat.style.display = "none";
    }
}


// -------------------------------
// Leave meeting
// -------------------------------
function leaveMeeting() {

    if (window.ikdaMicStream) {

        window.ikdaMicStream
            .getTracks()
            .forEach(track => track.stop());
    }

    window.location.href = "join.html";
}


// -------------------------------
// Send chat message
// -------------------------------
function sendMessage() {

    const input =
        document.getElementById("chatInput");

    const messages =
        document.getElementById("chatMessages");

    if (!input || !messages) return;

    const message =
        input.value.trim();

    if (!message) return;

    const item =
        document.createElement("div");

    item.style.padding = "10px";
    item.style.marginBottom = "8px";
    item.style.background = "#f1f5f3";
    item.style.borderRadius = "8px";

    item.innerHTML =
        "<strong>You</strong><br>" +
        escapeHTML(message);

    messages.appendChild(item);

    input.value = "";

    messages.scrollTop =
        messages.scrollHeight;
}


// -------------------------------
// Enter key chat
// -------------------------------
function handleChatKey(event) {

    if (event.key === "Enter") {

        sendMessage();
    }
}


// -------------------------------
// Security
// -------------------------------
function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


// -------------------------------
// Request to speak
// -------------------------------
function requestSpeak() {

    handRaised = true;

    showToast(
        "Request sent. Waiting for host approval."
    );

    setTimeout(() => {

        window.location.href =
            "waiting.html";

    }, 800);
}


// -------------------------------
// Host controls
// -------------------------------
function muteEveryone() {

    showToast(
        "All participants have been muted."
    );
}


function removeAllSpeakers() {

    showToast(
        "All speakers have been removed from the stage."
    );
}


function lockMeeting() {

    showToast(
        "Meeting locked. New members cannot join."
    );
}


function unlockMeeting() {

    showToast(
        "Meeting unlocked."
    );
}


// -------------------------------
// Open meeting
// -------------------------------
function openMeeting() {

    window.location.href =
        "meeting.html";
}


// -------------------------------
// End meeting
// -------------------------------
function endMeeting() {

    const confirmed =
        confirm(
            "Are you sure you want to end this meeting?"
        );

    if (!confirmed) return;

    showToast(
        "Meeting ended."
    );

    setTimeout(() => {

        window.location.href =
            "index.html";

    }, 1000);
}


// -------------------------------
// Navigation
// -------------------------------
function goHome() {

    window.location.href =
        "index.html";
}


function goJoin() {

    window.location.href =
        "join.html";
}


function goProfile() {

    window.location.href =
        "profile.html";
}


// -------------------------------
// Page loaded
// -------------------------------
document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "IKDA LIVE app loaded successfully."
        );

    }
);
