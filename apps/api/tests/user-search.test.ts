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
  UserSearchQuery,
  UserSearchResult,
  UserSearchStore,
} from '../src/modules/user-search/user-search.types.js';

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

  listUsers() {
    return [...this.users.values()];
  }
}

class InMemoryUserSearchStore implements UserSearchStore {
  constructor(private readonly authUserStore: InMemoryAuthUserStore) {}

  async searchUsers(query: UserSearchQuery): Promise<UserSearchResult[]> {
    const normalizedQuery = query.q.toLowerCase();

    return this.authUserStore
      .listUsers()
      .filter(
        (user) =>
          user.username.toLowerCase().includes(normalizedQuery) ||
          user.name.toLowerCase().includes(normalizedQuery),
      )
      .sort((a, b) => a.username.localeCompare(b.username))
      .slice(0, query.limit)
      .map((user) => ({
        id: user.id,
        username: user.username,
        name: user.name,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        isFollowing: false,
      }));
  }
}

class InMemoryFollowStore implements FollowStore {
  private follows = new Map<string, FollowRecord>();

  constructor(private readonly userStore: InMemoryAuthUserStore) {}

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

describe('User search routes', () => {
  let userStore: InMemoryAuthUserStore;
  let userSearchStore: InMemoryUserSearchStore;
  let followStore: InMemoryFollowStore;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_EXPIRES_IN = '1h';
    userStore = new InMemoryAuthUserStore();
    userSearchStore = new InMemoryUserSearchStore(userStore);
    followStore = new InMemoryFollowStore(userStore);
  });

  const createTestApp = () =>
    createApp({
      authUserStore: userStore,
      followStore,
      userSearchStore,
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
    const response = await request(createTestApp()).get('/users/search?q=ada');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required.',
        details: undefined,
      },
    });
  });

  it('searches by username', async () => {
    const viewer = await createAuthenticatedUser();
    await createAuthenticatedUser({
      email: 'grace@example.com',
      username: 'gracehopper',
      name: 'Grace Hopper',
      bio: 'Compiler pioneer',
    });
    const token = signAuthToken(viewer.id);

    const response = await request(createTestApp())
      .get('/users/search?q=grace')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      users: [
        {
          id: expect.any(String),
          username: 'gracehopper',
          name: 'Grace Hopper',
          bio: 'Compiler pioneer',
          avatarUrl: null,
          isFollowing: false,
        },
      ],
    });
  });

  it('searches by name', async () => {
    const viewer = await createAuthenticatedUser();
    await createAuthenticatedUser({
      email: 'grace@example.com',
      username: 'gracehopper',
      name: 'Grace Hopper',
    });
    const token = signAuthToken(viewer.id);

    const response = await request(createTestApp())
      .get('/users/search?q=hopper')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.users).toHaveLength(1);
    expect(response.body.users[0].username).toBe('gracehopper');
  });

  it('is case-insensitive', async () => {
    const viewer = await createAuthenticatedUser();
    await createAuthenticatedUser({
      email: 'grace@example.com',
      username: 'GraceHopper',
      name: 'Grace Hopper',
    });
    const token = signAuthToken(viewer.id);

    const response = await request(createTestApp())
      .get('/users/search?q=grace')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.users).toHaveLength(1);
    expect(response.body.users[0].username).toBe('GraceHopper');
  });

  it('returns 400 for empty query', async () => {
    const viewer = await createAuthenticatedUser();
    const token = signAuthToken(viewer.id);

    const response = await request(createTestApp())
      .get('/users/search?q=   ')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid user search query.',
        details: ['q is required.'],
      },
    });
  });

  it('never includes email or passwordHash', async () => {
    const viewer = await createAuthenticatedUser();
    await createAuthenticatedUser({
      email: 'grace@example.com',
      username: 'gracehopper',
      name: 'Grace Hopper',
    });
    const token = signAuthToken(viewer.id);

    const response = await request(createTestApp())
      .get('/users/search?q=grace')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.users[0].email).toBeUndefined();
    expect(response.body.users[0].passwordHash).toBeUndefined();
  });

  it('includes isFollowing for the authenticated viewer', async () => {
    const viewer = await createAuthenticatedUser();
    const targetUser = await createAuthenticatedUser({
      email: 'grace@example.com',
      username: 'gracehopper',
      name: 'Grace Hopper',
    });
    await followStore.createFollow(viewer.id, targetUser.id);
    const token = signAuthToken(viewer.id);

    const response = await request(createTestApp())
      .get('/users/search?q=grace')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.users[0].isFollowing).toBe(true);
  });

  it('respects limit', async () => {
    const viewer = await createAuthenticatedUser();
    await createAuthenticatedUser({
      email: 'grace@example.com',
      username: 'gracehopper',
      name: 'Grace Hopper',
    });
    await createAuthenticatedUser({
      email: 'guido@example.com',
      username: 'guidovanrossum',
      name: 'Guido van Rossum',
    });
    const token = signAuthToken(viewer.id);

    const response = await request(createTestApp())
      .get('/users/search?q=g&limit=1')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.users).toHaveLength(1);
  });
});
