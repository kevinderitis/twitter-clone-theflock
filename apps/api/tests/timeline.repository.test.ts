import { describe, expect, it, vi, beforeEach } from 'vitest';

import { PrismaTimelineStore } from '../src/modules/timeline/timeline.repository.js';

const mockPrisma = vi.hoisted(() => ({
  follow: {
    findMany: vi.fn(),
  },
  tweet: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
}));

vi.mock('../src/lib/prisma.js', () => ({
  prisma: mockPrisma,
}));

const makePrismaTweet = (overrides: Record<string, unknown> = {}) => ({
  id: 'tweet_1',
  content: 'Hello world',
  authorId: 'user_2',
  createdAt: new Date('2026-01-02T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  author: {
    id: 'user_2',
    username: 'barbara',
    name: 'Barbara Liskov',
    avatarUrl: null,
  },
  likes: [] as { userId: string }[],
  _count: { likes: 0 },
  ...overrides,
});

describe('PrismaTimelineStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns tweets from followed users', async () => {
    mockPrisma.follow.findMany.mockResolvedValue([
      { followingId: 'user_2' },
      { followingId: 'user_3' },
    ]);
    const tweets = [makePrismaTweet(), makePrismaTweet({ id: 'tweet_2' })];
    mockPrisma.tweet.findMany.mockResolvedValue(tweets);

    const result = await new PrismaTimelineStore().listTimeline('viewer_1', {
      limit: 20,
    });

    expect(result.tweets).toHaveLength(2);
    expect(result.nextCursor).toBeNull();
    expect(mockPrisma.follow.findMany).toHaveBeenCalledWith({
      where: { followerId: 'viewer_1' },
      select: { followingId: true },
    });
  });

  it('uses cursor-based pagination', async () => {
    mockPrisma.follow.findMany.mockResolvedValue([
      { followingId: 'user_2' },
    ]);
    mockPrisma.tweet.findUnique.mockResolvedValue({
      id: 'tweet_5',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const tweets = [
      makePrismaTweet({ id: 'tweet_4', createdAt: new Date('2025-12-31T00:00:00.000Z') }),
    ];
    mockPrisma.tweet.findMany.mockResolvedValue(tweets);

    const result = await new PrismaTimelineStore().listTimeline('viewer_1', {
      limit: 20,
      cursor: 'tweet_5',
    });

    expect(result.tweets).toHaveLength(1);
    expect(mockPrisma.tweet.findUnique).toHaveBeenCalledWith({
      where: { id: 'tweet_5' },
      select: { id: true, createdAt: true },
    });
  });

  it('skips cursor filter when cursor tweet is not found', async () => {
    mockPrisma.follow.findMany.mockResolvedValue([
      { followingId: 'user_2' },
    ]);
    mockPrisma.tweet.findUnique.mockResolvedValue(null);
    const tweets = [makePrismaTweet()];
    mockPrisma.tweet.findMany.mockResolvedValue(tweets);

    const result = await new PrismaTimelineStore().listTimeline('viewer_1', {
      limit: 20,
      cursor: 'missing',
    });

    expect(result.tweets).toHaveLength(1);
  });

  it('returns empty page when following no one', async () => {
    mockPrisma.follow.findMany.mockResolvedValue([]);

    const result = await new PrismaTimelineStore().listTimeline('viewer_1', {
      limit: 20,
    });

    expect(result).toEqual({ tweets: [], nextCursor: null });
    expect(mockPrisma.tweet.findMany).not.toHaveBeenCalled();
  });

  it('marks likedByMe when viewer has liked a tweet', async () => {
    mockPrisma.follow.findMany.mockResolvedValue([
      { followingId: 'user_2' },
    ]);
    const tweets = [makePrismaTweet({ likes: [{ userId: 'viewer_1' }] })];
    mockPrisma.tweet.findMany.mockResolvedValue(tweets);

    const result = await new PrismaTimelineStore().listTimeline('viewer_1', {
      limit: 20,
    });

    expect(result.tweets[0]?.likedByMe).toBe(true);
  });

  it('paginates with nextCursor when there are more tweets than limit', async () => {
    mockPrisma.follow.findMany.mockResolvedValue([
      { followingId: 'user_2' },
    ]);
    const tweets = [
      makePrismaTweet({ id: 'tweet_a', createdAt: new Date('2026-01-05T00:00:00.000Z') }),
      makePrismaTweet({ id: 'tweet_b', createdAt: new Date('2026-01-04T00:00:00.000Z') }),
      makePrismaTweet({ id: 'tweet_c', createdAt: new Date('2026-01-03T00:00:00.000Z') }),
    ];
    mockPrisma.tweet.findMany.mockResolvedValue(tweets);

    const result = await new PrismaTimelineStore().listTimeline('viewer_1', {
      limit: 2,
    });

    expect(result.tweets).toHaveLength(2);
    expect(result.nextCursor).toBe('tweet_b');
  });
});
