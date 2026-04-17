import type { RadioOption } from "@/components/home/types";

type RadioCardProps = {
  title: string;
  options: RadioOption[];
};

function RadioItem({ label, checked }: RadioOption) {
  return (
    <label className="flex items-center gap-3 text-lg text-slate-700">
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
          checked ? "border-brand-primary" : "border-slate-400"
        }`}
      >
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            checked ? "bg-brand-primary" : "bg-transparent"
          }`}
        />
      </span>
      <span className="font-medium">{label}</span>
    </label>
  );
}

export function RadioCard({ title, options }: RadioCardProps) {
  return (
    <section className="h-full rounded-3xl border border-slate-200/80 bg-white px-5 py-5 shadow-[0_18px_35px_rgba(12,40,84,0.08)]">
      <h2 className="mb-4 text-[1.5rem] font-semibold tracking-tight text-slate-900">
        {title}
      </h2>
      <div className="space-y-3">
        {options.map((option) => (
          <RadioItem key={option.id} {...option} />
        ))}
      </div>
    </section>
  );
}
