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
}

describe('Follow routes', () => {
  let userStore: InMemoryAuthUserStore;
  let followStore: InMemoryFollowStore;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_EXPIRES_IN = '1h';
    userStore = new InMemoryAuthUserStore();
    followStore = new InMemoryFollowStore();
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
});
