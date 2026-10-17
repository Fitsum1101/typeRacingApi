export interface RoomState {
  roomId: string;
  code: string | null;
  hostId: string;
  status: "WAITING" | "RACING" | "CLOSED";
  players: {
    playerKey: string;
    displayName: string;
    status: "JOINED" | "READY";
    isHost: boolean;
  }[];
}
