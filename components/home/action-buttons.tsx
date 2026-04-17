import { BoxIcon, ClipboardChartIcon } from "@/components/home/home-icons";
import type { ActionButtonData } from "@/components/home/types";

type ActionButtonsProps = {
  actions: ActionButtonData[];
};

function ActionButton({ label, tone }: ActionButtonData) {
  const palette =
    tone === "primary"
      ? "from-brand-primary to-[#2f74c5] hover:from-brand-primary-dark hover:to-brand-primary"
      : "from-success to-[#4c9d6d] hover:from-success-dark hover:to-success";

  const Icon = tone === "primary" ? ClipboardChartIcon : BoxIcon;

  return (
    <button
      type="button"
      className={`inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-linear-to-r ${palette} px-6 text-xl font-semibold text-white shadow-[0_18px_30px_rgba(13,48,94,0.18)] transition-transform duration-200 hover:-translate-y-0.5`}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}

export function ActionButtons({ actions }: ActionButtonsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {actions.map((action) => (
        <ActionButton key={action.id} {...action} />
      ))}
    </div>
  );
}
