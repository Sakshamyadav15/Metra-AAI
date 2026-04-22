import { Pool } from "pg";

const connectionString = process.env.POSTGRES_URL || "";

if (!connectionString) {
  console.log("POSTGRES_URL is not set. Skipping connectivity check.");
  process.exit(0);
}

const pool = new Pool({ connectionString });

try {
  const result = await pool.query("SELECT NOW() AS now");
  console.log("Postgres connectivity check passed:", result.rows[0].now);
} catch (error) {
  console.error("Postgres connectivity check failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
