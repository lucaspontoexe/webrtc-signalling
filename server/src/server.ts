import WebSocket from "ws";
const ws_server = new WebSocket.Server({ port: 9999 });

const socketsByID = new Map<string, WebSocket>();
const connectedSockets = Array<string>();

type SignalMessage = {
    recipient: string,
    origin: string,
    signal: string,
}

ws_server.on("connection", function connection(socket, request) {
  const params = new URLSearchParams(request.url);
  const id = params.get("id") || params.get("/?id") || "";
  console.log(id, "entrou");

  socket.send(JSON.stringify({ type: "welcome", peers: connectedSockets })); //as WelcomeMessage

  socketsByID.set(id, socket);
  connectedSockets.push(id);

  // send peer_joined to everyone
  connectedSockets.forEach(_socket => socketsByID.get(_socket)?.send(JSON.stringify({type: 'peer_joined', id})))

  socket.onmessage = (event) => {
      const message: SignalMessage = JSON.parse(String(event.data));
      const recipient = socketsByID.get(message.recipient);
      if (!recipient) return console.log('tentaram acessar o id', message.recipient, ', que não tá na lista');
      recipient.send(JSON.stringify(message));
    };

  socket.onclose = () => console.log(id, "saiu");
});


console.log("tá rodando");