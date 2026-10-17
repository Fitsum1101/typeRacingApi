import bcrypt from "bcrypt";
import { prisma } from "../../src/config/db";
import {
  RaceMode,
  RacePlayerStatus,
  RaceStatus,
  RoomPlayerStatus,
  RoomStatus,
} from "../../src/generated/prisma/enums";
import { TYPING_TEXTS_DATA, USER_STATS_DATA, USERS_DATA } from "./data/default";

const SALT_ROUNDS = 10;

// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// CLEAR
// ─────────────────────────────────────────────

async function clearDatabase() {
  await prisma.racePlayer.deleteMany();
  await prisma.race.deleteMany();
  await prisma.roomPlayer.deleteMany();
  await prisma.room.deleteMany();
  await prisma.userStats.deleteMany();
  await prisma.authSession.deleteMany();
  await prisma.typingText.deleteMany();
  await prisma.user.deleteMany();
  console.log("🗑️  Cleared existing data");
}

// ─────────────────────────────────────────────
// SEED FUNCTIONS (one per table)
// ─────────────────────────────────────────────

async function seedUsers() {
  const passwordHash = await bcrypt.hash("password123", SALT_ROUNDS);

  const users = await Promise.all(
    USERS_DATA.map((user) =>
      prisma.user.create({
        data: {
          ...user,
          passwordHash,
        },
      }),
    ),
  );

  console.log(`✅ Users: ${users.length}`);
  return users;
}

async function seedUserStats(users: { id: string }[]) {
  const stats = await Promise.all(
    users.map((user, index) =>
      prisma.userStats.create({
        data: {
          userId: user.id,
          ...USER_STATS_DATA[index],
        },
      }),
    ),
  );

  console.log(`✅ UserStats: ${stats.length}`);
  return stats;
}

async function seedTypingTexts() {
  const texts = await Promise.all(
    TYPING_TEXTS_DATA.map((text) =>
      prisma.typingText.create({
        data: text,
      }),
    ),
  );

  console.log(`✅ TypingTexts: ${texts.length}`);
  return texts;
}

async function seedRooms(users: { id: string; username: string }[]) {
  const room1 = await prisma.room.create({
    data: {
      code: "ABC123",
      hostId: users[0].id,
      mode: RaceMode.PRIVATE_ROOM,
      maxPlayers: 6,
      status: RoomStatus.WAITING,
      players: {
        create: [
          {
            userId: users[0].id,
            displayName: users[0].username,
            status: RoomPlayerStatus.READY,
          },
          {
            userId: users[1].id,
            displayName: users[1].username,
            status: RoomPlayerStatus.JOINED,
          },
          {
            userId: users[2].id,
            displayName: users[2].username,
            status: RoomPlayerStatus.JOINED,
          },
        ],
      },
    },
  });

  const room2 = await prisma.room.create({
    data: {
      code: null,
      hostId: users[1].id,
      mode: RaceMode.QUICK_MATCH,
      maxPlayers: 4,
      status: RoomStatus.CLOSED,
      players: {
        create: [
          {
            userId: users[1].id,
            displayName: users[1].username,
            status: RoomPlayerStatus.LEFT,
            leftAt: new Date(),
          },
          {
            userId: users[3].id,
            displayName: users[3].username,
            status: RoomPlayerStatus.LEFT,
            leftAt: new Date(),
          },
        ],
      },
    },
  });

  console.log("✅ Rooms + RoomPlayers: 2");
  return { room1, room2 };
}

async function seedRaces(
  users: { id: string; username: string }[],
  texts: { id: string }[],
  rooms: { room1: { id: string }; room2: { id: string } },
) {
  const race1 = await prisma.race.create({
    data: {
      roomId: rooms.room1.id,
      textId: texts[1].id,
      mode: RaceMode.PRIVATE_ROOM,
      status: RaceStatus.FINISHED,
      startedAt: new Date(Date.now() - 1000 * 60 * 5),
      finishedAt: new Date(Date.now() - 1000 * 60 * 3),
      players: {
        create: [
          {
            userId: users[0].id,
            displayName: users[0].username,
            status: RacePlayerStatus.FINISHED,
            wpm: 82.4,
            accuracy: 96.1,
            errors: 4,
            correctCharacters: 210,
            typedCharacters: 218,
            position: 1,
            points: 120,
            finishedAt: new Date(Date.now() - 1000 * 60 * 3),
          },
          {
            userId: users[1].id,
            displayName: users[1].username,
            status: RacePlayerStatus.FINISHED,
            wpm: 74.0,
            accuracy: 93.5,
            errors: 8,
            correctCharacters: 195,
            typedCharacters: 209,
            position: 2,
            points: 90,
            finishedAt: new Date(Date.now() - 1000 * 60 * 2.5),
          },
          {
            userId: users[2].id,
            displayName: users[2].username,
            status: RacePlayerStatus.FINISHED,
            wpm: 61.2,
            accuracy: 88.0,
            errors: 15,
            correctCharacters: 170,
            typedCharacters: 193,
            position: 3,
            points: 60,
            finishedAt: new Date(Date.now() - 1000 * 60 * 2),
          },
        ],
      },
    },
  });

  const race2 = await prisma.race.create({
    data: {
      roomId: rooms.room2.id,
      textId: texts[0].id,
      mode: RaceMode.QUICK_MATCH,
      status: RaceStatus.FINISHED,
      startedAt: new Date(Date.now() - 1000 * 60 * 30),
      finishedAt: new Date(Date.now() - 1000 * 60 * 28),
      players: {
        create: [
          {
            userId: users[1].id,
            displayName: users[1].username,
            status: RacePlayerStatus.FINISHED,
            wpm: 78.5,
            accuracy: 95.0,
            errors: 3,
            correctCharacters: 95,
            typedCharacters: 100,
            position: 1,
            points: 100,
            finishedAt: new Date(Date.now() - 1000 * 60 * 28),
          },
          {
            userId: users[3].id,
            displayName: users[3].username,
            status: RacePlayerStatus.FINISHED,
            wpm: 65.0,
            accuracy: 90.2,
            errors: 7,
            correctCharacters: 88,
            typedCharacters: 98,
            position: 2,
            points: 70,
            finishedAt: new Date(Date.now() - 1000 * 60 * 27.5),
          },
        ],
      },
    },
  });

  const race3 = await prisma.race.create({
    data: {
      roomId: null,
      textId: texts[2].id,
      mode: RaceMode.QUICK_MATCH,
      status: RaceStatus.RACING,
      startedAt: new Date(),
      players: {
        create: [
          {
            userId: users[0].id,
            displayName: users[0].username,
            status: RacePlayerStatus.RACING,
            wpm: 45.0,
            accuracy: 92.0,
            errors: 5,
            correctCharacters: 80,
            typedCharacters: 87,
          },
          {
            userId: users[4].id,
            displayName: users[4].username,
            status: RacePlayerStatus.RACING,
            wpm: 38.2,
            accuracy: 85.5,
            errors: 12,
            correctCharacters: 65,
            typedCharacters: 76,
          },
          {
            guestId: "guest-abc-123",
            displayName: "SpeedyGuest",
            status: RacePlayerStatus.RACING,
            wpm: 52.0,
            accuracy: 97.0,
            errors: 2,
            correctCharacters: 95,
            typedCharacters: 98,
          },
        ],
      },
    },
  });

  console.log("✅ Races + RacePlayers: 3");
  return { race1, race2, race3 };
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding database...\n");

  await clearDatabase();

  const users = await seedUsers();
  await seedUserStats(users);
  const texts = await seedTypingTexts();
  const rooms = await seedRooms(users);
  await seedRaces(users, texts, rooms);

  console.log("\n🎉 Seed completed successfully!");
  console.log("\nTest accounts (password: password123):");
  USERS_DATA.forEach((u) => console.log(`  - ${u.email}`));
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
