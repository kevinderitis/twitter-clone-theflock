import { PageShell } from '../components/PageShell';

export const TimelinePage = () => {
  return (
    <PageShell
      eyebrow="Home"
      title="Timeline"
      description="A feed-style layout placeholder with no business logic yet."
    >
      <div className="space-y-3">
        {[
          'Pinned composer area',
          'Tweet card placeholder',
          'Suggested follows placeholder',
        ].map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600"
          >
            {item}
          </div>
        ))}
      </div>
    </PageShell>
  );
};
