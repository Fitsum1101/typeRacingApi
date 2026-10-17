import { Ack } from "../sock";

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
