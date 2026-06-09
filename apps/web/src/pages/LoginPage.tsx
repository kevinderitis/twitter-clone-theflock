import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';

import { AuthCard, Field } from '../components/AuthCard';
import { PageShell } from '../components/PageShell';

type LoginValues = {
  email: string;
  password: string;
};

const createEmptyErrors = (): LoginValues => ({
  email: '',
  password: '',
});

export const LoginPage = () => {
  const [values, setValues] = useState<LoginValues>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<LoginValues>(createEmptyErrors);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: LoginValues = {
      email: values.email.trim() ? '' : 'Email is required.',
      password: values.password.trim() ? '' : 'Password is required.',
    };

    setErrors(nextErrors);

    if (nextErrors.email || nextErrors.password) {
      return;
    }

    console.info('Login placeholder submit', values);
  };

  return (
    <PageShell
      eyebrow="Account"
      title="Sign in and take a look around."
      description="This first frontend slice keeps auth local, but the form structure is ready for real mutations in a later commit."
    >
      <AuthCard
        title="Welcome back"
        subtitle="Use the seeded demo credentials later, or just validate the form states for now."
        submitLabel="Sign in"
        onSubmit={handleSubmit}
        footer={
          <>
            No account yet?{' '}
            <Link className="font-semibold text-brand-700" to="/register">
              Create one
            </Link>
            .
          </>
        }
      >
        <Field
          id="login-email"
          label="Email"
          type="email"
          autoComplete="email"
          value={values.email}
          error={errors.email}
          onChange={(value) =>
            setValues((current) => ({
              ...current,
              email: value,
            }))
          }
        />
        <Field
          id="login-password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={values.password}
          error={errors.password}
          onChange={(value) =>
            setValues((current) => ({
              ...current,
              password: value,
            }))
          }
        />
      </AuthCard>
    </PageShell>
  );
};
