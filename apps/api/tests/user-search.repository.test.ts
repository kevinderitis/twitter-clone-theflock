import { describe, expect, it, vi, beforeEach } from 'vitest';

import { PrismaUserSearchStore } from '../src/modules/user-search/user-search.repository.js';

const mockPrisma = vi.hoisted(() => ({
  user: {
    findMany: vi.fn(),
  },
}));

vi.mock('../src/lib/prisma.js', () => ({
  prisma: mockPrisma,
}));

const makeUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'user_1',
  username: 'ada',
  name: 'Ada Lovelace',
  bio: null,
  avatarUrl: null,
  ...overrides,
});

describe('PrismaUserSearchStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns users matching the search query', async () => {
    const users = [makeUser(), makeUser({ id: 'user_2', username: 'alan' })];
    mockPrisma.user.findMany.mockResolvedValue(users);

    const result = await new PrismaUserSearchStore().searchUsers({
      q: 'ada',
      limit: 20,
    });

    expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { username: { contains: 'ada', mode: 'insensitive' } },
          { name: { contains: 'ada', mode: 'insensitive' } },
        ],
      },
      orderBy: { username: 'asc' },
      take: 20,
      select: expect.any(Object),
    });
    expect(result).toHaveLength(2);
  });

  it('returns empty array when no users match', async () => {
    mockPrisma.user.findMany.mockResolvedValue([]);

    const result = await new PrismaUserSearchStore().searchUsers({
      q: 'nonexistent',
      limit: 20,
    });

    expect(result).toEqual([]);
  });

  it('limits results according to the limit parameter', async () => {
    const users = Array.from({ length: 5 }, (_, i) =>
      makeUser({ id: `user_${i}`, username: `user${i}` }),
    );
    mockPrisma.user.findMany.mockResolvedValue(users);

    const result = await new PrismaUserSearchStore().searchUsers({
      q: 'user',
      limit: 5,
    });

    expect(result).toHaveLength(5);
    expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 }),
    );
  });

  it('returns isFollowing as false for all results', async () => {
    const users = [makeUser()];
    mockPrisma.user.findMany.mockResolvedValue(users);

    const result = await new PrismaUserSearchStore().searchUsers({
      q: 'ada',
      limit: 20,
    });

    expect(result[0]?.isFollowing).toBe(false);
  });
});
