import { CheckIcon } from "@/components/home/home-icons";
import type { InventoryParameter } from "@/components/home/types";

type InventoryParametersCardProps = {
  parameters: InventoryParameter[];
};

function NumberField({ label, value }: InventoryParameter) {
  return (
    <div className="space-y-2">
      <label className="text-[1.02rem] font-semibold text-slate-800">{label}</label>
      <div className="flex min-w-0 items-center justify-between rounded-2xl border border-border-soft bg-white px-4 py-3 shadow-[0_8px_18px_rgba(17,46,93,0.07)]">
        <span className="text-xl font-semibold text-slate-800">{value}</span>
        <div className="flex flex-col text-slate-400">
          <span className="text-[0.7rem] leading-none">⌃</span>
          <span className="text-[0.7rem] leading-none">⌄</span>
        </div>
      </div>
    </div>
  );
}

export function InventoryParametersCard({
  parameters,
}: InventoryParametersCardProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-[1.7rem] font-semibold tracking-tight text-slate-900">
        Parámetros de inventario
      </h2>
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_18px_35px_rgba(12,40,84,0.08)]">
        <div className="grid gap-4 px-4 py-5 sm:grid-cols-3 sm:px-5">
          {parameters.map((parameter) => (
            <NumberField key={parameter.id} {...parameter} />
          ))}
        </div>
        <div className="border-t border-slate-200/80 px-4 py-4 sm:px-5">
          <label className="flex items-center gap-3 text-base font-medium text-slate-700">
            <div className="flex h-5 w-5 items-center justify-center rounded-sm border border-brand-primary bg-brand-primary text-white">
              <CheckIcon className="h-3.5 w-3.5" />
            </div>
            Incluir productos obsoletos
          </label>
        </div>
      </div>
    </section>
  );
}
