// @ts-check
// @ts-ignore
import Peer from "https://cdn.skypack.dev/simple-peer-light";

/**
 * @typedef {import('./types').ServerMessage.IncomingSignal} IncomingSignalMessage
 * @typedef {import('./types').ServerMessage.Error} ErrorMessage
 * @typedef {import('./types').ServerMessage.Welcome} WelcomeMessage
 * @typedef {import('./types').ServerMessage.PeerJoined} PeerJoinedMessage
 * @typedef {import('./types').ServerMessage.PeerLeft} PeerLeftMessage
 */

/**
 * @type {Map<string, import('./SimplePeer').Instance>}
 */
const peersByID = new Map();

/**
 * @type {Array<import('./types').PeerList>}
 */
let peers = [];
let myID = "peganobreu_tour" + String(Math.floor(Math.random() * 10000));

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
   * @type {IncomingSignalMessage | WelcomeMessage | PeerJoinedMessage | PeerLeftMessage | ErrorMessage}
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

    case "error":
      addToLog(`ERRO: ${message.details}`);
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
  p.on("data", (/** @type {string} */ data) => handlePeerMessage(id, data));
  p.on("close", () => removePeer(id));
  p.on("error", (err) => !p.destroyed && console.warn(err));
  peersByID.set(id, p);
  peers.push({ id, peer: p });
}

/**
 * @param {string} id
 */
function removePeer(id) {
  if (!peersByID.has(id)) return;
  addToLog(`${id} saiu`);
  peersByID.delete(id);
  peers = peers.filter((item) => item.id !== id);
}

// WEBRTC MESSAGE CONTROL
/**
 * @param {string} id
 * @param {string} message
 */
function handlePeerMessage(id, message) {
  addToLog(`${id}: ${message}`);
}

/**
 * @param {string} message
 */
function broadcastMessage(message) {
  addToLog(`${myID}: ${message}`);
  for (const item of peers) {
    item.peer.send(message);
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
  myID = idInput.value || myID;
  init();
};

sendButton.onclick = () => broadcastMessage(messageInput.value);

/**
 * @param {string} message
 */
function addToLog(message) {
  outputElement.innerText += message + "\n";
}

window.onbeforeunload = () => {
  for (const item of peers) {
    item.peer.destroy();
  }
  websocket.close();
};
