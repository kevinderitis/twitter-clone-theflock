import { PageShell } from '../components/PageShell';

const placeholderResults = ['demo', 'kevin', 'ada'];

export const SearchPage = () => {
  return (
    <PageShell
      eyebrow="Search"
      title="Find people and conversations."
      description="Search results stay mocked in this slice, but the page is already structured for future query state and user cards."
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-800">
            Search
          </span>
          <input
            type="search"
            placeholder="Search by name or username"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          />
        </label>

        <div className="space-y-3">
          {placeholderResults.map((result) => (
            <div
              key={result}
              className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="text-sm font-semibold text-slate-950">@{result}</p>
              <p className="mt-1 text-sm text-slate-600">
                Search result placeholder ready for backend data.
              </p>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
};
