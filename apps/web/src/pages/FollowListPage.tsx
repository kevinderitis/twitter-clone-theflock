import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { CompactFollowButton } from '../components/CompactFollowButton';
import { PageShell } from '../components/PageShell';
import { PublicUserCard } from '../components/PublicUserCard';
import { ApiError } from '../lib/api';
import { useAuth } from '../modules/auth/use-auth';
import {
  getFollowersRequest,
  getFollowingRequest,
} from '../modules/follows/follow-list-api';
import {
  followUserRequest,
  unfollowUserRequest,
} from '../modules/follows/follow-api';
import { getProfileRequest } from '../modules/profile/profile-api';
import type { ProfileResponse } from '../modules/profile/profile.types';
import type {
  FollowersResponse,
  FollowListUser,
  FollowingResponse,
} from '../modules/follows/follow-list.types';

const INITIAL_LIMIT = 20;
const MAX_LIMIT = 50;

const FollowListAction = ({ user }: { user: FollowListUser }) => {
  const { currentUser, token } = useAuth();
  const queryClient = useQueryClient();
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const profileQuery = useQuery<ProfileResponse>({
    queryKey: ['profile', user.username],
    queryFn: () => getProfileRequest(token!, user.username),
    enabled: Boolean(token) && currentUser?.id !== user.id,
    retry: false,
  });

  const followMutation = useMutation({
    mutationFn: async (isFollowing: boolean) => {
      if (!token) {
        throw new Error('Authentication is required.');
      }

      if (isFollowing) {
        return unfollowUserRequest(token, user.id);
      }

      return followUserRequest(token, user.id);
    },
    onMutate: async (isFollowing) => {
      setSubmissionError(null);
      await queryClient.cancelQueries({
        queryKey: ['profile', user.username],
      });

      const previousProfile = queryClient.getQueryData<ProfileResponse>([
        'profile',
        user.username,
      ]);

      queryClient.setQueryData<ProfileResponse>(
        ['profile', user.username],
        (current) => {
          if (!current) {
            return current;
          }

          return {
            user: {
              ...current.user,
              isFollowing: !isFollowing,
              followersCount: isFollowing
                ? Math.max(0, current.user.followersCount - 1)
                : current.user.followersCount + 1,
            },
          };
        },
      );

      return {
        previousProfile,
      };
    },
    onError: (error, _variables, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(
          ['profile', user.username],
          context.previousProfile,
        );
      }

      setSubmissionError(
        error instanceof ApiError
          ? error.message
          : 'We could not update follow state right now.',
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: ['profile', user.username],
      });
    },
  });

  if (!currentUser || currentUser.id === user.id) {
    return null;
  }

  const isFollowing = profileQuery.data?.user.isFollowing ?? false;

  return (
    <div className="space-y-2">
      <CompactFollowButton
        isFollowing={isFollowing}
        isPending={followMutation.isPending}
        testId={`follow-list-toggle-${user.username}`}
        onClick={() => {
          followMutation.mutate(isFollowing);
        }}
      />
      {submissionError ? (
        <p className="max-w-28 text-right text-xs text-rose-600">
          {submissionError}
        </p>
      ) : null}
    </div>
  );
};

export const FollowListPage = ({
  mode,
}: {
  mode: 'followers' | 'following';
}) => {
  const { username } = useParams();
  const { token } = useAuth();
  const [limit, setLimit] = useState(INITIAL_LIMIT);
  const resolvedUsername = username?.trim() ?? '';
  const profileQuery = useQuery<ProfileResponse>({
    queryKey: ['profile', resolvedUsername],
    queryFn: () => getProfileRequest(token!, resolvedUsername),
    enabled: Boolean(token) && resolvedUsername.length > 0,
    retry: false,
  });

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
  const totalCount =
    mode === 'followers'
      ? profileQuery.data?.user.followersCount
      : profileQuery.data?.user.followingCount;
  const showEmptyState =
    !followListQuery.isPending &&
    !followListQuery.isError &&
    users.length === 0;

  return (
    <PageShell
      eyebrow="Connections"
      title={`${title}${typeof totalCount === 'number' ? ` · ${totalCount}` : ''}`}
      description={`Public ${mode} list for @${resolvedUsername || 'user'} with profile counts and incremental limit loading.`}
      aside={
        <div className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            Connection summary
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link
              to={`/profile/${resolvedUsername}/followers`}
              className={`rounded-[1.5rem] border px-4 py-4 text-left transition ${
                mode === 'followers'
                  ? 'border-brand-200 bg-brand-50'
                  : 'border-slate-200 bg-slate-50 hover:border-brand-200'
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Followers
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {profileQuery.data?.user.followersCount ?? '...'}
              </p>
            </Link>
            <Link
              to={`/profile/${resolvedUsername}/following`}
              className={`rounded-[1.5rem] border px-4 py-4 text-left transition ${
                mode === 'following'
                  ? 'border-brand-200 bg-brand-50'
                  : 'border-slate-200 bg-slate-50 hover:border-brand-200'
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Following
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {profileQuery.data?.user.followingCount ?? '...'}
              </p>
            </Link>
          </div>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <li>Browse who this user follows and who follows them.</li>
            <li>Click &ldquo;Load more&rdquo; to see more people.</li>
            <li>Follow new people to build your network.</li>
          </ul>
        </div>
      }
    >
      <div className="space-y-4" data-testid={`follow-list-page-${mode}`}>
        <Link
          to={`/profile/${resolvedUsername}`}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:bg-slate-200"
        >
          &larr; Back to profile
        </Link>

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
          <div
            className="space-y-3"
            data-testid={`follow-list-results-${mode}`}
          >
            {users.map((user) => (
              <PublicUserCard
                key={user.id}
                user={user as FollowListUser}
                testId={`follow-list-user-${user.username}`}
                action={<FollowListAction user={user} />}
              />
            ))}
          </div>
        ) : null}

        {canLoadMore ? (
          <button
            type="button"
            data-testid={`follow-list-load-more-${mode}`}
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
