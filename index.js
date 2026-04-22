import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

import authRoutes from "./routes/auth.js";
import triageRoutes from "./routes/triage.js";
import sendRoutes from "./routes/send.js";
import jobRoutes from "./routes/jobs.js";
import feedbackRoutes from "./routes/feedback.js";
import providerRoutes from "./routes/providers.js";
import { createSessionMiddleware } from "./services/sessionStore.js";
import { hydrateMockUserSession, requireUser } from "./services/userContext.js";
import { initTriageQueue } from "./services/jobQueue.js";
import "./services/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const port = Number(process.env.PORT || 5000);
const defaultOrigins = ["http://localhost:3000", "http://localhost:5175"];
const configuredOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = configuredOrigins.length ? configuredOrigins : defaultOrigins;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(createSessionMiddleware());
app.use(hydrateMockUserSession);

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    mode: process.env.MOCK_MODE !== "false" ? "mock" : "live",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/triage", requireUser, triageRoutes);
app.use("/api", requireUser, sendRoutes);
app.use("/api/jobs", requireUser, jobRoutes);
app.use("/api/feedback", requireUser, feedbackRoutes);
app.use("/api/providers", requireUser, providerRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

initTriageQueue();

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
