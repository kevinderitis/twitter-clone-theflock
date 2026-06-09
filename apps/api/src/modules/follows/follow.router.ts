import { Router } from 'express';

import { getAuthenticatedUser, requireAuth } from '../auth/auth.middleware.js';
import { PrismaAuthUserStore } from '../auth/auth.repository.js';
import type { AuthUserStore } from '../auth/auth.types.js';
import { PrismaFollowStore } from './follow.repository.js';
import { FollowService } from './follow.service.js';
import type { FollowStore } from './follow.types.js';

type FollowRouterDependencies = {
  authUserStore?: AuthUserStore;
  followStore?: FollowStore;
  followService?: FollowService;
};

export const createFollowRouter = ({
  authUserStore,
  followStore,
  followService,
}: FollowRouterDependencies = {}) => {
  const router = Router();
  const resolvedAuthUserStore = authUserStore ?? new PrismaAuthUserStore();
  const resolvedFollowStore = followStore ?? new PrismaFollowStore();
  const service =
    followService ??
    new FollowService(resolvedAuthUserStore, resolvedFollowStore);

  router.post(
    '/:userId/follow',
    requireAuth(resolvedAuthUserStore),
    async (request, response, next) => {
      try {
        const targetUserId = Array.isArray(request.params.userId)
          ? request.params.userId[0]
          : request.params.userId;

        const result = await service.followUser(
          targetUserId,
          getAuthenticatedUser(request),
        );
        response.status(201).json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  router.delete(
    '/:userId/follow',
    requireAuth(resolvedAuthUserStore),
    async (request, response, next) => {
      try {
        const targetUserId = Array.isArray(request.params.userId)
          ? request.params.userId[0]
          : request.params.userId;

        const result = await service.unfollowUser(
          targetUserId,
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
