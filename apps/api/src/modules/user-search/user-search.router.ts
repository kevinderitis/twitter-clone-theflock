import { Router } from 'express';

import { getAuthenticatedUser, requireAuth } from '../auth/auth.middleware.js';
import { PrismaAuthUserStore } from '../auth/auth.repository.js';
import type { AuthUserStore } from '../auth/auth.types.js';
import type { FollowStore } from '../follows/follow.types.js';
import { PrismaFollowStore } from '../follows/follow.repository.js';
import { PrismaUserSearchStore } from './user-search.repository.js';
import { UserSearchService } from './user-search.service.js';
import type { UserSearchStore } from './user-search.types.js';

type UserSearchRouterDependencies = {
  authUserStore?: AuthUserStore;
  followStore?: FollowStore;
  userSearchStore?: UserSearchStore;
  userSearchService?: UserSearchService;
};

export const createUserSearchRouter = ({
  authUserStore,
  followStore,
  userSearchStore,
  userSearchService,
}: UserSearchRouterDependencies = {}) => {
  const router = Router();
  const resolvedAuthUserStore = authUserStore ?? new PrismaAuthUserStore();
  const resolvedFollowStore = followStore ?? new PrismaFollowStore();
  const resolvedUserSearchStore =
    userSearchStore ?? new PrismaUserSearchStore();
  const service =
    userSearchService ??
    new UserSearchService(resolvedUserSearchStore, resolvedFollowStore);

  router.get(
    '/search',
    requireAuth(resolvedAuthUserStore),
    async (request, response, next) => {
      try {
        const result = await service.searchUsers(
          request.query,
          getAuthenticatedUser(request),
        );
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
};
