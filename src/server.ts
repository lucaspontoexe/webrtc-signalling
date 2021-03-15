import express from "express";
import WebSocket from "ws";
import { SignalMessage } from "SignalMessage";

const app = express();
app.use(express.static("client"));
const http_server = app.listen(3000);
const ws_server = new WebSocket.Server({ server: http_server });


class Room {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
  socketsByID = new Map<string, WebSocket>();
  connectedSockets = Array<string>();
}

const roomsByID = new Map<string, Room>();

ws_server.on("connection", function connection(socket, request) {
  const params = new URLSearchParams(request.url);
  const client_id = params.get("id") || params.get("/?id") || "";
  const room_id = params.get("room_id") || params.get("/?room_id") || "";

  //dá pra melhorar? dá.
  const roomExists = roomsByID.has(room_id);
  const room = roomExists ? roomsByID.get(room_id)! : new Room(room_id);
  if (!roomExists) roomsByID.set(room_id, room);


  if (room.socketsByID.has(client_id)) {
    socket.send(JSON.stringify({ type: "error", details: "client_id exists" }));
    socket.close(4000);
    return;
  }

  console.log(client_id, "entrou no grupo", room.name);

  // send peer_joined to everyone
  room.connectedSockets.forEach((_socket) =>
    room.socketsByID
      .get(_socket)
      ?.send(JSON.stringify({ type: "peer_joined", id: client_id }))
  );

  room.socketsByID.set(client_id, socket);
  room.connectedSockets.push(client_id);

  socket.send(
    JSON.stringify({ type: "welcome", peers: room.connectedSockets })
  ); //as WelcomeMessage

  socket.onmessage = (event) => {
    const message: SignalMessage = JSON.parse(String(event.data));
    const recipient = room.socketsByID.get(message.recipient);
    if (!recipient)
      return console.log(
        "tentaram acessar o id",
        message.recipient,
        ", que não está na lista"
      );
    recipient.send(JSON.stringify(message));
  };

  socket.onclose = () => {
    console.log(client_id, "saiu do grupo", room.name);

    room.connectedSockets = room.connectedSockets.filter(
      (socket_id) => socket_id !== client_id
    );
    room.socketsByID.delete(client_id);

    room.connectedSockets.forEach((_socket) =>
      room.socketsByID
        .get(_socket)
        ?.send(JSON.stringify({ type: "peer_left", id: client_id }))
    );

    if (room.connectedSockets.length === 0) roomsByID.delete(room_id);
  };
});

console.log("tá rodando");
