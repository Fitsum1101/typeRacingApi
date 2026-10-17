import crypto from "crypto";
import { rooms } from "../rooms";
import { liveRaces } from "../state";
import { AppSocket, IO, RoomState } from "../types";
import { prisma } from "../../config/db";
import { markLeft, startRace } from "../services/race.service";

const MIN_PLAYERS_TO_START = 2; // use 1 while testing alone

export async function getRoomState(roomId: string): Promise<RoomState> {
  const room = await prisma.room.findUniqueOrThrow({
    where: { id: roomId },
    include: {
      players: {
        where: { status: { not: "LEFT" } },
        orderBy: { joinedAt: "asc" },
      },
    },
  });
  return {
    roomId: room.id,
    code: room.code,
    hostId: room.hostId,
    status: room.status,
    players: room.players.map((p) => {
      const key = (p.userId ?? p.guestId)!;
      return {
        playerKey: key,
        displayName: p.displayName,
        status: p.status === "READY" ? "READY" : "JOINED",
        isHost: key === room.hostId,
      };
    }),
  };
}

export async function broadcastRoomState(io: IO, roomId: string) {
  io.to(rooms.room(roomId)).emit("room:state", await getRoomState(roomId));
}

export async function leaveRoom(
  io: IO,
  socket: AppSocket,
  reason: "QUIT" | "DISCONNECTED",
) {
  const { roomId, playerKey, userId, guestId } = socket.data;
  if (!roomId) return;

  socket.leave(rooms.room(roomId));
  socket.data.roomId = undefined;
  markLeft(io, roomId, playerKey, reason); // updates the live race, if any

  await prisma.roomPlayer.updateMany({
    where: { roomId, ...(userId ? { userId } : { guestId }) },
    data: { status: "LEFT", leftAt: new Date() },
  });

  const remaining = await prisma.roomPlayer.findMany({
    where: { roomId, status: { not: "LEFT" } },
    orderBy: { joinedAt: "asc" },
  });
  const room = await prisma.room.findUniqueOrThrow({ where: { id: roomId } });

  // host left: hand the room to the next logged-in player, else close it
  if (room.hostId === userId) {
    const next = remaining.find((p) => p.userId);
    if (next) {
      await prisma.room.update({
        where: { id: roomId },
        data: { hostId: next.userId! },
      });
    } else if (!liveRaces.has(roomId)) {
      await prisma.room.update({
        where: { id: roomId },
        data: { status: "CLOSED" },
      });
      return;
    }
  }
  if (remaining.length === 0 && !liveRaces.has(roomId)) {
    await prisma.room.update({
      where: { id: roomId },
      data: { status: "CLOSED" },
    });
    return;
  }
  await broadcastRoomState(io, roomId);
}

export function registerRoomHandlers(io: IO, socket: AppSocket) {
  socket.on("room:create", async (ack) => {
    try {
      if (!socket.data.userId)
        return ack({ ok: false, error: "LOGIN_REQUIRED" });
      if (socket.data.roomId) await leaveRoom(io, socket, "QUIT");

      const code = crypto.randomBytes(3).toString("hex").toUpperCase(); // e.g. "A3F9C1"
      const room = await prisma.room.create({
        data: {
          code,
          hostId: socket.data.userId,
          mode: "PRIVATE_ROOM",
          players: {
            create: {
              userId: socket.data.userId,
              displayName: socket.data.displayName,
            },
          },
        },
      });

      socket.join(rooms.room(room.id));
      socket.data.roomId = room.id;
      ack({ ok: true, roomId: room.id, code });
      await broadcastRoomState(io, room.id);
    } catch {
      ack({ ok: false, error: "SERVER_ERROR" });
    }
  });

  socket.on("room:join", async (code, ack) => {
    try {
      const room = await prisma.room.findUnique({
        where: { code: String(code).toUpperCase() },
        include: { players: { where: { status: { not: "LEFT" } } } },
      });
      if (!room || room.status !== "WAITING")
        return ack({ ok: false, error: "ROOM_UNAVAILABLE" });
      if (room.players.length >= room.maxPlayers)
        return ack({ ok: false, error: "ROOM_FULL" });
      if (socket.data.roomId && socket.data.roomId !== room.id)
        await leaveRoom(io, socket, "QUIT");

      const { userId, guestId, displayName } = socket.data;
      const common = { status: "JOINED" as const, leftAt: null, displayName };

      if (userId) {
        await prisma.roomPlayer.upsert({
          where: { roomId_userId: { roomId: room.id, userId } },
          create: { roomId: room.id, userId, displayName },
          update: common,
        });
      } else {
        await prisma.roomPlayer.upsert({
          where: { roomId_guestId: { roomId: room.id, guestId: guestId! } },
          create: { roomId: room.id, guestId, displayName },
          update: common,
        });
      }

      socket.join(rooms.room(room.id));
      socket.data.roomId = room.id;
      ack({ ok: true, roomId: room.id });
      await broadcastRoomState(io, room.id);
    } catch {
      ack({ ok: false, error: "SERVER_ERROR" });
    }
  });

  socket.on("room:ready", async (ready) => {
    const { roomId, userId, guestId } = socket.data;
    if (!roomId) return;
    await prisma.roomPlayer.updateMany({
      where: { roomId, ...(userId ? { userId } : { guestId }) },
      data: { status: ready ? "READY" : "JOINED" },
    });
    await broadcastRoomState(io, roomId);
  });

  socket.on("room:start", async (ack) => {
    try {
      const { roomId, userId } = socket.data;
      if (!roomId) return ack({ ok: false, error: "NOT_IN_ROOM" });

      const room = await prisma.room.findUniqueOrThrow({
        where: { id: roomId },
        include: { players: { where: { status: { not: "LEFT" } } } },
      });
      if (room.hostId !== userId) return ack({ ok: false, error: "HOST_ONLY" });
      if (room.status !== "WAITING")
        return ack({ ok: false, error: "ALREADY_STARTED" });
      if (room.players.length < MIN_PLAYERS_TO_START)
        return ack({ ok: false, error: "NOT_ENOUGH_PLAYERS" });

      ack({ ok: true });
      await startRace(io, roomId);
    } catch {
      ack({ ok: false, error: "SERVER_ERROR" });
    }
  });

  socket.on("room:leave", () => leaveRoom(io, socket, "QUIT"));
}
