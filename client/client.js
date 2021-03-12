import Peer from "https://cdn.skypack.dev/simple-peer";

/**
 * @typedef IncomingSignalMessage
 * @property {string} type
 * @property {string} origin
 * @property {string} signal
 */

const peersByID = new Map();
const peers = [];
let id = "peganobreu";
/**
 * @type WebSocket
 */
// let websocket;

function init() {
  window.websocket = new WebSocket(`ws://localhost:9999/?id=${id}`);
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

    default:
      break;
  }
}

// EVENTS (?)
function onWelcome(peers) {
  console.log(peers);
  peers.forEach((peer) => addPeer(peer));
}

// SIGNALLING
function onSignalReceived(origin, signal) {
  peersByID.get(origin).signal(signal);
}

function sendSignal(recipient, signal) {
  // opcional: formatar como objeto, pra ver de onde tá vindo (ou não)
  // temos type?
  websocket.send(
    JSON.stringify({ type: "signal", origin: id, signal, recipient })
  );
}

// ADD & REMOVE PEER
function addPeer(id) {
  const p = new Peer({ initiator: true });
  p.on("signal", (data) => sendSignal(id, data));
  p.on("data", (data) => handlePeerMessage(id, JSON.parse(data)));
  p.on("close", () => removePeer(id));
  peersByID.set(id, p);
  peers.push({ id, peer: p });
}

function removePeer(id) {
  peersByID.delete(id);
  peers = peers.filter((item) => item.id !== id);
}

// WEBRTC MESSAGE CONTROL
function handlePeerMessage(id, message) {
  console.log(id, "sent: ", message);
  outputElement.innerText += message;
}

function broadcastMessage(message) {
  for (const peer of peers) {
    peer.send(JSON.parse(message));
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

connectButton.onclick = () => {id = idInput.value; init();};

sendButton.onclick = () => broadcastMessage({ message: messageInput.value });
