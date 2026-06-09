import { PageShell } from '../components/PageShell';

export const LoginPage = () => {
  return (
    <PageShell
      eyebrow="Account"
      title="Sign in"
      description="Authentication UI will be added in a later incremental task."
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4">
          <p className="font-medium text-slate-900">Login form placeholder</p>
          <p className="mt-1 text-sm text-slate-500">
            Email and password inputs will live here.
          </p>
        </div>
      </div>
    </PageShell>
  );
};
