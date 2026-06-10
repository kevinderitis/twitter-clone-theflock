import { Router } from 'express';

import {
  getOptionalAuthenticatedUser,
  optionalAuth,
} from '../auth/auth.middleware.js';
import { PrismaAuthUserStore } from '../auth/auth.repository.js';
import type { AuthUserStore } from '../auth/auth.types.js';
import { PrismaFollowStore } from '../follows/follow.repository.js';
import type { FollowStore } from '../follows/follow.types.js';
import { PrismaTweetStore } from '../tweets/tweet.repository.js';
import type { TweetStore } from '../tweets/tweet.types.js';
import { ProfileService } from './profile.service.js';

type ProfileRouterDependencies = {
  authUserStore?: AuthUserStore;
  followStore?: FollowStore;
  tweetStore?: TweetStore;
  profileService?: ProfileService;
};

export const createProfileRouter = ({
  authUserStore,
  followStore,
  tweetStore,
  profileService,
}: ProfileRouterDependencies = {}) => {
  const router = Router();
  const resolvedAuthUserStore = authUserStore ?? new PrismaAuthUserStore();
  const resolvedFollowStore = followStore ?? new PrismaFollowStore();
  const resolvedTweetStore = tweetStore ?? new PrismaTweetStore();
  const service =
    profileService ??
    new ProfileService(
      resolvedAuthUserStore,
      resolvedFollowStore,
      resolvedTweetStore,
    );

  router.get(
    '/:username',
    optionalAuth(resolvedAuthUserStore),
    async (request, response, next) => {
      try {
        const username = request.params.username;

        const result = await service.getProfile(
          username,
          getOptionalAuthenticatedUser(request),
        );
        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
};
