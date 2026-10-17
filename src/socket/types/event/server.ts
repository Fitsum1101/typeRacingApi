import { RoomState } from "./room";
import { ResultRow } from "./sock";

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
