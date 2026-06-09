import { Router } from 'express';

import { getAuthenticatedUser, requireAuth } from '../auth/auth.middleware.js';
import { PrismaAuthUserStore } from '../auth/auth.repository.js';
import type { AuthUserStore } from '../auth/auth.types.js';
import { PrismaLikeStore } from './like.repository.js';
import { LikeService } from './like.service.js';
import type { LikeStore } from './like.types.js';
import { PrismaTweetStore } from '../tweets/tweet.repository.js';
import type { TweetStore } from '../tweets/tweet.types.js';

type LikeRouterDependencies = {
  authUserStore?: AuthUserStore;
  tweetStore?: TweetStore;
  likeStore?: LikeStore;
  likeService?: LikeService;
};

export const createLikeRouter = ({
  authUserStore,
  tweetStore,
  likeStore,
  likeService,
}: LikeRouterDependencies = {}) => {
  const router = Router();
  const resolvedAuthUserStore = authUserStore ?? new PrismaAuthUserStore();
  const resolvedTweetStore = tweetStore ?? new PrismaTweetStore();
  const resolvedLikeStore = likeStore ?? new PrismaLikeStore();
  const service =
    likeService ?? new LikeService(resolvedTweetStore, resolvedLikeStore);

  router.post(
    '/:tweetId/like',
    requireAuth(resolvedAuthUserStore),
    async (request, response, next) => {
      try {
        const tweetId = Array.isArray(request.params.tweetId)
          ? request.params.tweetId[0]
          : request.params.tweetId;

        const result = await service.likeTweet(
          tweetId,
          getAuthenticatedUser(request),
        );
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  router.delete(
    '/:tweetId/like',
    requireAuth(resolvedAuthUserStore),
    async (request, response, next) => {
      try {
        const tweetId = Array.isArray(request.params.tweetId)
          ? request.params.tweetId[0]
          : request.params.tweetId;

        const result = await service.unlikeTweet(
          tweetId,
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
