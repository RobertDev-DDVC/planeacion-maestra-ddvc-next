import "dotenv/config";
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "../generated/prisma/client.ts";

function getArgument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

function getBooleanArgument(name: string, fallbackValue: boolean): boolean {
  const value = getArgument(name);

  if (value === undefined) {
    return fallbackValue;
  }

  return value.toLowerCase() !== "false";
}

function resolveSqliteFilePath(): string {
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

function toSqliteUrl(filePath: string): string {
  return `file:${filePath.replaceAll("\\", "/")}`;
}

async function main() {
  const username = getArgument("--username");
  const password = getArgument("--password");
  const dateValue = getArgument("--date");
  const isActive = getBooleanArgument("--isActive", true);

  if (!username || !password) {
    throw new Error(
      "Uso: pnpm sqlite:add --username usuario --password secreto [--date 2026-04-18T10:00:00.000Z] [--isActive false]",
    );
  }

  const databasePath = resolveSqliteFilePath();
  await mkdir(path.dirname(databasePath), { recursive: true });

  const prisma = new PrismaClient({
    adapter: new PrismaBetterSqlite3({
      url: toSqliteUrl(databasePath),
    }),
  });

  try {
    const record = await prisma.localCredential.create({
      data: {
        username,
        password,
        date: dateValue ? new Date(dateValue) : new Date(),
        isActive,
      },
    });

    console.log(JSON.stringify(record, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
