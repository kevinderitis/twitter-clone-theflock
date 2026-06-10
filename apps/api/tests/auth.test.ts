import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';
import { AppError } from '../src/lib/errors.js';
import {
  hashPassword,
  signAuthToken,
} from '../src/modules/auth/auth.security.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import type {
  AuthUserRecord,
  AuthUserStore,
  CreateUserInput,
} from '../src/modules/auth/auth.types.js';

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
    const existingByEmail = await this.findByEmail(input.email);

    if (existingByEmail) {
      throw new AppError(409, 'EMAIL_TAKEN', 'Email is already in use.');
    }

    const existingByUsername = await this.findByUsername(input.username);

    if (existingByUsername) {
      throw new AppError(409, 'USERNAME_TAKEN', 'Username is already in use.');
    }

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

const createTestApp = (userStore: InMemoryAuthUserStore) =>
  createApp({
    authService: new AuthService(userStore),
    authUserStore: userStore,
  });

describe('Authentication routes', () => {
  let userStore: InMemoryAuthUserStore;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_EXPIRES_IN = '1h';
    userStore = new InMemoryAuthUserStore();
  });

  it('registers a user successfully', async () => {
    const response = await request(createTestApp(userStore))
      .post('/auth/register')
      .send({
        email: 'Ada@Example.com',
        password: 'password123',
        username: 'AdaLovelace',
        name: 'Ada Lovelace',
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      user: {
        id: expect.any(String),
        email: 'ada@example.com',
        username: 'adalovelace',
        name: 'Ada Lovelace',
        bio: null,
        avatarUrl: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
    expect(response.body.user.passwordHash).toBeUndefined();
  });

  it('rejects duplicate emails during registration', async () => {
    const app = createTestApp(userStore);

    await request(app).post('/auth/register').send({
      email: 'ada@example.com',
      password: 'password123',
      username: 'adalovelace',
      name: 'Ada Lovelace',
    });

    const response = await request(app).post('/auth/register').send({
      email: 'ada@example.com',
      password: 'differentpass',
      username: 'gracehopper',
      name: 'Grace Hopper',
    });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: {
        code: 'EMAIL_TAKEN',
        message: 'Email is already in use.',
        details: undefined,
      },
    });
  });

  it('rejects duplicate usernames during registration', async () => {
    const app = createTestApp(userStore);

    await request(app).post('/auth/register').send({
      email: 'ada@example.com',
      password: 'password123',
      username: 'adalovelace',
      name: 'Ada Lovelace',
    });

    const response = await request(app).post('/auth/register').send({
      email: 'grace@example.com',
      password: 'differentpass',
      username: 'adalovelace',
      name: 'Grace Hopper',
    });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: {
        code: 'USERNAME_TAKEN',
        message: 'Username is already in use.',
        details: undefined,
      },
    });
  });

  it('logs in successfully with valid credentials', async () => {
    const passwordHash = await hashPassword('password123');

    await userStore.seedUser({
      email: 'ada@example.com',
      passwordHash,
      username: 'adalovelace',
      name: 'Ada Lovelace',
      bio: null,
      avatarUrl: null,
    });

    const response = await request(createTestApp(userStore))
      .post('/auth/login')
      .send({
        email: 'ada@example.com',
        password: 'password123',
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      token: expect.any(String),
      user: {
        id: expect.any(String),
        email: 'ada@example.com',
        username: 'adalovelace',
        name: 'Ada Lovelace',
        bio: null,
        avatarUrl: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
    expect(response.body.user.passwordHash).toBeUndefined();
  });

  it('rejects login when the password is invalid', async () => {
    const passwordHash = await hashPassword('password123');

    await userStore.seedUser({
      email: 'ada@example.com',
      passwordHash,
      username: 'adalovelace',
      name: 'Ada Lovelace',
      bio: null,
      avatarUrl: null,
    });

    const response = await request(createTestApp(userStore))
      .post('/auth/login')
      .send({
        email: 'ada@example.com',
        password: 'wrongpassword',
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
        details: undefined,
      },
    });
  });

  it('returns 401 for GET /auth/me without a token', async () => {
    const response = await request(createTestApp(userStore)).get('/auth/me');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required.',
        details: undefined,
      },
    });
  });

  it('returns 401 for GET /auth/me with an invalid token', async () => {
    const response = await request(createTestApp(userStore))
      .get('/auth/me')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Authentication token is invalid.',
        details: undefined,
      },
    });
  });

  it('returns the current user for GET /auth/me with a valid token', async () => {
    const passwordHash = await hashPassword('password123');
    const user = await userStore.seedUser({
      email: 'ada@example.com',
      passwordHash,
      username: 'adalovelace',
      name: 'Ada Lovelace',
      bio: null,
      avatarUrl: null,
    });

    const token = signAuthToken(user.id);

    const response = await request(createTestApp(userStore))
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      user: {
        id: user.id,
        email: 'ada@example.com',
        username: 'adalovelace',
        name: 'Ada Lovelace',
        bio: null,
        avatarUrl: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
    expect(response.body.user.passwordHash).toBeUndefined();
  });

  it('returns success for POST /auth/logout', async () => {
    const passwordHash = await hashPassword('password123');
    const user = await userStore.seedUser({
      email: 'ada@example.com',
      passwordHash,
      username: 'adalovelace',
      name: 'Ada Lovelace',
      bio: null,
      avatarUrl: null,
    });

    const token = signAuthToken(user.id);

    const response = await request(createTestApp(userStore))
      .post('/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
    });
  });
});
