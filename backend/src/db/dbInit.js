const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL;
const pool = new Pool({ connectionString: DATABASE_URL });

async function runSql(filePath) {
  const sql = fs.readFileSync(filePath, "utf8");
  if (!sql.trim()) return;
  await pool.query(sql);
  console.log("Ran:", filePath);
}

async function main() {
  const migrationsDir = path.join(__dirname, "..", "migrations");
  const seedsDir = path.join(__dirname, "..", "seeds");
  const seedFile = path.join(seedsDir, "seed_data.sql");

  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.toLowerCase().endsWith(".sql"))
    .sort();

  for (const f of migrationFiles) {
    await runSql(path.join(migrationsDir, f));
  }

  if (fs.existsSync(seedFile)) {
    await runSql(seedFile);
  }

  await pool.end();
}

main().catch(async (e) => {
  console.error("DB init failed:", e);
  try { await pool.end(); } catch {}
  process.exit(1);
});
