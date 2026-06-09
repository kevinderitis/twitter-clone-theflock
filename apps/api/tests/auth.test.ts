import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';
import { hashPassword } from '../src/modules/auth/auth.security.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import type {
  AuthUserRecord,
  AuthUserStore,
  CreateUserInput,
} from '../src/modules/auth/auth.types.js';

class InMemoryAuthUserStore implements AuthUserStore {
  private users = new Map<string, AuthUserRecord>();

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

describe('Authentication routes', () => {
  let userStore: InMemoryAuthUserStore;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_EXPIRES_IN = '1h';
    userStore = new InMemoryAuthUserStore();
  });

  it('registers a user successfully', async () => {
    const app = createApp({ authService: new AuthService(userStore) });

    const response = await request(app).post('/auth/register').send({
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
    const app = createApp({ authService: new AuthService(userStore) });

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
    const app = createApp({ authService: new AuthService(userStore) });

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

    const app = createApp({ authService: new AuthService(userStore) });

    const response = await request(app).post('/auth/login').send({
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

    const app = createApp({ authService: new AuthService(userStore) });

    const response = await request(app).post('/auth/login').send({
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
});
