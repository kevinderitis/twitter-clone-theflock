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
  likedByMe: false,
  ...overrides,
});

const createSearchUser = (overrides?: Record<string, unknown>) => ({
  id: 'user_search_1',
  username: 'kevin',
  name: 'Kevin',
  bio: 'Building The Flock one slice at a time.',
  avatarUrl: null,
  ...overrides,
});

const createProfileUser = (overrides?: Record<string, unknown>) => ({
  id: 'user_profile',
  username: 'demo',
  name: 'Demo User',
  bio: 'Shipping The Flock one commit at a time.',
  avatarUrl: null,
  followersCount: 12,
  followingCount: 7,
  tweetsCount: 2,
  isFollowing: false,
  ...overrides,
});

const createProfileTweet = (overrides?: Record<string, unknown>) => ({
  id: 'tweet_profile_1',
  content: 'Profile tweet from the backend.',
  authorId: 'user_profile',
  createdAt: '2026-01-11T10:00:00.000Z',
  updatedAt: '2026-01-11T10:00:00.000Z',
  likesCount: 3,
  author: {
    id: 'user_profile',
    username: 'demo',
    name: 'Demo User',
    avatarUrl: null,
  },
  ...overrides,
});

const createFollowListUser = (overrides?: Record<string, unknown>) => ({
  id: 'user_follow_1',
  username: 'hopper',
  name: 'Grace Hopper',
  bio: 'Compilers, systems, and sharp edges.',
  avatarUrl: null,
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

  it('renders a like button and the likes count', async () => {
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
      await screen.findByRole('button', { name: /^like$/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/^4$/i)).toBeInTheDocument();
  });

  it('updates the count when liking a tweet', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(createJsonResponse({ user: createDemoUser() }))
      .mockResolvedValueOnce(
        createJsonResponse({
          tweets: [createTimelineTweet()],
          nextCursor: null,
        }),
      )
      .mockResolvedValueOnce(createJsonResponse({ likesCount: 5 }))
      .mockResolvedValueOnce(
        createJsonResponse({
          tweets: [createTimelineTweet({ likesCount: 5, likedByMe: true })],
          nextCursor: null,
        }),
      );

    renderApp('/');

    await userEvent.click(
      await screen.findByRole('button', { name: /^like$/i }),
    );

    await screen.findByRole('button', { name: /^unlike$/i });
    expect(screen.getByText(/^5$/i)).toBeInTheDocument();
  });

  it('updates the count when unliking a tweet', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(createJsonResponse({ user: createDemoUser() }))
      .mockResolvedValueOnce(
        createJsonResponse({
          tweets: [createTimelineTweet({ likesCount: 4, likedByMe: true })],
          nextCursor: null,
        }),
      )
      .mockResolvedValueOnce(createJsonResponse({ likesCount: 3 }))
      .mockResolvedValueOnce(
        createJsonResponse({
          tweets: [createTimelineTweet({ likesCount: 3, likedByMe: false })],
          nextCursor: null,
        }),
      );

    renderApp('/');

    await userEvent.click(
      await screen.findByRole('button', { name: /^unlike$/i }),
    );

    await screen.findByRole('button', { name: /^like$/i });
    expect(screen.getByText(/^3$/i)).toBeInTheDocument();
  });

  it('shows a friendly message when the like mutation fails', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(createJsonResponse({ user: createDemoUser() }))
      .mockResolvedValueOnce(
        createJsonResponse({
          tweets: [createTimelineTweet()],
          nextCursor: null,
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse(
          {
            error: {
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Could not update like right now.',
            },
          },
          500,
        ),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          tweets: [createTimelineTweet()],
          nextCursor: null,
        }),
      );

    renderApp('/');

    await userEvent.click(
      await screen.findByRole('button', { name: /^like$/i }),
    );

    expect(
      await screen.findByText(/could not update like right now/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^like$/i })).toBeEnabled();
  });

  it('disables the like button while the mutation is pending', async () => {
    let resolveLike: ((value: Response) => void) | undefined;
    const pendingLike = new Promise<Response>((resolve) => {
      resolveLike = resolve;
    });
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(createJsonResponse({ user: createDemoUser() }))
      .mockResolvedValueOnce(
        createJsonResponse({
          tweets: [createTimelineTweet()],
          nextCursor: null,
        }),
      )
      .mockImplementationOnce(() => pendingLike)
      .mockResolvedValueOnce(
        createJsonResponse({
          tweets: [createTimelineTweet({ likesCount: 5, likedByMe: true })],
          nextCursor: null,
        }),
      );

    renderApp('/');

    const button = await screen.findByRole('button', { name: /^like$/i });
    await userEvent.click(button);

    expect(
      await screen.findByRole('button', { name: /ing\.\.\.$/i }),
    ).toBeDisabled();

    resolveLike?.(createJsonResponse({ likesCount: 5 }));
    await screen.findByRole('button', { name: /^unlike$/i });
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

describe('Search page', () => {
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

  it('renders the search page', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        user: createDemoUser(),
      }),
    );

    renderApp('/search');

    expect(
      await screen.findByRole('heading', {
        name: /find people worth following/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/search people/i)).toBeInTheDocument();
    expect(screen.getByText(/search is ready/i)).toBeInTheDocument();
  });

  it('does not call the search API for an empty query', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        user: createDemoUser(),
      }),
    );

    renderApp('/search');

    await screen.findByText(/search is ready/i);
    await new Promise((resolve) => {
      window.setTimeout(resolve, 350);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('/users/search'),
      expect.anything(),
    );
  });

  it('renders search results', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createDemoUser(),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          users: [createSearchUser()],
        }),
      );

    renderApp('/search');

    await screen.findByText(/search is ready/i);
    await user.type(screen.getByLabelText(/search people/i), 'kev');

    expect(await screen.findByText(/^Kevin$/i)).toBeInTheDocument();
    expect(screen.getByText(/@kevin/i)).toBeInTheDocument();
    expect(
      screen.getByText(/building the flock one slice at a time/i),
    ).toBeInTheDocument();
  });

  it('renders an empty results state', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createDemoUser(),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          users: [],
        }),
      );

    renderApp('/search');

    await screen.findByText(/search is ready/i);
    await user.type(screen.getByLabelText(/search people/i), 'nomatch');

    expect(await screen.findByText(/no results found/i)).toBeInTheDocument();
  });

  it('renders an error state', async () => {
    const user = userEvent.setup();
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
              message: 'Search failed.',
            },
          },
          500,
        ),
      );

    renderApp('/search');

    await screen.findByText(/search is ready/i);
    await user.type(screen.getByLabelText(/search people/i), 'demo');

    expect(
      await screen.findByText(/we could not load search results/i),
    ).toBeInTheDocument();
  });

  it('links each search result to the profile page', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createDemoUser(),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          users: [createSearchUser()],
        }),
      );

    renderApp('/search');

    await screen.findByText(/search is ready/i);
    await user.type(screen.getByLabelText(/search people/i), 'kevin');

    expect(await screen.findByRole('link', { name: /kevin/i })).toHaveAttribute(
      'href',
      '/profile/kevin',
    );
  });
});

describe('Profile page', () => {
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

  it('shows a loading state while the profile is fetching', async () => {
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
                user: createProfileUser(),
              }),
            );
          }, 50);
        }),
    );
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        tweets: [createProfileTweet()],
      }),
    );

    renderApp('/profile/demo');

    expect(await screen.findByText(/loading profile/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/shipping the flock one commit at a time/i),
    ).toBeInTheDocument();
  });

  it('renders profile info', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createDemoUser(),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createProfileUser(),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          tweets: [createProfileTweet()],
        }),
      );

    renderApp('/profile/demo');

    expect(await screen.findAllByText(/^Demo User$/i)).not.toHaveLength(0);
    expect(screen.getAllByText(/@demo/i).length).toBeGreaterThan(0);
    expect(
      await screen.findByText(/shipping the flock one commit at a time/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/^12$/i)).toBeInTheDocument();
    expect(screen.getByText(/^7$/i)).toBeInTheDocument();
    expect(screen.getByText(/^2$/i)).toBeInTheDocument();
  });

  it('does not show a follow button on your own profile', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createDemoUser(),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createProfileUser({
            id: 'user_demo',
          }),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          tweets: [createProfileTweet()],
        }),
      );

    renderApp('/profile/demo');

    await screen.findByText(/shipping the flock one commit at a time/i);
    expect(
      screen.queryByRole('button', { name: /follow|unfollow/i }),
    ).not.toBeInTheDocument();
  });

  it('renders a follow button for another profile', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createDemoUser(),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createProfileUser({
            id: 'user_kevin',
            username: 'kevin',
            name: 'Kevin',
          }),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          tweets: [createProfileTweet()],
        }),
      );

    renderApp('/profile/kevin');

    expect(
      await screen.findByRole('button', { name: /^follow$/i }),
    ).toBeInTheDocument();
  });

  it('follows another user successfully', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createDemoUser(),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createProfileUser({
            id: 'user_kevin',
            username: 'kevin',
            name: 'Kevin',
            followersCount: 12,
            isFollowing: false,
          }),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          tweets: [createProfileTweet()],
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          follow: {
            followerId: 'user_demo',
            followingId: 'user_kevin',
            createdAt: '2026-01-12T10:00:00.000Z',
          },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createProfileUser({
            id: 'user_kevin',
            username: 'kevin',
            name: 'Kevin',
            followersCount: 13,
            isFollowing: true,
          }),
        }),
      );

    renderApp('/profile/kevin');

    await userEvent.click(
      await screen.findByRole('button', { name: /^follow$/i }),
    );

    await screen.findByRole('button', { name: /^unfollow$/i });
    expect(screen.getByText(/^13$/i)).toBeInTheDocument();
  });

  it('unfollows another user successfully', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createDemoUser(),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createProfileUser({
            id: 'user_kevin',
            username: 'kevin',
            name: 'Kevin',
            followersCount: 13,
            isFollowing: true,
          }),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          tweets: [createProfileTweet()],
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          success: true,
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createProfileUser({
            id: 'user_kevin',
            username: 'kevin',
            name: 'Kevin',
            followersCount: 12,
            isFollowing: false,
          }),
        }),
      );

    renderApp('/profile/kevin');

    await userEvent.click(
      await screen.findByRole('button', { name: /^unfollow$/i }),
    );

    await screen.findByRole('button', { name: /^follow$/i });
    expect(screen.getByText(/^12$/i)).toBeInTheDocument();
  });

  it('disables the follow button while the mutation is pending', async () => {
    let resolveFollow: ((value: Response) => void) | undefined;
    const pendingFollow = new Promise<Response>((resolve) => {
      resolveFollow = resolve;
    });
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createDemoUser(),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createProfileUser({
            id: 'user_kevin',
            username: 'kevin',
            name: 'Kevin',
            isFollowing: false,
          }),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          tweets: [createProfileTweet()],
        }),
      )
      .mockImplementationOnce(() => pendingFollow)
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createProfileUser({
            id: 'user_kevin',
            username: 'kevin',
            name: 'Kevin',
            followersCount: 13,
            isFollowing: true,
          }),
        }),
      );

    renderApp('/profile/kevin');

    await userEvent.click(
      await screen.findByRole('button', { name: /^follow$/i }),
    );

    expect(
      await screen.findByRole('button', { name: /ing\.\.\.$/i }),
    ).toBeDisabled();

    resolveFollow?.(
      createJsonResponse({
        follow: {
          followerId: 'user_demo',
          followingId: 'user_kevin',
          createdAt: '2026-01-12T10:00:00.000Z',
        },
      }),
    );
    await screen.findByRole('button', { name: /^unfollow$/i });
  });

  it('shows a friendly message when follow mutation fails', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createDemoUser(),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createProfileUser({
            id: 'user_kevin',
            username: 'kevin',
            name: 'Kevin',
            isFollowing: false,
          }),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          tweets: [createProfileTweet()],
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse(
          {
            error: {
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Could not update follow state right now.',
            },
          },
          500,
        ),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createProfileUser({
            id: 'user_kevin',
            username: 'kevin',
            name: 'Kevin',
            isFollowing: false,
          }),
        }),
      );

    renderApp('/profile/kevin');

    await userEvent.click(
      await screen.findByRole('button', { name: /^follow$/i }),
    );

    expect(
      await screen.findByText(/could not update follow state right now/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^follow$/i })).toBeEnabled();
  });

  it('renders user tweets', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createDemoUser(),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createProfileUser(),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          tweets: [createProfileTweet()],
        }),
      );

    renderApp('/profile/demo');

    expect(
      await screen.findByText(/profile tweet from the backend/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/^3$/i)).toBeInTheDocument();
  });

  it('renders an empty tweets state', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createDemoUser(),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createProfileUser({
            tweetsCount: 0,
          }),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          tweets: [],
        }),
      );

    renderApp('/profile/demo');

    expect(await screen.findByText(/no tweets yet/i)).toBeInTheDocument();
  });

  it('renders an error state', async () => {
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
              code: 'USER_NOT_FOUND',
              message: 'User not found.',
            },
          },
          404,
        ),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          tweets: [],
        }),
      );

    renderApp('/profile/missing');

    expect(
      await screen.findByText(/we could not load this profile/i),
    ).toBeInTheDocument();
  });

  it('links profile counters to followers and following pages', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(createJsonResponse({ user: createDemoUser() }))
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createProfileUser(),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          tweets: [createProfileTweet()],
        }),
      );

    renderApp('/profile/demo');

    await screen.findByText(/shipping the flock one commit at a time/i);

    expect(screen.getByRole('link', { name: /following 7/i })).toHaveAttribute(
      'href',
      '/profile/demo/following',
    );
    expect(screen.getByRole('link', { name: /followers 12/i })).toHaveAttribute(
      'href',
      '/profile/demo/followers',
    );
  });
});

describe('Follow list pages', () => {
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

  it('renders followers page users', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(createJsonResponse({ user: createDemoUser() }))
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createProfileUser(),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          followers: [createFollowListUser()],
        }),
      );

    renderApp('/profile/demo/followers');

    expect(await screen.findByText(/^Grace Hopper$/i)).toBeInTheDocument();
    expect(screen.getByText(/@hopper/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /followers · 12/i }),
    ).toBeInTheDocument();
  });

  it('renders following page users', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(createJsonResponse({ user: createDemoUser() }))
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createProfileUser(),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          following: [
            createFollowListUser({ username: 'kevin', name: 'Kevin' }),
          ],
        }),
      );

    renderApp('/profile/demo/following');

    expect(await screen.findByText(/^Kevin$/i)).toBeInTheDocument();
    expect(screen.getByText(/@kevin/i)).toBeInTheDocument();
  });

  it('renders an empty state for followers', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(createJsonResponse({ user: createDemoUser() }))
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createProfileUser(),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          followers: [],
        }),
      );

    renderApp('/profile/demo/followers');

    expect(await screen.findByText(/no followers yet/i)).toBeInTheDocument();
  });

  it('renders an error state for following', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(createJsonResponse({ user: createDemoUser() }))
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createProfileUser(),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse(
          {
            error: {
              code: 'USER_NOT_FOUND',
              message: 'User not found.',
            },
          },
          404,
        ),
      );

    renderApp('/profile/missing/following');

    expect(
      await screen.findByText(/we could not load this list/i),
    ).toBeInTheDocument();
  });

  it('respects the initial limit parameter', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(createJsonResponse({ user: createDemoUser() }))
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createProfileUser(),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          followers: [createFollowListUser()],
        }),
      );

    renderApp('/profile/demo/followers');

    await screen.findByText(/^Grace Hopper$/i);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/users/demo/followers?limit=20',
      expect.any(Object),
    );
  });

  it('loads additional users by increasing the limit', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(createJsonResponse({ user: createDemoUser() }))
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createProfileUser({
            followersCount: 40,
          }),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          followers: Array.from({ length: 20 }, (_, index) =>
            createFollowListUser({
              id: `user_follow_${index}`,
              username: `user${index}`,
              name: `User ${index}`,
            }),
          ),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          followers: Array.from({ length: 40 }, (_, index) =>
            createFollowListUser({
              id: `user_follow_${index}`,
              username: `user${index}`,
              name: `User ${index}`,
            }),
          ),
        }),
      );

    renderApp('/profile/demo/followers');

    expect(await screen.findByText(/^User 19$/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /load more/i }));

    expect(await screen.findByText(/^User 39$/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/users/demo/followers?limit=40',
      expect.any(Object),
    );
  });

  it('profile counters navigate to the correct page', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(createJsonResponse({ user: createDemoUser() }))
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createProfileUser(),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          tweets: [createProfileTweet()],
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          user: createProfileUser(),
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          followers: [createFollowListUser()],
        }),
      );

    renderApp('/profile/demo');

    await userEvent.click(
      await screen.findByRole('link', { name: /followers 12/i }),
    );

    expect(await screen.findByText(/^Grace Hopper$/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /followers · 12/i }),
    ).toBeInTheDocument();
  });
});
