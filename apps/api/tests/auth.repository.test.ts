import { describe, expect, it, vi, beforeEach } from 'vitest';

import { Prisma } from '@prisma/client';

import { PrismaAuthUserStore } from '../src/modules/auth/auth.repository.js';

const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../src/lib/prisma.js', () => ({
  prisma: mockPrisma,
}));

const makeUser = () => ({
  id: 'user_1',
  email: 'ada@example.com',
  passwordHash: 'hashed_pw',
  username: 'ada',
  name: 'Ada Lovelace',
  bio: null as string | null,
  avatarUrl: null as string | null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
});

describe('PrismaAuthUserStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findById', () => {
    it('returns the user when found', async () => {
      const user = makeUser();
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await new PrismaAuthUserStore().findById('user_1');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user_1' },
        select: expect.any(Object),
      });
      expect(result).toEqual(user);
    });

    it('returns null when not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await new PrismaAuthUserStore().findById('missing');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('returns the user when found', async () => {
      const user = makeUser();
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await new PrismaAuthUserStore().findByEmail('ada@example.com');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'ada@example.com' },
        select: expect.any(Object),
      });
      expect(result).toEqual(user);
    });

    it('returns null when not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await new PrismaAuthUserStore().findByEmail('missing@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('returns the user when found', async () => {
      const user = makeUser();
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await new PrismaAuthUserStore().findByUsername('ada');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'ada' },
        select: expect.any(Object),
      });
      expect(result).toEqual(user);
    });

    it('returns null when not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await new PrismaAuthUserStore().findByUsername('missing');

      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    const input = {
      email: 'ada@example.com',
      passwordHash: 'hashed_pw',
      username: 'ada',
      name: 'Ada Lovelace',
      bio: null as string | null,
      avatarUrl: null as string | null,
    };

    it('creates and returns the user', async () => {
      const user = makeUser();
      mockPrisma.user.create.mockResolvedValue(user);

      const result = await new PrismaAuthUserStore().createUser(input);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: input,
        select: expect.any(Object),
      });
      expect(result).toEqual(user);
    });

    it('throws EMAIL_TAKEN on unique constraint for email', async () => {
      const error = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: '1.0',
        meta: { target: ['email'] },
      });
      mockPrisma.user.create.mockRejectedValue(error);

      await expect(
        new PrismaAuthUserStore().createUser(input),
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'EMAIL_TAKEN',
      });
    });

    it('throws USERNAME_TAKEN on unique constraint for username', async () => {
      const error = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: '1.0',
        meta: { target: ['username'] },
      });
      mockPrisma.user.create.mockRejectedValue(error);

      await expect(
        new PrismaAuthUserStore().createUser(input),
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'USERNAME_TAKEN',
      });
    });

    it('re-throws unknown Prisma errors', async () => {
      const error = new Prisma.PrismaClientKnownRequestError('Foreign key', {
        code: 'P2003',
        clientVersion: '1.0',
      });
      mockPrisma.user.create.mockRejectedValue(error);

      await expect(
        new PrismaAuthUserStore().createUser(input),
      ).rejects.toThrow(error);
    });

    it('re-throws non-Prisma errors', async () => {
      const error = new Error('DB connection lost');
      mockPrisma.user.create.mockRejectedValue(error);

      await expect(
        new PrismaAuthUserStore().createUser(input),
      ).rejects.toThrow(error);
    });
  });
});
