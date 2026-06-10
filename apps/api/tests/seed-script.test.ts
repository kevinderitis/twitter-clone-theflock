import { afterEach, describe, expect, it, vi } from 'vitest';

type TransactionMock = {
  like: { deleteMany: () => Promise<void>; createMany: () => Promise<void> };
  follow: { deleteMany: () => Promise<void>; createMany: () => Promise<void> };
  tweet: { deleteMany: () => Promise<void>; createMany: () => Promise<void> };
  user: { deleteMany: () => Promise<void>; createMany: () => Promise<void> };
};

describe('seed script', () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it('runs the seed plan successfully and logs the summary', async () => {
    const deleteMany = vi.fn().mockResolvedValue(undefined);
    const createMany = vi.fn().mockResolvedValue(undefined);
    const disconnect = vi.fn().mockResolvedValue(undefined);
    const transaction = vi
      .fn()
      .mockImplementation(async (callback: (tx: TransactionMock) => Promise<void>) =>
        callback({
          like: { deleteMany, createMany },
          follow: { deleteMany, createMany },
          tweet: { deleteMany, createMany },
          user: { deleteMany, createMany },
        }),
      );

    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.doMock('../src/lib/prisma.js', () => ({
      prisma: {
        $transaction: transaction,
        $disconnect: disconnect,
      },
    }));
    vi.doMock('../src/modules/auth/auth.security.js', () => ({
      hashPassword: vi.fn().mockResolvedValue('hashed-password'),
    }));
    vi.doMock('../prisma/seed.data.js', () => ({
      buildSeedPlan: vi.fn().mockReturnValue({
        users: [{ id: 'user_1' }],
        tweets: [{ id: 'tweet_1' }],
        follows: [{ followerId: 'user_1', followingId: 'user_2' }],
        likes: [{ userId: 'user_1', tweetId: 'tweet_1' }],
      }),
    }));

    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIRES_IN;

    await import('../prisma/seed.ts');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(process.env.JWT_SECRET).toBe('seed-jwt-secret');
    expect(process.env.JWT_EXPIRES_IN).toBe('1h');
    expect(transaction).toHaveBeenCalled();
    expect(createMany).toHaveBeenCalledTimes(4);
    expect(disconnect).toHaveBeenCalled();
    expect(consoleLog).toHaveBeenCalledWith(
      'Seeded 1 users, 1 tweets, 1 follows, and 1 likes.',
    );
    expect(consoleError).not.toHaveBeenCalled();

    consoleLog.mockRestore();
    consoleError.mockRestore();
  });

  it('handles seed failures and still disconnects prisma', async () => {
    const disconnect = vi.fn().mockResolvedValue(undefined);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.doMock('../src/lib/prisma.js', () => ({
      prisma: {
        $transaction: vi.fn().mockRejectedValue(new Error('db failed')),
        $disconnect: disconnect,
      },
    }));
    vi.doMock('../src/modules/auth/auth.security.js', () => ({
      hashPassword: vi.fn().mockResolvedValue('hashed-password'),
    }));
    vi.doMock('../prisma/seed.data.js', () => ({
      buildSeedPlan: vi.fn().mockReturnValue({
        users: [],
        tweets: [],
        follows: [],
        likes: [],
      }),
    }));

    process.exitCode = undefined;

    await import('../prisma/seed.ts');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(consoleError).toHaveBeenCalledWith(
      'Seed failed',
      expect.objectContaining({ message: 'db failed' }),
    );
    expect(process.exitCode).toBe(1);
    expect(disconnect).toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
