import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { PageShell } from '../components/PageShell';
import { useAuth } from '../modules/auth/use-auth';
import { searchUsersRequest } from '../modules/search/search-api';
import type { SearchUser } from '../modules/search/search.types';

const SEARCH_DEBOUNCE_MS = 300;

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const SearchResultCard = ({ user }: { user: SearchUser }) => (
  <Link
    to={`/profile/${user.username}`}
    className="block rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-200 hover:shadow-md"
  >
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-sm font-semibold text-brand-700">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={`${user.name} avatar`}
            className="h-full w-full rounded-2xl object-cover"
          />
        ) : (
          getInitials(user.name)
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-950">{user.name}</p>
        <p className="mt-1 text-sm text-slate-500">@{user.username}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {user.bio ?? 'No bio yet.'}
        </p>
      </div>
    </div>
  </Link>
);

export const SearchPage = () => {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
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
      return 'Start typing to search people by name or username.';
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

  return (
    <PageShell
      eyebrow="Search"
      title="Find people worth following."
      description="This slice connects the user search page to the backend with a small, mobile-first discovery flow."
      aside={
        <div className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            Search tips
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <li>Search waits 300ms before querying the backend.</li>
            <li>Results stay intentionally lightweight and public-only.</li>
            <li>Profile details and follow actions stay out of this slice.</li>
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

        <div className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50 px-4 py-3">
          <p className="text-sm text-slate-600">{summaryText}</p>
        </div>

        {searchQuery.isPending ? (
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">
              Loading results...
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Looking up users in the flock.
            </p>
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

        {showIdleState ? (
          <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white/70 p-6 text-center">
            <p className="text-sm font-semibold text-slate-900">
              Search is ready.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Try searching for demo, kevin, or another seeded username.
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
              <SearchResultCard key={user.id} user={user} />
            ))}
          </div>
        ) : null}
      </div>
    </PageShell>
  );
};
