import { ensureSqliteDirectoryExists, toSqliteUrl } from "@/lib/sqlite-config";

const globalForPrisma = globalThis as {
  prisma?: unknown;
};

type PrismaModule = typeof import("@/generated/prisma/client");
type PrismaClientInstance = InstanceType<PrismaModule["PrismaClient"]>;

export class SqliteNativeBindingError extends Error {
  override cause?: unknown;

  constructor(cause?: unknown) {
    super(
      "No se pudo cargar el runtime nativo de SQLite. Habilita scripts con `ignore-scripts=false` y ejecuta `pnpm rebuild better-sqlite3`.",
    );
    this.name = "SqliteNativeBindingError";
    this.cause = cause;
  }
}

function shouldWrapAsSqliteNativeBindingError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes("Could not locate the bindings file") ||
    message.includes("better_sqlite3.node") ||
    message.includes("better-sqlite3")
  );
}

export function isSqliteNativeBindingError(
  error: unknown,
): error is SqliteNativeBindingError {
  return error instanceof SqliteNativeBindingError;
}

async function createPrismaClient(): Promise<PrismaClientInstance> {
  try {
    const sqliteFilePath = await ensureSqliteDirectoryExists();
    const [{ PrismaBetterSqlite3 }, { PrismaClient }] = await Promise.all([
      import("@prisma/adapter-better-sqlite3"),
      import("@/generated/prisma/client"),
    ]);

    return new PrismaClient({
      adapter: new PrismaBetterSqlite3({
        url: toSqliteUrl(sqliteFilePath),
      }),
    });
  } catch (error) {
    if (shouldWrapAsSqliteNativeBindingError(error)) {
      throw new SqliteNativeBindingError(error);
    }

    throw error;
  }
}

export async function getPrisma(): Promise<PrismaClientInstance> {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  try {
    return (await globalForPrisma.prisma) as PrismaClientInstance;
  } catch (error) {
    globalForPrisma.prisma = undefined;
    throw error;
  }
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = globalForPrisma.prisma;
}
