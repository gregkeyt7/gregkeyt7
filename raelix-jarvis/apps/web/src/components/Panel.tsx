import type { PropsWithChildren, ReactNode } from "react";

interface PanelProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export const Panel = ({ title, subtitle, action, children }: PanelProps) => {
  return (
    <section className="rounded-2xl border border-slate-800/80 bg-panel p-4 shadow-neon backdrop-blur">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-neon">{title}</h2>
          {subtitle ? <p className="mt-1 text-xs text-slate-400">{subtitle}</p> : null}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
};
