import type { PropsWithChildren, ReactNode } from 'react';

type PageShellProps = PropsWithChildren<{
  eyebrow?: string;
  title?: string;
  description?: string;
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
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      {eyebrow || title || description ? (
        <div className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-7">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-700">
              {eyebrow}
            </p>
          ) : null}
          {title ? (
            <h2 className="mt-3 font-display text-3xl font-semibold text-slate-950 sm:text-4xl">
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
              {description}
            </p>
          ) : null}
          <div className="mt-6">{children}</div>
        </div>
      ) : (
        children
      )}

      <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        {aside ?? (
          <>
            <div className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                What's happening
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Follow other users to see their posts in your timeline. The more
                people you follow, the more interesting your feed becomes.
              </p>
            </div>
            <div className="rounded-[2rem] border border-brand-100 bg-brand-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-700">
                Tips
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Find people with similar interests by browsing profiles and
                searching for topics you care about.
              </p>
            </div>
          </>
        )}
      </aside>
    </section>
  );
};
