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

describe('Follow routes', () => {
  let userStore: InMemoryAuthUserStore;
  let followStore: InMemoryFollowStore;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_EXPIRES_IN = '1h';
    userStore = new InMemoryAuthUserStore();
    followStore = new InMemoryFollowStore(userStore);
  });

  const createTestApp = () =>
    createApp({
      authUserStore: userStore,
      followStore,
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

  it('follows another user successfully', async () => {
    const currentUser = await createAuthenticatedUser();
    const targetUser = await createAuthenticatedUser({
      email: 'grace@example.com',
      username: 'gracehopper',
      name: 'Grace Hopper',
    });
    const token = signAuthToken(currentUser.id);

    const response = await request(createTestApp())
      .post(`/users/${targetUser.id}/follow`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      follow: {
        followerId: currentUser.id,
        followingId: targetUser.id,
        createdAt: expect.any(String),
      },
    });
  });

  it('returns 404 when following a nonexistent user', async () => {
    const currentUser = await createAuthenticatedUser();
    const token = signAuthToken(currentUser.id);

    const response = await request(createTestApp())
      .post('/users/user_missing/follow')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User not found.',
        details: undefined,
      },
    });
  });

  it('returns 400 when following yourself', async () => {
    const currentUser = await createAuthenticatedUser();
    const token = signAuthToken(currentUser.id);

    const response = await request(createTestApp())
      .post(`/users/${currentUser.id}/follow`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        code: 'FOLLOW_SELF',
        message: 'You cannot follow yourself.',
        details: undefined,
      },
    });
  });

  it('returns 409 when following the same user twice', async () => {
    const currentUser = await createAuthenticatedUser();
    const targetUser = await createAuthenticatedUser({
      email: 'grace@example.com',
      username: 'gracehopper',
      name: 'Grace Hopper',
    });
    const token = signAuthToken(currentUser.id);

    await request(createTestApp())
      .post(`/users/${targetUser.id}/follow`)
      .set('Authorization', `Bearer ${token}`);

    const response = await request(createTestApp())
      .post(`/users/${targetUser.id}/follow`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: {
        code: 'FOLLOW_ALREADY_EXISTS',
        message: 'You are already following this user.',
        details: undefined,
      },
    });
  });

  it('unfollows successfully', async () => {
    const currentUser = await createAuthenticatedUser();
    const targetUser = await createAuthenticatedUser({
      email: 'grace@example.com',
      username: 'gracehopper',
      name: 'Grace Hopper',
    });
    const token = signAuthToken(currentUser.id);

    await followStore.createFollow(currentUser.id, targetUser.id);

    const response = await request(createTestApp())
      .delete(`/users/${targetUser.id}/follow`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
    });
    await expect(
      followStore.findFollow(currentUser.id, targetUser.id),
    ).resolves.toBeNull();
  });

  it('returns success when unfollowing a nonexistent relationship', async () => {
    const currentUser = await createAuthenticatedUser();
    const targetUser = await createAuthenticatedUser({
      email: 'grace@example.com',
      username: 'gracehopper',
      name: 'Grace Hopper',
    });
    const token = signAuthToken(currentUser.id);

    const response = await request(createTestApp())
      .delete(`/users/${targetUser.id}/follow`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
    });
  });

  it('returns followers for a public profile', async () => {
    const targetUser = await createAuthenticatedUser();
    const followerA = await createAuthenticatedUser({
      email: 'grace@example.com',
      username: 'gracehopper',
      name: 'Grace Hopper',
      bio: 'Compiler pioneer',
      avatarUrl: 'https://example.com/grace.png',
    });
    const followerB = await createAuthenticatedUser({
      email: 'barbara@example.com',
      username: 'barbaraliskov',
      name: 'Barbara Liskov',
      bio: 'LSP',
    });

    await followStore.createFollow(followerA.id, targetUser.id);
    await followStore.createFollow(followerB.id, targetUser.id);

    const response = await request(createTestApp()).get(
      `/users/${targetUser.username}/followers`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      followers: [
        {
          id: followerB.id,
          username: 'barbaraliskov',
          name: 'Barbara Liskov',
          bio: 'LSP',
          avatarUrl: null,
        },
        {
          id: followerA.id,
          username: 'gracehopper',
          name: 'Grace Hopper',
          bio: 'Compiler pioneer',
          avatarUrl: 'https://example.com/grace.png',
        },
      ],
    });
    expect(response.body.followers[0]).not.toHaveProperty('email');
    expect(response.body.followers[0]).not.toHaveProperty('passwordHash');
  });

  it('returns users followed by a public profile', async () => {
    const targetUser = await createAuthenticatedUser();
    const followedA = await createAuthenticatedUser({
      email: 'grace@example.com',
      username: 'gracehopper',
      name: 'Grace Hopper',
      bio: 'Compiler pioneer',
    });
    const followedB = await createAuthenticatedUser({
      email: 'barbara@example.com',
      username: 'barbaraliskov',
      name: 'Barbara Liskov',
      avatarUrl: 'https://example.com/barbara.png',
    });

    await followStore.createFollow(targetUser.id, followedA.id);
    await followStore.createFollow(targetUser.id, followedB.id);

    const response = await request(createTestApp()).get(
      `/users/${targetUser.username}/following`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      following: [
        {
          id: followedB.id,
          username: 'barbaraliskov',
          name: 'Barbara Liskov',
          bio: null,
          avatarUrl: 'https://example.com/barbara.png',
        },
        {
          id: followedA.id,
          username: 'gracehopper',
          name: 'Grace Hopper',
          bio: 'Compiler pioneer',
          avatarUrl: null,
        },
      ],
    });
    expect(response.body.following[0]).not.toHaveProperty('email');
    expect(response.body.following[0]).not.toHaveProperty('passwordHash');
  });

  it('returns 404 when listing followers for a missing user', async () => {
    const response = await request(createTestApp()).get(
      '/users/missing-user/followers',
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User not found.',
        details: undefined,
      },
    });
  });

  it('respects the limit when listing followers', async () => {
    const targetUser = await createAuthenticatedUser();
    const followerA = await createAuthenticatedUser({
      email: 'grace@example.com',
      username: 'gracehopper',
      name: 'Grace Hopper',
    });
    const followerB = await createAuthenticatedUser({
      email: 'barbara@example.com',
      username: 'barbaraliskov',
      name: 'Barbara Liskov',
    });

    await followStore.createFollow(followerA.id, targetUser.id);
    await followStore.createFollow(followerB.id, targetUser.id);

    const response = await request(createTestApp()).get(
      `/users/${targetUser.username}/followers?limit=1`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      followers: [
        {
          id: followerB.id,
          username: 'barbaraliskov',
          name: 'Barbara Liskov',
          bio: null,
          avatarUrl: null,
        },
      ],
    });
  });
});
