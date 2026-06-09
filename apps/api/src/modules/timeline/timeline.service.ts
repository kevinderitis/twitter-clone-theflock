import { ZodError } from 'zod';

import { AppError } from '../../lib/errors.js';
import type { AuthUserRecord } from '../auth/auth.types.js';
import { timelineQuerySchema } from './timeline.schemas.js';
import type { TimelineStore } from './timeline.types.js';

const mapValidationError = (error: ZodError) =>
  error.issues.map((issue) => issue.message);

export class TimelineService {
  constructor(private readonly timelineStore: TimelineStore) {}

  async getTimeline(query: unknown, authUser: AuthUserRecord) {
    try {
      const validatedQuery = timelineQuerySchema.parse(query);

      return this.timelineStore.listTimeline(authUser.id, validatedQuery);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Invalid timeline query.',
          mapValidationError(error),
        );
      }

      throw error;
    }
  }
}
