import "dotenv/config";

import { queryFabricWarehouse } from "../lib/fabric-warehouse";

type DimProductoRow = Record<string, unknown>;

async function main(): Promise<void> {
  const result = await queryFabricWarehouse<DimProductoRow>(`
    SELECT TOP (100)
      *
    FROM [dbo].[dim_producto]
  `);

  console.log(`Rows returned: ${result.recordset.length}`);
  console.table(result.recordset);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  console.error("Failed to query dbo.dim_producto");
  console.error(message);
  process.exitCode = 1;
});
