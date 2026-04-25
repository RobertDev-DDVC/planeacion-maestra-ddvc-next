import type { DimProductoPreviewItem } from "@/lib/fabric-dim-producto";

type DimProductoPreviewProps = {
  readonly rows: DimProductoPreviewItem[];
  readonly errorMessage: string | null;
};

type DimProductoColumnKey = Extract<keyof DimProductoPreviewItem, string>;

const columns: ReadonlyArray<{
  readonly key: DimProductoColumnKey;
  readonly label: string;
}> = [
  { key: "ProductoMaestro", label: "Producto maestro" },
  { key: "CodigoProducto", label: "Código" },
  { key: "name", label: "Nombre" },
  { key: "GrupoProducto", label: "Marca" },
  { key: "primaryvendorid", label: "Proveedor" },
  { key: "iemflag_importacion", label: "Importación" },
  { key: "productlifecyclestateid", label: "Estado" },
  { key: "reqgroupid", label: "Grupo req." },
  { key: "modifieddatetime", label: "Actualizado" },
];

function formatCellValue(
  key: DimProductoColumnKey,
  value: DimProductoPreviewItem[DimProductoColumnKey],
): string {
  if (value === null || value === undefined || value === "") {
    return "Sin dato";
  }

  if (key === "iemflag_importacion") {
    return value === "1" ? "Sí" : "No";
  }

  if (key === "modifieddatetime" && typeof value === "string") {
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }

  return String(value);
}

export function DimProductoPreview({
  rows,
  errorMessage,
}: DimProductoPreviewProps) {
  return (
    <section className="mt-8 overflow-hidden rounded-[26px] border border-border-soft bg-slate-950 text-white shadow-[0_26px_60px_rgba(12,40,84,0.2)]">
      <div className="flex flex-col gap-3 border-b border-white/10 bg-[linear-gradient(135deg,#0f2b46_0%,#17324d_48%,#1f5f72_100%)] px-5 py-5 sm:flex-row sm:items-end sm:justify-between lg:px-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100/80">
            Fabric Warehouse
          </p>
          <h2 className="mt-2 text-xl font-black tracking-normal sm:text-2xl">
            Vista previa de dbo.dim_producto
          </h2>
        </div>
        <div className="w-fit rounded-full border border-white/18 bg-white/12 px-3 py-1 text-xs font-bold text-cyan-50">
          {rows.length} registros
        </div>
      </div>

      {errorMessage ? (
        <div className="bg-rose-950/60 px-5 py-4 text-sm font-semibold text-rose-100 lg:px-6">
          {errorMessage}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-320 border-collapse text-left text-sm">
            <thead>
              <tr className="bg-slate-900 text-xs uppercase tracking-[0.12em] text-cyan-100/75">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="border-b border-white/10 px-4 py-3 font-black"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {rows.map((row, rowIndex) => (
                <tr
                  key={`${row.Productorecid ?? row.CodigoProducto ?? "producto"}-${rowIndex}`}
                  className="bg-slate-950 transition-colors odd:bg-slate-900/46 hover:bg-cyan-950/40"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="max-w-90 px-4 py-3 align-top text-slate-100"
                    >
                      <span className="line-clamp-2">
                        {formatCellValue(column.key, row[column.key])}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
