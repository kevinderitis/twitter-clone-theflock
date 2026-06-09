import { useParams } from 'react-router-dom';

import { PageShell } from '../components/PageShell';

export const ProfilePage = () => {
  const { username } = useParams();

  return (
    <PageShell
      eyebrow="Profile"
      title={`@${username ?? 'user'}`}
      description="Profile data and tweet history will be added in future iterations."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-slate-900">Bio placeholder</p>
          <p className="mt-1 text-sm text-slate-500">
            Short user details will appear here.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-slate-900">
            Stats placeholder
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Followers, following, and likes summary.
          </p>
        </div>
      </div>
    </PageShell>
  );
};
