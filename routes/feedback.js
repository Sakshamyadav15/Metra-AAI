import { Router } from "express";
import {
  getAuditTrail,
  getPersonalizationProfile,
  getSenderGraph,
  postFeedback,
} from "../controllers/feedbackController.js";

const router = Router();

router.post("/", postFeedback);
router.get("/profile", getPersonalizationProfile);
router.get("/graph", getSenderGraph);
router.get("/audit", getAuditTrail);

export default router;
