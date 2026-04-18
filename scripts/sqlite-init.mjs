import "dotenv/config";
import { mkdir } from "node:fs/promises";
import path from "node:path";

import Database from "better-sqlite3";

function resolveSqliteFilePath() {
  const appDataDirectory =
    process.env.APPDATA ??
    path.join(process.env.USERPROFILE ?? "C:\\Users\\Public", "AppData", "Roaming");

  const defaultDatabasePath = path.join(
    appDataDirectory,
    "pm-ddvc",
    "data",
    "local-credentials.sqlite",
  );

  return path.resolve(
    process.env.LOCAL_SQLITE_CACHE_PATH ?? process.env.PM_SQLITE_PATH ?? defaultDatabasePath,
  );
}

async function main() {
  const databasePath = resolveSqliteFilePath();
  await mkdir(path.dirname(databasePath), { recursive: true });

  const db = new Database(databasePath);

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS local_credentials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        isActive BOOLEAN NOT NULL DEFAULT 1
      )
    `);

    console.log(`SQLite inicializado en: ${databasePath}`);
  } finally {
    db.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
