import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AppError } from '../src/lib/errors.js';
import { hashPassword } from '../src/modules/auth/auth.security.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import type {
  AuthUserRecord,
  AuthUserStore,
  CreateUserInput,
} from '../src/modules/auth/auth.types.js';

const createUser = (overrides: Partial<AuthUserRecord> = {}): AuthUserRecord => ({
  id: 'user_1',
  email: 'ada@example.com',
  passwordHash:
    '$2b$12$1FdSv8k4NQtsR9WgQkAnT.HL7T4P6vNruM3aMcMBXNIN1qNbfXDnK',
  username: 'ada',
  name: 'Ada Lovelace',
  bio: null,
  avatarUrl: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

class InMemoryAuthUserStore implements AuthUserStore {
  users: AuthUserRecord[] = [];

  async findById(id: string) {
    return this.users.find((user) => user.id === id) ?? null;
  }

  async findByEmail(email: string) {
    return this.users.find((user) => user.email === email) ?? null;
  }

  async findByUsername(username: string) {
    return this.users.find((user) => user.username === username) ?? null;
  }

  async createUser(input: CreateUserInput) {
    const user = createUser({
      id: `user_${this.users.length + 1}`,
      ...input,
    });

    this.users.push(user);
    return user;
  }
}

describe('AuthService', () => {
  const originalJwtSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = 'auth-service-test-secret';
  });

  afterEach(() => {
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
  });

  it('validates registration input and returns all relevant messages', async () => {
    const service = new AuthService(new InMemoryAuthUserStore());

    await expect(
      service.register({
        email: 'bad-email',
        password: 'short',
        username: '   ',
        name: '   ',
      }),
    ).rejects.toMatchObject<AppError>({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      details: [
        'Username is required.',
        'Name is required.',
        'Email must be a valid email address.',
        'Password must be at least 8 characters long.',
      ],
    });
  });

  it('rejects duplicate registration emails', async () => {
    const store = new InMemoryAuthUserStore();
    store.users.push(createUser());

    const service = new AuthService(store);

    await expect(
      service.register({
        email: 'Ada@Example.com',
        password: 'Password123!',
        username: 'new-user',
        name: 'New User',
      }),
    ).rejects.toMatchObject<AppError>({
      statusCode: 409,
      code: 'EMAIL_TAKEN',
    });
  });

  it('rejects duplicate registration usernames', async () => {
    const store = new InMemoryAuthUserStore();
    store.users.push(createUser());

    const service = new AuthService(store);

    await expect(
      service.register({
        email: 'new@example.com',
        password: 'Password123!',
        username: ' Ada ',
        name: 'New User',
      }),
    ).rejects.toMatchObject<AppError>({
      statusCode: 409,
      code: 'USERNAME_TAKEN',
    });
  });

  it('normalizes fields and returns a public user on successful registration', async () => {
    const store = new InMemoryAuthUserStore();
    const service = new AuthService(store);

    const response = await service.register({
      email: '  Ada@Example.com ',
      password: 'Password123!',
      username: ' Ada ',
      name: '  Ada Lovelace ',
    });

    expect(response.user.email).toBe('ada@example.com');
    expect(response.user.username).toBe('ada');
    expect(response.user.name).toBe('Ada Lovelace');
    expect('passwordHash' in response.user).toBe(false);
    expect(store.users).toHaveLength(1);
    expect(store.users[0]?.passwordHash).not.toBe('Password123!');
  });

  it('validates login input', async () => {
    const service = new AuthService(new InMemoryAuthUserStore());

    await expect(
      service.login({
        email: 'bad-email',
        password: '   ',
      }),
    ).rejects.toMatchObject<AppError>({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      details: ['Password is required.', 'Email must be a valid email address.'],
    });
  });

  it('rejects login when the user does not exist', async () => {
    const service = new AuthService(new InMemoryAuthUserStore());

    await expect(
      service.login({
        email: 'ada@example.com',
        password: 'Password123!',
      }),
    ).rejects.toMatchObject<AppError>({
      statusCode: 401,
      code: 'INVALID_CREDENTIALS',
    });
  });

  it('rejects login when the password is invalid', async () => {
    const store = new InMemoryAuthUserStore();
    store.users.push(createUser());
    const service = new AuthService(store);

    await expect(
      service.login({
        email: 'ada@example.com',
        password: 'WrongPassword!',
      }),
    ).rejects.toMatchObject<AppError>({
      statusCode: 401,
      code: 'INVALID_CREDENTIALS',
    });
  });

  it('returns a token and public user on successful login', async () => {
    const store = new InMemoryAuthUserStore();
    store.users.push(
      createUser({
        passwordHash: await hashPassword('Password123!'),
      }),
    );
    const service = new AuthService(store);

    const response = await service.login({
      email: 'Ada@Example.com',
      password: 'Password123!',
    });

    expect(response.token).toEqual(expect.any(String));
    expect(response.user.email).toBe('ada@example.com');
    expect('passwordHash' in response.user).toBe(false);
  });

  it('returns the current user when the id exists', async () => {
    const store = new InMemoryAuthUserStore();
    const user = createUser();
    store.users.push(user);
    const service = new AuthService(store);

    const response = await service.getCurrentUser(user.id);

    expect(response.user).toMatchObject({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  });

  it('rejects getCurrentUser when the token points to a missing user', async () => {
    const service = new AuthService(new InMemoryAuthUserStore());

    await expect(service.getCurrentUser('missing')).rejects.toMatchObject<AppError>(
      {
        statusCode: 401,
        code: 'INVALID_TOKEN',
      },
    );
  });

  it('returns a success payload on logout', async () => {
    const service = new AuthService(new InMemoryAuthUserStore());

    await expect(service.logout()).resolves.toEqual({ success: true });
  });
});
