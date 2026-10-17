import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { socketAuth } from "./auth";
import { rooms } from "./rooms";
import { registerRoomHandlers, leaveRoom } from "./handlers/room.handlers";
import { registerRaceHandlers } from "./handlers/race.handlers";
import {
  registerQuickMatch,
  removeFromQueue,
} from "./handlers/quickmatch.handlers";
import { IO, SocketData } from "./types/sock";
import { ClientToServerEvents } from "./types/event/client";
import { ServerToClientEvents } from "./types/event/server";

let io: IO | null = null;

export function initSocket(httpServer: HttpServer): IO {
  io = new Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>(
    httpServer,
    {
      cors: { origin: process.env.CLIENT_URL, credentials: true },
    },
  );

  io.use(socketAuth);

  io.on("connection", (socket) => {
    if (socket.data.userId) socket.join(rooms.user(socket.data.userId));

    registerRoomHandlers(io!, socket);
    registerRaceHandlers(io!, socket);
    registerQuickMatch(io!, socket);

    socket.on("disconnect", () => {
      removeFromQueue(socket);
      leaveRoom(io!, socket, "DISCONNECTED");
    });
  });

  return io;
}

export function getIO(): IO {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
}
