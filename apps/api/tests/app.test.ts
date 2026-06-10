import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

import { createApp } from '../src/app.js';

const mockAuthService = vi.hoisted(() => ({
  register: vi.fn(),
  login: vi.fn(),
  getCurrentUser: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('../src/modules/auth/auth.service.js', () => ({
  AuthService: vi.fn(() => mockAuthService),
}));

describe('createApp', () => {
  const originalWebOrigin = process.env.WEB_ORIGIN;
  const originalJwtSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = 'app-test-secret';
  });

  afterEach(() => {
    vi.clearAllMocks();
    if (originalWebOrigin === undefined) {
      delete process.env.WEB_ORIGIN;
    } else {
      process.env.WEB_ORIGIN = originalWebOrigin;
    }
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
  });

  describe('CORS with custom WEB_ORIGIN', () => {
    beforeEach(() => {
      process.env.WEB_ORIGIN = 'https://myapp.example.com';
    });

    it('uses WEB_ORIGIN as default CORS origin', async () => {
      const app = createApp();

      const response = await request(app)
        .get('/health')
        .set('Origin', 'https://myapp.example.com');

      expect(response.headers['access-control-allow-origin']).toBe(
        'https://myapp.example.com',
      );
    });

    it('allows localhost origins alongside custom WEB_ORIGIN', async () => {
      const app = createApp();

      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:5173');

      expect(response.headers['access-control-allow-origin']).toBe(
        'http://localhost:5173',
      );
    });

    it('falls back to WEB_ORIGIN for unknown origins', async () => {
      const app = createApp();

      const response = await request(app)
        .get('/health')
        .set('Origin', 'https://evil-site.com');

      expect(response.headers['access-control-allow-origin']).toBe(
        'https://myapp.example.com',
      );
    });

    it('uses localhost default when WEB_ORIGIN is empty string', async () => {
      process.env.WEB_ORIGIN = '   ';
      const app = createApp();

      const response = await request(app)
        .get('/health')
        .set('Origin', 'https://evil-site.com');

      expect(response.headers['access-control-allow-origin']).toBe(
        'http://localhost:5173',
      );
    });
  });

  describe('error handler', () => {
    it('returns 500 for non-AppError exceptions', async () => {
      mockAuthService.getCurrentUser.mockRejectedValue(
        new Error('DB connection lost'),
      );

      const authUserStore = {
        findById: async () => ({
          id: 'user_1',
          email: 'test@example.com',
          passwordHash: 'hash',
          username: 'test',
          name: 'Test User',
          bio: null,
          avatarUrl: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        }),
        findByEmail: async () => null,
        findByUsername: async () => null,
        createUser: async () => ({}),
      } as never;

      const app = createApp({ authUserStore });

      const token = (await import('jsonwebtoken')).default.sign(
        { sub: 'user_1' },
        'app-test-secret',
      );

      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred.',
        },
      });
    });
  });
});
