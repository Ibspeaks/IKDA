// =====================================================
// IKDA LIVE - MEETING SIGNALING
// Supabase + WebRTC Audio
// =====================================================

const SUPABASE_URL =
  "https://dvskuudjamineqbvvjld.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_r8v8E93qy_DpvNhL9pvyKQ_HZBLaBm5";

// -----------------------------------------------------
// MEETING INFORMATION
// -----------------------------------------------------

const urlParams =
  new URLSearchParams(window.location.search);

const ROOM_ID =
  urlParams.get("room") ||
  localStorage.getItem("ikdaMeetingCode") ||
  "IKDA";

const USER_NAME =
  localStorage.getItem("ikdaParticipantName") ||
  "Participant";

const PARTICIPANT_ID =
  crypto.randomUUID();


// -----------------------------------------------------
// WEBRTC
// -----------------------------------------------------

let localStream = null;

let peerConnections = {};

let microphoneEnabled = false;


// STUN servers help phones discover their network paths.

const rtcConfig = {

  iceServers: [

    {
      urls: "stun:stun.l.google.com:19302"
    },

    {
      urls: "stun:stun1.l.google.com:19302"
    }

  ]

};


// -----------------------------------------------------
// SUPABASE REST HELPER
// -----------------------------------------------------

async function supabaseRequest(
  table,
  method = "GET",
  body = null,
  query = ""
) {

  const url =
    SUPABASE_URL +
    "/rest/v1/" +
    table +
    query;


  const options = {

    method: method,

    headers: {

      "apikey": SUPABASE_KEY,

      "Authorization":
        "Bearer " + SUPABASE_KEY,

      "Content-Type":
        "application/json",

      "Prefer":
        "return=representation"

    }

  };


  if (body !== null) {

    options.body =
      JSON.stringify(body);

  }


  const response =
    await fetch(
      url,
      options
    );


  if (!response.ok) {

    const errorText =
      await response.text();

    throw new Error(
      errorText
    );

  }


  const text =
    await response.text();


  if (!text) {

    return [];

  }


  return JSON.parse(text);

}


// -----------------------------------------------------
// START MICROPHONE
// -----------------------------------------------------

async function startIKDAMicrophone() {

  try {

    localStream =
      await navigator.mediaDevices
        .getUserMedia({

          audio: {

            echoCancellation: true,

            noiseSuppression: true,

            autoGainControl: true

          },

          video: false

        });


    microphoneEnabled = true;


    console.log(
      "IKDA microphone connected"
    );


    updateIKDAMicrophoneButton();


  } catch (error) {

    console.error(
      "Microphone error:",
      error
    );


    alert(
      "Please allow microphone permission to speak in the IKDA Live meeting."
    );

  }

}


// -----------------------------------------------------
// MICROPHONE BUTTON
// -----------------------------------------------------

function toggleIKDAMicrophone() {

  if (!localStream) {

    startIKDAMicrophone();

    return;

  }


  const tracks =
    localStream.getAudioTracks();


  microphoneEnabled =
    !microphoneEnabled;


  tracks.forEach(
    track => {

      track.enabled =
        microphoneEnabled;

    }
  );


  updateIKDAMicrophoneButton();

}


// -----------------------------------------------------
// UPDATE BUTTON
// -----------------------------------------------------

function updateIKDAMicrophoneButton() {

  const button =
    document.getElementById(
      "micButton"
    );


  if (!button) {

    return;

  }


  if (microphoneEnabled) {

    button.innerText =
      "🎤 Mute Microphone";

    button.className =
      "mic";

  } else {

    button.innerText =
      "🔇 Unmute Microphone";

    button.className =
      "muted";

  }

}


// -----------------------------------------------------
// CREATE PEER CONNECTION
// -----------------------------------------------------

function createIKDAPeer(
  remoteParticipantId
) {

  if (
    peerConnections[
      remoteParticipantId
    ]
  ) {

    return peerConnections[
      remoteParticipantId
    ];

  }


  const peer =
    new RTCPeerConnection(
      rtcConfig
    );


  // Add our microphone.

  if (localStream) {

    localStream
      .getTracks()
      .forEach(
        track => {

          peer.addTrack(
            track,
            localStream
          );

        }
      );

  }


  // ---------------------------------------------------
  // RECEIVE REMOTE AUDIO
  // ---------------------------------------------------

  peer.ontrack =
    function(event) {

      let audio =
        document.getElementById(
          "remote-" +
          remoteParticipantId
        );


      if (!audio) {

        audio =
          document.createElement(
            "audio"
          );

        audio.id =
          "remote-" +
          remoteParticipantId;

        audio.autoplay = true;

        audio.playsInline = true;


        document.body
          .appendChild(audio);

      }


      audio.srcObject =
        event.streams[0];

    };


  // ---------------------------------------------------
  // ICE CANDIDATES
  // ---------------------------------------------------

  peer.onicecandidate =
    async function(event) {

      if (!event.candidate) {

        return;

      }


      await sendSignal({

        target:
          remoteParticipantId,

        type:
          "ice",

        data:
          event.candidate

      });

    };


  peerConnections[
    remoteParticipantId
  ] = peer;


  return peer;

}


// -----------------------------------------------------
// SEND SIGNAL
// -----------------------------------------------------

async function sendSignal(signal) {

  try {

    await supabaseRequest(

      "ikda_signals",

      "POST",

      {

        room_id:
          ROOM_ID,

        sender_id:
          PARTICIPANT_ID,

        target_id:
          signal.target,

        signal_type:
          signal.type,

        signal_data:
          signal.data

      }

    );

  } catch (error) {

    console.error(
      "Signal error:",
      error
    );

  }

}


// -----------------------------------------------------
// CREATE OFFER
// -----------------------------------------------------

async function createOffer(
  remoteParticipantId
) {

  const peer =
    createIKDAPeer(
      remoteParticipantId
    );


  const offer =
    await peer.createOffer();


  await peer.setLocalDescription(
    offer
  );


  await sendSignal({

    target:
      remoteParticipantId,

    type:
      "offer",

    data:
      offer

  });

}


// -----------------------------------------------------
// HANDLE OFFER
// -----------------------------------------------------

async function handleOffer(
  signal
) {

  const sender =
    signal.sender_id;


  const peer =
    createIKDAPeer(
      sender
    );


  await peer.setRemoteDescription(

    new RTCSessionDescription(
      signal.signal_data
    )

  );


  const answer =
    await peer.createAnswer();


  await peer.setLocalDescription(
    answer
  );


  await sendSignal({

    target:
      sender,

    type:
      "answer",

    data:
      answer

  });

}


// -----------------------------------------------------
// HANDLE ANSWER
// -----------------------------------------------------

async function handleAnswer(
  signal
) {

  const peer =
    peerConnections[
      signal.sender_id
    ];


  if (!peer) {

    return;

  }


  await peer.setRemoteDescription(

    new RTCSessionDescription(
      signal.signal_data
    )

  );

}


// -----------------------------------------------------
// HANDLE ICE
// -----------------------------------------------------

async function handleICE(
  signal
) {

  const peer =
    peerConnections[
      signal.sender_id
    ];


  if (!peer) {

    return;

  }


  try {

    await peer.addIceCandidate(

      new RTCIceCandidate(
        signal.signal_data
      )

    );

  } catch (error) {

    console.error(
      "ICE error:",
      error
    );

  }

}


// -----------------------------------------------------
// PROCESS SIGNAL
// -----------------------------------------------------

async function processSignal(
  signal
) {

  if (
    signal.sender_id ===
    PARTICIPANT_ID
  ) {

    return;

  }


  if (
    signal.target_id &&
    signal.target_id !==
    PARTICIPANT_ID
  ) {

    return;

  }


  if (
    signal.signal_type ===
    "offer"
  ) {

    await handleOffer(
      signal
    );

  }


  else if (
    signal.signal_type ===
    "answer"
  ) {

    await handleAnswer(
      signal
    );

  }


  else if (
    signal.signal_type ===
    "ice"
  ) {

    await handleICE(
      signal
    );

  }

}


// -----------------------------------------------------
// CHECK FOR SIGNALS
// -----------------------------------------------------

let lastSignalTime =
  new Date().toISOString();


async function checkSignals() {

  try {

    const signals =
      await supabaseRequest(

        "ikda_signals",

        "GET",

        null,

        "?room_id=eq." +
        encodeURIComponent(
          ROOM_ID
        ) +
        "&created_at=gt." +
        encodeURIComponent(
          lastSignalTime
        ) +
        "&order=created_at.asc"

      );


    for (
      const signal of signals
    ) {

      await processSignal(
        signal
      );


      if (
        signal.created_at >
        lastSignalTime
      ) {

        lastSignalTime =
          signal.created_at;

      }

    }

  } catch (error) {

    console.error(
      "Signal checking error:",
      error
    );

  }

}


// -----------------------------------------------------
// REGISTER PARTICIPANT
// -----------------------------------------------------

async function registerParticipant() {

  try {

    await supabaseRequest(

      "ikda_participants",

      "POST",

      {

        room_id:
          ROOM_ID,

        participant_id:
          PARTICIPANT_ID,

        participant_name:
          USER_NAME,

        online:
          true

      }

    );


    console.log(
      "Participant registered"
    );


  } catch (error) {

    console.error(
      "Participant registration error:",
      error
    );

  }

}


// -----------------------------------------------------
// GET OTHER PARTICIPANTS
// -----------------------------------------------------

async function connectToExistingParticipants() {

  try {

    const participants =
      await supabaseRequest(

        "ikda_participants",

        "GET",

        null,

        "?room_id=eq." +
        encodeURIComponent(
          ROOM_ID
        ) +
        "&online=eq.true"

      );


    for (
      const participant
      of participants
    ) {

      if (
        participant.participant_id ===
        PARTICIPANT_ID
      ) {

        continue;

      }


      /*
       Only one side should create
       the initial offer.

       Using participant ID ordering
       prevents both phones from
       creating offers at once.
      */

      if (
        PARTICIPANT_ID <
        participant.participant_id
      ) {

        await createOffer(
          participant.participant_id
        );

      }

    }

  } catch (error) {

    console.error(
      "Participant lookup error:",
      error
    );

  }

}


// -----------------------------------------------------
// MARK PARTICIPANT OFFLINE
// -----------------------------------------------------

async function leaveIKDAMeeting() {

  try {

    await supabaseRequest(

      "ikda_participants",

      "PATCH",

      {

        online:
          false

      },

      "?participant_id=eq." +
      encodeURIComponent(
        PARTICIPANT_ID
      )

    );

  } catch (error) {

    console.error(
      "Leaving meeting error:",
      error
    );

  }


  if (localStream) {

    localStream
      .getTracks()
      .forEach(
        track =>
          track.stop()
      );

  }


  Object.values(
    peerConnections
  ).forEach(
    peer =>
      peer.close()
  );


  peerConnections = {};


  window.location.href =
    "index.html";

}


// -----------------------------------------------------
// START IKDA LIVE
// -----------------------------------------------------

async function startIKDALive() {

  console.log(
    "Starting IKDA Live..."
  );


  await startIKDAMicrophone();


  await registerParticipant();


  /*
   Give Supabase a moment to register
   the participant before discovering
   other participants.
  */

  setTimeout(

    async function() {

      await connectToExistingParticipants();

    },

    1000

  );


  /*
   Keep checking for WebRTC signals.
  */

  setInterval(

    checkSignals,

    700

  );

}


// -----------------------------------------------------
// PAGE EVENTS
// -----------------------------------------------------

document.addEventListener(
  "DOMContentLoaded",
  function() {

    startIKDALive();

  }
);


// -----------------------------------------------------
// MAKE FUNCTIONS AVAILABLE TO meeting.html
// -----------------------------------------------------

window.toggleIKDAMicrophone =
  toggleIKDAMicrophone;

window.leaveIKDAMeeting =
  leaveIKDAMeeting;
