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
        const targetUserId = request.params.userId;

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
        const targetUserId = request.params.userId;

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

  router.get('/:username/followers', async (request, response, next) => {
    try {
      const username = Array.isArray(request.params.username)
        ? request.params.username[0]
        : request.params.username;
      const limit = Array.isArray(request.query.limit)
        ? request.query.limit[0]
        : request.query.limit;

      const result = await service.getFollowers(username, limit);
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.get('/:username/following', async (request, response, next) => {
    try {
      const username = request.params.username;
      const limit = Array.isArray(request.query.limit)
        ? request.query.limit[0]
        : request.query.limit;

      const result = await service.getFollowing(username, limit);
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
};
