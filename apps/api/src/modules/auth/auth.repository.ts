import { Prisma } from '@prisma/client';

import { AppError } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import type {
  AuthUserRecord,
  AuthUserStore,
  CreateUserInput,
} from './auth.types.js';

const authUserSelect = {
  id: true,
  email: true,
  passwordHash: true,
  username: true,
  name: true,
  bio: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

type PrismaAuthUser = Prisma.UserGetPayload<{
  select: typeof authUserSelect;
}>;

const toAuthUserRecord = (user: PrismaAuthUser): AuthUserRecord => user;

export class PrismaAuthUserStore implements AuthUserStore {
  async findByEmail(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: authUserSelect,
    });

    return user ? toAuthUserRecord(user) : null;
  }

  async findByUsername(username: string) {
    const user = await prisma.user.findUnique({
      where: { username },
      select: authUserSelect,
    });

    return user ? toAuthUserRecord(user) : null;
  }

  async createUser(input: CreateUserInput) {
    try {
      const user = await prisma.user.create({
        data: input,
        select: authUserSelect,
      });

      return toAuthUserRecord(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        Array.isArray(error.meta?.target)
      ) {
        const target = error.meta.target.join(',');

        if (target.includes('email')) {
          throw new AppError(409, 'EMAIL_TAKEN', 'Email is already in use.');
        }

        if (target.includes('username')) {
          throw new AppError(
            409,
            'USERNAME_TAKEN',
            'Username is already in use.',
          );
        }
      }

      throw error;
    }
  }
}
