import { AppError } from '../lib/errors.js';

const readRequiredEnv = (name: string) => {
  const value = process.env[name];

  if (!value) {
    throw new AppError(
      500,
      'CONFIGURATION_ERROR',
      `${name} is not configured.`,
    );
  }

  return value;
};

export const getJwtSecret = () => readRequiredEnv('JWT_SECRET');

export const getJwtExpiresIn = () => process.env.JWT_EXPIRES_IN ?? '7d';
