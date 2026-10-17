import { Router } from "express";
import authController from "../controller/auth.controller";
// import your auth middleware here if needed, e.g.:
// import { authenticate } from "../../../middleware/auth.middleware";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", /* authenticate, */ authController.me);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

export default router;
