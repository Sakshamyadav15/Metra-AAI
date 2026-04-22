import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");

const configuredDbPath = process.env.DB_PATH || "./server/data/triage.db";
const dbPath = path.isAbsolute(configuredDbPath)
  ? configuredDbPath
  : path.resolve(projectRoot, configuredDbPath);

if (!fs.existsSync(dbPath)) {
  throw new Error(`SQLite database does not exist at ${dbPath}`);
}

const backupsDir = path.resolve(projectRoot, "server", "data", "backups");
fs.mkdirSync(backupsDir, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupPath = path.join(backupsDir, `triage-${timestamp}.db`);
fs.copyFileSync(dbPath, backupPath);

console.log(`Backup created: ${backupPath}`);
