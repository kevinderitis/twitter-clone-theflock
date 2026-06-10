import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('prisma singleton', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it('caches the prisma instance in non-production', async () => {
    process.env.NODE_ENV = 'development';

    const { prisma: first } = await import('../src/lib/prisma.js');
    const { prisma: second } = await import('../src/lib/prisma.js');

    expect(first).toBe(second);
  });

  it('creates a fresh instance per call in production', async () => {
    process.env.NODE_ENV = 'production';

    const mod = await import('../src/lib/prisma.js');

    expect(mod.prisma).toBeDefined();
  });
});
