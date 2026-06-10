import { Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { AppError } from '../src/lib/errors.js';
import { FollowService } from '../src/modules/follows/follow.service.js';
import type { AuthUserRecord, AuthUserStore } from '../src/modules/auth/auth.types.js';
import type {
  FollowListQuery,
  FollowProfile,
  FollowRecord,
  FollowStore,
} from '../src/modules/follows/follow.types.js';

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

const createProfile = (overrides: Partial<FollowProfile> = {}): FollowProfile => ({
  id: 'user_2',
  username: 'target',
  name: 'Target',
  bio: null,
  avatarUrl: null,
  ...overrides,
});

class InMemoryAuthUserStore implements AuthUserStore {
  constructor(private readonly users: AuthUserRecord[]) {}

  async findById(id: string) {
    return this.users.find((user) => user.id === id) ?? null;
  }

  async findByEmail() {
    return null;
  }

  async findByUsername(username: string) {
    return this.users.find((user) => user.username === username) ?? null;
  }

  async createUser() {
    throw new Error('not needed');
  }
}

class InMemoryFollowStore implements FollowStore {
  follows: FollowRecord[] = [];
  followers: FollowProfile[] = [];
  following: FollowProfile[] = [];
  shouldThrowDuplicate = false;

  async createFollow(followerId: string, followingId: string) {
    if (this.shouldThrowDuplicate) {
      throw new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: 'test',
        meta: { target: ['followerId', 'followingId'] },
      });
    }

    const follow = {
      followerId,
      followingId,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    this.follows.push(follow);
    return follow;
  }

  async findFollow(followerId: string, followingId: string) {
    return (
      this.follows.find(
        (follow) =>
          follow.followerId === followerId && follow.followingId === followingId,
      ) ?? null
    );
  }

  async deleteFollow(followerId: string, followingId: string) {
    this.follows = this.follows.filter(
      (follow) =>
        !(
          follow.followerId === followerId &&
          follow.followingId === followingId
        ),
    );
  }

  async listFollowers(_userId: string, query: FollowListQuery) {
    return this.followers.slice(0, query.limit);
  }

  async listFollowing(_userId: string, query: FollowListQuery) {
    return this.following.slice(0, query.limit);
  }

  async countFollowers() {
    return this.followers.length;
  }

  async countFollowing() {
    return this.following.length;
  }
}

describe('FollowService', () => {
  it('validates follow params and prevents following yourself', async () => {
    const currentUser = createUser();
    const service = new FollowService(
      new InMemoryAuthUserStore([currentUser]),
      new InMemoryFollowStore(),
    );

    await expect(service.followUser('', currentUser)).rejects.toMatchObject<AppError>(
      {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
      },
    );

    await expect(
      service.followUser(currentUser.id, currentUser),
    ).rejects.toMatchObject<AppError>({
      statusCode: 400,
      code: 'FOLLOW_SELF',
    });
  });

  it('rejects following a missing user', async () => {
    const currentUser = createUser();
    const service = new FollowService(
      new InMemoryAuthUserStore([currentUser]),
      new InMemoryFollowStore(),
    );

    await expect(
      service.followUser('missing', currentUser),
    ).rejects.toMatchObject<AppError>({
      statusCode: 404,
      code: 'USER_NOT_FOUND',
    });
  });

  it('rejects when the relationship already exists', async () => {
    const currentUser = createUser();
    const targetUser = createUser({ id: 'user_2', username: 'target' });
    const followStore = new InMemoryFollowStore();
    followStore.follows.push({
      followerId: currentUser.id,
      followingId: targetUser.id,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const service = new FollowService(
      new InMemoryAuthUserStore([currentUser, targetUser]),
      followStore,
    );

    await expect(
      service.followUser(targetUser.id, currentUser),
    ).rejects.toMatchObject<AppError>({
      statusCode: 409,
      code: 'FOLLOW_ALREADY_EXISTS',
    });
  });

  it('maps Prisma duplicate errors when creating a follow', async () => {
    const currentUser = createUser();
    const targetUser = createUser({ id: 'user_2', username: 'target' });
    const followStore = new InMemoryFollowStore();
    followStore.shouldThrowDuplicate = true;

    const service = new FollowService(
      new InMemoryAuthUserStore([currentUser, targetUser]),
      followStore,
    );

    await expect(
      service.followUser(targetUser.id, currentUser),
    ).rejects.toMatchObject<AppError>({
      statusCode: 409,
      code: 'FOLLOW_ALREADY_EXISTS',
    });
  });

  it('creates a follow successfully', async () => {
    const currentUser = createUser();
    const targetUser = createUser({ id: 'user_2', username: 'target' });
    const service = new FollowService(
      new InMemoryAuthUserStore([currentUser, targetUser]),
      new InMemoryFollowStore(),
    );

    const response = await service.followUser(targetUser.id, currentUser);

    expect(response.follow).toMatchObject({
      followerId: currentUser.id,
      followingId: targetUser.id,
    });
  });

  it('unfollows when a relationship exists and is idempotent otherwise', async () => {
    const currentUser = createUser();
    const targetUser = createUser({ id: 'user_2', username: 'target' });
    const followStore = new InMemoryFollowStore();
    followStore.follows.push({
      followerId: currentUser.id,
      followingId: targetUser.id,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const service = new FollowService(
      new InMemoryAuthUserStore([currentUser, targetUser]),
      followStore,
    );

    await expect(
      service.unfollowUser(targetUser.id, currentUser),
    ).resolves.toEqual({ success: true });
    expect(followStore.follows).toHaveLength(0);

    await expect(
      service.unfollowUser(targetUser.id, currentUser),
    ).resolves.toEqual({ success: true });
  });

  it('rejects unfollow when the target user is missing', async () => {
    const currentUser = createUser();
    const service = new FollowService(
      new InMemoryAuthUserStore([currentUser]),
      new InMemoryFollowStore(),
    );

    await expect(
      service.unfollowUser('missing', currentUser),
    ).rejects.toMatchObject<AppError>({
      statusCode: 404,
      code: 'USER_NOT_FOUND',
    });
  });

  it('validates follower list params and returns followers', async () => {
    const targetUser = createUser({ id: 'user_2', username: 'target' });
    const followStore = new InMemoryFollowStore();
    followStore.followers = [
      createProfile({ id: 'user_3', username: 'hopper', name: 'Grace Hopper' }),
    ];

    const service = new FollowService(
      new InMemoryAuthUserStore([targetUser]),
      followStore,
    );

    await expect(service.getFollowers('', 20)).rejects.toMatchObject<AppError>({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });

    await expect(service.getFollowers('target', 0)).rejects.toMatchObject<AppError>({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });

    await expect(
      service.getFollowers('missing', 20),
    ).rejects.toMatchObject<AppError>({
      statusCode: 404,
      code: 'USER_NOT_FOUND',
    });

    await expect(service.getFollowers('target', 20)).resolves.toEqual({
      followers: followStore.followers,
    });
  });

  it('returns following users', async () => {
    const targetUser = createUser({ id: 'user_2', username: 'target' });
    const followStore = new InMemoryFollowStore();
    followStore.following = [
      createProfile({ id: 'user_4', username: 'kevin', name: 'Kevin' }),
    ];

    const service = new FollowService(
      new InMemoryAuthUserStore([targetUser]),
      followStore,
    );

    await expect(service.getFollowing('target', 20)).resolves.toEqual({
      following: followStore.following,
    });
  });
});
