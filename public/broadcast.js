const peerConnections = {};
const config = {
  iceServers: [
    { 
      "urls": "stun:stun.l.google.com:19302",
    },
    // { 
    //   "urls": "turn:TURN_IP?transport=tcp",
    //   "username": "TURN_USERNAME",
    //   "credential": "TURN_CREDENTIALS"
    // }
  ]
};

const socket = io.connect(window.location.origin);

socket.on("answer", (id, description) => {
  peerConnections[id].setRemoteDescription(description);
});

socket.on("watcher", id => {
  const peerConnection = new RTCPeerConnection(config);
  peerConnections[id] = peerConnection;

  // let stream = videoElement.srcObject;
  // console.log("WATCHER")
  // console.log(videoSelect.value)
  // console.log(stream)

  let stream = canvas.captureStream();
  stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("candidate", id, event.candidate);
    }
  };

  peerConnection
    .createOffer()
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(() => {
      socket.emit("offer", id, peerConnection.localDescription);
    });
});

socket.on("candidate", (id, candidate) => {
  peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on("disconnectPeer", id => {
  peerConnections[id].close();
  delete peerConnections[id];
});

window.onunload = window.onbeforeunload = () => {
  socket.close();
};

// Get camera and microphone
const videoElement = document.querySelector("video");
const audioSelect = document.querySelector("select#audioSource");
const videoSelect = document.querySelector("select#videoSource");
let canvas = document.querySelector("#three-canvas");





function getDevices() {
  console.log("getDevices")
  return navigator.mediaDevices.enumerateDevices();
}

function gotDevices(deviceInfos) {
  console.log("gotDevices")
  window.deviceInfos = deviceInfos;
  for (const deviceInfo of deviceInfos) {
    const option = document.createElement("option");
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === "audioinput") {
      option.text = deviceInfo.label || `Microphone ${audioSelect.length + 1}`;
      audioSelect.appendChild(option);
    } else if (deviceInfo.kind === "videoinput") {
      option.text = deviceInfo.label || `Camera ${videoSelect.length + 1}`;
      videoSelect.appendChild(option);
    }
  }
}

function getStream() {
  console.log("getStream")
  if (window.stream) {
    window.stream.getTracks().forEach(track => {
      track.stop();
    });
  }
  const audioSource = audioSelect.value;
  const videoSource = videoSelect.value;
  console.log(videoSource)
  // const constraints = {
  //   audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
  //   video: { deviceId: videoSource ? { exact: videoSource } : undefined }
  // };

  const constraints = {
    audio: true, video: true 
  };

  console.log(constraints)
  return canvas.captureStream();
  return navigator.mediaDevices
    .getUserMedia(constraints)
    .then(gotStream)
    .catch(handleError);
}

function gotStream(stream) {
  console.log("gotStream")
  console.log(stream)
  window.stream = stream;
  audioSelect.selectedIndex = [...audioSelect.options].findIndex(
    option => option.text === stream.getAudioTracks()[0].label
  );
  videoSelect.selectedIndex = [...videoSelect.options].findIndex(
    option => option.text === stream.getVideoTracks()[0].label
  );
  videoElement.srcObject = stream;
  console.log(videoSelect.value)
  socket.emit("broadcaster");
}

function handleError(error) {
  console.error("Error: ", error);
}

function initThreeJsSquare() {
  var scene = new THREE.Scene();
  var width = 300
  var height = 300
  var camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

  var renderer = new THREE.WebGLRenderer({
      preserveDrawingBuffer :true
  });
  renderer.setSize(width,height);
  renderer.domElement.id="three-canvas"
  document.getElementById("three-square").appendChild( renderer.domElement );
  // $("#three-square").html(renderer.domElement)
  // document.body.appendChild(renderer.domElement);

  var geometry = new THREE.BoxGeometry(1, 1, 1);
  var material = new THREE.MeshBasicMaterial({
      color: 0x00ff00
  });
  var cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  camera.position.z = 5;

  var animate = function () {
      requestAnimationFrame(animate);

      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;

      renderer.render(scene, camera);
  };

  animate();
  initOther()
}

function initOther(){

  audioSelect.onchange = getStream;
  videoSelect.onchange = getStream;
  


    canvas = document.querySelector("#three-canvas");
    console.log("CANVAS ELEMENT")
    console.log(canvas)
    getStream()
    .then(getDevices)
    .then(gotDevices);
}

window.addEventListener("load", function() {

  initThreeJsSquare()
  

})