import { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import type {
  FollowListQuery,
  FollowProfile,
  FollowRecord,
  FollowStore,
} from './follow.types.js';

const followSelect = {
  followerId: true,
  followingId: true,
  createdAt: true,
} satisfies Prisma.FollowSelect;

const followProfileSelect = {
  id: true,
  username: true,
  name: true,
  bio: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

type PrismaFollow = Prisma.FollowGetPayload<{
  select: typeof followSelect;
}>;

type PrismaFollowProfile = Prisma.UserGetPayload<{
  select: typeof followProfileSelect;
}>;

const toFollowRecord = (follow: PrismaFollow): FollowRecord => follow;
const toFollowProfile = (user: PrismaFollowProfile): FollowProfile => user;

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

  async listFollowers(userId: string, query: FollowListQuery) {
    const users = await prisma.user.findMany({
      where: {
        following: {
          some: {
            followingId: userId,
          },
        },
      },
      orderBy: {
        username: 'asc',
      },
      take: query.limit,
      select: followProfileSelect,
    });

    return users.map(toFollowProfile);
  }

  async listFollowing(userId: string, query: FollowListQuery) {
    const users = await prisma.user.findMany({
      where: {
        followers: {
          some: {
            followerId: userId,
          },
        },
      },
      orderBy: {
        username: 'asc',
      },
      take: query.limit,
      select: followProfileSelect,
    });

    return users.map(toFollowProfile);
  }

  async countFollowers(userId: string) {
    return prisma.follow.count({
      where: {
        followingId: userId,
      },
    });
  }

  async countFollowing(userId: string) {
    return prisma.follow.count({
      where: {
        followerId: userId,
      },
    });
  }
}
