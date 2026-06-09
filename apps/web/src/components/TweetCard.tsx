import type { TimelineTweet } from '../modules/timeline/timeline.types';

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

export const TweetCard = ({ tweet }: { tweet: TimelineTweet }) => {
  return (
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

          {typeof tweet.likesCount === 'number' ? (
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              <span>Likes</span>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">
                {tweet.likesCount}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
};
