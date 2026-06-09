import { PageShell } from '../components/PageShell';

export const RegisterPage = () => {
  return (
    <PageShell
      eyebrow="Onboarding"
      title="Create account"
      description="Registration logic is intentionally out of scope for this scaffold."
    >
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4">
        <p className="font-medium text-slate-900">
          Registration form placeholder
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Username, email, and password fields will be introduced later.
        </p>
      </div>
    </PageShell>
  );
};
