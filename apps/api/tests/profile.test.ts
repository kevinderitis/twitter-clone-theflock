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
  FollowListQuery,
  FollowProfile,
  FollowRecord,
  FollowStore,
} from '../src/modules/follows/follow.types.js';
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

class InMemoryFollowStore implements FollowStore {
  private follows = new Map<string, FollowRecord>();

  private key(followerId: string, followingId: string) {
    return `${followerId}:${followingId}`;
  }

  async createFollow(followerId: string, followingId: string) {
    const follow: FollowRecord = {
      followerId,
      followingId,
      createdAt: new Date(),
    };

    this.follows.set(this.key(followerId, followingId), follow);

    return follow;
  }

  async findFollow(followerId: string, followingId: string) {
    return this.follows.get(this.key(followerId, followingId)) ?? null;
  }

  async deleteFollow(followerId: string, followingId: string) {
    this.follows.delete(this.key(followerId, followingId));
  }

  async listFollowers(userId: string, query: FollowListQuery) {
    void userId;
    void query;
    return [] satisfies FollowProfile[];
  }

  async listFollowing(userId: string, query: FollowListQuery) {
    void userId;
    void query;
    return [] satisfies FollowProfile[];
  }

  async countFollowers(userId: string) {
    return [...this.follows.values()].filter(
      (follow) => follow.followingId === userId,
    ).length;
  }

  async countFollowing(userId: string) {
    return [...this.follows.values()].filter(
      (follow) => follow.followerId === userId,
    ).length;
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

  async findTweetsByUsername(
    username: string,
    limit: number,
    authUserId?: string,
  ) {
    void authUserId;
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

describe('Profile routes', () => {
  let userStore: InMemoryAuthUserStore;
  let followStore: InMemoryFollowStore;
  let tweetStore: InMemoryTweetStore;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_EXPIRES_IN = '1h';
    userStore = new InMemoryAuthUserStore();
    followStore = new InMemoryFollowStore();
    tweetStore = new InMemoryTweetStore(userStore);
  });

  const createTestApp = () =>
    createApp({
      authUserStore: userStore,
      followStore,
      tweetStore,
    });

  const createUser = async (overrides?: Partial<CreateUserInput>) => {
    const passwordHash = await hashPassword('password123');

    return userStore.seedUser({
      email: 'ada@example.com',
      passwordHash,
      username: 'adalovelace',
      name: 'Ada Lovelace',
      bio: 'First programmer.',
      avatarUrl: null,
      ...overrides,
    });
  };

  it('returns public profile info with counts', async () => {
    const targetUser = await createUser();
    const followerOne = await createUser({
      email: 'grace@example.com',
      username: 'gracehopper',
      name: 'Grace Hopper',
    });
    const followerTwo = await createUser({
      email: 'linus@example.com',
      username: 'linustorvalds',
      name: 'Linus Torvalds',
    });
    const followingUser = await createUser({
      email: 'margaret@example.com',
      username: 'mhamilton',
      name: 'Margaret Hamilton',
    });

    await followStore.createFollow(followerOne.id, targetUser.id);
    await followStore.createFollow(followerTwo.id, targetUser.id);
    await followStore.createFollow(targetUser.id, followingUser.id);
    await tweetStore.seedTweet({
      authorId: targetUser.id,
      content: 'First profile tweet',
    });
    await tweetStore.seedTweet({
      authorId: targetUser.id,
      content: 'Second profile tweet',
    });

    const response = await request(createTestApp()).get(
      `/users/${targetUser.username}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      user: {
        id: targetUser.id,
        username: 'adalovelace',
        name: 'Ada Lovelace',
        bio: 'First programmer.',
        avatarUrl: null,
        followersCount: 2,
        followingCount: 1,
        tweetsCount: 2,
        isFollowing: false,
      },
    });
  });

  it('returns isFollowing when the viewer already follows the user', async () => {
    const targetUser = await createUser();
    const viewer = await createUser({
      email: 'grace@example.com',
      username: 'gracehopper',
      name: 'Grace Hopper',
    });
    await followStore.createFollow(viewer.id, targetUser.id);
    const token = signAuthToken(viewer.id);

    const response = await request(createTestApp())
      .get(`/users/${targetUser.username}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({
      id: targetUser.id,
      isFollowing: true,
    });
  });

  it('returns 404 for a missing user', async () => {
    const response = await request(createTestApp()).get('/users/missinguser');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User not found.',
        details: undefined,
      },
    });
  });
});
