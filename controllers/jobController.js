import { enqueueTriageJob, getTriageJobStatus } from "../services/jobQueue.js";
import { isMockMode } from "../services/authHelpers.js";
import { getRequestTokens } from "../services/userContext.js";
import { getLatestItems, getRecentRuns } from "../services/persistenceService.js";

export async function postTriageJob(req, res) {
  try {
    const user = req.user;
    const tokens = getRequestTokens(req);
    const maxEmails = Number(req.body?.maxEmails || process.env.TRIAGE_MAX_EMAILS || 10);

    if (!isMockMode() && !tokens) {
      return res.status(401).json({ error: "Unauthorized. Complete OAuth login first." });
    }

    const queued = await enqueueTriageJob({
      user,
      tokens,
      mockMode: isMockMode(),
      maxEmails,
    });

    return res.status(202).json({
      jobId: queued.id,
      status: "queued",
      mode: queued.mode,
    });
  } catch (error) {
    console.error("triage_job_enqueue_failed", error.message);
    if (error.message.toLowerCase().includes("redis")) {
      return res.status(503).json({ error: error.message });
    }
    return res.status(500).json({ error: "Failed to queue triage job" });
  }
}

export async function getJob(req, res) {
  const { jobId } = req.params;
  const status = await getTriageJobStatus(jobId);
  if (!status) {
    return res.status(404).json({ error: "Job not found" });
  }
  return res.json(status);
}

export function getRecentJobs(req, res) {
  const runs = getRecentRuns(req.user.id, 30);
  return res.json({ jobs: runs });
}

export function getLatestTriageHistory(req, res) {
  const items = getLatestItems(req.user.id, 100);
  return res.json({ emails: items });
}
