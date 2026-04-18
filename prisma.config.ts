import "dotenv/config";
import { defineConfig } from "prisma/config";

const appDataDirectory =
  process.env.APPDATA ??
  `${process.env.USERPROFILE ?? "C:/Users/Public"}/AppData/Roaming`;

const defaultDatabasePath = `${appDataDirectory}/pm-ddvc/data/local-credentials.sqlite`;
const databasePath = (process.env.PM_SQLITE_PATH ?? defaultDatabasePath).replaceAll(
  "\\",
  "/",
);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: `file:${databasePath}`,
  },
});
