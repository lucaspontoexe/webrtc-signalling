const WebSocket = require("ws");
const ws_server = new WebSocket.Server({ port: 9999 });

const peersByID = new Map();
let connectedPeers = [];

ws_server.on("connection", function connection(socket, request) {
  const params = new URLSearchParams(request.url);
  const id = params.get("id") || params.get("?id");
  const peers = peersByID.values();
  connection.send(JSON.stringify({ type: "welcome", peers }));

  peersByID.set(id, socket);
  // connectedPeers = peersByID.values(); //keys?

  socket.onmessage = (text) => {
    /* if (type === 'signal') relaySignal*/
    const message = JSON.parse(text);
    const recipient = peersByID.get(message.recipient);
    recipient.send(text);
  };
});

console.log("tá rodando");
