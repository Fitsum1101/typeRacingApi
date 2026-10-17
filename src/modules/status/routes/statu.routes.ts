import { Router } from "express";
import userStatsController from "../controller/statu.controller";

// import { authenticate } from "../../../middleware/auth.middleware";

const router = Router();

router.get("/me", /* authenticate, */ userStatsController.getMyStats);
router.get("/leaderboard", userStatsController.leaderboard);
router.get("/:userId", userStatsController.getStatsByUserId);
router.post(
  "/race-result",
  /* authenticate, */ userStatsController.submitRaceResult,
);
router.post("/reset", /* authenticate, */ userStatsController.resetStats);

export default router;
