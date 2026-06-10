import { describe, expect, it, vi } from 'vitest';

import { AppError } from '../src/lib/errors.js';
import { TimelineService } from '../src/modules/timeline/timeline.service.js';
import type { AuthUserRecord } from '../src/modules/auth/auth.types.js';
import type { TimelineStore } from '../src/modules/timeline/timeline.types.js';

const authUser: AuthUserRecord = {
  id: 'viewer_1',
  email: 'viewer@example.com',
  passwordHash: 'hash',
  username: 'viewer',
  name: 'Viewer',
  bio: null,
  avatarUrl: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('TimelineService', () => {
  it('returns timeline data for valid queries', async () => {
    const store: TimelineStore = {
      listTimeline: vi.fn().mockResolvedValue({
        tweets: [],
        nextCursor: null,
      }),
    };

    const service = new TimelineService(store);
    const response = await service.getTimeline({ limit: 10 }, authUser);

    expect(response).toEqual({ tweets: [], nextCursor: null });
    expect(store.listTimeline).toHaveBeenCalledWith(authUser.id, { limit: 10 });
  });

  it('maps query validation errors', async () => {
    const store: TimelineStore = {
      listTimeline: vi.fn(),
    };

    const service = new TimelineService(store);

    await expect(
      service.getTimeline({ limit: 0 }, authUser),
    ).rejects.toMatchObject<AppError>({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  });

  it('rethrows unexpected store errors', async () => {
    const store: TimelineStore = {
      listTimeline: vi.fn().mockRejectedValue(new Error('boom')),
    };

    const service = new TimelineService(store);

    await expect(
      service.getTimeline({ limit: 10 }, authUser),
    ).rejects.toThrow('boom');
  });
});
