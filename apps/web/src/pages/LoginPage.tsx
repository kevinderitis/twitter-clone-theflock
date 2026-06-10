import { type FormEvent, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { AuthCard, Field } from '../components/AuthCard';
import { PageShell } from '../components/PageShell';
import { ApiError } from '../lib/api';
import { useAuth } from '../modules/auth/use-auth';

type LoginValues = {
  email: string;
  password: string;
};

const createEmptyErrors = (): LoginValues => ({
  email: '',
  password: '',
});

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [values, setValues] = useState<LoginValues>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<LoginValues>(createEmptyErrors);
  const [submissionError, setSubmissionError] = useState<{
    message: string;
    details?: string[];
  } | null>(null);

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      const redirectTarget =
        typeof location.state === 'object' &&
        location.state !== null &&
        'from' in location.state &&
        typeof location.state.from === 'string'
          ? location.state.from
          : '/';

      navigate(redirectTarget, { replace: true });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        setSubmissionError({
          message: error.message,
          details: error.details,
        });
        return;
      }

      setSubmissionError({
        message: 'Something went wrong. Please try again.',
      });
    },
  });

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

    setSubmissionError(null);
    loginMutation.mutate(values);
  };

  return (
    <div className="mx-auto w-full max-w-lg py-8 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-700">
        Account
      </p>
      <h2 className="mt-3 font-display text-3xl font-semibold text-slate-950 sm:text-4xl">
        Sign in and take a look around.
      </h2>
      <div className="mt-6">
        <AuthCard
          title="Welcome back"
          subtitle="Sign in to see what your flock is sharing."
          submitLabel="Sign in"
          isSubmitting={loginMutation.isPending}
          errorMessage={submissionError?.message ?? null}
          errorDetails={submissionError?.details}
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
      </div>
    </div>
  );
};
