import { ZodError } from 'zod';

import { AppError } from '../../lib/errors.js';
import type { FollowStore } from '../follows/follow.types.js';
import { userSearchQuerySchema } from './user-search.schemas.js';
import type { AuthUserRecord } from '../auth/auth.types.js';
import type { UserSearchStore } from './user-search.types.js';

const mapValidationError = (error: ZodError) =>
  error.issues.map((issue) => issue.message);

export class UserSearchService {
  constructor(
    private readonly userSearchStore: UserSearchStore,
    private readonly followStore?: FollowStore,
  ) {}

  async searchUsers(query: unknown, authUser?: AuthUserRecord | null) {
    try {
      const validatedQuery = userSearchQuerySchema.parse(query);
      const users = await this.userSearchStore.searchUsers(validatedQuery);

      if (!authUser || !this.followStore) {
        return {
          users,
        };
      }

      const usersWithFollowState = await Promise.all(
        users.map(async (user) => ({
          ...user,
          isFollowing:
            user.id !== authUser.id
              ? Boolean(
                  await this.followStore?.findFollow(authUser.id, user.id),
                )
              : false,
        })),
      );

      return {
        users: usersWithFollowState,
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
