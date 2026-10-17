import { AppSocket } from "./types/sock";

export interface LivePlayer {
  playerKey: string;
  racePlayerId: string;
  userId: string | null;
  guestId: string | null;
  displayName: string;
  correct: number;
  typed: number;
  errors: number;
  wpm: number;
  lastAt: number;
  finished: boolean;
  finishedAt?: number;
  position?: number;
  points: number;
  left?: "QUIT" | "DISCONNECTED";
}

export interface LiveRace {
  raceId: string;
  roomId: string;
  mode: "QUICK_MATCH" | "PRIVATE_ROOM";
  text: string;
  startedAt: number | null; // null during countdown
  finishedCount: number;
  players: Map<string, LivePlayer>; // key = playerKey
  timeout?: NodeJS.Timeout;
}

export const liveRaces = new Map<string, LiveRace>(); // key = roomId
export const quickQueue: AppSocket[] = [];
