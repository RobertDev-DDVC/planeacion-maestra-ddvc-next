import { queryFabricWarehouse } from "@/lib/fabric-warehouse";

export type DimProductoPreviewRow = {
  readonly ProductoMaestro: string | null;
  readonly Productorecid: string | null;
  readonly VariantRecId: string | null;
  readonly CodigoVariante: string | null;
  readonly ProductRecIDDDVC: string | null;
  readonly GrupoProducto: string | null;
  readonly CodigoProducto: string | null;
  readonly RecIdProducto: string | null;
  readonly name: string | null;
  readonly grossdepth: number | null;
  readonly grossheight: number | null;
  readonly grosswidth: number | null;
  readonly netweight: number | null;
  readonly iemflag_importacion: string | null;
  readonly primaryvendorid: string | null;
  readonly productlifecyclestateid: string | null;
  readonly reqgroupid: string | null;
  readonly modifieddatetime: Date | null;
};

export type DimProductoPreviewItem = Omit<
  DimProductoPreviewRow,
  "modifieddatetime"
> & {
  readonly modifieddatetime: string | null;
};

function serializeDimProductoRow(row: DimProductoPreviewRow): DimProductoPreviewItem {
  return {
    ...row,
    modifieddatetime: row.modifieddatetime?.toISOString() ?? null,
  };
}

export async function getDimProductoPreview(
  take = 100,
): Promise<DimProductoPreviewItem[]> {
  const result = await queryFabricWarehouse<DimProductoPreviewRow>(`
    SELECT TOP (${take})
      [ProductoMaestro],
      [Productorecid],
      [VariantRecId],
      [CodigoVariante],
      [ProductRecIDDDVC],
      [GrupoProducto],
      [CodigoProducto],
      [RecIdProducto],
      [name],
      [grossdepth],
      [grossheight],
      [grosswidth],
      [netweight],
      [iemflag_importacion],
      [primaryvendorid],
      [productlifecyclestateid],
      [reqgroupid],
      [modifieddatetime]
    FROM [dbo].[dim_producto]
  `);

  return result.recordset.map(serializeDimProductoRow);
}
