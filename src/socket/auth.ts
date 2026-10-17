import crypto from "crypto";
import jwt from "jsonwebtoken";
import { AppSocket } from "./types/sock";
import { prisma } from "../config/db";

export async function socketAuth(
  socket: AppSocket,
  next: (err?: Error) => void,
) {
  try {
    const { token, guestId, displayName } = socket.handshake.auth ?? {};

    if (token) {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
        sub: string;
      };
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || !user.isActive) return next(new Error("UNAUTHORIZED"));

      socket.data.userId = user.id;
      socket.data.playerKey = user.id;
      socket.data.displayName = user.username;
      return next();
    }

    // guest: client may resend its saved id so it can reconnect as the same guest
    const isUuid =
      typeof guestId === "string" && /^[0-9a-f-]{36}$/i.test(guestId);
    const id = isUuid ? guestId : crypto.randomUUID();
    socket.data.guestId = id;
    socket.data.playerKey = id;
    socket.data.displayName = String(
      displayName ?? `Guest-${id.slice(0, 4)}`,
    ).slice(0, 20);
    next();
  } catch {
    next(new Error("UNAUTHORIZED"));
  }
}
