"use client";

import * as XLSX from "xlsx";

import type {
  ExportPlanDdvcResult,
  LogSnapshot,
  PlanDdvcExportInput,
  PlanDdvcWorkbookData,
  PlanRow,
  SaveOutcome,
  SharePointSyncOutcome,
} from "@/types/export/plan-ddvc-export.types";

const EXCEL_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const MOCK_PRODUCTS = [
  "Kit de Profilaxis",
  "Resina Fluida A2",
  "Guantes de Nitrilo M",
  "Anestesia Tópica",
  "Puntas de Mezcla",
  "Alginato Cromático",
] as const;

export async function exportPlanDdvcWorkbook(
  input: PlanDdvcExportInput,
): Promise<ExportPlanDdvcResult> {
  const workbookData = buildPlanDdvcWorkbook(input);
  let sharePointSyncPromise = Promise.resolve(
    "skipped" as SharePointSyncOutcome,
  );

  if (window.electronAPI?.writeLog) {
    const logSnapshot = await window.electronAPI.writeLog(workbookData.logEntry);
    sharePointSyncPromise = syncDailyLogSnapshot(logSnapshot);
  }

  if (window.electronAPI?.saveExcel) {
    const filePath = await window.electronAPI.saveExcel(
      workbookData.buffer,
      workbookData.defaultName,
    );
    const sharePointSyncOutcome = await sharePointSyncPromise;
    const outcome = filePath ? "saved" : "cancelled";

    return {
      outcome,
      warningMessage: getSharePointWarningMessage(sharePointSyncOutcome, outcome),
    };
  }

  downloadInBrowser(workbookData.buffer, workbookData.defaultName);
  const sharePointSyncOutcome = await sharePointSyncPromise;
  return {
    outcome: "downloaded",
    warningMessage: getSharePointWarningMessage(
      sharePointSyncOutcome,
      "downloaded",
    ),
  };
}

async function syncDailyLogSnapshot(
  logSnapshot: LogSnapshot,
): Promise<SharePointSyncOutcome> {
  try {
    const response = await fetch("/api/sharepoint/logs", {
      body: JSON.stringify(logSnapshot),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      return "failed";
    }

    const payload = (await response.json()) as { skipped?: boolean };
    return payload.skipped ? "skipped" : "synced";
  } catch {
    return "failed";
  }
}

function getSharePointWarningMessage(
  sharePointSyncOutcome: SharePointSyncOutcome,
  outcome: SaveOutcome,
) {
  if (sharePointSyncOutcome !== "failed") {
    return null;
  }

  if (outcome === "saved") {
    return "El archivo se guardo localmente, pero no se sincronizo el log con SharePoint.";
  }

  if (outcome === "downloaded") {
    return "La exportacion se genero, pero no se sincronizo el log con SharePoint.";
  }

  return "El log local se guardo, pero no se sincronizo con SharePoint.";
}

function buildPlanDdvcWorkbook(
  input: PlanDdvcExportInput,
): PlanDdvcWorkbookData {
  const selectedBrands = getSelectedLabels(input.brandPanel.options);
  const selectedSuppliers = getSelectedLabels(input.supplierPanel.options);
  const selectedWorkdays = getCheckedLabels(input.workdayOptions);
  const selectedOrigin = getCheckedLabel(input.originOptions);
  const activeFilter = resolveActiveFilter({
    selectedBrands,
    selectedOrigin,
    selectedSuppliers,
    selectedWorkdays,
  });
  const parameters = normalizeParameters(input.parameters);
  const timestamp = new Date();
  const defaultName = `plan-ddvc-${formatFileTimestamp(timestamp)}.xlsx`;

  const workbook = XLSX.utils.book_new();
  workbook.Props = {
    Author: "PM DDVC",
    CreatedDate: timestamp,
    Subject: "Exportacion de Plan DDVC",
    Title: "Plan DDVC",
  };

  const summaryRows = [
    ["Campo", "Valor"],
    ["Accion", "Plan DDVC"],
    ["Fecha de generacion", formatReadableTimestamp(timestamp)],
    ["Filtro activo", activeFilter],
    ["Marcas seleccionadas", joinOrFallback(selectedBrands)],
    ["Proveedores seleccionados", joinOrFallback(selectedSuppliers)],
    ["Origen", selectedOrigin ?? "Sin seleccionar"],
    ["Dias de operacion", joinOrFallback(selectedWorkdays)],
    ["Emergencia", parameters.emergencia],
    ["Minimo", parameters.minimo],
    ["Maximo", parameters.maximo],
    ["Incluir productos obsoletos", input.includeObsolete ? "Si" : "No"],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  summarySheet["!cols"] = [{ wch: 24 }, { wch: 54 }];

  const planRows = buildMockPlanRows({
    includeObsolete: input.includeObsolete,
    parameters,
    selectedBrands,
    selectedOrigin,
    selectedSuppliers,
    selectedWorkdays,
  });
  const planSheet = XLSX.utils.json_to_sheet(planRows);
  planSheet["!cols"] = [
    { wch: 24 },
    { wch: 22 },
    { wch: 34 },
    { wch: 22 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 18 },
    { wch: 16 },
  ];

  XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumen");
  XLSX.utils.book_append_sheet(workbook, planSheet, "Plan DDVC");

  const buffer = new Uint8Array(
    XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    }),
  );

  return {
    buffer,
    defaultName,
    logEntry: {
      accion: "Plan DDVC",
      fecha: timestamp.toISOString(),
      filtro: activeFilter,
      origen: selectedOrigin,
      parametros: parameters,
      selectionValues: {
        brands: selectedBrands,
        suppliers: selectedSuppliers,
        workdays: selectedWorkdays,
      },
      usuario: resolveUser(),
    },
  };
}

function buildMockPlanRows({
  includeObsolete,
  parameters,
  selectedBrands,
  selectedOrigin,
  selectedSuppliers,
  selectedWorkdays,
}: {
  includeObsolete: boolean;
  parameters: Record<string, number>;
  selectedBrands: string[];
  selectedOrigin: string | null;
  selectedSuppliers: string[];
  selectedWorkdays: string[];
}): PlanRow[] {
  const originLabel = selectedOrigin ?? "Sin seleccionar";
  const workdayLabel = selectedWorkdays[0] ?? "Lunes";
  const obsoleteSuffix = includeObsolete ? "Incluye obsoletos" : "Solo activos";

  return MOCK_PRODUCTS.map((product, index) => {
    const existenciaActual = Math.max(parameters.minimo - index, 0);
    const ventaPromedio = parameters.emergencia + index + 2;
    const compraSugerida = Math.max(
      parameters.maximo + ventaPromedio - existenciaActual,
      0,
    );

    return {
      Producto: `${product} ${index + 1}`,
      Marca:
        selectedBrands[index % Math.max(selectedBrands.length, 1)] ??
        "Sin marca seleccionada",
      Proveedor:
        selectedSuppliers[index % Math.max(selectedSuppliers.length, 1)] ??
        "Sin proveedor seleccionado",
      Origen: originLabel,
      DiaOperacion: workdayLabel,
      ExistenciaActual: existenciaActual,
      VentaPromedio: ventaPromedio,
      Emergencia: parameters.emergencia,
      Minimo: parameters.minimo,
      Maximo: parameters.maximo,
      CompraSugerida: compraSugerida,
      Estatus:
        existenciaActual <= parameters.emergencia
          ? `Urgente - ${obsoleteSuffix}`
          : `Planeado - ${obsoleteSuffix}`,
    };
  });
}

function normalizeParameters(parameters: PlanDdvcExportInput["parameters"]) {
  return parameters.reduce<Record<string, number>>((accumulator, parameter) => {
    accumulator[parameter.id] = parameter.value;
    return accumulator;
  }, {});
}

function getSelectedLabels(
  options: { label: string; selected?: boolean }[],
): string[] {
  return options
    .slice(1)
    .filter((option) => option.selected)
    .map((option) => option.label);
}

function getCheckedLabels(options: PlanDdvcExportInput["originOptions"]): string[] {
  return options.filter((option) => option.checked).map((option) => option.label);
}

function getCheckedLabel(options: PlanDdvcExportInput["originOptions"]): string | null {
  return options.find((option) => option.checked)?.label ?? null;
}

function joinOrFallback(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "Sin seleccionar";
}

function resolveActiveFilter({
  selectedBrands,
  selectedOrigin,
  selectedSuppliers,
  selectedWorkdays,
}: {
  selectedBrands: string[];
  selectedOrigin: string | null;
  selectedSuppliers: string[];
  selectedWorkdays: string[];
}): string {
  const activeFilters = [
    selectedBrands.length > 0 ? "marca" : null,
    selectedSuppliers.length > 0 ? "proveedor" : null,
    selectedWorkdays.length > 0 ? "dias-operacion" : null,
    selectedOrigin ? "origen" : null,
  ].filter((value): value is string => value !== null);

  if (activeFilters.length === 0) {
    return "sin-filtro";
  }

  return activeFilters.length === 1 ? activeFilters[0] : "mixto";
}

function resolveUser(): string {
  if (typeof navigator === "undefined") {
    return "desconocido";
  }

  return navigator.userAgent.includes("Electron")
    ? "usuario-electron"
    : "usuario-web";
}

function formatFileTimestamp(date: Date): string {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("-");
}

function formatReadableTimestamp(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function downloadInBrowser(buffer: Uint8Array, fileName: string) {
  const blob = new Blob([buffer as BlobPart], { type: EXCEL_MIME });
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = downloadUrl;
  anchor.download = fileName;
  anchor.click();

  URL.revokeObjectURL(downloadUrl);
}
