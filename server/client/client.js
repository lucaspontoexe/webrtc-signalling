import Peer from "https://cdn.skypack.dev/simple-peer-light";

/**
 * @typedef IncomingSignalMessage
 * @property {string} type
 * @property {string} origin
 * @property {string} signal
 */

const peersByID = new Map();
let peers = [];
let id = "peganobreu";
/**
 * @type WebSocket
 */

function init() {
  window.websocket = new WebSocket(`ws://${window.location.host}/?id=${id}`);
  window.websocket.onmessage = handleWebSocketMessage;
}

/**
 * Handle Message
 * @param {MessageEvent<string>} event
 */
function handleWebSocketMessage(event) {
  const message = JSON.parse(event.data);
  console.log(message);
  switch (message.type) {
    case "welcome":
      onWelcome(message.peers);
      break;

    case "signal":
      onSignalReceived(message.origin, message.signal);
      break;

    case "peer_joined":
      addToLog(`${message.id} entrou`);
      if (message.id === id) return;
      addPeer(message.id, { initiator: false });
      break;

    case "peer_left":
      removePeer(message.id);
      break;

    default:
      break;
  }
}

// EVENTS (?)
function onWelcome(peers) {
  console.log(peers);
  peers.forEach((peer) => addPeer(peer, { initiator: true }));
}

// SIGNALLING
function onSignalReceived(origin, signal) {
  console.log("received signal", signal);
  peersByID.get(origin).signal(JSON.stringify(signal));
}

function sendSignal(recipient, signal) {
  // opcional: formatar como objeto, pra ver de onde tá vindo (ou não)
  // temos type?
  websocket.send(
    JSON.stringify({ type: "signal", origin: id, signal, recipient })
  );
}

// ADD & REMOVE PEER
function addPeer(id, config) {
  const p = new Peer(config);
  p.on("signal", (data) => sendSignal(id, data));
  p.on("data", (data) => handlePeerMessage(id, JSON.parse(data)));
  p.on("close", () => removePeer(id));
  p.on("error", console.log);
  peersByID.set(id, p);
  peers.push({ id, peer: p });
}

function removePeer(id) {
  addToLog(`${id} saiu`);
  peersByID.delete(id);
  peers = peers.filter((item) => item.id !== id);
}

// WEBRTC MESSAGE CONTROL
function handlePeerMessage(id, message) {
  addToLog(`${id}: ${message.message}`);
}

function broadcastMessage(message) {
  // precisa disso?
  addToLog(`eu: ${message.message}`);
  for (const item of peers) {
    item.peer.send(JSON.stringify(message));
  }
}

// HTML AND INTERACTION CODE
/**
 * @type HTMLButtonElement
 */
const connectButton = document.querySelector("#connectButton");
/**
 * @type HTMLButtonElement
 */
const sendButton = document.querySelector("#sendButton");
/**
 * @type HTMLInputElement
 */
const idInput = document.querySelector("#idInput");
/**
 * @type HTMLInputElement
 */
const messageInput = document.querySelector("#messageInput");

const outputElement = document.querySelector(".output");

document.querySelector("form").onsubmit = (event) => {
  event.preventDefault();
  messageInput.value = "";
};

connectButton.onclick = () => {
  id = idInput.value;
  init();
};

sendButton.onclick = () => broadcastMessage({ message: messageInput.value });

function addToLog(message) {
  outputElement.innerText += message + "\n";
}
