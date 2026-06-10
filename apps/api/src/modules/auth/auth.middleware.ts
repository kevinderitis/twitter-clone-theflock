import type { Request, Response, NextFunction } from 'express';

import { AppError } from '../../lib/errors.js';
import type { AuthUserRecord, AuthUserStore } from './auth.types.js';
import { verifyAuthToken } from './auth.security.js';

type AuthenticatedRequest = Request & {
  authUser?: AuthUserRecord;
};

export const requireAuth =
  (userStore: AuthUserStore) =>
  async (request: Request, _response: Response, next: NextFunction) => {
    try {
      const authorizationHeader = request.headers.authorization;

      if (!authorizationHeader?.startsWith('Bearer ')) {
        throw new AppError(
          401,
          'AUTHENTICATION_REQUIRED',
          'Authentication is required.',
        );
      }

      const token = authorizationHeader.slice('Bearer '.length).trim();

      if (!token) {
        throw new AppError(
          401,
          'AUTHENTICATION_REQUIRED',
          'Authentication is required.',
        );
      }

      const { userId } = verifyAuthToken(token);
      const user = await userStore.findById(userId);

      if (!user) {
        throw new AppError(
          401,
          'INVALID_TOKEN',
          'Authentication token is invalid.',
        );
      }

      (request as AuthenticatedRequest).authUser = user;
      next();
    } catch (error) {
      next(error);
    }
  };

export const optionalAuth =
  (userStore: AuthUserStore) =>
  async (request: Request, _response: Response, next: NextFunction) => {
    try {
      const authorizationHeader = request.headers.authorization;

      if (!authorizationHeader?.startsWith('Bearer ')) {
        next();
        return;
      }

      const token = authorizationHeader.slice('Bearer '.length).trim();

      if (!token) {
        next();
        return;
      }

      const { userId } = verifyAuthToken(token);
      const user = await userStore.findById(userId);

      if (user) {
        (request as AuthenticatedRequest).authUser = user;
      }

      next();
    } catch {
      next();
    }
  };

export const getAuthenticatedUser = (request: Request) => {
  const user = (request as AuthenticatedRequest).authUser;

  if (!user) {
    throw new AppError(
      500,
      'AUTH_CONTEXT_MISSING',
      'Authenticated user was not attached to the request.',
    );
  }

  return user;
};

export const getOptionalAuthenticatedUser = (request: Request) =>
  (request as AuthenticatedRequest).authUser ?? null;
