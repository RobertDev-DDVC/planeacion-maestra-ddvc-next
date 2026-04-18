import "dotenv/config";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const appDataDirectory =
  process.env.APPDATA ??
  path.join(process.env.USERPROFILE ?? "C:\\Users\\Public", "AppData", "Roaming");

const defaultDatabasePath = path.join(
  appDataDirectory,
  "pm-ddvc",
  "data",
  "local-credentials.sqlite",
);

const databasePath = path.resolve(
  process.env.LOCAL_SQLITE_CACHE_PATH ?? process.env.PM_SQLITE_PATH ?? defaultDatabasePath,
);

await mkdir(path.dirname(databasePath), { recursive: true });
console.log(`Ruta SQLite lista: ${databasePath}`);
