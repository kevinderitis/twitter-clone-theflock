import { AppError } from '../../lib/errors.js';
import {
  hashPassword,
  signAuthToken,
  verifyPassword,
} from './auth.security.js';
import type {
  AuthUserRecord,
  AuthUserStore,
  LoginInput,
  PublicUser,
  RegisterInput,
} from './auth.types.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const normalizeUsername = (username: string) => username.trim().toLowerCase();
const normalizeName = (name: string) => name.trim();

const toPublicUser = (user: AuthUserRecord): PublicUser => ({
  id: user.id,
  email: user.email,
  username: user.username,
  name: user.name,
  bio: user.bio,
  avatarUrl: user.avatarUrl,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const validateRegisterInput = (input: Partial<RegisterInput>) => {
  const errors: string[] = [];

  if (!input.email?.trim()) errors.push('Email is required.');
  if (!input.password?.trim()) errors.push('Password is required.');
  if (!input.username?.trim()) errors.push('Username is required.');
  if (!input.name?.trim()) errors.push('Name is required.');

  if (input.email?.trim() && !EMAIL_REGEX.test(input.email.trim())) {
    errors.push('Email must be a valid email address.');
  }

  if (input.password && input.password.length < MIN_PASSWORD_LENGTH) {
    errors.push(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
    );
  }

  if (errors.length > 0) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Invalid registration payload.',
      errors,
    );
  }

  return {
    email: normalizeEmail(input.email!),
    password: input.password!,
    username: normalizeUsername(input.username!),
    name: normalizeName(input.name!),
  };
};

const validateLoginInput = (input: Partial<LoginInput>) => {
  const errors: string[] = [];

  if (!input.email?.trim()) errors.push('Email is required.');
  if (!input.password?.trim()) errors.push('Password is required.');

  if (input.email?.trim() && !EMAIL_REGEX.test(input.email.trim())) {
    errors.push('Email must be a valid email address.');
  }

  if (errors.length > 0) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Invalid login payload.',
      errors,
    );
  }

  return {
    email: normalizeEmail(input.email!),
    password: input.password!,
  };
};

export class AuthService {
  constructor(private readonly userStore: AuthUserStore) {}

  async register(input: Partial<RegisterInput>) {
    const validatedInput = validateRegisterInput(input);

    if (await this.userStore.findByEmail(validatedInput.email)) {
      throw new AppError(409, 'EMAIL_TAKEN', 'Email is already in use.');
    }

    if (await this.userStore.findByUsername(validatedInput.username)) {
      throw new AppError(409, 'USERNAME_TAKEN', 'Username is already in use.');
    }

    const passwordHash = await hashPassword(validatedInput.password);
    const user = await this.userStore.createUser({
      email: validatedInput.email,
      passwordHash,
      username: validatedInput.username,
      name: validatedInput.name,
      bio: null,
      avatarUrl: null,
    });

    return {
      user: toPublicUser(user),
    };
  }

  async login(input: Partial<LoginInput>) {
    const validatedInput = validateLoginInput(input);
    const user = await this.userStore.findByEmail(validatedInput.email);

    if (!user) {
      throw new AppError(
        401,
        'INVALID_CREDENTIALS',
        'Invalid email or password.',
      );
    }

    const isPasswordValid = await verifyPassword(
      validatedInput.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new AppError(
        401,
        'INVALID_CREDENTIALS',
        'Invalid email or password.',
      );
    }

    return {
      token: signAuthToken(user.id),
      user: toPublicUser(user),
    };
  }
}
