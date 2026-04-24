import "dotenv/config";

import { checkFabricWarehouseConnection } from "../lib/fabric-warehouse";

async function main(): Promise<void> {
  const health = await checkFabricWarehouseConnection();

  console.log("Fabric Warehouse connection OK");
  console.log(`Database: ${health.databaseName}`);
  console.log(`Connected at: ${health.connectedAt.toISOString()}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  console.error("Fabric Warehouse connection failed");
  console.error(message);
  process.exitCode = 1;
});
