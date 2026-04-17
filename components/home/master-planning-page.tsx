import { ActionButtons } from "@/components/home/action-buttons";
import { FilterPanel } from "@/components/home/filter-panel";
import { InventoryParametersCard } from "@/components/home/inventory-parameters-card";
import {
  actionButtons,
  brandPanel,
  inventoryParameters,
  originOptions,
  supplierPanel,
  workdayOptions,
} from "@/components/home/mock-data";
import { PageHeader } from "@/components/home/page-header";
import { RadioCard } from "@/components/home/radio-card";

export function MasterPlanningPage() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-360 rounded-[34px] border border-white/70 bg-white/88 p-4 panel-shadow backdrop-blur sm:p-6 lg:p-7">
        <PageHeader />
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_1fr]">
          <FilterPanel data={brandPanel} />
          <FilterPanel data={supplierPanel} />
        </div>
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_1fr]">
          <InventoryParametersCard parameters={inventoryParameters} />
          <div className="grid gap-6 md:grid-cols-[0.95fr_0.85fr]">
            <RadioCard title="Origen" options={originOptions} />
            <RadioCard title="Días de operación" options={workdayOptions} />
          </div>
        </div>
        <div className="mt-8 xl:ml-auto xl:max-w-155">
          <ActionButtons actions={actionButtons} />
        </div>
      </div>
    </main>
  );
}
