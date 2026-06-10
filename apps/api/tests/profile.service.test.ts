import { describe, expect, it, vi } from 'vitest';

import { AppError } from '../src/lib/errors.js';
import { ProfileService } from '../src/modules/profile/profile.service.js';
import type { AuthUserRecord, AuthUserStore } from '../src/modules/auth/auth.types.js';
import type { FollowStore } from '../src/modules/follows/follow.types.js';
import type { TweetStore } from '../src/modules/tweets/tweet.types.js';

const createUser = (overrides: Partial<AuthUserRecord> = {}): AuthUserRecord => ({
  id: 'user_1',
  email: 'user@example.com',
  passwordHash: 'hash',
  username: 'user',
  name: 'User',
  bio: null,
  avatarUrl: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

describe('ProfileService', () => {
  const createUserStore = (user: AuthUserRecord | null): AuthUserStore => ({
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findByUsername: vi.fn().mockResolvedValue(user),
    createUser: vi.fn(),
  });

  const createFollowStore = (): FollowStore => ({
    createFollow: vi.fn(),
    findFollow: vi.fn().mockResolvedValue({
      followerId: 'viewer_1',
      followingId: 'user_1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }),
    deleteFollow: vi.fn(),
    listFollowers: vi.fn(),
    listFollowing: vi.fn(),
    countFollowers: vi.fn().mockResolvedValue(12),
    countFollowing: vi.fn().mockResolvedValue(7),
  });

  const createTweetStore = (): TweetStore => ({
    createTweet: vi.fn(),
    findTweetById: vi.fn(),
    findTweetsByUsername: vi.fn(),
    userExistsByUsername: vi.fn(),
    countTweetsByAuthorId: vi.fn().mockResolvedValue(5),
    deleteTweet: vi.fn(),
  });

  it('validates usernames and rejects missing users', async () => {
    const service = new ProfileService(
      createUserStore(null),
      createFollowStore(),
      createTweetStore(),
    );

    await expect(service.getProfile('')).rejects.toMatchObject<AppError>({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });

    await expect(service.getProfile('missing')).rejects.toMatchObject<AppError>({
      statusCode: 404,
      code: 'USER_NOT_FOUND',
    });
  });

  it('returns profile counts and isFollowing false for your own profile', async () => {
    const user = createUser();
    const followStore = createFollowStore();
    const tweetStore = createTweetStore();
    const service = new ProfileService(createUserStore(user), followStore, tweetStore);

    const response = await service.getProfile(user.username, user);

    expect(response).toEqual({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        followersCount: 12,
        followingCount: 7,
        tweetsCount: 5,
        isFollowing: false,
      },
    });
    expect(followStore.findFollow).not.toHaveBeenCalled();
  });

  it('returns profile counts and follow state for another user', async () => {
    const user = createUser();
    const viewer = createUser({ id: 'viewer_1', username: 'viewer' });
    const followStore = createFollowStore();
    const service = new ProfileService(createUserStore(user), followStore, createTweetStore());

    const response = await service.getProfile(user.username, viewer);

    expect(response.user.isFollowing).toBe(true);
    expect(followStore.findFollow).toHaveBeenCalledWith(viewer.id, user.id);
  });

  it('returns isFollowing false when no viewer is provided', async () => {
    const user = createUser();
    const followStore = createFollowStore();
    const service = new ProfileService(createUserStore(user), followStore, createTweetStore());

    const response = await service.getProfile(user.username);

    expect(response.user.isFollowing).toBe(false);
  });
});
