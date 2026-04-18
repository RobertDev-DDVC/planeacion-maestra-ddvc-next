import path from "node:path";

const fallbackAppDataDirectory =
  process.env.APPDATA ??
  path.join(process.env.USERPROFILE ?? "C:\\Users\\Public", "AppData", "Roaming");

const defaultDatabasePath = path.join(
  fallbackAppDataDirectory,
  "pm-ddvc",
  "data",
  "local-credentials.sqlite",
);

export function resolveSqliteFilePath(): string {
  const configuredPath =
    process.env.LOCAL_SQLITE_CACHE_PATH?.trim() ?? process.env.PM_SQLITE_PATH?.trim();
  return path.resolve(configuredPath && configuredPath.length > 0 ? configuredPath : defaultDatabasePath);
}

export function toSqliteUrl(filePath: string = resolveSqliteFilePath()): string {
  return `file:${filePath.replaceAll("\\", "/")}`;
}
