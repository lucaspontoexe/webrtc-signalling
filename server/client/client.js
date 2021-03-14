// @ts-check
// @ts-ignore
import Peer from "https://cdn.skypack.dev/simple-peer-light";

/**
 * @typedef IncomingSignalMessage
 * @property {"signal"} type
 * @property {string} origin
 * @property {string} signal
 */

/**
 * @typedef WelcomeMessage
 * @property {"welcome"} type
 * @property {string[]} peers
 */

/**
 * @typedef PeerJoinedMessage
 * @property {"peer_joined"} type
 * @property {string} id
 */

/**
 * @typedef PeerLeftMessage
 * @property {"peer_left"} type
 * @property {string} id
 */

/**
 * @typedef PeerList
 * @property {string} id
 * @property {import('./SimplePeer').Instance} peer
 */

/**
 * @type {Map<string, import('./SimplePeer').Instance>}
 */
const peersByID = new Map();

/**
 * @type {Array<PeerList>}
 */
let peers = [];
let myID = "peganobreu";

/**
 * @type {WebSocket}
 */
let websocket;

function init() {
  websocket = new WebSocket(`ws://${window.location.host}/?id=${myID}`);
  websocket.onmessage = handleWebSocketMessage;
}

/**
 * Handle Message
 * @param {MessageEvent<string>} event
 */
function handleWebSocketMessage(event) {
  /**
   * @type {IncomingSignalMessage | WelcomeMessage | PeerJoinedMessage | PeerLeftMessage}
   */
  const message = JSON.parse(event.data);
  console.log(message);
  switch (message.type) {
    case "welcome":
      addToLog(`você entrou`);
      onWelcome(message.peers);
      break;

    case "signal":
      onSignalReceived(message.origin, message.signal);
      break;

    case "peer_joined":
      addToLog(`${message.id} entrou`);
      if (message.id === myID) return;
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
/**
 * @param {string[]} peers
 */
function onWelcome(peers) {
  console.log(peers);
  peers.forEach((peer) => addPeer(peer, { initiator: true }));
}

// SIGNALLING
/**
 * @param {string} origin
 * @param {object} signal
 */
function onSignalReceived(origin, signal) {
  console.log("received signal", signal);
  peersByID.get(origin).signal(JSON.stringify(signal));
}

/**
 * @param {string} recipient
 * @param {object} signal
 */
function sendSignal(recipient, signal) {
  // opcional: formatar como objeto, pra ver de onde tá vindo (ou não)
  // temos type?
  websocket.send(
    JSON.stringify({ type: "signal", origin: myID, signal, recipient })
  );
}

// ADD & REMOVE PEER
/**
 * @param {string} id
 * @param {{ initiator: boolean; }} config
 */
function addPeer(id, config) {
  if (id === myID) return;

  /**
   * @type {import('./SimplePeer').Instance}
   */
  const p = new Peer(config);
  p.on("signal", (/** @type {object} */ data) => sendSignal(id, data));
  p.on("data", (/** @type {string} */ data) => handlePeerMessage(id, JSON.parse(data)));
  p.on("close", () => removePeer(id));
  p.on("error", console.log);
  peersByID.set(id, p);
  peers.push({ id, peer: p });
}

/**
 * @param {string} id
 */
function removePeer(id) {
  addToLog(`${id} saiu`);
  peersByID.delete(id);
  peers = peers.filter((item) => item.id !== id);
}

// WEBRTC MESSAGE CONTROL
/**
 * @param {string} id
 * @param {{ message: any; }} message
 */
function handlePeerMessage(id, message) {
  addToLog(`${id}: ${message.message}`);
}

/**
 * @param {{ message: any; }} message
 */
function broadcastMessage(message) {
  // precisa disso?
  addToLog(`${myID}: ${message.message}`);
  for (const item of peers) {
    item.peer.send(JSON.stringify(message));
  }
}

// HTML AND INTERACTION CODE
/**
 * @type {HTMLButtonElement}
 */
const connectButton = document.querySelector("#connectButton");
/**
 * @type {HTMLButtonElement}
 */
const sendButton = document.querySelector("#sendButton");
/**
 * @type {HTMLInputElement}
 */
const idInput = document.querySelector("#idInput");
/**
 * @type {HTMLInputElement}
 */
const messageInput = document.querySelector("#messageInput");
/**
 * @type {HTMLPreElement}
 */
const outputElement = document.querySelector(".output");

document.querySelector("form").onsubmit = (event) => {
  event.preventDefault();
  messageInput.value = "";
};

connectButton.onclick = () => {
  myID = idInput.value;
  init();
};

sendButton.onclick = () => broadcastMessage({ message: messageInput.value });

/**
 * @param {string} message
 */
function addToLog(message) {
  outputElement.innerText += message + "\n";
}
