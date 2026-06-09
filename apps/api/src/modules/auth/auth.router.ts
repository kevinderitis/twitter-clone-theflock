import { Router } from 'express';

import { getAuthenticatedUser, requireAuth } from './auth.middleware.js';
import { PrismaAuthUserStore } from './auth.repository.js';
import { AuthService } from './auth.service.js';
import type { AuthUserStore } from './auth.types.js';

type AuthRouterDependencies = {
  authService?: AuthService;
  userStore?: AuthUserStore;
};

export const createAuthRouter = ({
  authService,
  userStore,
}: AuthRouterDependencies = {}) => {
  const router = Router();
  const resolvedUserStore = userStore ?? new PrismaAuthUserStore();
  const service = authService ?? new AuthService(resolvedUserStore);

  router.post('/register', async (request, response, next) => {
    try {
      const result = await service.register(request.body);
      response.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.post('/login', async (request, response, next) => {
    try {
      const result = await service.login(request.body);
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.get(
    '/me',
    requireAuth(resolvedUserStore),
    async (request, response, next) => {
      try {
        const result = await service.getCurrentUser(
          getAuthenticatedUser(request).id,
        );
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  router.post(
    '/logout',
    requireAuth(resolvedUserStore),
    async (_request, response, next) => {
      try {
        const result = await service.logout();
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
};
