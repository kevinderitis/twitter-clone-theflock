import { Router } from 'express';

import { getAuthenticatedUser, requireAuth } from '../auth/auth.middleware.js';
import { PrismaAuthUserStore } from '../auth/auth.repository.js';
import type { AuthUserStore } from '../auth/auth.types.js';
import { PrismaTimelineStore } from './timeline.repository.js';
import { TimelineService } from './timeline.service.js';
import type { TimelineStore } from './timeline.types.js';

type TimelineRouterDependencies = {
  authUserStore?: AuthUserStore;
  timelineStore?: TimelineStore;
  timelineService?: TimelineService;
};

export const createTimelineRouter = ({
  authUserStore,
  timelineStore,
  timelineService,
}: TimelineRouterDependencies = {}) => {
  const router = Router();
  const resolvedAuthUserStore = authUserStore ?? new PrismaAuthUserStore();
  const resolvedTimelineStore = timelineStore ?? new PrismaTimelineStore();
  const service = timelineService ?? new TimelineService(resolvedTimelineStore);

  router.get(
    '/',
    requireAuth(resolvedAuthUserStore),
    async (request, response, next) => {
      try {
        const result = await service.getTimeline(
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
