import { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import type { LikeRecord, LikeStore } from './like.types.js';

const likeSelect = {
  userId: true,
  tweetId: true,
  createdAt: true,
} satisfies Prisma.LikeSelect;

type PrismaLike = Prisma.LikeGetPayload<{
  select: typeof likeSelect;
}>;

const toLikeRecord = (like: PrismaLike): LikeRecord => like;

export class PrismaLikeStore implements LikeStore {
  async createLike(userId: string, tweetId: string) {
    try {
      const like = await prisma.like.create({
        data: {
          userId,
          tweetId,
        },
        select: likeSelect,
      });

      return toLikeRecord(like);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new AppError(
          409,
          'LIKE_ALREADY_EXISTS',
          'You have already liked this tweet.',
        );
      }

      throw error;
    }
  }

  async findLike(userId: string, tweetId: string) {
    const like = await prisma.like.findUnique({
      where: {
        userId_tweetId: {
          userId,
          tweetId,
        },
      },
      select: likeSelect,
    });

    return like ? toLikeRecord(like) : null;
  }

  async deleteLike(userId: string, tweetId: string) {
    await prisma.like.delete({
      where: {
        userId_tweetId: {
          userId,
          tweetId,
        },
      },
    });
  }

  async countLikes(tweetId: string) {
    return prisma.like.count({
      where: { tweetId },
    });
  }
}
