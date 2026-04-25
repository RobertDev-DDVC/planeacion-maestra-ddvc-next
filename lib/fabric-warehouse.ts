import * as sql from "mssql";
import type { ConnectionPool, IResult, config as SqlConfig } from "mssql";

type FabricEnv = {
  readonly server: string;
  readonly port: number;
  readonly database: string;
  readonly tenantId: string;
  readonly clientId: string;
  readonly clientSecret: string;
};

type FabricHealthRow = {
  readonly connectedAt: Date;
  readonly databaseName: string;
};

const globalForFabric = globalThis as typeof globalThis & {
  fabricWarehousePool?: Promise<ConnectionPool>;
};

function readRequiredEnv(keys: readonly string[]): string {
  for (const key of keys) {
    const value = process.env[key]?.trim();

    if (value) {
      return value;
    }
  }

  throw new Error(`Missing required environment variable. Expected one of: ${keys.join(", ")}`);
}

function parseFabricServer(rawServer: string): Pick<FabricEnv, "server" | "port"> {
  const normalizedServer = rawServer
    .trim()
    .replace(/^tcp:/i, "")
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "");
  const [server, rawPort] = normalizedServer.split(",", 2);
  const port = rawPort ? Number(rawPort) : 1433;

  if (!server) {
    throw new Error("FABRIC_SERVER must include the Fabric SQL endpoint host.");
  }

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("FABRIC_SERVER port must be a positive integer.");
  }

  return { server, port };
}

function resolveFabricEnv(): FabricEnv {
  const { server, port } = parseFabricServer(
    readRequiredEnv(["FABRIC_SERVER", "FABRIC_WAREHOUSE_SERVER"]),
  );

  return {
    server,
    port,
    database: readRequiredEnv(["FABRIC_DATABASE", "FABRIC_WAREHOUSE_DATABASE"]),
    tenantId: readRequiredEnv(["FABRIC_TENANT_ID", "GRAPH_TENANT_ID"]),
    clientId: readRequiredEnv(["FABRIC_CLIENT_ID", "FABRIC_CLIENT_ID"]),
    clientSecret: readRequiredEnv(["FABRIC_CLIENT_SECRET", "FABRIC_CLIENT_SECRET"]),
  };
}

export function getFabricWarehouseConfig(): SqlConfig {
  const env = resolveFabricEnv();

  return {
    server: env.server,
    port: env.port,
    database: env.database,
    connectionTimeout: 30_000,
    requestTimeout: 120_000,
    pool: {
      max: 5,
      min: 0,
      idleTimeoutMillis: 30_000,
    },
    options: {
      encrypt: true,
      trustServerCertificate: false,
    },
    authentication: {
      type: "azure-active-directory-service-principal-secret",
      options: {
        clientId: env.clientId,
        clientSecret: env.clientSecret,
        tenantId: env.tenantId,
      },
    },
  };
}

export function getFabricWarehousePool(): Promise<ConnectionPool> {
  if (!globalForFabric.fabricWarehousePool) {
    globalForFabric.fabricWarehousePool = new sql.ConnectionPool(
      getFabricWarehouseConfig(),
    ).connect();
  }

  return globalForFabric.fabricWarehousePool;
}

export async function queryFabricWarehouse<Row extends object>(
  statement: string,
): Promise<IResult<Row>> {
  const pool = await getFabricWarehousePool();

  return pool.request().query<Row>(statement);
}

export async function checkFabricWarehouseConnection(): Promise<FabricHealthRow> {
  const result = await queryFabricWarehouse<FabricHealthRow>(`
    SELECT
      SYSDATETIME() AS connectedAt,
      DB_NAME() AS databaseName
  `);
  const [row] = result.recordset;

  if (!row) {
    throw new Error("Fabric Warehouse connection succeeded but returned no health row.");
  }

  return row;
}
