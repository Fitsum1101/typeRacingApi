-- CreateEnum
CREATE TYPE "RaceMode" AS ENUM ('QUICK_MATCH', 'PRIVATE_ROOM');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('WAITING', 'RACING', 'CLOSED');

-- CreateEnum
CREATE TYPE "RoomPlayerStatus" AS ENUM ('JOINED', 'READY', 'LEFT');

-- CreateEnum
CREATE TYPE "RaceStatus" AS ENUM ('COUNTDOWN', 'RACING', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RacePlayerStatus" AS ENUM ('JOINED', 'RACING', 'FINISHED', 'DISCONNECTED', 'QUIT');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserStats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalRaces" INTEGER NOT NULL DEFAULT 0,
    "racesWon" INTEGER NOT NULL DEFAULT 0,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "bestWpm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageWpm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "hostId" TEXT NOT NULL,
    "mode" "RaceMode" NOT NULL,
    "maxPlayers" INTEGER NOT NULL DEFAULT 6,
    "status" "RoomStatus" NOT NULL DEFAULT 'WAITING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomPlayer" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT,
    "guestId" TEXT,
    "displayName" TEXT NOT NULL,
    "status" "RoomPlayerStatus" NOT NULL DEFAULT 'JOINED',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "RoomPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TypingText" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TypingText_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Race" (
    "id" TEXT NOT NULL,
    "roomId" TEXT,
    "textId" TEXT NOT NULL,
    "mode" "RaceMode" NOT NULL,
    "status" "RaceStatus" NOT NULL DEFAULT 'COUNTDOWN',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Race_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RacePlayer" (
    "id" TEXT NOT NULL,
    "raceId" TEXT NOT NULL,
    "userId" TEXT,
    "guestId" TEXT,
    "displayName" TEXT NOT NULL,
    "status" "RacePlayerStatus" NOT NULL DEFAULT 'JOINED',
    "wpm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,
    "correctCharacters" INTEGER NOT NULL DEFAULT 0,
    "typedCharacters" INTEGER NOT NULL DEFAULT 0,
    "position" INTEGER,
    "points" INTEGER NOT NULL DEFAULT 0,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RacePlayer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserStats_userId_key" ON "UserStats"("userId");

-- CreateIndex
CREATE INDEX "UserStats_totalPoints_idx" ON "UserStats"("totalPoints" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Room_code_key" ON "Room"("code");

-- CreateIndex
CREATE INDEX "Room_hostId_idx" ON "Room"("hostId");

-- CreateIndex
CREATE INDEX "Room_status_mode_idx" ON "Room"("status", "mode");

-- CreateIndex
CREATE INDEX "RoomPlayer_roomId_status_idx" ON "RoomPlayer"("roomId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "RoomPlayer_roomId_userId_key" ON "RoomPlayer"("roomId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomPlayer_roomId_guestId_key" ON "RoomPlayer"("roomId", "guestId");

-- CreateIndex
CREATE INDEX "Race_roomId_status_idx" ON "Race"("roomId", "status");

-- CreateIndex
CREATE INDEX "Race_createdAt_idx" ON "Race"("createdAt");

-- CreateIndex
CREATE INDEX "RacePlayer_userId_createdAt_idx" ON "RacePlayer"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "RacePlayer_raceId_position_idx" ON "RacePlayer"("raceId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "RacePlayer_raceId_userId_key" ON "RacePlayer"("raceId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "RacePlayer_raceId_guestId_key" ON "RacePlayer"("raceId", "guestId");

-- AddForeignKey
ALTER TABLE "UserStats" ADD CONSTRAINT "UserStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomPlayer" ADD CONSTRAINT "RoomPlayer_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomPlayer" ADD CONSTRAINT "RoomPlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Race" ADD CONSTRAINT "Race_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Race" ADD CONSTRAINT "Race_textId_fkey" FOREIGN KEY ("textId") REFERENCES "TypingText"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RacePlayer" ADD CONSTRAINT "RacePlayer_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RacePlayer" ADD CONSTRAINT "RacePlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
