import { Request, Response } from "express";
import { catchAsync } from "../../../utils/catchAsync";
import userStatsService from "../service/statu.service";

import { ApiResponse } from "../../../utils/apiResponse";

/**
 * GET /stats/me
 * Requires authentication middleware
 */
const getMyStats = catchAsync(async (req: any, res: Response) => {
  const stats = await userStatsService.getUserStats(req.user!.id);

  res
    .status(200)
    .json(new ApiResponse(200, stats, "Stats fetched successfully"));
});

/**
 * GET /stats/:userId
 */
const getStatsByUserId = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params as { userId: string };
  const stats = await userStatsService.getUserStats(userId);

  res
    .status(200)
    .json(new ApiResponse(200, stats, "Stats fetched successfully"));
});

/**
 * POST /stats/race-result
 * Body: { wpm, accuracy, points, won }
 * Requires authentication middleware
 */
const submitRaceResult = catchAsync(async (req: any, res: Response) => {
  const stats = await userStatsService.updateStatsAfterRace(
    req.user!.id,
    req.body,
  );

  res
    .status(200)
    .json(new ApiResponse(200, stats, "Stats updated successfully"));
});

/**
 * GET /stats/leaderboard
 * Query: ?limit=20&offset=0
 */
const leaderboard = catchAsync(async (req: Request, res: Response) => {
  const limit = Number(req.query.limit) || 20;
  const offset = Number(req.query.offset) || 0;

  const data = await userStatsService.getLeaderboard(limit, offset);

  res
    .status(200)
    .json(new ApiResponse(200, data, "Leaderboard fetched successfully"));
});

/**
 * POST /stats/reset
 * Requires authentication middleware (or admin middleware)
 */
const resetStats = catchAsync(async (req: any, res: Response) => {
  const stats = await userStatsService.resetUserStats(req.user!.id);

  res.status(200).json(new ApiResponse(200, stats, "Stats reset successfully"));
});

export default {
  getMyStats,
  getStatsByUserId,
  submitRaceResult,
  leaderboard,
  resetStats,
};
