import { afterEach, describe, expect, it } from 'vitest';

import { AppError } from '../src/lib/errors.js';
import { getJwtExpiresIn, getJwtSecret } from '../src/config/env.js';

describe('env helpers', () => {
  const originalSecret = process.env.JWT_SECRET;
  const originalExpiresIn = process.env.JWT_EXPIRES_IN;

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }

    if (originalExpiresIn === undefined) {
      delete process.env.JWT_EXPIRES_IN;
    } else {
      process.env.JWT_EXPIRES_IN = originalExpiresIn;
    }
  });

  it('returns the configured JWT secret', () => {
    process.env.JWT_SECRET = 'super-secret';

    expect(getJwtSecret()).toBe('super-secret');
  });

  it('throws when the JWT secret is missing', () => {
    delete process.env.JWT_SECRET;

    expect(() => getJwtSecret()).toThrowError(AppError);
    expect(() => getJwtSecret()).toThrow('JWT_SECRET is not configured.');
  });

  it('returns the configured expiration or the default value', () => {
    delete process.env.JWT_EXPIRES_IN;
    expect(getJwtExpiresIn()).toBe('7d');

    process.env.JWT_EXPIRES_IN = '12h';
    expect(getJwtExpiresIn()).toBe('12h');
  });
});
