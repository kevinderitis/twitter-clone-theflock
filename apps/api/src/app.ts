import express from 'express';

import { isAppError } from './lib/errors.js';
import { createAuthRouter } from './modules/auth/auth.router.js';
import { AuthService } from './modules/auth/auth.service.js';
import type { AuthUserStore } from './modules/auth/auth.types.js';
import { createFollowRouter } from './modules/follows/follow.router.js';
import { PrismaFollowStore } from './modules/follows/follow.repository.js';
import { FollowService } from './modules/follows/follow.service.js';
import type { FollowStore } from './modules/follows/follow.types.js';
import { createLikeRouter } from './modules/likes/like.router.js';
import { LikeService } from './modules/likes/like.service.js';
import type { LikeStore } from './modules/likes/like.types.js';
import { createProfileRouter } from './modules/profile/profile.router.js';
import { ProfileService } from './modules/profile/profile.service.js';
import { createTimelineRouter } from './modules/timeline/timeline.router.js';
import { TimelineService } from './modules/timeline/timeline.service.js';
import type { TimelineStore } from './modules/timeline/timeline.types.js';
import { createTweetRouter } from './modules/tweets/tweet.router.js';
import { TweetService } from './modules/tweets/tweet.service.js';
import type { TweetStore } from './modules/tweets/tweet.types.js';
import { createUserSearchRouter } from './modules/user-search/user-search.router.js';
import { UserSearchService } from './modules/user-search/user-search.service.js';
import type { UserSearchStore } from './modules/user-search/user-search.types.js';

type AppDependencies = {
  authService?: AuthService;
  authUserStore?: AuthUserStore;
  followService?: FollowService;
  followStore?: FollowStore;
  likeService?: LikeService;
  likeStore?: LikeStore;
  profileService?: ProfileService;
  timelineService?: TimelineService;
  timelineStore?: TimelineStore;
  tweetService?: TweetService;
  tweetStore?: TweetStore;
  userSearchService?: UserSearchService;
  userSearchStore?: UserSearchStore;
};

export const createApp = ({
  authService,
  authUserStore,
  followService,
  followStore,
  likeService,
  likeStore,
  profileService,
  timelineService,
  timelineStore,
  tweetService,
  tweetStore,
  userSearchService,
  userSearchStore,
}: AppDependencies = {}) => {
  const app = express();
  const resolvedFollowStore = followStore ?? new PrismaFollowStore();
  const configuredWebOrigin = process.env.WEB_ORIGIN?.trim();
  const webOrigin =
    configuredWebOrigin && configuredWebOrigin.length > 0
      ? configuredWebOrigin
      : 'http://localhost:5173';

  app.use((request, response, next) => {
    response.header('Access-Control-Allow-Origin', webOrigin);
    response.header('Vary', 'Origin');
    response.header(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization',
    );
    response.header(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    );

    if (request.method === 'OPTIONS') {
      response.sendStatus(204);
      return;
    }

    next();
  });

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
      followStore: resolvedFollowStore,
    }),
  );
  app.use(
    '/users',
    createUserSearchRouter({
      authUserStore,
      followStore: resolvedFollowStore,
      userSearchService,
      userSearchStore,
    }),
  );
  app.use(
    '/users',
    createProfileRouter({
      authUserStore,
      followStore: resolvedFollowStore,
      profileService,
      tweetStore,
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
