import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';

import { AuthCard, Field } from '../components/AuthCard';
import { PageShell } from '../components/PageShell';

type RegisterValues = {
  name: string;
  username: string;
  email: string;
  password: string;
};

const createEmptyErrors = (): RegisterValues => ({
  name: '',
  username: '',
  email: '',
  password: '',
});

export const RegisterPage = () => {
  const [values, setValues] = useState<RegisterValues>({
    name: '',
    username: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<RegisterValues>(createEmptyErrors);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: RegisterValues = {
      name: values.name.trim() ? '' : 'Name is required.',
      username: values.username.trim() ? '' : 'Username is required.',
      email: values.email.trim() ? '' : 'Email is required.',
      password: values.password.trim() ? '' : 'Password is required.',
    };

    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    console.info('Register placeholder submit', values);
  };

  return (
    <PageShell
      eyebrow="Onboarding"
      title="Create your account."
      description="The backend is ready, but this slice stops at the client shell so we can land a clean, focused first UI commit."
    >
      <AuthCard
        title="Join The Flock"
        subtitle="We are only validating empty states here. API integration comes in the next frontend step."
        submitLabel="Create account"
        onSubmit={handleSubmit}
        footer={
          <>
            Already have an account?{' '}
            <Link className="font-semibold text-brand-700" to="/login">
              Sign in
            </Link>
            .
          </>
        }
      >
        <Field
          id="register-name"
          label="Name"
          autoComplete="name"
          value={values.name}
          error={errors.name}
          onChange={(value) =>
            setValues((current) => ({
              ...current,
              name: value,
            }))
          }
        />
        <Field
          id="register-username"
          label="Username"
          autoComplete="username"
          value={values.username}
          error={errors.username}
          onChange={(value) =>
            setValues((current) => ({
              ...current,
              username: value,
            }))
          }
        />
        <Field
          id="register-email"
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
          id="register-password"
          label="Password"
          type="password"
          autoComplete="new-password"
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
