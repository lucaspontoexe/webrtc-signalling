import Peer from "https://cdn.skypack.dev/simple-peer";

/**
 * @typedef IncomingSignalMessage
 * @property {string} type
 * @property {string} origin
 * @property {string} signal
 */

const peersByID = new Map();
const peers = [];
const id = "peganobreu";
/**
 * @type WebSocket
 */
let websocket;

function init() {
  websocket = new WebSocket(`ws://localhost:9999/?id=${id}`);
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
  websocket.send(JSON.stringify({ type: 'signal', origin: id, signal, recipient }));
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
}

function broadcastMessage(message) {
  for (const peer of peers) {
    peer.send(JSON.parse(message));
  }
}
