import { mkdir } from "node:fs/promises";
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

function normalizeConfiguredPath(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  const hasWrappingSingleQuotes =
    trimmedValue.startsWith("'") && trimmedValue.endsWith("'");
  const hasWrappingDoubleQuotes =
    trimmedValue.startsWith('"') && trimmedValue.endsWith('"');

  if (hasWrappingSingleQuotes || hasWrappingDoubleQuotes) {
    return trimmedValue.slice(1, -1).trim();
  }

  return trimmedValue;
}

export function resolveSqliteFilePath(): string {
  const configuredPath =
    normalizeConfiguredPath(process.env.LOCAL_SQLITE_CACHE_PATH) ??
    normalizeConfiguredPath(process.env.PM_SQLITE_PATH);

  return path.resolve(configuredPath && configuredPath.length > 0 ? configuredPath : defaultDatabasePath);
}

export function toSqliteUrl(filePath: string = resolveSqliteFilePath()): string {
  return `file:${filePath.replaceAll("\\", "/")}`;
}

export async function ensureSqliteDirectoryExists(
  filePath: string = resolveSqliteFilePath(),
): Promise<string> {
  await mkdir(path.dirname(filePath), { recursive: true });
  return filePath;
}
