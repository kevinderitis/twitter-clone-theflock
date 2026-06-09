import { ZodError } from 'zod';

import { AppError } from '../../lib/errors.js';
import { userSearchQuerySchema } from './user-search.schemas.js';
import type { UserSearchStore } from './user-search.types.js';

const mapValidationError = (error: ZodError) =>
  error.issues.map((issue) => issue.message);

export class UserSearchService {
  constructor(private readonly userSearchStore: UserSearchStore) {}

  async searchUsers(query: unknown) {
    try {
      const validatedQuery = userSearchQuerySchema.parse(query);

      return {
        users: await this.userSearchStore.searchUsers(validatedQuery),
      };
    } catch (error) {
      if (error instanceof ZodError) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Invalid user search query.',
          mapValidationError(error),
        );
      }

      throw error;
    }
  }
}
