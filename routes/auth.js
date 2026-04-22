import { Router } from "express";
import {
  getGoogleAuth,
  getGoogleCallback,
  getSessionStatus,
} from "../controllers/authController.js";

const router = Router();

router.get("/google", getGoogleAuth);
router.get("/callback", getGoogleCallback);
router.get("/session", getSessionStatus);

export default router;
