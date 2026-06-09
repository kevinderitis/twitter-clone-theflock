import type { PropsWithChildren } from 'react';

type PageShellProps = PropsWithChildren<{
  eyebrow: string;
  title: string;
  description: string;
}>;

export const PageShell = ({
  children,
  eyebrow,
  title,
  description,
}: PageShellProps) => {
  return (
    <section className="mx-auto max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-700">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-bold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
      <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
        {children}
      </div>
    </section>
  );
};
