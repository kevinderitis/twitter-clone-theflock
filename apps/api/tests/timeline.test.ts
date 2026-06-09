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
  TimelinePage,
  TimelineQuery,
  TimelineStore,
} from '../src/modules/timeline/timeline.types.js';
import type {
  CreateTweetInput,
  TweetRecord,
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
  constructor(private readonly userStore: InMemoryAuthUserStore) {}

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
    const followers = await Promise.all(
      [...this.follows.values()]
        .filter((follow) => follow.followingId === userId)
        .map((follow) => this.userStore.findById(follow.followerId)),
    );

    return followers
      .filter((user): user is AuthUserRecord => user !== null)
      .map((user) => this.toFollowProfile(user))
      .sort((a, b) => a.username.localeCompare(b.username))
      .slice(0, query.limit);
  }

  async listFollowing(userId: string, query: FollowListQuery) {
    const following = await Promise.all(
      [...this.follows.values()]
        .filter((follow) => follow.followerId === userId)
        .map((follow) => this.userStore.findById(follow.followingId)),
    );

    return following
      .filter((user): user is AuthUserRecord => user !== null)
      .map((user) => this.toFollowProfile(user))
      .sort((a, b) => a.username.localeCompare(b.username))
      .slice(0, query.limit);
  }

  listByFollower(followerId: string) {
    return [...this.follows.values()].filter(
      (follow) => follow.followerId === followerId,
    );
  }

  private toFollowProfile(user: AuthUserRecord): FollowProfile {
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
    };
  }
}

class InMemoryTimelineStore implements TimelineStore {
  constructor(
    private readonly userStore: InMemoryAuthUserStore,
    private readonly followStore: InMemoryFollowStore,
  ) {}

  private tweets = new Map<string, TweetRecord>();
  private likes = new Set<string>();
  private tweetCount = 0;

  private likeKey(userId: string, tweetId: string) {
    return `${userId}:${tweetId}`;
  }

  async seedTweet(
    input: CreateTweetInput & { createdAt?: Date; updatedAt?: Date },
  ) {
    const author = await this.userStore.findById(input.authorId);

    if (!author) {
      throw new Error('Author not found in test store.');
    }

    this.tweetCount += 1;
    const createdAt = input.createdAt ?? new Date();
    const updatedAt = input.updatedAt ?? createdAt;

    const tweet: TweetRecord = {
      id: `tweet_${this.tweetCount}`,
      content: input.content,
      authorId: input.authorId,
      createdAt,
      updatedAt,
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

  async seedLike(userId: string, tweetId: string) {
    const tweet = this.tweets.get(tweetId);

    if (!tweet) {
      throw new Error('Tweet not found in test store.');
    }

    const key = this.likeKey(userId, tweetId);

    if (!this.likes.has(key)) {
      this.likes.add(key);
      tweet.likesCount += 1;
    }
  }

  async listTimeline(
    viewerId: string,
    query: TimelineQuery,
  ): Promise<TimelinePage> {
    const followedIds = new Set(
      this.followStore
        .listByFollower(viewerId)
        .map((follow) => follow.followingId),
    );

    const timelineTweets = [...this.tweets.values()]
      .filter((tweet) => followedIds.has(tweet.authorId))
      .sort((a, b) => {
        if (b.createdAt.getTime() !== a.createdAt.getTime()) {
          return b.createdAt.getTime() - a.createdAt.getTime();
        }

        return b.id.localeCompare(a.id);
      });

    const startIndex = query.cursor
      ? timelineTweets.findIndex((tweet) => tweet.id === query.cursor) + 1
      : 0;

    const pageTweets = timelineTweets.slice(
      startIndex,
      startIndex + query.limit + 1,
    );
    const hasMore = pageTweets.length > query.limit;
    const visibleTweets = hasMore
      ? pageTweets.slice(0, query.limit)
      : pageTweets;

    return {
      tweets: visibleTweets.map((tweet) => ({
        ...tweet,
        likedByMe: this.likes.has(this.likeKey(viewerId, tweet.id)),
      })),
      nextCursor: hasMore ? (visibleTweets.at(-1)?.id ?? null) : null,
    };
  }
}

describe('Timeline routes', () => {
  let userStore: InMemoryAuthUserStore;
  let followStore: InMemoryFollowStore;
  let timelineStore: InMemoryTimelineStore;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_EXPIRES_IN = '1h';
    userStore = new InMemoryAuthUserStore();
    followStore = new InMemoryFollowStore(userStore);
    timelineStore = new InMemoryTimelineStore(userStore, followStore);
  });

  const createTestApp = () =>
    createApp({
      authUserStore: userStore,
      followStore,
      timelineStore,
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

  it('returns 401 without a token', async () => {
    const response = await request(createTestApp()).get('/timeline');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required.',
        details: undefined,
      },
    });
  });

  it('returns tweets from followed users', async () => {
    const viewer = await createAuthenticatedUser();
    const followedUser = await createAuthenticatedUser({
      email: 'grace@example.com',
      username: 'gracehopper',
      name: 'Grace Hopper',
    });
    const token = signAuthToken(viewer.id);

    await followStore.createFollow(viewer.id, followedUser.id);
    await timelineStore.seedTweet({
      content: 'Hello from Grace',
      authorId: followedUser.id,
    });

    const response = await request(createTestApp())
      .get('/timeline')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      tweets: [
        {
          id: expect.any(String),
          content: 'Hello from Grace',
          authorId: followedUser.id,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          author: {
            id: followedUser.id,
            username: 'gracehopper',
            name: 'Grace Hopper',
            avatarUrl: null,
          },
          likesCount: 0,
          likedByMe: false,
        },
      ],
      nextCursor: null,
    });
  });

  it('includes likedByMe for the authenticated user', async () => {
    const viewer = await createAuthenticatedUser();
    const followedUser = await createAuthenticatedUser({
      email: 'grace@example.com',
      username: 'gracehopper',
      name: 'Grace Hopper',
    });
    const token = signAuthToken(viewer.id);

    await followStore.createFollow(viewer.id, followedUser.id);
    const tweet = await timelineStore.seedTweet({
      content: 'Already liked',
      authorId: followedUser.id,
    });
    await timelineStore.seedLike(viewer.id, tweet.id);

    const response = await request(createTestApp())
      .get('/timeline')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.tweets).toEqual([
      {
        id: tweet.id,
        content: 'Already liked',
        authorId: followedUser.id,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        author: {
          id: followedUser.id,
          username: 'gracehopper',
          name: 'Grace Hopper',
          avatarUrl: null,
        },
        likesCount: 1,
        likedByMe: true,
      },
    ]);
  });

  it('does not return tweets from unfollowed users', async () => {
    const viewer = await createAuthenticatedUser();
    const followedUser = await createAuthenticatedUser({
      email: 'grace@example.com',
      username: 'gracehopper',
      name: 'Grace Hopper',
    });
    const unfollowedUser = await createAuthenticatedUser({
      email: 'linus@example.com',
      username: 'linustorvalds',
      name: 'Linus Torvalds',
    });
    const token = signAuthToken(viewer.id);

    await followStore.createFollow(viewer.id, followedUser.id);
    await timelineStore.seedTweet({
      content: 'Followed author tweet',
      authorId: followedUser.id,
    });
    await timelineStore.seedTweet({
      content: 'Unfollowed author tweet',
      authorId: unfollowedUser.id,
    });

    const response = await request(createTestApp())
      .get('/timeline')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.tweets).toHaveLength(1);
    expect(response.body.tweets[0].content).toBe('Followed author tweet');
  });

  it('returns tweets ordered by newest first', async () => {
    const viewer = await createAuthenticatedUser();
    const followedUser = await createAuthenticatedUser({
      email: 'grace@example.com',
      username: 'gracehopper',
      name: 'Grace Hopper',
    });
    const token = signAuthToken(viewer.id);

    await followStore.createFollow(viewer.id, followedUser.id);
    await timelineStore.seedTweet({
      content: 'Older tweet',
      authorId: followedUser.id,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
    });
    await timelineStore.seedTweet({
      content: 'Newer tweet',
      authorId: followedUser.id,
      createdAt: new Date('2024-01-02T00:00:00.000Z'),
    });

    const response = await request(createTestApp())
      .get('/timeline')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(
      response.body.tweets.map((tweet: { content: string }) => tweet.content),
    ).toEqual(['Newer tweet', 'Older tweet']);
  });

  it('returns an empty array when following nobody', async () => {
    const viewer = await createAuthenticatedUser();
    const otherUser = await createAuthenticatedUser({
      email: 'grace@example.com',
      username: 'gracehopper',
      name: 'Grace Hopper',
    });
    const token = signAuthToken(viewer.id);

    await timelineStore.seedTweet({
      content: 'Tweet from someone else',
      authorId: otherUser.id,
    });

    const response = await request(createTestApp())
      .get('/timeline')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      tweets: [],
      nextCursor: null,
    });
  });

  it('supports limit pagination', async () => {
    const viewer = await createAuthenticatedUser();
    const followedUser = await createAuthenticatedUser({
      email: 'grace@example.com',
      username: 'gracehopper',
      name: 'Grace Hopper',
    });
    const token = signAuthToken(viewer.id);

    await followStore.createFollow(viewer.id, followedUser.id);

    const newest = await timelineStore.seedTweet({
      content: 'Newest tweet',
      authorId: followedUser.id,
      createdAt: new Date('2024-01-03T00:00:00.000Z'),
    });
    await timelineStore.seedTweet({
      content: 'Middle tweet',
      authorId: followedUser.id,
      createdAt: new Date('2024-01-02T00:00:00.000Z'),
    });
    await timelineStore.seedTweet({
      content: 'Oldest tweet',
      authorId: followedUser.id,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
    });

    const firstPage = await request(createTestApp())
      .get('/timeline?limit=2')
      .set('Authorization', `Bearer ${token}`);

    expect(firstPage.status).toBe(200);
    expect(firstPage.body.tweets).toHaveLength(2);
    expect(firstPage.body.tweets[0].content).toBe('Newest tweet');
    expect(firstPage.body.tweets[1].content).toBe('Middle tweet');
    expect(firstPage.body.nextCursor).toBe(firstPage.body.tweets[1].id);
    expect(firstPage.body.tweets[0].id).toBe(newest.id);

    const secondPage = await request(createTestApp())
      .get(`/timeline?limit=2&cursor=${firstPage.body.nextCursor}`)
      .set('Authorization', `Bearer ${token}`);

    expect(secondPage.status).toBe(200);
    expect(secondPage.body.tweets).toHaveLength(1);
    expect(secondPage.body.tweets[0].content).toBe('Oldest tweet');
    expect(secondPage.body.nextCursor).toBeNull();
  });
});
