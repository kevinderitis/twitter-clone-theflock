import type { PropsWithChildren, ReactNode } from 'react';

type PageShellProps = PropsWithChildren<{
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
}>;

export const PageShell = ({
  children,
  eyebrow,
  title,
  description,
  aside,
}: PageShellProps) => {
  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-700">
          {eyebrow}
        </p>
        <h2 className="mt-3 font-display text-3xl font-semibold text-slate-950 sm:text-4xl">
          {title}
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
          {description}
        </p>
        <div className="mt-6">{children}</div>
      </div>

      <aside className="space-y-4">
        {aside ?? (
          <>
            <div className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                Next
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                This screen is wired for future API integration, but stays
                intentionally local in this slice.
              </p>
            </div>
            <div className="rounded-[2rem] border border-brand-100 bg-brand-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-700">
                Design Goal
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Keep the app feeling alive with believable structure before
                connecting real data.
              </p>
            </div>
          </>
        )}
      </aside>
    </section>
  );
};
