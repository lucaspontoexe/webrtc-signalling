import express from "express";
import WebSocket from "ws";

const app = express();
app.use(express.static("client"));
const http_server = app.listen(3000);
const ws_server = new WebSocket.Server({ server: http_server });

const socketsByID = new Map<string, WebSocket>();
let connectedSockets = Array<string>();

type SignalMessage = {
  recipient: string;
  origin: string;
  signal: string;
};

ws_server.on("connection", function connection(socket, request) {
  const params = new URLSearchParams(request.url);
  const id = params.get("id") || params.get("/?id") || "";
  
  if (socketsByID.has(id)) {
    socket.send(JSON.stringify({ type: "error", details: "id exists" }));
    socket.close(4000);
    return;
  }

  console.log(id, "entrou");

  // send peer_joined to everyone
  connectedSockets.forEach((_socket) =>
    socketsByID.get(_socket)?.send(JSON.stringify({ type: "peer_joined", id }))
  );

  socketsByID.set(id, socket);
  connectedSockets.push(id);

  socket.send(JSON.stringify({ type: "welcome", peers: connectedSockets })); //as WelcomeMessage

  socket.onmessage = (event) => {
    const message: SignalMessage = JSON.parse(String(event.data));
    const recipient = socketsByID.get(message.recipient);
    if (!recipient)
      return console.log(
        "tentaram acessar o id",
        message.recipient,
        ", que não está na lista"
      );
    recipient.send(JSON.stringify(message));
  };

  socket.onclose = () => {
    console.log(id, "saiu");

    connectedSockets = connectedSockets.filter((socket_id) => socket_id !== id);
    socketsByID.delete(id);

    connectedSockets.forEach((_socket) =>
      socketsByID.get(_socket)?.send(JSON.stringify({ type: "peer_left", id }))
    );
  };
});

console.log("tá rodando");
