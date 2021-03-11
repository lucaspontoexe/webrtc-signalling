import Peer from 'https://cdn.skypack.dev/simple-peer';

/**
 * @typedef IncomingSignalMessage
 * @property 
 */


const myself = new Peer({initiator: true});
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
}

function onWelcome() {
    for (const peer of peers) {
        addPeer(peer);
    }
}


function addPeer(nickname) {
    const p = new Peer();
        p.on('signal', data => sendSignal(data, nickname));
        p.on('data', data => handlePeerMessage(nickname, JSON.parse(data)));
        p.on('close', () => removePeer(nickname));
        peersByID.set(nickname,p);
        peers.push({nickname, peer: p});
}

function removePeer(nickname) {
    peersByID.delete(nickname);
    peers = peers.filter(item => item.nickname !== nickname);
}

function sendSignal(signal, recipient) {
    // opcional: formatar como objeto, pra ver de onde tá vindo (ou não)
    // temos type?
    websocket.send(JSON.stringify({signal, recipient}));
}

function handlePeerMessage(nickname, message) {
    console.log(nickname, 'sent: ', message);
}

function broadcastMessage(message) {
    for (const peer of peers) {
        peer.send(JSON.parse(message));
    }
}