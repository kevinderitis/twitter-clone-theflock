import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import jwt from 'jsonwebtoken';

import { verifyAuthToken } from '../src/modules/auth/auth.security.js';

describe('verifyAuthToken', () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  });

  it('returns userId for a valid token', () => {
    const token = jwt.sign({ sub: 'user_1' }, 'test-secret');

    const result = verifyAuthToken(token);

    expect(result).toEqual({ userId: 'user_1' });
  });

  it('throws INVALID_TOKEN when the sub claim is missing', () => {
    const token = jwt.sign({ foo: 'bar' }, 'test-secret');

    expect(() => verifyAuthToken(token)).toThrow(
      expect.objectContaining({
        statusCode: 401,
        code: 'INVALID_TOKEN',
      }),
    );
  });

  it('throws INVALID_TOKEN for an expired token', async () => {
    const token = jwt.sign({ sub: 'user_1' }, 'test-secret', { expiresIn: '0s' });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(() => verifyAuthToken(token)).toThrow(
      expect.objectContaining({
        statusCode: 401,
        code: 'INVALID_TOKEN',
      }),
    );
  });

  it('throws INVALID_TOKEN for a malformed token', () => {
    expect(() => verifyAuthToken('not-a-valid-token')).toThrow(
      expect.objectContaining({
        statusCode: 401,
        code: 'INVALID_TOKEN',
      }),
    );
  });

  it('throws INVALID_TOKEN for a token signed with a different secret', () => {
    const token = jwt.sign({ sub: 'user_1' }, 'wrong-secret');

    expect(() => verifyAuthToken(token)).toThrow(
      expect.objectContaining({
        statusCode: 401,
        code: 'INVALID_TOKEN',
      }),
    );
  });

  it('throws INVALID_TOKEN when the payload is a string (not object)', () => {
    const token = jwt.sign('string-payload', 'test-secret');

    expect(() => verifyAuthToken(token)).toThrow(
      expect.objectContaining({
        statusCode: 401,
        code: 'INVALID_TOKEN',
      }),
    );
  });
});
