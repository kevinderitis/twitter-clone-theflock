import { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import type {
  UserSearchQuery,
  UserSearchResult,
  UserSearchStore,
} from './user-search.types.js';

const userSearchSelect = {
  id: true,
  username: true,
  name: true,
  bio: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

type PrismaSearchUser = Prisma.UserGetPayload<{
  select: typeof userSearchSelect;
}>;

const toUserSearchResult = (user: PrismaSearchUser): UserSearchResult => ({
  ...user,
  isFollowing: false,
});

export class PrismaUserSearchStore implements UserSearchStore {
  async searchUsers(query: UserSearchQuery) {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          {
            username: {
              contains: query.q,
              mode: 'insensitive',
            },
          },
          {
            name: {
              contains: query.q,
              mode: 'insensitive',
            },
          },
        ],
      },
      orderBy: {
        username: 'asc',
      },
      take: query.limit,
      select: userSearchSelect,
    });

    return users.map(toUserSearchResult);
  }
}
