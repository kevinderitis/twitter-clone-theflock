import { Router } from 'express';

import { PrismaAuthUserStore } from './auth.repository.js';
import { AuthService } from './auth.service.js';

type AuthRouterDependencies = {
  authService?: AuthService;
};

export const createAuthRouter = ({
  authService,
}: AuthRouterDependencies = {}) => {
  const router = Router();
  const service = authService ?? new AuthService(new PrismaAuthUserStore());

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

  return router;
};
