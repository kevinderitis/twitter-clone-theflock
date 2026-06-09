import type { FormEvent, ReactNode } from 'react';

type FieldProps = {
  id: string;
  label: string;
  type?: string;
  value: string;
  error?: string;
  autoComplete?: string;
  onChange: (value: string) => void;
};

type AuthCardProps = {
  title: string;
  subtitle: string;
  submitLabel: string;
  footer: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
};

export const Field = ({
  id,
  label,
  type = 'text',
  value,
  error,
  autoComplete,
  onChange,
}: FieldProps) => {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-800">
        {label}
      </span>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className={[
          'w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-950 outline-none transition',
          error
            ? 'border-rose-300 ring-4 ring-rose-100'
            : 'border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-100',
        ].join(' ')}
      />
      {error ? (
        <span className="mt-2 block text-sm text-rose-600">{error}</span>
      ) : null}
    </label>
  );
};

export const AuthCard = ({
  title,
  subtitle,
  submitLabel,
  footer,
  onSubmit,
  children,
}: AuthCardProps) => {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-slate-50/90 p-5 shadow-inner shadow-white sm:p-6">
      <div>
        <h3 className="text-2xl font-semibold text-slate-950">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
        {children}

        <button
          type="submit"
          className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          {submitLabel}
        </button>
      </form>

      <div className="mt-4 text-sm text-slate-600">{footer}</div>
    </div>
  );
};
