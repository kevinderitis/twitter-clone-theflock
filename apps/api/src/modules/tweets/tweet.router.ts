import { Router } from 'express';

import {
  getAuthenticatedUser,
  getOptionalAuthenticatedUser,
  optionalAuth,
  requireAuth,
} from '../auth/auth.middleware.js';
import { PrismaAuthUserStore } from '../auth/auth.repository.js';
import type { AuthUserStore } from '../auth/auth.types.js';
import { PrismaTweetStore } from './tweet.repository.js';
import { TweetService } from './tweet.service.js';
import type { TweetStore } from './tweet.types.js';

type TweetRouterDependencies = {
  authUserStore?: AuthUserStore;
  tweetStore?: TweetStore;
  tweetService?: TweetService;
};

export const createTweetRouter = ({
  authUserStore,
  tweetStore,
  tweetService,
}: TweetRouterDependencies = {}) => {
  const router = Router();
  const resolvedAuthUserStore = authUserStore ?? new PrismaAuthUserStore();
  const resolvedTweetStore = tweetStore ?? new PrismaTweetStore();
  const service = tweetService ?? new TweetService(resolvedTweetStore);

  router.post(
    '/',
    requireAuth(resolvedAuthUserStore),
    async (request, response, next) => {
      try {
        const result = await service.createTweet(
          request.body,
          getAuthenticatedUser(request),
        );
        response.status(201).json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  router.get('/:tweetId', async (request, response, next) => {
    try {
      const tweetId = Array.isArray(request.params.tweetId)
        ? request.params.tweetId[0]
        : request.params.tweetId;

      const result = await service.getTweetById(tweetId);
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.delete(
    '/:id',
    requireAuth(resolvedAuthUserStore),
    async (request, response, next) => {
      try {
        const tweetId = Array.isArray(request.params.id)
          ? request.params.id[0]
          : request.params.id;

        const result = await service.deleteTweet(
          tweetId,
          getAuthenticatedUser(request),
        );
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  router.get(
    '/user/:username',
    optionalAuth(resolvedAuthUserStore),
    async (request, response, next) => {
      try {
        const username = Array.isArray(request.params.username)
          ? request.params.username[0]
          : request.params.username;

        const authUser = getOptionalAuthenticatedUser(request);
        const result = await service.getTweetsByUsername(
          username,
          request.query,
          authUser?.id,
        );
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
};
