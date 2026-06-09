import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

import { AppError } from '../../lib/errors.js';
import type { AuthUserRecord, AuthUserStore } from '../auth/auth.types.js';
import { followParamsSchema } from './follow.schemas.js';
import type { FollowStore } from './follow.types.js';

const mapValidationError = (error: ZodError) =>
  error.issues.map((issue) => issue.message);

export class FollowService {
  constructor(
    private readonly authUserStore: AuthUserStore,
    private readonly followStore: FollowStore,
  ) {}

  async followUser(userIdParam: string, authUser: AuthUserRecord) {
    const targetUserId = this.validateUserId(userIdParam);

    if (targetUserId === authUser.id) {
      throw new AppError(400, 'FOLLOW_SELF', 'You cannot follow yourself.');
    }

    const targetUser = await this.authUserStore.findById(targetUserId);

    if (!targetUser) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found.');
    }

    const existingFollow = await this.followStore.findFollow(
      authUser.id,
      targetUserId,
    );

    if (existingFollow) {
      throw new AppError(
        409,
        'FOLLOW_ALREADY_EXISTS',
        'You are already following this user.',
      );
    }

    try {
      const follow = await this.followStore.createFollow(
        authUser.id,
        targetUserId,
      );

      return {
        follow,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new AppError(
          409,
          'FOLLOW_ALREADY_EXISTS',
          'You are already following this user.',
        );
      }

      throw error;
    }
  }

  async unfollowUser(userIdParam: string, authUser: AuthUserRecord) {
    const targetUserId = this.validateUserId(userIdParam);
    const targetUser = await this.authUserStore.findById(targetUserId);

    if (!targetUser) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found.');
    }

    const existingFollow = await this.followStore.findFollow(
      authUser.id,
      targetUserId,
    );

    if (existingFollow) {
      await this.followStore.deleteFollow(authUser.id, targetUserId);
    }

    return {
      success: true,
    };
  }

  private validateUserId(userIdParam: string) {
    try {
      return followParamsSchema.parse({ userId: userIdParam }).userId;
    } catch (error) {
      if (error instanceof ZodError) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Invalid follow request.',
          mapValidationError(error),
        );
      }

      throw error;
    }
  }
}
