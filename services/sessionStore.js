import session from "express-session";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sqlite3 from "sqlite3";
import connectSqlite3 from "connect-sqlite3";

const SQLiteStore = connectSqlite3(session);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");

export function createSessionMiddleware() {
  const configuredSessionPath = process.env.SESSION_DB_PATH || "./data/sessions.sqlite";
  const sessionPath = path.isAbsolute(configuredSessionPath)
    ? configuredSessionPath
    : path.resolve(projectRoot, configuredSessionPath);
  fs.mkdirSync(path.dirname(sessionPath), { recursive: true });
  const db = path.basename(sessionPath);
  const dir = path.dirname(sessionPath);

  return session({
    secret: process.env.SESSION_SECRET || "insecure-dev-secret",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: new SQLiteStore({
      db,
      dir,
      concurrentDB: true,
      driver: sqlite3.Database,
    }),
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  });
}
