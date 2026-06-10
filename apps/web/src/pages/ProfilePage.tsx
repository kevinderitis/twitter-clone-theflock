import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { PageShell } from '../components/PageShell';
import { useAuth } from '../modules/auth/use-auth';
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

const ProfileStat = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
      {label}
    </p>
    <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
  </div>
);

const ProfileTweetCard = ({ tweet }: { tweet: ProfileTweet }) => (
  <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
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

        <div className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          <span>Likes</span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">
            {tweet.likesCount}
          </span>
        </div>
      </div>
    </div>
  </article>
);

const ProfileSummaryCard = ({ user }: { user: ProfileUser }) => (
  <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
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

    <p className="mt-4 text-sm leading-6 text-slate-600">
      {user.bio ?? 'No bio yet.'}
    </p>
  </section>
);

export const ProfilePage = () => {
  const { username } = useParams();
  const { token } = useAuth();
  const resolvedUsername = username?.trim() ?? '';

  const profileQuery = useQuery({
    queryKey: ['profile', resolvedUsername],
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

  const isLoading = profileQuery.isPending || tweetsQuery.isPending;
  const isError = profileQuery.isError || tweetsQuery.isError;
  const tweets = tweetsQuery.data?.tweets ?? [];
  const showEmptyTweets =
    !isLoading && !isError && profileQuery.data && tweets.length === 0;

  const description = useMemo(() => {
    if (profileQuery.data?.user) {
      return `Public profile, counts, and recent tweets for @${profileQuery.data.user.username}.`;
    }

    return `Public profile, counts, and recent tweets for @${resolvedUsername || 'user'}.`;
  }, [profileQuery.data, resolvedUsername]);

  return (
    <PageShell
      eyebrow="Profile"
      title={`@${resolvedUsername || 'user'}`}
      description={description}
      aside={
        <div className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            Profile notes
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <li>Counts are fetched from the new profile summary endpoint.</li>
            <li>Tweet history reuses the existing public read API.</li>
            <li>Follow actions stay out of this slice on purpose.</li>
          </ul>
        </div>
      }
    >
      <div className="space-y-4">
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

        {profileQuery.data?.user && !isLoading && !isError ? (
          <>
            <ProfileSummaryCard user={profileQuery.data.user} />

            <section className="grid gap-3 sm:grid-cols-3">
              <ProfileStat
                label="Tweets"
                value={profileQuery.data.user.tweetsCount}
              />
              <ProfileStat
                label="Following"
                value={profileQuery.data.user.followingCount}
              />
              <ProfileStat
                label="Followers"
                value={profileQuery.data.user.followersCount}
              />
            </section>
          </>
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
          <div className="space-y-4">
            {tweets.map((tweet) => (
              <ProfileTweetCard key={tweet.id} tweet={tweet} />
            ))}
          </div>
        ) : null}
      </div>
    </PageShell>
  );
};
