import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { runSqliteMigrations } from "./migrationService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");

const configuredDbPath = process.env.DB_PATH || "./data/triage.db";
const dbPath = path.isAbsolute(configuredDbPath)
  ? configuredDbPath
  : path.resolve(projectRoot, configuredDbPath);
const migrationsDir = path.resolve(projectRoot, "server", "migrations");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
runSqliteMigrations(db, migrationsDir);

export { db };
