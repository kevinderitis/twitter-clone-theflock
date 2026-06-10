import { describe, expect, it, vi, beforeEach } from 'vitest';

import { Prisma } from '@prisma/client';

import { PrismaLikeStore } from '../src/modules/likes/like.repository.js';

const mockPrisma = vi.hoisted(() => ({
  like: {
    create: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
}));

vi.mock('../src/lib/prisma.js', () => ({
  prisma: mockPrisma,
}));

const makeLike = (overrides: Record<string, unknown> = {}) => ({
  userId: 'user_1',
  tweetId: 'tweet_1',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

describe('PrismaLikeStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createLike', () => {
    it('creates and returns the like', async () => {
      const like = makeLike();
      mockPrisma.like.create.mockResolvedValue(like);

      const result = await new PrismaLikeStore().createLike('user_1', 'tweet_1');

      expect(mockPrisma.like.create).toHaveBeenCalledWith({
        data: { userId: 'user_1', tweetId: 'tweet_1' },
        select: expect.any(Object),
      });
      expect(result).toEqual(like);
    });

    it('throws LIKE_ALREADY_EXISTS on duplicate', async () => {
      const error = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: '1.0',
      });
      mockPrisma.like.create.mockRejectedValue(error);

      await expect(
        new PrismaLikeStore().createLike('user_1', 'tweet_1'),
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'LIKE_ALREADY_EXISTS',
      });
    });

    it('re-throws unknown Prisma errors', async () => {
      const error = new Prisma.PrismaClientKnownRequestError('Foreign key', {
        code: 'P2003',
        clientVersion: '1.0',
      });
      mockPrisma.like.create.mockRejectedValue(error);

      await expect(
        new PrismaLikeStore().createLike('user_1', 'tweet_1'),
      ).rejects.toThrow(error);
    });

    it('re-throws non-Prisma errors', async () => {
      const error = new Error('DB connection lost');
      mockPrisma.like.create.mockRejectedValue(error);

      await expect(
        new PrismaLikeStore().createLike('user_1', 'tweet_1'),
      ).rejects.toThrow(error);
    });
  });

  describe('findLike', () => {
    it('returns the like when found', async () => {
      const like = makeLike();
      mockPrisma.like.findUnique.mockResolvedValue(like);

      const result = await new PrismaLikeStore().findLike('user_1', 'tweet_1');

      expect(mockPrisma.like.findUnique).toHaveBeenCalledWith({
        where: {
          userId_tweetId: { userId: 'user_1', tweetId: 'tweet_1' },
        },
        select: expect.any(Object),
      });
      expect(result).toEqual(like);
    });

    it('returns null when not found', async () => {
      mockPrisma.like.findUnique.mockResolvedValue(null);

      const result = await new PrismaLikeStore().findLike('user_1', 'tweet_1');

      expect(result).toBeNull();
    });
  });

  describe('deleteLike', () => {
    it('deletes the like', async () => {
      mockPrisma.like.delete.mockResolvedValue(undefined as unknown as never);

      await new PrismaLikeStore().deleteLike('user_1', 'tweet_1');

      expect(mockPrisma.like.delete).toHaveBeenCalledWith({
        where: {
          userId_tweetId: { userId: 'user_1', tweetId: 'tweet_1' },
        },
      });
    });
  });

  describe('countLikes', () => {
    it('returns the like count', async () => {
      mockPrisma.like.count.mockResolvedValue(3);

      const result = await new PrismaLikeStore().countLikes('tweet_1');

      expect(result).toBe(3);
      expect(mockPrisma.like.count).toHaveBeenCalledWith({
        where: { tweetId: 'tweet_1' },
      });
    });
  });
});
