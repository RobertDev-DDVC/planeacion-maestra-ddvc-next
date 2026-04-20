import type {
  FilterPanelData,
  InventoryParameter,
  RadioOption,
} from "@/types/home/home.types";

export type PlanDdvcExportInput = {
  brandPanel: FilterPanelData;
  supplierPanel: FilterPanelData;
  parameters: InventoryParameter[];
  originOptions: RadioOption[];
  workdayOptions: RadioOption[];
  includeObsolete: boolean;
};

export type SaveOutcome = "downloaded" | "saved" | "cancelled";

export type ExportPlanDdvcResult = {
  outcome: SaveOutcome;
  warningMessage: string | null;
};

export type SharePointSyncOutcome = "failed" | "skipped" | "synced";

export type PlanDdvcLogEntry = {
  accion: "Plan DDVC";
  fecha: string;
  filtro: string;
  origen: string | null;
  parametros: Record<string, number>;
  selectionValues: {
    brands: string[];
    suppliers: string[];
    workdays: string[];
  };
  usuario: string;
};

export type LogSnapshot = {
  content: string;
  fileName: string;
};

export type PlanDdvcWorkbookData = {
  defaultName: string;
  buffer: Uint8Array;
  logEntry: PlanDdvcLogEntry;
};

export type PlanRow = {
  CompraSugerida: number;
  DiaOperacion: string;
  Emergencia: number;
  Estatus: string;
  ExistenciaActual: number;
  Marca: string;
  Maximo: number;
  Minimo: number;
  Origen: string;
  Producto: string;
  Proveedor: string;
  VentaPromedio: number;
};

