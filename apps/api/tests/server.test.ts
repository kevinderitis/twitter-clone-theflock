import { afterEach, describe, expect, it, vi } from 'vitest';

describe('server entrypoint', () => {
  afterEach(() => {
    vi.resetModules();
    vi.unmock('../src/app.js');
    delete process.env.API_PORT;
  });

  it('creates the app and starts listening on the configured port', async () => {
    const listen = vi.fn((port: number, callback: () => void) => {
      callback();
      return { close: vi.fn() };
    });
    const createApp = vi.fn(() => ({
      listen,
    }));
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    process.env.API_PORT = '4123';

    vi.doMock('../src/app.js', () => ({
      createApp,
    }));

    await import('../src/server.js');

    expect(createApp).toHaveBeenCalled();
    expect(listen).toHaveBeenCalledWith(4123, expect.any(Function));
    expect(consoleSpy).toHaveBeenCalledWith('API listening on port 4123');

    consoleSpy.mockRestore();
  });

  it('falls back to port 3000 when API_PORT is not set', async () => {
    const listen = vi.fn((_port: number, callback: () => void) => {
      callback();
      return { close: vi.fn() };
    });
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    vi.doMock('../src/app.js', () => ({
      createApp: () => ({ listen }),
    }));

    await import('../src/server.js');

    expect(listen).toHaveBeenCalledWith(3000, expect.any(Function));
    consoleSpy.mockRestore();
  });
});
