import { useParams } from 'react-router-dom';

import { PageShell } from '../components/PageShell';

const statPlaceholders = [
  { label: 'Tweets', value: '128' },
  { label: 'Following', value: '84' },
  { label: 'Followers', value: '1.9K' },
];

export const ProfilePage = () => {
  const { username } = useParams();

  return (
    <PageShell
      eyebrow="Profile"
      title={`@${username ?? 'user'}`}
      description="This is a profile-shaped placeholder ready for public user data, tweet history, and relationship actions."
    >
      <div className="space-y-4">
        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-[1.5rem] bg-slate-200" />
            <div>
              <h3 className="text-lg font-semibold text-slate-950">
                {username ?? 'user'}
              </h3>
              <p className="text-sm text-slate-500">@{username ?? 'user'}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Bio placeholder. Public profile details and counts will plug into
            this exact region in a later backend-connected step.
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          {statPlaceholders.map((stat) => (
            <div
              key={stat.label}
              className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                {stat.label}
              </p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">
                {stat.value}
              </p>
            </div>
          ))}
        </section>
      </div>
    </PageShell>
  );
};
