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
    };

    this.tweets.set(tweet.id, tweet);

    return tweet;
  }

  async findTweetById(id: string) {
    return this.tweets.get(id) ?? null;
  }

  async deleteTweet(id: string) {
    this.tweets.delete(id);
  }

  async seedTweet(input: CreateTweetInput) {
    return this.createTweet(input);
  }
}

describe('Tweet routes', () => {
  let userStore: InMemoryAuthUserStore;
  let tweetStore: InMemoryTweetStore;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_EXPIRES_IN = '1h';
    userStore = new InMemoryAuthUserStore();
    tweetStore = new InMemoryTweetStore(userStore);
  });

  const createTestApp = () =>
    createApp({
      authUserStore: userStore,
      tweetStore,
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

  it('creates a tweet successfully', async () => {
    const user = await createAuthenticatedUser();
    const token = signAuthToken(user.id);

    const response = await request(createTestApp())
      .post('/tweets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: '  Building The Flock incrementally.  ',
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      tweet: {
        id: expect.any(String),
        content: 'Building The Flock incrementally.',
        authorId: user.id,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        author: {
          id: user.id,
          username: 'adalovelace',
          name: 'Ada Lovelace',
          avatarUrl: null,
        },
      },
    });
  });

  it('returns 401 when creating a tweet without a token', async () => {
    const response = await request(createTestApp()).post('/tweets').send({
      content: 'Hello world',
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required.',
        details: undefined,
      },
    });
  });

  it('returns 400 when creating a tweet with empty content', async () => {
    const user = await createAuthenticatedUser();
    const token = signAuthToken(user.id);

    const response = await request(createTestApp())
      .post('/tweets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: '   ',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid tweet payload.',
        details: ['Content is required.'],
      },
    });
  });

  it('returns 400 when creating a tweet longer than 280 characters', async () => {
    const user = await createAuthenticatedUser();
    const token = signAuthToken(user.id);

    const response = await request(createTestApp())
      .post('/tweets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'x'.repeat(281),
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid tweet payload.',
        details: ['Content must be 280 characters or fewer.'],
      },
    });
  });

  it('deletes an owned tweet successfully', async () => {
    const user = await createAuthenticatedUser();
    const token = signAuthToken(user.id);
    const tweet = await tweetStore.seedTweet({
      content: 'Owned tweet',
      authorId: user.id,
    });

    const response = await request(createTestApp())
      .delete(`/tweets/${tweet.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
    });
    await expect(tweetStore.findTweetById(tweet.id)).resolves.toBeNull();
  });

  it('returns 404 when deleting a nonexistent tweet', async () => {
    const user = await createAuthenticatedUser();
    const token = signAuthToken(user.id);

    const response = await request(createTestApp())
      .delete('/tweets/tweet_missing')
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

  it("returns 403 when deleting another user's tweet", async () => {
    const owner = await createAuthenticatedUser();
    const otherUser = await createAuthenticatedUser({
      email: 'grace@example.com',
      username: 'gracehopper',
      name: 'Grace Hopper',
    });
    const token = signAuthToken(otherUser.id);
    const tweet = await tweetStore.seedTweet({
      content: 'Owner only',
      authorId: owner.id,
    });

    const response = await request(createTestApp())
      .delete(`/tweets/${tweet.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: {
        code: 'TWEET_FORBIDDEN',
        message: "You cannot delete another user's tweet.",
        details: undefined,
      },
    });
  });
});
