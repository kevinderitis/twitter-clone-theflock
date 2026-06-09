import { Router } from 'express';

import { requireAuth } from '../auth/auth.middleware.js';
import { PrismaAuthUserStore } from '../auth/auth.repository.js';
import type { AuthUserStore } from '../auth/auth.types.js';
import { PrismaUserSearchStore } from './user-search.repository.js';
import { UserSearchService } from './user-search.service.js';
import type { UserSearchStore } from './user-search.types.js';

type UserSearchRouterDependencies = {
  authUserStore?: AuthUserStore;
  userSearchStore?: UserSearchStore;
  userSearchService?: UserSearchService;
};

export const createUserSearchRouter = ({
  authUserStore,
  userSearchStore,
  userSearchService,
}: UserSearchRouterDependencies = {}) => {
  const router = Router();
  const resolvedAuthUserStore = authUserStore ?? new PrismaAuthUserStore();
  const resolvedUserSearchStore =
    userSearchStore ?? new PrismaUserSearchStore();
  const service =
    userSearchService ?? new UserSearchService(resolvedUserSearchStore);

  router.get(
    '/search',
    requireAuth(resolvedAuthUserStore),
    async (request, response, next) => {
      try {
        const result = await service.searchUsers(request.query);
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
};
