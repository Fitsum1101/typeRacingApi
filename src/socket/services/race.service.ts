import { prisma } from "../../config/db";
import { rooms } from "../rooms";
import { LivePlayer, LiveRace, liveRaces } from "../state";
import { AppSocket, ResultRow, IO } from "../types/sock";

const COUNTDOWN_MS = 3000;
const MAX_RACE_MS = 3 * 60 * 1000;
const MAX_WPM = 300; // anything above is treated as cheating
const POINTS = [10, 7, 5, 3, 2, 1];

export async function startRace(io: IO, roomId: string) {
  const room = await prisma.room.findUniqueOrThrow({
    where: { id: roomId },
    include: { players: { where: { status: { not: "LEFT" } } } },
  });

  const count = await prisma.typingText.count();
  const text = await prisma.typingText.findFirstOrThrow({
    skip: Math.floor(Math.random() * count),
  });

  // DB write #1: create the race and its racers
  const race = await prisma.$transaction(async (tx) => {
    await tx.room.update({ where: { id: roomId }, data: { status: "RACING" } });
    return tx.race.create({
      data: {
        roomId,
        textId: text.id,
        mode: room.mode,
        players: {
          create: room.players.map((p) => ({
            userId: p.userId,
            guestId: p.guestId,
            displayName: p.displayName,
          })),
        },
      },
      include: { players: true },
    });
  });

  const live: LiveRace = {
    raceId: race.id,
    roomId,
    mode: room.mode,
    text: text.content,
    startedAt: null,
    finishedCount: 0,
    players: new Map(
      race.players.map((rp) => {
        const key = (rp.userId ?? rp.guestId)!;
        const lp: LivePlayer = {
          playerKey: key,
          racePlayerId: rp.id,
          userId: rp.userId,
          guestId: rp.guestId,
          displayName: rp.displayName,
          correct: 0,
          typed: 0,
          errors: 0,
          wpm: 0,
          lastAt: 0,
          finished: false,
          points: 0,
        };
        return [key, lp];
      }),
    ),
  };
  liveRaces.set(roomId, live);

  // clients get a server timestamp, so everyone counts down in sync
  const startsAt = Date.now() + COUNTDOWN_MS;
  io.to(rooms.room(roomId)).emit("race:countdown", {
    raceId: race.id,
    startsAt,
  });

  setTimeout(async () => {
    live.startedAt = startsAt;
    await prisma.race.update({
      where: { id: race.id },
      data: { status: "RACING", startedAt: new Date(startsAt) },
    });
    io.to(rooms.room(roomId)).emit("race:start", {
      raceId: race.id,
      text: live.text,
      startedAt: startsAt,
    });
    live.timeout = setTimeout(() => finishRace(io, live), MAX_RACE_MS);
  }, COUNTDOWN_MS);
}

export function handleProgress(
  io: IO,
  socket: AppSocket,
  p: { correctCharacters: number; typedCharacters: number; errors: number },
) {
  const live = liveRaces.get(socket.data.roomId ?? "");
  if (!live || !live.startedAt) return;

  const now = Date.now();
  if (now < live.startedAt) return; // typing before the start

  const me = live.players.get(socket.data.playerKey);
  if (!me || me.finished || me.left) return;
  if (now - me.lastAt < 50) return; // throttle: max ~20 updates/sec
  me.lastAt = now;

  // never trust the numbers
  const correct = Math.min(
    Math.max(0, Math.floor(p.correctCharacters) || 0),
    live.text.length,
  );
  const typed = Math.max(correct, Math.floor(p.typedCharacters) || 0);
  const minutes = (now - live.startedAt) / 60000;
  if (minutes < 0.001) return;

  const wpm = correct / 5 / minutes;
  if (wpm > MAX_WPM) return; // impossible speed, ignore

  me.correct = correct;
  me.typed = typed;
  me.errors = Math.max(0, Math.floor(p.errors) || 0);
  me.wpm = wpm;

  // volatile = OK to drop if the network is busy (the next update replaces it)
  socket.to(rooms.room(live.roomId)).volatile.emit("race:progress", {
    playerKey: me.playerKey,
    progress: correct / live.text.length,
    wpm: Math.round(wpm),
  });

  if (correct >= live.text.length) finishPlayer(io, live, me, now);
}

function finishPlayer(io: IO, live: LiveRace, me: LivePlayer, now: number) {
  me.finished = true;
  me.finishedAt = now;
  me.position = ++live.finishedCount;
  me.points = POINTS[me.position - 1] ?? 1;

  io.to(rooms.room(live.roomId)).emit("race:player_finished", {
    playerKey: me.playerKey,
    position: me.position,
    wpm: Math.round(me.wpm),
  });

  checkAllDone(io, live);
}

export function markLeft(
  io: IO,
  roomId: string,
  playerKey: string,
  reason: "QUIT" | "DISCONNECTED",
) {
  const live = liveRaces.get(roomId);
  const me = live?.players.get(playerKey);
  if (!live || !me || me.finished) return;
  me.left = reason;
  checkAllDone(io, live);
}

function checkAllDone(io: IO, live: LiveRace) {
  const allDone = [...live.players.values()].every((p) => p.finished || p.left);
  if (allDone) finishRace(io, live);
}

async function finishRace(io: IO, live: LiveRace) {
  if (!liveRaces.delete(live.roomId)) return; // already finished
  if (live.timeout) clearTimeout(live.timeout);

  const players = [...live.players.values()];
  const acc = (p: LivePlayer) =>
    p.typed > 0 ? (p.correct / p.typed) * 100 : 0;

  // DB write #2: everything in one transaction
  await prisma.$transaction(async (tx) => {
    for (const p of players) {
      await tx.racePlayer.update({
        where: { id: p.racePlayerId },
        data: {
          status: p.finished ? "FINISHED" : (p.left ?? "DISCONNECTED"),
          wpm: p.wpm,
          accuracy: acc(p),
          errors: p.errors,
          correctCharacters: p.correct,
          typedCharacters: p.typed,
          position: p.position ?? null,
          points: p.points,
          finishedAt: p.finishedAt ? new Date(p.finishedAt) : null,
        },
      });

      // stats only for logged-in users who actually finished
      if (p.userId && p.finished) {
        const s = await tx.userStats.upsert({
          where: { userId: p.userId },
          create: { userId: p.userId },
          update: {},
        });
        const n = s.totalRaces;
        await tx.userStats.update({
          where: { userId: p.userId },
          data: {
            totalRaces: { increment: 1 },
            racesWon: { increment: p.position === 1 ? 1 : 0 },
            totalPoints: { increment: p.points },
            bestWpm: Math.max(s.bestWpm, p.wpm),
            averageWpm: (s.averageWpm * n + p.wpm) / (n + 1),
            averageAccuracy: (s.averageAccuracy * n + acc(p)) / (n + 1),
          },
        });
      }
    }

    await tx.race.update({
      where: { id: live.raceId },
      data: { status: "FINISHED", finishedAt: new Date() },
    });
    await tx.room.update({
      where: { id: live.roomId },
      data: { status: live.mode === "QUICK_MATCH" ? "CLOSED" : "WAITING" },
    });
  });

  const rows: ResultRow[] = players
    .sort((a, b) => (a.position ?? 99) - (b.position ?? 99))
    .map((p) => ({
      playerKey: p.playerKey,
      displayName: p.displayName,
      position: p.position ?? null,
      wpm: Math.round(p.wpm),
      accuracy: Math.round(acc(p)),
      points: p.points,
    }));

  io.to(rooms.room(live.roomId)).emit("race:results", rows);
}
