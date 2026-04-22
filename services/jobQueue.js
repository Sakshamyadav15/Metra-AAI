import { Queue, Worker, QueueEvents } from "bullmq";
import IORedis from "ioredis";
import { runTriage } from "./triageEngine.js";

const REDIS_URL = process.env.REDIS_URL || "";
const USE_QUEUE = process.env.ASYNC_TRIAGE !== "false";
const REDIS_REQUIRED =
  process.env.REDIS_REQUIRED === "true" || process.env.NODE_ENV === "production";

let redisConnection = null;
let triageQueue = null;
let triageQueueEvents = null;
let triageWorker = null;

const inMemoryJobs = new Map();

function getRedisConnection() {
  if (!REDIS_URL) {
    return null;
  }

  if (!redisConnection) {
    redisConnection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }

  return redisConnection;
}

function assertRedisPolicy() {
  if (!USE_QUEUE) {
    return;
  }

  if (!REDIS_URL && REDIS_REQUIRED) {
    throw new Error(
      "Redis is required for async triage in this environment. Set REDIS_URL or disable ASYNC_TRIAGE.",
    );
  }
}

export function initTriageQueue() {
  assertRedisPolicy();

  if (!USE_QUEUE) {
    return;
  }

  const connection = getRedisConnection();
  if (!connection) {
    console.warn("Redis not configured. Falling back to in-memory triage jobs.");
    return;
  }

  triageQueue = new Queue("triage-jobs", { connection });
  triageQueueEvents = new QueueEvents("triage-jobs", { connection });

  triageWorker = new Worker(
    "triage-jobs",
    async (job) => {
      const result = await runTriage(job.data);
      return result;
    },
    { connection, concurrency: Number(process.env.TRIAGE_WORKER_CONCURRENCY || 2) },
  );

  triageWorker.on("failed", (job, error) => {
    console.error("triage_job_failed", job?.id, error.message);
  });
}

export async function enqueueTriageJob(payload) {
  assertRedisPolicy();

  if (triageQueue) {
    const job = await triageQueue.add("triage", payload, {
      removeOnComplete: true,
      removeOnFail: 100,
      attempts: 2,
    });
    return { id: String(job.id), mode: "queue" };
  }

  if (REDIS_REQUIRED) {
    throw new Error("Redis-required mode is enabled, but queue is unavailable.");
  }

  const jobId = `mem-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  inMemoryJobs.set(jobId, {
    id: jobId,
    status: "processing",
    createdAt: new Date().toISOString(),
    result: null,
    error: null,
  });

  runTriage(payload)
    .then((result) => {
      inMemoryJobs.set(jobId, {
        id: jobId,
        status: "completed",
        createdAt: inMemoryJobs.get(jobId)?.createdAt,
        finishedAt: new Date().toISOString(),
        result,
        error: null,
      });
    })
    .catch((error) => {
      inMemoryJobs.set(jobId, {
        id: jobId,
        status: "failed",
        createdAt: inMemoryJobs.get(jobId)?.createdAt,
        finishedAt: new Date().toISOString(),
        result: null,
        error: error?.response?.data?.error?.message || error.message,
      });
    });

  return { id: jobId, mode: "memory" };
}

export async function getTriageJobStatus(jobId) {
  if (triageQueue) {
    const job = await triageQueue.getJob(jobId);
    if (!job) {
      return null;
    }

    const state = await job.getState();
    const result = state === "completed" ? await job.returnvalue : null;
    const failedReason = job.failedReason || null;

    return {
      id: String(job.id),
      status: state,
      result,
      error: failedReason,
      createdAt: new Date(job.timestamp).toISOString(),
      finishedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
    };
  }

  return inMemoryJobs.get(jobId) || null;
}
