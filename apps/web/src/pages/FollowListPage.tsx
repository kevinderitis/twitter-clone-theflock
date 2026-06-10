import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { PageShell } from '../components/PageShell';
import { useAuth } from '../modules/auth/use-auth';
import {
  getFollowersRequest,
  getFollowingRequest,
} from '../modules/follows/follow-list-api';
import type {
  FollowersResponse,
  FollowListUser,
  FollowingResponse,
} from '../modules/follows/follow-list.types';

const INITIAL_LIMIT = 20;
const MAX_LIMIT = 50;

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const FollowUserCard = ({ user }: { user: FollowListUser }) => (
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

export const FollowListPage = ({
  mode,
}: {
  mode: 'followers' | 'following';
}) => {
  const { username } = useParams();
  const { token } = useAuth();
  const [limit, setLimit] = useState(INITIAL_LIMIT);
  const resolvedUsername = username?.trim() ?? '';

  const followListQuery = useQuery<FollowersResponse | FollowingResponse>({
    queryKey: ['profile', mode, resolvedUsername, limit],
    queryFn: async () => {
      if (mode === 'followers') {
        return getFollowersRequest(token!, resolvedUsername, limit);
      }

      return getFollowingRequest(token!, resolvedUsername, limit);
    },
    enabled: Boolean(token) && resolvedUsername.length > 0,
    retry: false,
  });

  const users = useMemo(() => {
    const data = followListQuery.data;

    if (!data) {
      return [] as FollowListUser[];
    }

    if (mode === 'followers' && 'followers' in data) {
      return data.followers;
    }

    if (mode === 'following' && 'following' in data) {
      return data.following;
    }

    return [] as FollowListUser[];
  }, [followListQuery.data, mode]);

  const canLoadMore = users.length === limit && limit < MAX_LIMIT;
  const title = mode === 'followers' ? 'Followers' : 'Following';
  const showEmptyState =
    !followListQuery.isPending &&
    !followListQuery.isError &&
    users.length === 0;

  return (
    <PageShell
      eyebrow="Connections"
      title={`${title} for @${resolvedUsername || 'user'}`}
      description={`Public ${mode} list for @${resolvedUsername || 'user'} using the existing backend endpoint and incremental limit loading.`}
      aside={
        <div className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            List behavior
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <li>Starts with 20 users.</li>
            <li>Load more increases the requested limit up to 50.</li>
            <li>Cards stay public and profile-focused in this slice.</li>
          </ul>
        </div>
      }
    >
      <div className="space-y-4">
        {followListQuery.isPending ? (
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">
              Loading {mode}...
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Fetching public user cards for this profile.
            </p>
          </div>
        ) : null}

        {followListQuery.isError ? (
          <div className="rounded-[1.75rem] border border-rose-200 bg-rose-50 p-5">
            <p className="text-sm font-semibold text-rose-700">
              We could not load this list.
            </p>
            <p className="mt-2 text-sm text-rose-600">
              Try refreshing the page or returning to the profile.
            </p>
          </div>
        ) : null}

        {showEmptyState ? (
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">
              No {mode} yet.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              This list is still empty for now.
            </p>
          </div>
        ) : null}

        {users.length > 0 ? (
          <div className="space-y-3">
            {users.map((user) => (
              <FollowUserCard key={user.id} user={user} />
            ))}
          </div>
        ) : null}

        {canLoadMore ? (
          <button
            type="button"
            onClick={() => {
              setLimit((current) => Math.min(current + 20, MAX_LIMIT));
            }}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Load more
          </button>
        ) : null}
      </div>
    </PageShell>
  );
};
