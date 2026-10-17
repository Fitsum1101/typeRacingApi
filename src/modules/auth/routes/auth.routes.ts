import { Router } from "express";
import {
  register,
  login,
  me,
  refresh,
  logout,
} from "../controller/auth.controller";
// import your auth middleware here if needed, e.g.:
// import { authenticate } from "../../../middleware/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", /* authenticate, */ me);
router.post("/refresh", refresh);
router.post("/logout", logout);

export default router;
