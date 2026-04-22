import { Router } from "express";
import {
  getJob,
  getLatestTriageHistory,
  getRecentJobs,
  postTriageJob,
} from "../controllers/jobController.js";

const router = Router();

router.post("/triage", postTriageJob);
router.get("/", getRecentJobs);
router.get("/history/latest", getLatestTriageHistory);
router.get("/:jobId", getJob);

export default router;
