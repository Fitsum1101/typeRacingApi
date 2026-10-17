import { rooms } from "../rooms";
import { quickQueue } from "../state";
import { broadcastRoomState } from "./room.handlers";
import { AppSocket, IO } from "../types";
import { prisma } from "../../config/db";
import { startRace } from "../services/race.service";

const MATCH_SIZE = 2; // in production: wait a few seconds to fill up to 6

export function removeFromQueue(socket: AppSocket) {
  const i = quickQueue.indexOf(socket);
  if (i !== -1) quickQueue.splice(i, 1);
}

export function registerQuickMatch(io: IO, socket: AppSocket) {
  socket.on("quickmatch:join", async (ack) => {
    if (!socket.data.userId) return ack({ ok: false, error: "LOGIN_REQUIRED" });
    if (quickQueue.includes(socket)) return ack({ ok: true });

    quickQueue.push(socket);
    ack({ ok: true });

    if (quickQueue.length < MATCH_SIZE) return;
    const group = quickQueue.splice(0, MATCH_SIZE);

    // note: Room.hostId is required, so the first player is the "host"
    const room = await prisma.room.create({
      data: {
        mode: "QUICK_MATCH",
        hostId: group[0].data.userId!,
        players: {
          create: group.map((s) => ({
            userId: s.data.userId!,
            displayName: s.data.displayName,
          })),
        },
      },
    });

    for (const s of group) {
      s.join(rooms.room(room.id));
      s.data.roomId = room.id;
      s.emit("matchmaking:found", { roomId: room.id });
    }
    await broadcastRoomState(io, room.id);
    await startRace(io, room.id);
  });

  socket.on("quickmatch:leave", () => removeFromQueue(socket));
}
