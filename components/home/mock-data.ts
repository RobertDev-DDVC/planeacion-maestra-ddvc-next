import type {
  ActionButtonData,
  FilterPanelData,
  InventoryParameter,
  RadioOption,
} from "@/types/home/home.types";

export const brandPanel: FilterPanelData = {
  title: "Marca",
  searchPlaceholder: "Buscar marca...",
  selectedSummary: "3 seleccionadas",
  options: [
    { id: "all-brands", label: "Seleccionar todo", selected: true },
    { id: "papacarie", label: "PAPACARIE-PAPACARIE", selected: true },
    { id: "ortosim", label: "ADA-ORTOSIM", selected: true },
  ],
  showObsoleteToggle: true,
};

export const supplierPanel: FilterPanelData = {
  title: "Proveedor:",
  searchPlaceholder: "Buscar proveedor...",
  selectedSummary: "5 seleccionados",
  options: [
    { id: "all-suppliers", label: "Seleccionar todo", selected: true },
    {
      id: "supplier-1",
      label: "PRN-00009-IVOCLEAR VIVADENT, SA. DE C.V.",
      selected: true,
    },
    {
      id: "supplier-2",
      label: "PRN-00011-LABORATORIOS GAYZ, SA. DE C.V.",
      selected: true,
    },
    {
      id: "supplier-3",
      label: "PRN-00012-MANUFACTURA DENTAL...",
      selected: true,
    },
  ],
};

export const inventoryParameters: InventoryParameter[] = [
  { id: "emergencia", label: "Emergencia", value: 1 },
  { id: "minimo", label: "Mínimo", value: 2 },
  { id: "maximo", label: "Máximo", value: 3 },
];

export const originOptions: RadioOption[] = [
  { id: "nacional", label: "Proveedor nacional" },
  { id: "importacion", label: "Proveedor importación" },
];

export const workdayOptions: RadioOption[] = [
  { id: "lunes", label: "Lunes", checked: true },
  { id: "martes", label: "Martes" },
  { id: "miercoles", label: "Miércoles" },
  { id: "jueves", label: "Jueves" },
  { id: "viernes", label: "Viernes" },
];

export const actionButtons: ActionButtonData[] = [
  { id: "plan-ddvc", label: "Plan DDVC", tone: "primary" },
  { id: "inventario", label: "Inventario", tone: "success" },
];
