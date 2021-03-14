import SimplePeer from "./SimplePeer";

export namespace ServerMessage {
    
    interface IncomingSignal {
        type: "signal",
        origin: string,
        signal: string,
    }
    
    interface Welcome {
        type: "welcome",
        peers: string[],
    }
    
    interface PeerJoined {
        type: "peer_joined",
        id: string,
    }
    
    interface PeerLeft {
        type: "peer_left",
        id: string,
    }
    
    interface Error {
        type: "error",
        details: string,
    }
}

export interface PeerList {
    id: string,
    peer: SimplePeer.Instance
}
