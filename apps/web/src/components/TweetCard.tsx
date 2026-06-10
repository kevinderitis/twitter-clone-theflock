import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { ApiError } from '../lib/api';
import {
  unlikeTweetRequest,
  likeTweetRequest,
} from '../modules/likes/like-api';
import { useAuth } from '../modules/auth/use-auth';
import type {
  TimelineResponse,
  TimelineTweet,
} from '../modules/timeline/timeline.types';

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

const updateTimelineTweet = (
  data: InfiniteData<TimelineResponse, string | undefined> | undefined,
  tweetId: string,
  updater: (tweet: TimelineTweet) => TimelineTweet,
) => {
  if (!data) {
    return data;
  }

  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      tweets: page.tweets.map((tweet) =>
        tweet.id === tweetId ? updater(tweet) : tweet,
      ),
    })),
  };
};

export const TweetCard = ({ tweet }: { tweet: TimelineTweet }) => {
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
        queryKey: ['timeline'],
      });

      const previousTimeline = queryClient.getQueryData<
        InfiniteData<TimelineResponse, string | undefined>
      >(['timeline']);

      queryClient.setQueryData<
        InfiniteData<TimelineResponse, string | undefined>
      >(['timeline'], (current) =>
        updateTimelineTweet(current, tweet.id, (currentTweet) => {
          const currentLikesCount = currentTweet.likesCount ?? 0;
          const currentLikedByMe = currentTweet.likedByMe ?? false;

          return {
            ...currentTweet,
            likedByMe: !currentLikedByMe,
            likesCount: currentLikedByMe
              ? Math.max(0, currentLikesCount - 1)
              : currentLikesCount + 1,
          };
        }),
      );

      return {
        previousTimeline,
      };
    },
    onError: (error, _variables, context) => {
      if (context?.previousTimeline) {
        queryClient.setQueryData(['timeline'], context.previousTimeline);
      }

      setMutationMessage(
        error instanceof ApiError
          ? error.message
          : 'We could not update your like right now.',
      );
    },
    onSuccess: (response) => {
      queryClient.setQueryData<
        InfiniteData<TimelineResponse, string | undefined>
      >(['timeline'], (current) =>
        updateTimelineTweet(current, tweet.id, (currentTweet) => ({
          ...currentTweet,
          likedByMe: !likedByMe,
          likesCount: response.likesCount,
        })),
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: ['timeline'],
      });
    },
  });

  return (
    <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <Link
          to={`/profile/${tweet.author.username}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-sm font-semibold text-brand-700 hover:opacity-80"
        >
          {tweet.author.avatarUrl ? (
            <img
              src={tweet.author.avatarUrl}
              alt={`${tweet.author.name} avatar`}
              className="h-full w-full rounded-2xl object-cover"
            />
          ) : (
            getInitials(tweet.author.name)
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              to={`/profile/${tweet.author.username}`}
              className="text-sm font-semibold text-slate-950 hover:text-brand-600 hover:underline"
            >
              {tweet.author.name}
            </Link>
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
