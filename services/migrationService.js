import fs from "node:fs";
import path from "node:path";

function ensureMigrationsTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function listAppliedVersions(db) {
  const rows = db.prepare("SELECT version FROM schema_migrations ORDER BY version ASC").all();
  return new Set(rows.map((row) => row.version));
}

function listMigrationFiles(migrationsDir) {
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }

  return fs
    .readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));
}

export function runSqliteMigrations(db, migrationsDir) {
  ensureMigrationsTable(db);
  const applied = listAppliedVersions(db);
  const migrationFiles = listMigrationFiles(migrationsDir);

  for (const fileName of migrationFiles) {
    if (applied.has(fileName)) {
      continue;
    }

    const filePath = path.join(migrationsDir, fileName);
    const sql = fs.readFileSync(filePath, "utf8");

    const tx = db.transaction(() => {
      db.exec(sql);
      db.prepare("INSERT INTO schema_migrations (version) VALUES (?)").run(fileName);
    });

    tx();
  }
}

export function getSqliteMigrationStatus(db, migrationsDir) {
  ensureMigrationsTable(db);
  const applied = listAppliedVersions(db);
  const migrationFiles = listMigrationFiles(migrationsDir);

  return migrationFiles.map((fileName) => ({
    version: fileName,
    applied: applied.has(fileName),
  }));
}
