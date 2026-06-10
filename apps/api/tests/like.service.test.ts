import { describe, expect, it, vi } from 'vitest';

import { AppError } from '../src/lib/errors.js';
import { LikeService } from '../src/modules/likes/like.service.js';
import type { AuthUserRecord } from '../src/modules/auth/auth.types.js';
import type { LikeStore } from '../src/modules/likes/like.types.js';
import type { TweetRecord, TweetStore } from '../src/modules/tweets/tweet.types.js';

const authUser: AuthUserRecord = {
  id: 'user_1',
  email: 'user@example.com',
  passwordHash: 'hash',
  username: 'user',
  name: 'User',
  bio: null,
  avatarUrl: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const tweet: TweetRecord = {
  id: 'tweet_1',
  content: 'hello',
  authorId: 'author_1',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  likesCount: 0,
  author: {
    id: 'author_1',
    username: 'author',
    name: 'Author',
    avatarUrl: null,
  },
};

describe('LikeService', () => {
  const createTweetStore = (foundTweet: TweetRecord | null): TweetStore => ({
    createTweet: vi.fn(),
    findTweetById: vi.fn().mockResolvedValue(foundTweet),
    findTweetsByUsername: vi.fn(),
    userExistsByUsername: vi.fn(),
    countTweetsByAuthorId: vi.fn(),
    deleteTweet: vi.fn(),
  });

  const createLikeStore = (): LikeStore => ({
    createLike: vi.fn().mockResolvedValue({
      userId: authUser.id,
      tweetId: tweet.id,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }),
    findLike: vi.fn().mockResolvedValue(null),
    deleteLike: vi.fn().mockResolvedValue(undefined),
    countLikes: vi.fn().mockResolvedValue(3),
  });

  it('validates tweet ids', async () => {
    const service = new LikeService(createTweetStore(tweet), createLikeStore());

    await expect(service.likeTweet('', authUser)).rejects.toMatchObject<AppError>({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  });

  it('returns 404 when liking or unliking a missing tweet', async () => {
    const service = new LikeService(createTweetStore(null), createLikeStore());

    await expect(
      service.likeTweet('tweet_1', authUser),
    ).rejects.toMatchObject<AppError>({
      statusCode: 404,
      code: 'TWEET_NOT_FOUND',
    });

    await expect(
      service.unlikeTweet('tweet_1', authUser),
    ).rejects.toMatchObject<AppError>({
      statusCode: 404,
      code: 'TWEET_NOT_FOUND',
    });
  });

  it('creates a like and returns the updated count', async () => {
    const likeStore = createLikeStore();
    const service = new LikeService(createTweetStore(tweet), likeStore);

    const response = await service.likeTweet(tweet.id, authUser);

    expect(likeStore.createLike).toHaveBeenCalledWith(authUser.id, tweet.id);
    expect(response).toEqual({ likesCount: 3 });
  });

  it('deletes an existing like when unliking', async () => {
    const likeStore = createLikeStore();
    vi.mocked(likeStore.findLike).mockResolvedValue({
      userId: authUser.id,
      tweetId: tweet.id,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const service = new LikeService(createTweetStore(tweet), likeStore);

    const response = await service.unlikeTweet(tweet.id, authUser);

    expect(likeStore.deleteLike).toHaveBeenCalledWith(authUser.id, tweet.id);
    expect(response).toEqual({ likesCount: 3 });
  });

  it('is idempotent when unliking a tweet that is not liked yet', async () => {
    const likeStore = createLikeStore();
    const service = new LikeService(createTweetStore(tweet), likeStore);

    const response = await service.unlikeTweet(tweet.id, authUser);

    expect(likeStore.deleteLike).not.toHaveBeenCalled();
    expect(response).toEqual({ likesCount: 3 });
  });
});
