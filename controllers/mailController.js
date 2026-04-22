import { isMockMode } from "../services/authHelpers.js";
import { enqueueTriageJob, getTriageJobStatus } from "../services/jobQueue.js";
import { getRequestTokens } from "../services/userContext.js";

async function waitForCompletion(jobId, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const status = await getTriageJobStatus(jobId);
    if (!status) {
      break;
    }

    if (status.status === "completed") {
      return status;
    }

    if (status.status === "failed") {
      return status;
    }

    await new Promise((resolve) => setTimeout(resolve, 900));
  }

  return null;
}

export async function postTriage(req, res) {
  try {
    const mockMode = isMockMode();
    const tokens = getRequestTokens(req);
    const liveMaxEmails = Number(process.env.TRIAGE_MAX_EMAILS || 10);
    const waitForResult = req.query.wait === "1" || req.body?.wait === true;

    if (!mockMode && !tokens) {
      return res.status(401).json({ error: "Unauthorized. Complete OAuth login first." });
    }

    const queued = await enqueueTriageJob({
      user: req.user,
      tokens,
      mockMode,
      maxEmails: liveMaxEmails,
    });

    if (!waitForResult) {
      return res.status(202).json({
        status: "queued",
        jobId: queued.id,
      });
    }

    const result = await waitForCompletion(queued.id);
    if (!result) {
      return res.status(202).json({
        status: "processing",
        jobId: queued.id,
      });
    }

    if (result.status === "failed") {
      return res.status(500).json({ error: result.error || "Unable to complete triage" });
    }

    const emails = result.result?.emails || [];

    return res.json({
      status: "completed",
      jobId: queued.id,
      emails,
    });
  } catch (error) {
    const providerError = error?.response?.data?.error;
    const providerCode = providerError?.code;
    const providerMessage = providerError?.message;

    console.error("triage_failed", error?.response?.data || error.message);

    if (providerCode === "invalid_api_key") {
      return res.status(500).json({
        error: "Groq API key is invalid. Update GROQ_API_KEY in .env and restart the server.",
      });
    }

    if (providerMessage) {
      return res.status(500).json({ error: `Triage failed: ${providerMessage}` });
    }

    return res.status(500).json({ error: "Unable to complete triage" });
  }
}
