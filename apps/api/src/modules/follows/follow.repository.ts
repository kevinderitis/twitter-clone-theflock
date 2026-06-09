import { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import type { FollowRecord, FollowStore } from './follow.types.js';

const followSelect = {
  followerId: true,
  followingId: true,
  createdAt: true,
} satisfies Prisma.FollowSelect;

type PrismaFollow = Prisma.FollowGetPayload<{
  select: typeof followSelect;
}>;

const toFollowRecord = (follow: PrismaFollow): FollowRecord => follow;

export class PrismaFollowStore implements FollowStore {
  async createFollow(followerId: string, followingId: string) {
    const follow = await prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
      select: followSelect,
    });

    return toFollowRecord(follow);
  }

  async findFollow(followerId: string, followingId: string) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
      select: followSelect,
    });

    return follow ? toFollowRecord(follow) : null;
  }

  async deleteFollow(followerId: string, followingId: string) {
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });
  }
}
