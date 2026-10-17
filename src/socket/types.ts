import { Server, Socket } from "socket.io";

export type Ack<T = {}> = (
  res: ({ ok: true } & T) | { ok: false; error: string },
) => void;

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

export interface ResultRow {
  playerKey: string;
  displayName: string;
  position: number | null;
  wpm: number;
  accuracy: number;
  points: number;
}

export interface ServerToClientEvents {
  "room:state": (state: RoomState) => void;
  "race:countdown": (p: { raceId: string; startsAt: number }) => void;
  "race:start": (p: {
    raceId: string;
    text: string;
    startedAt: number;
  }) => void;
  "race:progress": (p: {
    playerKey: string;
    progress: number;
    wpm: number;
  }) => void;
  "race:player_finished": (p: {
    playerKey: string;
    position: number;
    wpm: number;
  }) => void;
  "race:results": (rows: ResultRow[]) => void;
  "matchmaking:found": (p: { roomId: string }) => void;
}

export interface ClientToServerEvents {
  "room:create": (ack: Ack<{ roomId: string; code: string }>) => void;
  "room:join": (code: string, ack: Ack<{ roomId: string }>) => void;
  "room:ready": (ready: boolean) => void;
  "room:start": (ack: Ack) => void;
  "room:leave": () => void;
  "quickmatch:join": (ack: Ack) => void;
  "quickmatch:leave": () => void;
  "race:progress": (p: {
    correctCharacters: number; // correct chars in the text so far
    typedCharacters: number; // total keystrokes incl. mistakes
    errors: number;
  }) => void;
}

export interface SocketData {
  userId?: string; // set for logged-in users
  guestId?: string; // set for guests
  playerKey: string; // userId ?? guestId
  displayName: string;
  roomId?: string;
}

export type IO = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  {},
  SocketData
>;
export type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  {},
  SocketData
>;
