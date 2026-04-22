import path from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "../services/db.js";
import { getSqliteMigrationStatus, runSqliteMigrations } from "../services/migrationService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");
const migrationsDir = path.resolve(projectRoot, "server", "migrations");

runSqliteMigrations(db, migrationsDir);
const status = getSqliteMigrationStatus(db, migrationsDir);

console.log("SQLite migrations status:");
for (const row of status) {
  console.log(`- ${row.version}: ${row.applied ? "applied" : "pending"}`);
}
