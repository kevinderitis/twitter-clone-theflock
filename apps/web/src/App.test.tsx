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

const createDemoUser = () => ({
  id: 'user_demo',
  email: 'demo@example.com',
  username: 'demo',
  name: 'Demo User',
  bio: null,
  avatarUrl: null,
  createdAt: '2026-01-10T09:00:00.000Z',
  updatedAt: '2026-01-10T09:00:00.000Z',
});

const createTimelineTweet = (overrides?: Record<string, unknown>) => ({
  id: 'tweet_1',
  content: 'Hello from the seeded timeline',
  authorId: 'user_demo',
  createdAt: '2026-01-10T09:00:00.000Z',
  updatedAt: '2026-01-10T09:00:00.000Z',
  author: {
    id: 'user_demo',
    username: 'demo',
    name: 'Demo User',
    avatarUrl: null,
  },
  likesCount: 4,
  ...overrides,
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
    fetchMock
      .mockResolvedValueOnce(
        createJsonResponse({
          token: 'demo-token',
          user: createDemoUser(),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          tweets: [createTimelineTweet()],
          nextCursor: null,
        }),
      );

    renderApp('/login');

    await userEvent.type(screen.getByLabelText(/email/i), 'demo@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'Password123!');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await screen.findByText(/hello from the seeded timeline/i);

    expect(window.localStorage.getItem('theflock.auth.token')).toBe(
      'demo-token',
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
              ...createDemoUser(),
              id: 'user_new',
              email: 'new@example.com',
              username: 'newuser',
              name: 'New User',
            },
          },
          201,
        ),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          token: 'new-token',
          user: {
            ...createDemoUser(),
            id: 'user_new',
            email: 'new@example.com',
            username: 'newuser',
            name: 'New User',
          },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          tweets: [
            createTimelineTweet({
              id: 'tweet_new',
              content: 'Fresh account feed',
            }),
          ],
          nextCursor: null,
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

    await screen.findByText(/fresh account feed/i);

    expect(window.localStorage.getItem('theflock.auth.token')).toBe(
      'new-token',
    );
  });

  it('clears session on logout', async () => {
    window.localStorage.setItem('theflock.auth.token', 'demo-token');

    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createDemoUser(),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          tweets: [createTimelineTweet()],
          nextCursor: null,
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

describe('Timeline page', () => {
  beforeEach(() => {
    window.localStorage.setItem('theflock.auth.token', 'demo-token');
    vi.stubEnv('VITE_API_URL', 'http://localhost:3000');
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('shows a loading state while the timeline is fetching', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        user: createDemoUser(),
      }),
    );
    fetchMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve(
              createJsonResponse({
                tweets: [createTimelineTweet()],
                nextCursor: null,
              }),
            );
          }, 50);
        }),
    );

    renderApp('/');

    expect(await screen.findByText(/loading timeline/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/hello from the seeded timeline/i),
    ).toBeInTheDocument();
  });

  it('renders timeline tweets', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createDemoUser(),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          tweets: [createTimelineTweet()],
          nextCursor: null,
        }),
      );

    renderApp('/');

    expect(
      await screen.findByText(/hello from the seeded timeline/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/demo user/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/@demo/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/^0 \/ 280$/i)).toBeInTheDocument();
  });

  it('shows an empty state when the timeline is empty', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createDemoUser(),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          tweets: [],
          nextCursor: null,
        }),
      );

    renderApp('/');

    expect(
      await screen.findByText(/your timeline is empty/i),
    ).toBeInTheDocument();
  });

  it('shows an error state when timeline loading fails', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createDemoUser(),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse(
          {
            error: {
              code: 'INTERNAL_SERVER_ERROR',
              message: 'An unexpected error occurred.',
            },
          },
          500,
        ),
      );

    renderApp('/');

    expect(
      await screen.findByText(/we could not load your timeline/i),
    ).toBeInTheDocument();
  });

  it('shows a load more button when nextCursor exists', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createDemoUser(),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          tweets: [createTimelineTweet()],
          nextCursor: 'tweet_cursor_2',
        }),
      );

    renderApp('/');

    expect(
      await screen.findByRole('button', { name: /load more/i }),
    ).toBeInTheDocument();
  });

  it('renders the composer and keeps submit disabled when empty', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createDemoUser(),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          tweets: [createTimelineTweet()],
          nextCursor: null,
        }),
      );

    renderApp('/');

    expect(
      await screen.findByPlaceholderText(/what's happening\?/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /post/i })).toBeDisabled();
  });

  it('updates the character counter and disables submit when over 280 characters', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createDemoUser(),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          tweets: [createTimelineTweet()],
          nextCursor: null,
        }),
      );

    renderApp('/');

    const textarea = await screen.findByPlaceholderText(/what's happening\?/i);
    await userEvent.type(textarea, 'a'.repeat(281));

    expect(screen.getByText(/^281 \/ 280$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /post/i })).toBeDisabled();
  });

  it('clears the textarea after a successful submit and refreshes the timeline query', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createDemoUser(),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          tweets: [createTimelineTweet()],
          nextCursor: null,
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse(
          {
            tweet: createTimelineTweet({
              id: 'tweet_created',
              content: 'A newly created tweet',
            }),
          },
          201,
        ),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          tweets: [createTimelineTweet({ content: 'Timeline refreshed' })],
          nextCursor: null,
        }),
      );

    renderApp('/');

    const textarea = await screen.findByPlaceholderText(/what's happening\?/i);
    await userEvent.type(textarea, 'A freshly posted thought');
    await userEvent.click(screen.getByRole('button', { name: /^post$/i }));

    await waitFor(() => {
      expect(textarea).toHaveValue('');
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/tweets',
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(await screen.findByText(/timeline refreshed/i)).toBeInTheDocument();
  });
});
