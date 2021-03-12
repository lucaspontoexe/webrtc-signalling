import Peer from "https://cdn.skypack.dev/simple-peer";

/**
 * @typedef IncomingSignalMessage
 * @property {string} type
 * @property {string} origin
 * @property {string} signal
 */

// TODO: nickname -> id

const peersByID = new Map();
const peers = [];
/**
 * @type WebSocket
 */
let websocket;

function init() {
  websocket = new WebSocket('ws://localhost:9999/?nickname="peganobreu"');
  websocket.onmessage = handleWebSocketMessage;
}

/**
 * Handle Message
 * @param {MessageEvent<string>} event
 */
function handleWebSocketMessage(event) {
  const message = JSON.parse(event.data);
  // todo: handle signal messages
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
  for (const peer of peers) {
    addPeer(peer);
  }
}

// SIGNALLING
function onSignalReceived(origin, signal) {
  peersByID.get(origin).signal(signal);
}

function sendSignal(recipient, signal) {
  // opcional: formatar como objeto, pra ver de onde tá vindo (ou não)
  // temos type?
  websocket.send(JSON.stringify({ signal, recipient }));
}

// ADD & REMOVE PEER
function addPeer(nickname) {
  const p = new Peer({ initiator: true });
  p.on("signal", (data) => sendSignal(data, nickname));
  p.on("data", (data) => handlePeerMessage(nickname, JSON.parse(data)));
  p.on("close", () => removePeer(nickname));
  peersByID.set(nickname, p);
  peers.push({ nickname, peer: p });
}

function removePeer(nickname) {
  peersByID.delete(nickname);
  peers = peers.filter((item) => item.nickname !== nickname);
}

// WEBRTC MESSAGE CONTROL
function handlePeerMessage(nickname, message) {
  console.log(nickname, "sent: ", message);
}

function broadcastMessage(message) {
  for (const peer of peers) {
    peer.send(JSON.parse(message));
  }
}
