import { describe, expect, it, vi, beforeEach } from 'vitest';

import { PrismaTweetStore } from '../src/modules/tweets/tweet.repository.js';

const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
  },
  tweet: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  like: {
    findMany: vi.fn(),
  },
}));

vi.mock('../src/lib/prisma.js', () => ({
  prisma: mockPrisma,
}));

const makeTweet = (overrides: Record<string, unknown> = {}) => ({
  id: 'tweet_1',
  content: 'Hello world',
  authorId: 'user_1',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  author: {
    id: 'user_1',
    username: 'ada',
    name: 'Ada Lovelace',
    avatarUrl: null,
  },
  _count: { likes: 0 },
  ...overrides,
});

describe('PrismaTweetStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTweet', () => {
    it('creates and returns a tweet', async () => {
      const tweet = makeTweet();
      mockPrisma.tweet.create.mockResolvedValue(tweet);

      const result = await new PrismaTweetStore().createTweet({
        content: 'Hello world',
        authorId: 'user_1',
      });

      expect(mockPrisma.tweet.create).toHaveBeenCalledWith({
        data: { content: 'Hello world', authorId: 'user_1' },
        select: expect.any(Object),
      });
      expect(result).toMatchObject({
        id: 'tweet_1',
        content: 'Hello world',
        authorId: 'user_1',
        likesCount: 0,
      });
    });
  });

  describe('findTweetById', () => {
    it('returns the tweet when found', async () => {
      const tweet = makeTweet();
      mockPrisma.tweet.findUnique.mockResolvedValue(tweet);

      const result = await new PrismaTweetStore().findTweetById('tweet_1');

      expect(result).toMatchObject({ id: 'tweet_1', content: 'Hello world' });
    });

    it('returns null when not found', async () => {
      mockPrisma.tweet.findUnique.mockResolvedValue(null);

      const result = await new PrismaTweetStore().findTweetById('missing');

      expect(result).toBeNull();
    });
  });

  describe('findTweetsByUsername', () => {
    it('returns tweets without likedByMe when no authUserId', async () => {
      const tweets = [makeTweet(), makeTweet({ id: 'tweet_2' })];
      mockPrisma.tweet.findMany.mockResolvedValue(tweets);

      const result = await new PrismaTweetStore().findTweetsByUsername('ada', 20);

      expect(mockPrisma.tweet.findMany).toHaveBeenCalledWith({
        where: { author: { username: 'ada' } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 20,
        select: expect.any(Object),
      });
      expect(result).toHaveLength(2);
      expect(result[0]?.likedByMe).toBeUndefined();
    });

    it('returns tweets with likedByMe when authUserId is provided', async () => {
      const tweets = [
        makeTweet({ id: 'tweet_1' }),
        makeTweet({ id: 'tweet_2' }),
      ];
      mockPrisma.tweet.findMany.mockResolvedValue(tweets);
      mockPrisma.like.findMany.mockResolvedValue([
        { tweetId: 'tweet_1' },
      ]);

      const result = await new PrismaTweetStore().findTweetsByUsername(
        'ada', 20, 'viewer_1',
      );

      expect(result[0]?.likedByMe).toBe(true);
      expect(result[1]?.likedByMe).toBe(false);
      expect(mockPrisma.like.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'viewer_1',
          tweetId: { in: ['tweet_1', 'tweet_2'] },
        },
        select: { tweetId: true },
      });
    });

    it('returns empty array when no tweets exist', async () => {
      mockPrisma.tweet.findMany.mockResolvedValue([]);

      const result = await new PrismaTweetStore().findTweetsByUsername('ada', 20);

      expect(result).toEqual([]);
    });
  });

  describe('userExistsByUsername', () => {
    it('returns true when user exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user_1' });

      const result = await new PrismaTweetStore().userExistsByUsername('ada');

      expect(result).toBe(true);
    });

    it('returns false when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await new PrismaTweetStore().userExistsByUsername('missing');

      expect(result).toBe(false);
    });
  });

  describe('countTweetsByAuthorId', () => {
    it('returns the tweet count', async () => {
      mockPrisma.tweet.count.mockResolvedValue(5);

      const result = await new PrismaTweetStore().countTweetsByAuthorId('user_1');

      expect(result).toBe(5);
      expect(mockPrisma.tweet.count).toHaveBeenCalledWith({
        where: { authorId: 'user_1' },
      });
    });
  });

  describe('deleteTweet', () => {
    it('deletes the tweet by id', async () => {
      mockPrisma.tweet.delete.mockResolvedValue(undefined as unknown as never);

      await new PrismaTweetStore().deleteTweet('tweet_1');

      expect(mockPrisma.tweet.delete).toHaveBeenCalledWith({
        where: { id: 'tweet_1' },
      });
    });
  });
});
