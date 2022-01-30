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

  let stream = canvas.captureStream();
  stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

  let stream2 = canvas2.captureStream();
  stream2.getTracks().forEach(track => peerConnection.addTrack(track, stream2));

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

let canvas = document.querySelector("#three-canvas");
let canvas2 = document.querySelector("#three-canvas2");




function initThreeJsSquare(color,canvasId) {

  return new Promise(function(resolve,reject){
    var scene = new THREE.Scene();
    var width = 300
    var height = 300
    var camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  
    var renderer = new THREE.WebGLRenderer({
        preserveDrawingBuffer :true
    });
    renderer.setSize(width,height);
    renderer.domElement.id=canvasId
    document.getElementById("three-square").appendChild( renderer.domElement );
    // $("#three-square").html(renderer.domElement)
    // document.body.appendChild(renderer.domElement);
  
    var geometry = new THREE.BoxGeometry(1, 1, 1);
    var material = new THREE.MeshBasicMaterial({
        color: color
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
    resolve()
  })
  
  
}

function initOther(){


    canvas = document.querySelector("#three-canvas");
    canvas2 = document.querySelector("#three-canvas2");

    socket.emit("broadcaster");
}

window.addEventListener("load", async function() {

  await initThreeJsSquare(0x00ff00,"three-canvas")
  await initThreeJsSquare(0x2979ff,"three-canvas2")
  initOther()
})