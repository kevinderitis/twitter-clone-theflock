import type { NextFunction, Request, Response } from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '../src/lib/errors.js';
import {
  getAuthenticatedUser,
  getOptionalAuthenticatedUser,
  optionalAuth,
  requireAuth,
} from '../src/modules/auth/auth.middleware.js';
import { signAuthToken } from '../src/modules/auth/auth.security.js';
import type { AuthUserRecord, AuthUserStore } from '../src/modules/auth/auth.types.js';

const createUser = (overrides: Partial<AuthUserRecord> = {}): AuthUserRecord => ({
  id: 'user_1',
  email: 'user@example.com',
  passwordHash: 'hash',
  username: 'user',
  name: 'User',
  bio: null,
  avatarUrl: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

const createRequest = (authorization?: string) =>
  ({
    headers: authorization ? { authorization } : {},
  }) as Request;

const createUserStore = (user: AuthUserRecord | null): AuthUserStore => ({
  findById: vi.fn().mockResolvedValue(user),
  findByEmail: vi.fn(),
  findByUsername: vi.fn(),
  createUser: vi.fn(),
});

describe('auth middleware helpers', () => {
  const originalSecret = process.env.JWT_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  });

  it('requireAuth rejects missing or blank bearer tokens', async () => {
    process.env.JWT_SECRET = 'middleware-secret';
    const next = vi.fn<NextFunction>();
    const middleware = requireAuth(createUserStore(null));

    await middleware(createRequest(), {} as Response, next);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining<AppError>({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
      }),
    );

    next.mockClear();
    await middleware(createRequest('Bearer   '), {} as Response, next);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining<AppError>({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
      }),
    );
  });

  it('requireAuth rejects invalid tokens and missing users', async () => {
    process.env.JWT_SECRET = 'middleware-secret';
    const next = vi.fn<NextFunction>();

    await requireAuth(createUserStore(null))(
      createRequest('Bearer invalid-token'),
      {} as Response,
      next,
    );
    expect(next).toHaveBeenCalled();

    next.mockClear();
    const token = signAuthToken('missing-user');
    await requireAuth(createUserStore(null))(
      createRequest(`Bearer ${token}`),
      {} as Response,
      next,
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining<AppError>({
        statusCode: 401,
        code: 'INVALID_TOKEN',
      }),
    );
  });

  it('requireAuth attaches the authenticated user', async () => {
    process.env.JWT_SECRET = 'middleware-secret';
    const user = createUser();
    const token = signAuthToken(user.id);
    const request = createRequest(`Bearer ${token}`);
    const next = vi.fn<NextFunction>();

    await requireAuth(createUserStore(user))(request, {} as Response, next);

    expect(getAuthenticatedUser(request)).toEqual(user);
    expect(next).toHaveBeenCalledWith();
  });

  it('optionalAuth ignores missing and malformed tokens', async () => {
    process.env.JWT_SECRET = 'middleware-secret';
    const next = vi.fn<NextFunction>();
    const middleware = optionalAuth(createUserStore(null));

    const noHeaderRequest = createRequest();
    await middleware(noHeaderRequest, {} as Response, next);
    expect(getOptionalAuthenticatedUser(noHeaderRequest)).toBeNull();

    const blankTokenRequest = createRequest('Bearer   ');
    await middleware(blankTokenRequest, {} as Response, next);
    expect(getOptionalAuthenticatedUser(blankTokenRequest)).toBeNull();

    const invalidTokenRequest = createRequest('Bearer invalid');
    await middleware(invalidTokenRequest, {} as Response, next);
    expect(getOptionalAuthenticatedUser(invalidTokenRequest)).toBeNull();
  });

  it('optionalAuth attaches the user when the token is valid', async () => {
    process.env.JWT_SECRET = 'middleware-secret';
    const user = createUser();
    const token = signAuthToken(user.id);
    const request = createRequest(`Bearer ${token}`);
    const next = vi.fn<NextFunction>();

    await optionalAuth(createUserStore(user))(request, {} as Response, next);

    expect(getOptionalAuthenticatedUser(request)).toEqual(user);
    expect(next).toHaveBeenCalledWith();
  });

  it('getAuthenticatedUser throws when the middleware context is missing', () => {
    expect(() => getAuthenticatedUser({} as Request)).toThrowError(AppError);
    expect(getOptionalAuthenticatedUser({} as Request)).toBeNull();
  });
});
