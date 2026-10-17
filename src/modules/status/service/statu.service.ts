import { prisma } from "../../../config/db";
import { ApiError } from "../../../utils/apiError";

type RaceResultInput = {
  wpm: number;
  accuracy: number;
  points: number;
  won: boolean;
};

/**
 * Get stats for a user. Creates an empty record if none exists.
 */
async function getUserStats(userId: string) {
  let stats = await prisma.userStats.findUnique({
    where: { userId },
  });

  if (!stats) {
    stats = await prisma.userStats.create({
      data: { userId },
    });
  }

  return stats;
}

/**
 * Update stats after a completed race.
 * Recalculates averages and best WPM.
 */
async function updateStatsAfterRace(userId: string, result: RaceResultInput) {
  const { wpm, accuracy, points, won } = result;

  if (wpm < 0 || accuracy < 0 || accuracy > 100 || points < 0) {
    throw ApiError.badRequest("Invalid race result values");
  }

  const current = await getUserStats(userId);

  const newTotalRaces = current.totalRaces + 1;
  const newRacesWon = current.racesWon + (won ? 1 : 0);
  const newTotalPoints = current.totalPoints + points;

  // Running average: (oldAvg * oldCount + newValue) / newCount
  const newAverageWpm =
    (current.averageWpm * current.totalRaces + wpm) / newTotalRaces;
  const newAverageAccuracy =
    (current.averageAccuracy * current.totalRaces + accuracy) / newTotalRaces;

  const newBestWpm = Math.max(current.bestWpm, wpm);

  const updated = await prisma.userStats.update({
    where: { userId },
    data: {
      totalRaces: newTotalRaces,
      racesWon: newRacesWon,
      totalPoints: newTotalPoints,
      bestWpm: newBestWpm,
      averageWpm: Number(newAverageWpm.toFixed(2)),
      averageAccuracy: Number(newAverageAccuracy.toFixed(2)),
    },
  });

  return updated;
}

/**
 * Get leaderboard ordered by totalPoints (descending).
 */
async function getLeaderboard(limit = 20, offset = 0) {
  const [entries, total] = await Promise.all([
    prisma.userStats.findMany({
      orderBy: { totalPoints: "desc" },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    }),
    prisma.userStats.count(),
  ]);

  return {
    entries,
    total,
    limit,
    offset,
  };
}

/**
 * Reset a user's stats (admin / testing helper).
 */
async function resetUserStats(userId: string) {
  const stats = await prisma.userStats.findUnique({
    where: { userId },
  });

  if (!stats) {
    throw ApiError.notFound("User stats not found");
  }

  return prisma.userStats.update({
    where: { userId },
    data: {
      totalRaces: 0,
      racesWon: 0,
      totalPoints: 0,
      bestWpm: 0,
      averageWpm: 0,
      averageAccuracy: 0,
    },
  });
}

export default {
  getUserStats,
  updateStatsAfterRace,
  getLeaderboard,
  resetUserStats,
};
