import express from 'express';

import { isAppError } from './lib/errors.js';
import { createAuthRouter } from './modules/auth/auth.router.js';
import { AuthService } from './modules/auth/auth.service.js';
import type { AuthUserStore } from './modules/auth/auth.types.js';
import { createFollowRouter } from './modules/follows/follow.router.js';
import { FollowService } from './modules/follows/follow.service.js';
import type { FollowStore } from './modules/follows/follow.types.js';
import { createLikeRouter } from './modules/likes/like.router.js';
import { LikeService } from './modules/likes/like.service.js';
import type { LikeStore } from './modules/likes/like.types.js';
import { createTimelineRouter } from './modules/timeline/timeline.router.js';
import { TimelineService } from './modules/timeline/timeline.service.js';
import type { TimelineStore } from './modules/timeline/timeline.types.js';
import { createTweetRouter } from './modules/tweets/tweet.router.js';
import { TweetService } from './modules/tweets/tweet.service.js';
import type { TweetStore } from './modules/tweets/tweet.types.js';

type AppDependencies = {
  authService?: AuthService;
  authUserStore?: AuthUserStore;
  followService?: FollowService;
  followStore?: FollowStore;
  likeService?: LikeService;
  likeStore?: LikeStore;
  timelineService?: TimelineService;
  timelineStore?: TimelineStore;
  tweetService?: TweetService;
  tweetStore?: TweetStore;
};

export const createApp = ({
  authService,
  authUserStore,
  followService,
  followStore,
  likeService,
  likeStore,
  timelineService,
  timelineStore,
  tweetService,
  tweetStore,
}: AppDependencies = {}) => {
  const app = express();

  app.use(express.json());

  app.use('/auth', createAuthRouter({ authService, userStore: authUserStore }));
  app.use(
    '/tweets',
    createTweetRouter({
      authUserStore,
      tweetService,
      tweetStore,
    }),
  );
  app.use(
    '/users',
    createFollowRouter({
      authUserStore,
      followService,
      followStore,
    }),
  );
  app.use(
    '/tweets',
    createLikeRouter({
      authUserStore,
      likeService,
      likeStore,
      tweetStore,
    }),
  );
  app.use(
    '/timeline',
    createTimelineRouter({
      authUserStore,
      timelineService,
      timelineStore,
    }),
  );

  app.get('/health', (_request, response) => {
    response.status(200).json({
      status: 'ok',
      service: 'api',
    });
  });

  app.use(
    (
      error: unknown,
      _request: express.Request,
      response: express.Response,
      next: express.NextFunction,
    ) => {
      void next;

      if (isAppError(error)) {
        response.status(error.statusCode).json({
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        });
        return;
      }

      console.error(error);

      response.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred.',
        },
      });
    },
  );

  return app;
};
