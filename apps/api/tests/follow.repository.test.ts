import { describe, expect, it, vi, beforeEach } from 'vitest';

import { PrismaFollowStore } from '../src/modules/follows/follow.repository.js';

const mockPrisma = vi.hoisted(() => ({
  user: {
    findMany: vi.fn(),
  },
  follow: {
    create: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
}));

vi.mock('../src/lib/prisma.js', () => ({
  prisma: mockPrisma,
}));

const makeFollow = (overrides: Record<string, unknown> = {}) => ({
  followerId: 'user_1',
  followingId: 'user_2',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

const makeProfile = (overrides: Record<string, unknown> = {}) => ({
  id: 'user_2',
  username: 'barbara',
  name: 'Barbara Liskov',
  bio: null,
  avatarUrl: null,
  ...overrides,
});

describe('PrismaFollowStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createFollow', () => {
    it('creates and returns the follow', async () => {
      const follow = makeFollow();
      mockPrisma.follow.create.mockResolvedValue(follow);

      const result = await new PrismaFollowStore().createFollow('user_1', 'user_2');

      expect(mockPrisma.follow.create).toHaveBeenCalledWith({
        data: { followerId: 'user_1', followingId: 'user_2' },
        select: expect.any(Object),
      });
      expect(result).toEqual(follow);
    });
  });

  describe('findFollow', () => {
    it('returns the follow when found', async () => {
      const follow = makeFollow();
      mockPrisma.follow.findUnique.mockResolvedValue(follow);

      const result = await new PrismaFollowStore().findFollow('user_1', 'user_2');

      expect(mockPrisma.follow.findUnique).toHaveBeenCalledWith({
        where: {
          followerId_followingId: { followerId: 'user_1', followingId: 'user_2' },
        },
        select: expect.any(Object),
      });
      expect(result).toEqual(follow);
    });

    it('returns null when not found', async () => {
      mockPrisma.follow.findUnique.mockResolvedValue(null);

      const result = await new PrismaFollowStore().findFollow('user_1', 'user_2');

      expect(result).toBeNull();
    });
  });

  describe('deleteFollow', () => {
    it('deletes the follow', async () => {
      mockPrisma.follow.delete.mockResolvedValue(undefined as unknown as never);

      await new PrismaFollowStore().deleteFollow('user_1', 'user_2');

      expect(mockPrisma.follow.delete).toHaveBeenCalledWith({
        where: {
          followerId_followingId: { followerId: 'user_1', followingId: 'user_2' },
        },
      });
    });
  });

  describe('listFollowers', () => {
    it('returns followers for a user', async () => {
      const profiles = [makeProfile(), makeProfile({ id: 'user_3', username: 'alan' })];
      mockPrisma.user.findMany.mockResolvedValue(profiles);

      const result = await new PrismaFollowStore().listFollowers('user_1', { limit: 20 });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          followers: { some: { followingId: 'user_1' } },
        },
        orderBy: { username: 'asc' },
        take: 20,
        select: expect.any(Object),
      });
      expect(result).toHaveLength(2);
    });

    it('returns empty array when no followers', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      const result = await new PrismaFollowStore().listFollowers('user_1', { limit: 20 });

      expect(result).toEqual([]);
    });
  });

  describe('listFollowing', () => {
    it('returns who a user is following', async () => {
      const profiles = [makeProfile()];
      mockPrisma.user.findMany.mockResolvedValue(profiles);

      const result = await new PrismaFollowStore().listFollowing('user_1', { limit: 20 });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          following: { some: { followerId: 'user_1' } },
        },
        orderBy: { username: 'asc' },
        take: 20,
        select: expect.any(Object),
      });
      expect(result).toHaveLength(1);
    });

    it('returns empty array when not following anyone', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      const result = await new PrismaFollowStore().listFollowing('user_1', { limit: 20 });

      expect(result).toEqual([]);
    });
  });

  describe('countFollowers', () => {
    it('returns the follower count', async () => {
      mockPrisma.follow.count.mockResolvedValue(10);

      const result = await new PrismaFollowStore().countFollowers('user_1');

      expect(result).toBe(10);
      expect(mockPrisma.follow.count).toHaveBeenCalledWith({
        where: { followingId: 'user_1' },
      });
    });
  });

  describe('countFollowing', () => {
    it('returns the following count', async () => {
      mockPrisma.follow.count.mockResolvedValue(5);

      const result = await new PrismaFollowStore().countFollowing('user_1');

      expect(result).toBe(5);
      expect(mockPrisma.follow.count).toHaveBeenCalledWith({
        where: { followerId: 'user_1' },
      });
    });
  });
});
