export type FilterOption = {
  id: string;
  label: string;
  selected?: boolean;
};

export type FilterPanelData = {
  title: string;
  searchPlaceholder: string;
  selectedSummary: string;
  options: FilterOption[];
  showObsoleteToggle?: boolean;
};

export type InventoryParameter = {
  id: string;
  label: string;
  value: number;
};

export type RadioOption = {
  id: string;
  label: string;
  checked?: boolean;
};

export type ActionButtonData = {
  id: string;
  label: string;
  tone: "primary" | "success";
};
