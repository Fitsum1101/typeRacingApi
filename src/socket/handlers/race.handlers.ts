import { handleProgress } from "../services/race.service";
import { AppSocket, IO } from "../types/sock";

export function registerRaceHandlers(io: IO, socket: AppSocket) {
  socket.on("race:progress", (p) => handleProgress(io, socket, p));
}
