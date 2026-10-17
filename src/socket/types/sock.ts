import { Server, Socket } from "socket.io";
import { ClientToServerEvents } from "./event/client";
import { ServerToClientEvents } from "./server";

export type Ack<T = {}> = (
  res: ({ ok: true } & T) | { ok: false; error: string },
) => void;

export interface ResultRow {
  playerKey: string;
  displayName: string;
  position: number | null;
  wpm: number;
  accuracy: number;
  points: number;
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
