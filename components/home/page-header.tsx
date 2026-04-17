function BrandPlaceholder() {
  return (
    <div className="flex items-center gap-3 text-white">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/14 ring-1 ring-white/18 backdrop-blur">
        <div className="relative h-8 w-8">
          <span className="absolute left-0 top-2 h-4 w-4 rounded-full border-[3px] border-white border-r-transparent" />
          <span className="absolute right-0 top-0 h-5 w-5 rounded-full bg-white/92" />
          <span className="absolute bottom-0 left-2 h-3 w-6 rounded-full bg-white/85" />
        </div>
      </div>
      <div className="leading-tight">
        <p className="text-3xl font-semibold tracking-wide">DDVC</p>
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/72">
          Distribuidora dental
        </p>
      </div>
    </div>
  );
}

export function PageHeader() {
  return (
    <header className="rounded-[28px] bg-gradient-to-r from-brand-primary-dark via-brand-primary to-brand-primary-soft px-7 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] sm:px-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        <BrandPlaceholder />
        <div className="hidden h-16 w-px bg-white/22 lg:block" />
        <div className="space-y-1 text-white">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-white/70">
            PM DDVC
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-[2.15rem]">
            Planeación maestra
          </h1>
        </div>
      </div>
    </header>
  );
}
