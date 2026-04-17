import { CheckIcon, ClearIcon, KebabIcon, SearchIcon } from "@/components/home/home-icons";
import type { FilterPanelData } from "@/components/home/types";

type FilterPanelProps = {
  data: FilterPanelData;
};

function SearchField({ placeholder }: { placeholder: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border-soft bg-white px-4 py-3 text-slate-400 shadow-[0_8px_18px_rgba(17,46,93,0.07)]">
      <SearchIcon className="h-5 w-5 shrink-0" />
      <span className="flex-1 text-base font-medium text-slate-400">{placeholder}</span>
      <ClearIcon className="h-4 w-4 shrink-0" />
    </div>
  );
}

function SelectedChip({
  label,
  selected,
  trailing,
}: {
  label: string;
  selected?: boolean;
  trailing?: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-200/70 px-4 py-3 last:border-b-0">
      <div
        className={`flex h-5 w-5 items-center justify-center rounded-sm border text-white ${
          selected
            ? "border-brand-primary bg-brand-primary"
            : "border-slate-300 bg-white text-transparent"
        }`}
      >
        {selected ? <CheckIcon className="h-3.5 w-3.5" /> : null}
      </div>
      <p className="min-w-0 flex-1 truncate text-[1.02rem] font-medium text-slate-800">
        {label}
      </p>
      {trailing ? (
        <span className="text-sm font-medium text-slate-500">{trailing}</span>
      ) : (
        <KebabIcon className="h-5 w-5 text-slate-400" />
      )}
    </div>
  );
}

export function FilterPanel({ data }: FilterPanelProps) {
  const [allOption, ...regularOptions] = data.options;

  return (
    <section className="space-y-4">
      <h2 className="text-[1.7rem] font-semibold tracking-tight text-slate-900">
        {data.title}
      </h2>
      <SearchField placeholder={data.searchPlaceholder} />
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_35px_rgba(12,40,84,0.08)]">
        <SelectedChip
          label={allOption.label}
          selected={allOption.selected}
          trailing={data.selectedSummary}
        />
        {regularOptions.map((option) => (
          <SelectedChip
            key={option.id}
            label={option.label}
            selected={option.selected}
          />
        ))}
      </div>
      {data.showObsoleteToggle ? (
        <label className="flex items-center gap-3 text-base font-medium text-slate-700">
          <div className="flex h-5 w-5 items-center justify-center rounded-sm border border-brand-primary bg-brand-primary text-white">
            <CheckIcon className="h-3.5 w-3.5" />
          </div>
          Incluir productos obsoletos
        </label>
      ) : null}
    </section>
  );
}
