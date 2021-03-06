import WebSocket from "ws";

export class Room {
  name: string;
  constructor(name: string) {
    this.name = name;
  }

  socketsByID = new Map<string, WebSocket>();
  IDsBySocket = new Map<WebSocket, string>();

  connectedSockets = Array<string>();
  broadcastMessage = (message: object) => {
    this.connectedSockets.forEach((socket_id) =>
      this.socketsByID.get(socket_id)?.send(JSON.stringify(message))
    );
  };

  addSocket = (id: string, socket: WebSocket) => {
    this.socketsByID.set(id, socket);
    this.IDsBySocket.set(socket, id);
    this.connectedSockets.push(id);
  };

  removeSocket = (id: string, socket: WebSocket) => {
    this.connectedSockets = this.connectedSockets.filter(
      (socket_id) => socket_id !== id
    );
    this.socketsByID.delete(id);
    this.IDsBySocket.delete(socket);
  };
}
