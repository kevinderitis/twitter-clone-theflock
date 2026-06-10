import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { PageShell } from '../components/PageShell';
import { ApiError } from '../lib/api';
import { useAuth } from '../modules/auth/use-auth';
import {
  followUserRequest,
  unfollowUserRequest,
} from '../modules/follows/follow-api';
import {
  unlikeTweetRequest,
  likeTweetRequest,
} from '../modules/likes/like-api';
import {
  getProfileRequest,
  getProfileTweetsRequest,
} from '../modules/profile/profile-api';
import type {
  ProfileTweet,
  ProfileUser,
} from '../modules/profile/profile.types';

const formatTweetDate = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const ProfileStat = ({
  href,
  label,
  value,
}: {
  href?: string;
  label: string;
  value: number;
}) => {
  const className =
    'rounded-[1.5rem] border border-slate-200 bg-slate-50 p-3 sm:p-4 transition';

  if (href) {
    return (
      <Link
        to={href}
        className={`${className} block hover:border-brand-200 hover:bg-brand-50/40`}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          {label}
        </p>
        <p className="mt-2 text-xl font-semibold text-slate-950 sm:mt-3 sm:text-2xl">
          {value}
        </p>
      </Link>
    );
  }

  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold text-slate-950 sm:mt-3 sm:text-2xl">
        {value}
      </p>
    </div>
  );
};

const ProfileTweetCard = ({
  tweet,
  profileUsername,
}: {
  tweet: ProfileTweet;
  profileUsername: string;
}) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [mutationMessage, setMutationMessage] = useState<string | null>(null);
  const likesCount = tweet.likesCount ?? 0;
  const likedByMe = tweet.likedByMe ?? false;

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error('Authentication is required.');
      }

      return likedByMe
        ? unlikeTweetRequest(token, tweet.id)
        : likeTweetRequest(token, tweet.id);
    },
    onMutate: async () => {
      setMutationMessage(null);
      await queryClient.cancelQueries({
        queryKey: ['profile', 'tweets', profileUsername],
      });

      const previousTweets = queryClient.getQueryData<
        { tweets: ProfileTweet[] }
      >(['profile', 'tweets', profileUsername]);

      queryClient.setQueryData<
        { tweets: ProfileTweet[] }
      >(['profile', 'tweets', profileUsername], (current) => {
        if (!current) {
          return current;
        }

        return {
          tweets: current.tweets.map((t) => {
            if (t.id !== tweet.id) {
              return t;
            }

            const currentLikedByMe = t.likedByMe ?? false;
            const currentLikesCount = t.likesCount ?? 0;

            return {
              ...t,
              likedByMe: !currentLikedByMe,
              likesCount: currentLikedByMe
                ? Math.max(0, currentLikesCount - 1)
                : currentLikesCount + 1,
            };
          }),
        };
      });

      return { previousTweets };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTweets) {
        queryClient.setQueryData(
          ['profile', 'tweets', profileUsername],
          context.previousTweets,
        );
      }

      setMutationMessage(
        'We could not update your like right now.',
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: ['profile', 'tweets', profileUsername],
      });
    },
  });

  return (
    <article
      className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm"
      data-testid={`profile-tweet-${tweet.id}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-sm font-semibold text-brand-700">
          {tweet.author.avatarUrl ? (
            <img
              src={tweet.author.avatarUrl}
              alt={`${tweet.author.name} avatar`}
              className="h-full w-full rounded-2xl object-cover"
            />
          ) : (
            getInitials(tweet.author.name)
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-sm font-semibold text-slate-950">
              {tweet.author.name}
            </p>
            <p className="text-sm text-slate-500">@{tweet.author.username}</p>
            <span className="text-xs text-slate-400">
              {formatTweetDate(tweet.createdAt)}
            </span>
          </div>

          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {tweet.content}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                likeMutation.mutate();
              }}
              disabled={likeMutation.isPending}
              aria-pressed={likedByMe}
              className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                likedByMe
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              } disabled:cursor-not-allowed disabled:opacity-70`}
            >
              {likeMutation.isPending
                ? likedByMe
                  ? 'Unliking...'
                  : 'Liking...'
                : likedByMe
                  ? 'Unlike'
                  : 'Like'}
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              <span>Likes</span>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">
                {likesCount}
              </span>
            </div>
          </div>

          {mutationMessage ? (
            <p className="mt-3 text-sm text-rose-600">{mutationMessage}</p>
          ) : null}
        </div>
      </div>
    </article>
  );
};

const ProfileSummaryCard = ({
  currentUserId,
  followError,
  isFollowPending,
  onToggleFollow,
  user,
}: {
  currentUserId?: string;
  followError: string | null;
  isFollowPending: boolean;
  onToggleFollow: () => void;
  user: ProfileUser;
}) => (
  <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-brand-100 text-lg font-semibold text-brand-700">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={`${user.name} avatar`}
              className="h-full w-full rounded-[1.5rem] object-cover"
            />
          ) : (
            getInitials(user.name)
          )}
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-slate-950">{user.name}</h3>
          <p className="text-sm text-slate-500">@{user.username}</p>
        </div>
      </div>
      {currentUserId && currentUserId !== user.id ? (
        <button
          type="button"
          onClick={onToggleFollow}
          disabled={isFollowPending}
          data-testid="profile-follow-toggle"
          className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
            user.isFollowing
              ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
              : 'bg-brand-500 text-white shadow-lg shadow-brand-500/20 hover:bg-brand-600'
          } disabled:cursor-not-allowed disabled:opacity-70`}
        >
          {isFollowPending
            ? user.isFollowing
              ? 'Unfollowing...'
              : 'Following...'
            : user.isFollowing
              ? 'Unfollow'
              : 'Follow'}
        </button>
      ) : null}
    </div>

    <p className="mt-4 text-sm leading-6 text-slate-600">
      {user.bio ?? 'No bio yet.'}
    </p>

    {followError ? (
      <p className="mt-3 text-sm text-rose-600">{followError}</p>
    ) : null}
  </section>
);

export const ProfilePage = () => {
  const { username } = useParams();
  const { currentUser, token } = useAuth();
  const queryClient = useQueryClient();
  const [followError, setFollowError] = useState<string | null>(null);
  const resolvedUsername = username?.trim() ?? '';
  const profileQueryKey = ['profile', resolvedUsername] as const;

  const profileQuery = useQuery({
    queryKey: profileQueryKey,
    queryFn: () => getProfileRequest(token!, resolvedUsername),
    enabled: Boolean(token) && resolvedUsername.length > 0,
    retry: false,
  });

  const tweetsQuery = useQuery({
    queryKey: ['profile', 'tweets', resolvedUsername],
    queryFn: () => getProfileTweetsRequest(token!, resolvedUsername),
    enabled: Boolean(token) && resolvedUsername.length > 0,
    retry: false,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!token || !profileQuery.data?.user) {
        throw new Error('Authentication is required.');
      }

      return profileQuery.data.user.isFollowing
        ? unfollowUserRequest(token, profileQuery.data.user.id)
        : followUserRequest(token, profileQuery.data.user.id);
    },
    onMutate: async () => {
      setFollowError(null);
      await queryClient.cancelQueries({
        queryKey: profileQueryKey,
      });

      const previousProfile = queryClient.getQueryData<{ user: ProfileUser }>(
        profileQueryKey,
      );

      queryClient.setQueryData<{ user: ProfileUser }>(
        profileQueryKey,
        (current) => {
          if (!current) {
            return current;
          }

          return {
            user: {
              ...current.user,
              isFollowing: !current.user.isFollowing,
              followersCount: current.user.isFollowing
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
        queryClient.setQueryData(profileQueryKey, context.previousProfile);
      }

      setFollowError(
        error instanceof ApiError
          ? error.message
          : 'We could not update the follow state right now.',
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: profileQueryKey,
      });
    },
  });

  const isLoading = profileQuery.isPending || tweetsQuery.isPending;
  const isError = profileQuery.isError || tweetsQuery.isError;
  const tweets = tweetsQuery.data?.tweets ?? [];
  const showEmptyTweets =
    !isLoading && !isError && profileQuery.data && tweets.length === 0;

  return (
    <PageShell
      aside={
        <div className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            About profiles
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <li>Follow users to see their posts in your timeline.</li>
            <li>Like and reply to posts to join the conversation.</li>
            <li>Your profile shows your posts and the people you follow.</li>
          </ul>
        </div>
      }
    >
      <div data-testid="profile-page">
        {!isLoading && !isError && profileQuery.data?.user ? (
          <div
            className="sticky top-0 z-10 space-y-4 rounded-[1.75rem] border-b border-slate-200 bg-white"
            data-testid="profile-summary"
          >
            <ProfileSummaryCard
              currentUserId={currentUser?.id}
              followError={followError}
              isFollowPending={followMutation.isPending}
              onToggleFollow={() => {
                followMutation.mutate();
              }}
              user={profileQuery.data.user}
            />

            <section className="grid grid-cols-3 gap-2 sm:gap-3">
              <ProfileStat
                label="Tweets"
                value={profileQuery.data.user.tweetsCount}
              />
              <ProfileStat
                label="Following"
                href={`/profile/${profileQuery.data.user.username}/following`}
                value={profileQuery.data.user.followingCount}
              />
              <ProfileStat
                label="Followers"
                href={`/profile/${profileQuery.data.user.username}/followers`}
                value={profileQuery.data.user.followersCount}
              />
            </section>
          </div>
        ) : null}

        <div className={`space-y-4${!isLoading && !isError && profileQuery.data?.user ? ' mt-4' : ''}`}>
          {isLoading ? (
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">
                Loading profile...
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Fetching public profile details and tweets.
              </p>
            </div>
          ) : null}

          {isError ? (
            <div className="rounded-[1.75rem] border border-rose-200 bg-rose-50 p-5">
              <p className="text-sm font-semibold text-rose-700">
                We could not load this profile.
              </p>
              <p className="mt-2 text-sm text-rose-600">
                Try refreshing the page or searching for another user.
              </p>
            </div>
          ) : null}

          {showEmptyTweets ? (
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">
                No tweets yet.
              </p>
              <p className="mt-2 text-sm text-slate-600">
                This user has not posted anything yet.
              </p>
            </div>
          ) : null}

          {tweets.length > 0 && !isLoading && !isError ? (
            <div className="space-y-4" data-testid="profile-tweets">
              {tweets.map((tweet) => (
                <ProfileTweetCard key={tweet.id} tweet={tweet} profileUsername={resolvedUsername} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </PageShell>
  );
};
