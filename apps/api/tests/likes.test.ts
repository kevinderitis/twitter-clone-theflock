import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';
import {
  hashPassword,
  signAuthToken,
} from '../src/modules/auth/auth.security.js';
import type {
  AuthUserRecord,
  AuthUserStore,
  CreateUserInput,
} from '../src/modules/auth/auth.types.js';
import { AppError } from '../src/lib/errors.js';
import type { LikeRecord, LikeStore } from '../src/modules/likes/like.types.js';
import type {
  CreateTweetInput,
  TweetRecord,
  TweetStore,
} from '../src/modules/tweets/tweet.types.js';

class InMemoryAuthUserStore implements AuthUserStore {
  private users = new Map<string, AuthUserRecord>();

  async findById(id: string) {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string) {
    return (
      [...this.users.values()].find((user) => user.email === email) ?? null
    );
  }

  async findByUsername(username: string) {
    return (
      [...this.users.values()].find((user) => user.username === username) ??
      null
    );
  }

  async createUser(input: CreateUserInput) {
    const now = new Date();
    const user: AuthUserRecord = {
      id: `user_${this.users.size + 1}`,
      createdAt: now,
      updatedAt: now,
      ...input,
    };

    this.users.set(user.id, user);

    return user;
  }

  async seedUser(input: CreateUserInput) {
    return this.createUser(input);
  }
}

class InMemoryTweetStore implements TweetStore {
  constructor(private readonly userStore: InMemoryAuthUserStore) {}

  private tweets = new Map<string, TweetRecord>();

  async createTweet(input: CreateTweetInput) {
    const author = await this.userStore.findById(input.authorId);

    if (!author) {
      throw new Error('Author not found in test store.');
    }

    const now = new Date();
    const tweet: TweetRecord = {
      id: `tweet_${this.tweets.size + 1}`,
      content: input.content,
      authorId: input.authorId,
      createdAt: now,
      updatedAt: now,
      author: {
        id: author.id,
        username: author.username,
        name: author.name,
        avatarUrl: author.avatarUrl,
      },
      likesCount: 0,
    };

    this.tweets.set(tweet.id, tweet);

    return tweet;
  }

  async findTweetById(id: string) {
    return this.tweets.get(id) ?? null;
  }

  async findTweetsByUsername(username: string, limit: number, authUserId?: string) {
    return [...this.tweets.values()]
      .filter((tweet) => tweet.author.username === username)
      .slice(0, limit);
  }

  async userExistsByUsername(username: string) {
    return Boolean(await this.userStore.findByUsername(username));
  }

  async countTweetsByAuthorId(authorId: string) {
    return [...this.tweets.values()].filter(
      (tweet) => tweet.authorId === authorId,
    ).length;
  }

  async deleteTweet(id: string) {
    this.tweets.delete(id);
  }

  async seedTweet(input: CreateTweetInput) {
    return this.createTweet(input);
  }
}

class InMemoryLikeStore implements LikeStore {
  private likes = new Map<string, LikeRecord>();

  private key(userId: string, tweetId: string) {
    return `${userId}:${tweetId}`;
  }

  async createLike(userId: string, tweetId: string) {
    const key = this.key(userId, tweetId);

    if (this.likes.has(key)) {
      throw new AppError(
        409,
        'LIKE_ALREADY_EXISTS',
        'You have already liked this tweet.',
      );
    }

    const like: LikeRecord = {
      userId,
      tweetId,
      createdAt: new Date(),
    };

    this.likes.set(key, like);

    return like;
  }

  async findLike(userId: string, tweetId: string) {
    return this.likes.get(this.key(userId, tweetId)) ?? null;
  }

  async deleteLike(userId: string, tweetId: string) {
    this.likes.delete(this.key(userId, tweetId));
  }

  async countLikes(tweetId: string) {
    return [...this.likes.values()].filter((like) => like.tweetId === tweetId)
      .length;
  }
}

describe('Like routes', () => {
  let userStore: InMemoryAuthUserStore;
  let tweetStore: InMemoryTweetStore;
  let likeStore: InMemoryLikeStore;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_EXPIRES_IN = '1h';
    userStore = new InMemoryAuthUserStore();
    tweetStore = new InMemoryTweetStore(userStore);
    likeStore = new InMemoryLikeStore();
  });

  const createTestApp = () =>
    createApp({
      authUserStore: userStore,
      tweetStore,
      likeStore,
    });

  const createAuthenticatedUser = async (
    overrides?: Partial<CreateUserInput>,
  ) => {
    const passwordHash = await hashPassword('password123');

    return userStore.seedUser({
      email: 'ada@example.com',
      passwordHash,
      username: 'adalovelace',
      name: 'Ada Lovelace',
      bio: null,
      avatarUrl: null,
      ...overrides,
    });
  };

  it('likes a tweet successfully', async () => {
    const currentUser = await createAuthenticatedUser();
    const tweetAuthor = await createAuthenticatedUser({
      email: 'grace@example.com',
      username: 'gracehopper',
      name: 'Grace Hopper',
    });
    const tweet = await tweetStore.seedTweet({
      content: 'Hello world',
      authorId: tweetAuthor.id,
    });
    const token = signAuthToken(currentUser.id);

    const response = await request(createTestApp())
      .post(`/tweets/${tweet.id}/like`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      likesCount: 1,
    });
  });

  it('returns 401 when liking without a token', async () => {
    const response = await request(createTestApp()).post(
      '/tweets/tweet_1/like',
    );

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required.',
        details: undefined,
      },
    });
  });

  it('returns 404 when liking a nonexistent tweet', async () => {
    const currentUser = await createAuthenticatedUser();
    const token = signAuthToken(currentUser.id);

    const response = await request(createTestApp())
      .post('/tweets/tweet_missing/like')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: 'TWEET_NOT_FOUND',
        message: 'Tweet not found.',
        details: undefined,
      },
    });
  });

  it('returns 409 when liking the same tweet twice', async () => {
    const currentUser = await createAuthenticatedUser();
    const tweetAuthor = await createAuthenticatedUser({
      email: 'grace@example.com',
      username: 'gracehopper',
      name: 'Grace Hopper',
    });
    const tweet = await tweetStore.seedTweet({
      content: 'Hello world',
      authorId: tweetAuthor.id,
    });
    const token = signAuthToken(currentUser.id);

    await request(createTestApp())
      .post(`/tweets/${tweet.id}/like`)
      .set('Authorization', `Bearer ${token}`);

    const response = await request(createTestApp())
      .post(`/tweets/${tweet.id}/like`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: {
        code: 'LIKE_ALREADY_EXISTS',
        message: 'You have already liked this tweet.',
        details: undefined,
      },
    });
  });

  it('unlikes a tweet successfully', async () => {
    const currentUser = await createAuthenticatedUser();
    const tweetAuthor = await createAuthenticatedUser({
      email: 'grace@example.com',
      username: 'gracehopper',
      name: 'Grace Hopper',
    });
    const tweet = await tweetStore.seedTweet({
      content: 'Hello world',
      authorId: tweetAuthor.id,
    });
    const token = signAuthToken(currentUser.id);

    await likeStore.createLike(currentUser.id, tweet.id);

    const response = await request(createTestApp())
      .delete(`/tweets/${tweet.id}/like`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      likesCount: 0,
    });
  });

  it('returns 404 when unliking a nonexistent tweet', async () => {
    const currentUser = await createAuthenticatedUser();
    const token = signAuthToken(currentUser.id);

    const response = await request(createTestApp())
      .delete('/tweets/tweet_missing/like')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: 'TWEET_NOT_FOUND',
        message: 'Tweet not found.',
        details: undefined,
      },
    });
  });

  it('returns success when unliking a tweet not previously liked', async () => {
    const currentUser = await createAuthenticatedUser();
    const tweetAuthor = await createAuthenticatedUser({
      email: 'grace@example.com',
      username: 'gracehopper',
      name: 'Grace Hopper',
    });
    const tweet = await tweetStore.seedTweet({
      content: 'Hello world',
      authorId: tweetAuthor.id,
    });
    const token = signAuthToken(currentUser.id);

    const response = await request(createTestApp())
      .delete(`/tweets/${tweet.id}/like`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      likesCount: 0,
    });
  });

  it('updates likes count correctly', async () => {
    const currentUser = await createAuthenticatedUser();
    const otherUser = await createAuthenticatedUser({
      email: 'grace@example.com',
      username: 'gracehopper',
      name: 'Grace Hopper',
    });
    const thirdUser = await createAuthenticatedUser({
      email: 'linus@example.com',
      username: 'linustorvalds',
      name: 'Linus Torvalds',
    });
    const tweet = await tweetStore.seedTweet({
      content: 'Hello world',
      authorId: otherUser.id,
    });

    await likeStore.createLike(otherUser.id, tweet.id);
    await likeStore.createLike(thirdUser.id, tweet.id);

    const token = signAuthToken(currentUser.id);

    const likeResponse = await request(createTestApp())
      .post(`/tweets/${tweet.id}/like`)
      .set('Authorization', `Bearer ${token}`);

    expect(likeResponse.status).toBe(200);
    expect(likeResponse.body).toEqual({
      likesCount: 3,
    });

    const unlikeResponse = await request(createTestApp())
      .delete(`/tweets/${tweet.id}/like`)
      .set('Authorization', `Bearer ${token}`);

    expect(unlikeResponse.status).toBe(200);
    expect(unlikeResponse.body).toEqual({
      likesCount: 2,
    });
  });
});
