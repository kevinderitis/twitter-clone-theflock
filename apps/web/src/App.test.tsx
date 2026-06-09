import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';
import { AuthProvider } from './modules/auth/auth-provider';

const createJsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });

const renderApp = (initialEntry: string) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          <App />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
};

describe('App authentication flow', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubEnv('VITE_API_URL', 'http://localhost:3000');
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('submits the login form successfully', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        token: 'demo-token',
        user: {
          id: 'user_demo',
          email: 'demo@example.com',
          username: 'demo',
          name: 'Demo User',
          bio: null,
          avatarUrl: null,
          createdAt: '2026-01-10T09:00:00.000Z',
          updatedAt: '2026-01-10T09:00:00.000Z',
        },
      }),
    );

    renderApp('/login');

    await userEvent.type(screen.getByLabelText(/email/i), 'demo@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'Password123!');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await screen.findByText(/composer placeholder/i);

    expect(window.localStorage.getItem('theflock.auth.token')).toBe(
      'demo-token',
    );
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/auth/login',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  it('shows a login error from the backend', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      createJsonResponse(
        {
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password.',
          },
        },
        401,
      ),
    );

    renderApp('/login');

    await userEvent.type(screen.getByLabelText(/email/i), 'demo@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong-password');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(
      await screen.findByText(/invalid email or password/i),
    ).toBeInTheDocument();
  });

  it('submits the register form successfully', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        createJsonResponse(
          {
            user: {
              id: 'user_new',
              email: 'new@example.com',
              username: 'newuser',
              name: 'New User',
              bio: null,
              avatarUrl: null,
              createdAt: '2026-01-10T09:00:00.000Z',
              updatedAt: '2026-01-10T09:00:00.000Z',
            },
          },
          201,
        ),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          token: 'new-token',
          user: {
            id: 'user_new',
            email: 'new@example.com',
            username: 'newuser',
            name: 'New User',
            bio: null,
            avatarUrl: null,
            createdAt: '2026-01-10T09:00:00.000Z',
            updatedAt: '2026-01-10T09:00:00.000Z',
          },
        }),
      );

    renderApp('/register');

    await userEvent.type(screen.getByLabelText(/^name$/i), 'New User');
    await userEvent.type(screen.getByLabelText(/username/i), 'newuser');
    await userEvent.type(screen.getByLabelText(/email/i), 'new@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'Password123!');
    await userEvent.click(
      screen.getByRole('button', { name: /create account/i }),
    );

    await screen.findByText(/composer placeholder/i);

    expect(window.localStorage.getItem('theflock.auth.token')).toBe(
      'new-token',
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://localhost:3000/auth/register',
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:3000/auth/login',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  it('clears session on logout', async () => {
    window.localStorage.setItem('theflock.auth.token', 'demo-token');

    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        createJsonResponse({
          user: {
            id: 'user_demo',
            email: 'demo@example.com',
            username: 'demo',
            name: 'Demo User',
            bio: null,
            avatarUrl: null,
            createdAt: '2026-01-10T09:00:00.000Z',
            updatedAt: '2026-01-10T09:00:00.000Z',
          },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          success: true,
        }),
      );

    renderApp('/');

    await screen.findByRole('button', { name: /log out/i });
    await userEvent.click(screen.getByRole('button', { name: /log out/i }));

    await screen.findByRole('heading', { name: /welcome back/i });
    expect(window.localStorage.getItem('theflock.auth.token')).toBeNull();
  });

  it('redirects protected routes when logged out', async () => {
    renderApp('/search');

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /welcome back/i }),
      ).toBeInTheDocument();
    });
  });
});
