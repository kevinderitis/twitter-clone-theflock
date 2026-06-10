import { type FormEvent, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';

import { AuthCard, Field } from '../components/AuthCard';
import { ApiError } from '../lib/api';
import { useAuth } from '../modules/auth/use-auth';

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
  const navigate = useNavigate();
  const { register } = useAuth();
  const [values, setValues] = useState<RegisterValues>({
    name: '',
    username: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<RegisterValues>(createEmptyErrors);
  const [submissionError, setSubmissionError] = useState<{
    message: string;
    details?: string[];
  } | null>(null);

  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: () => {
      navigate('/', { replace: true });
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

    setSubmissionError(null);
    registerMutation.mutate(values);
  };

  return (
    <div className="mx-auto w-full max-w-lg py-8 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-700">
        Onboarding
      </p>
      <h2 className="mt-3 font-display text-3xl font-semibold text-slate-950 sm:text-4xl">
        Create your account.
      </h2>
      <div className="mt-6">
        <AuthCard
          title="Join The Flock"
          subtitle="Join the conversation and start sharing your thoughts."
          submitLabel="Create account"
          isSubmitting={registerMutation.isPending}
          errorMessage={submissionError?.message ?? null}
          errorDetails={submissionError?.details}
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
      </div>
    </div>
  );
};
