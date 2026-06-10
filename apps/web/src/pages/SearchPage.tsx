import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { CompactFollowButton } from '../components/CompactFollowButton';
import { PublicUserCard } from '../components/PublicUserCard';
import { ApiError } from '../lib/api';
import {
  followUserRequest,
  unfollowUserRequest,
} from '../modules/follows/follow-api';
import { PageShell } from '../components/PageShell';
import { useAuth } from '../modules/auth/use-auth';
import { searchUsersRequest } from '../modules/search/search-api';
import type { SearchUser } from '../modules/search/search.types';

const SEARCH_DEBOUNCE_MS = 300;

export const SearchPage = () => {
  const { currentUser, token } = useAuth();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [followErrorByUserId, setFollowErrorByUserId] = useState<
    Record<string, string | null>
  >({});
  const trimmedQuery = query.trim();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(trimmedQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [trimmedQuery]);

  const searchQuery = useQuery({
    queryKey: ['user-search', debouncedQuery],
    queryFn: () => searchUsersRequest(token!, debouncedQuery),
    enabled: Boolean(token) && debouncedQuery.length > 0,
    retry: false,
  });

  const users = searchQuery.data?.users ?? [];
  const showIdleState = debouncedQuery.length === 0;
  const showEmptyState =
    debouncedQuery.length > 0 &&
    !searchQuery.isPending &&
    !searchQuery.isError &&
    users.length === 0;
  const summaryText = useMemo(() => {
    if (showIdleState) {
      return '';
    }

    if (searchQuery.isPending) {
      return `Searching for "${debouncedQuery}"...`;
    }

    if (searchQuery.isError) {
      return 'We could not search right now. Please try again.';
    }

    if (showEmptyState) {
      return `No users matched "${debouncedQuery}".`;
    }

    return `${users.length} result${users.length === 1 ? '' : 's'} for "${debouncedQuery}".`;
  }, [
    debouncedQuery,
    searchQuery.isError,
    searchQuery.isPending,
    showEmptyState,
    showIdleState,
    users.length,
  ]);

  const followMutation = useMutation({
    mutationFn: async ({
      isFollowing,
      userId,
    }: {
      isFollowing: boolean;
      userId: string;
    }) => {
      if (!token) {
        throw new Error('Authentication is required.');
      }

      if (isFollowing) {
        return unfollowUserRequest(token, userId);
      }

      return followUserRequest(token, userId);
    },
    onMutate: async ({ isFollowing, userId }) => {
      setFollowErrorByUserId((current) => ({
        ...current,
        [userId]: null,
      }));

      await queryClient.cancelQueries({
        queryKey: ['user-search', debouncedQuery],
      });

      const previousResults = queryClient.getQueryData<{ users: SearchUser[] }>(
        ['user-search', debouncedQuery],
      );

      queryClient.setQueryData<{ users: SearchUser[] }>(
        ['user-search', debouncedQuery],
        (current) => {
          if (!current) {
            return current;
          }

          return {
            users: current.users.map((user) =>
              user.id === userId
                ? {
                    ...user,
                    isFollowing: !isFollowing,
                  }
                : user,
            ),
          };
        },
      );

      return {
        previousResults,
        userId,
      };
    },
    onError: (error, _variables, context) => {
      if (context?.previousResults) {
        queryClient.setQueryData(
          ['user-search', debouncedQuery],
          context.previousResults,
        );
      }

      if (context?.userId) {
        setFollowErrorByUserId((current) => ({
          ...current,
          [context.userId]:
            error instanceof ApiError
              ? error.message
              : 'We could not update follow state right now.',
        }));
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: ['user-search', debouncedQuery],
      });
    },
  });

  return (
    <PageShell
      eyebrow="Search"
      title="Find people worth following."
      description="Find people to follow and grow your network."
      aside={
        <div className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            Search tips
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <li>Search by name or username to find people.</li>
            <li>Results update as you type.</li>
            <li>
              Follow interesting people directly from search results.
            </li>
          </ul>
        </div>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-800">
            Search people
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            placeholder="Search by name or username"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          />
        </label>

        {debouncedQuery.length > 0 &&
        !showEmptyState &&
        !searchQuery.isError ? (
          <div className="flex min-h-6 items-center px-1">
            {searchQuery.isPending ? (
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Searching...
              </p>
            ) : (
              <p className="text-sm text-slate-600">{summaryText}</p>
            )}
          </div>
        ) : null}

        {searchQuery.isError ? (
          <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm font-semibold text-rose-700">
              We could not load search results.
            </p>
            <p className="mt-2 text-sm text-rose-600">
              Please try a different query or try again in a moment.
            </p>
          </div>
        ) : null}

        {showEmptyState ? (
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">
              No results found.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Try a different name or username.
            </p>
          </div>
        ) : null}

        {users.length > 0 ? (
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="space-y-2">
                <PublicUserCard
                  user={user as SearchUser}
                  action={
                    currentUser && currentUser.id !== user.id ? (
                      <CompactFollowButton
                        isFollowing={user.isFollowing}
                        isPending={
                          followMutation.isPending &&
                          followMutation.variables?.userId === user.id
                        }
                        onClick={() => {
                          followMutation.mutate({
                            isFollowing: user.isFollowing,
                            userId: user.id,
                          });
                        }}
                      />
                    ) : null
                  }
                />
                {followErrorByUserId[user.id] ? (
                  <p className="px-2 text-sm text-rose-600">
                    {followErrorByUserId[user.id]}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </PageShell>
  );
};
