import { PageShell } from '../components/PageShell';

const previewCards = [
  {
    title: 'Compose area',
    body: 'Tweet creation stays out of this slice, but the home screen already reserves a focused place for it.',
  },
  {
    title: 'Timeline cards',
    body: 'Real feed data will land next. For now, the layout already matches a stacked mobile reading flow.',
  },
  {
    title: 'Right rail notes',
    body: 'Search, profile stats, and trends can plug into the side rail later without reshaping the shell.',
  },
];

export const TimelinePage = () => {
  return (
    <PageShell
      eyebrow="Home"
      title="A feed-shaped home screen."
      description="This placeholder keeps the main reading rhythm of a Twitter-like timeline while staying intentionally data-free."
      aside={
        <div className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            Later in this area
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <li>Search trends</li>
            <li>Suggested follows</li>
            <li>Profile highlights</li>
          </ul>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-[1.75rem] border border-dashed border-brand-200 bg-brand-50/80 p-5">
          <p className="text-sm font-semibold text-slate-900">
            Composer placeholder
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            The next frontend slice can wire this area to authenticated tweet
            creation without redesigning the page.
          </p>
        </div>

        {previewCards.map((card) => (
          <article
            key={card.title}
            className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 h-11 w-11 rounded-2xl bg-slate-200" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-950">
                  {card.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {card.body}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </PageShell>
  );
};
