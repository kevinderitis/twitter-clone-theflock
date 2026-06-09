import { useInfiniteQuery } from '@tanstack/react-query';

import { TweetCard } from '../components/TweetCard';
import { TweetComposer } from '../components/TweetComposer';
import { PageShell } from '../components/PageShell';
import { useAuth } from '../modules/auth/use-auth';
import { getTimelinePageRequest } from '../modules/timeline/timeline-api';

export const TimelinePage = () => {
  const { token } = useAuth();

  const timelineQuery = useInfiniteQuery({
    queryKey: ['timeline'],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => getTimelinePageRequest(token!, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: Boolean(token),
    retry: false,
  });

  const tweets = timelineQuery.data?.pages.flatMap((page) => page.tweets) ?? [];
  const hasTweets = tweets.length > 0;

  return (
    <PageShell
      eyebrow="Home"
      title="Your followed timeline."
      description="This first real feed slice reads authenticated timeline data from the backend, with a simple mobile-first reading flow."
      aside={
        <div className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            Feed status
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <li>Seed data gives the timeline realistic follow activity.</li>
            <li>
              Pagination is cursor-based through the existing backend API.
            </li>
            <li>Tweet creation stays intentionally out of this slice.</li>
          </ul>
        </div>
      }
    >
      <div className="space-y-4">
        <TweetComposer />

        {timelineQuery.isPending ? (
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">
              Loading timeline...
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Fetching the latest tweets from people you follow.
            </p>
          </div>
        ) : null}

        {timelineQuery.isError ? (
          <div className="rounded-[1.75rem] border border-rose-200 bg-rose-50 p-5">
            <p className="text-sm font-semibold text-rose-700">
              We could not load your timeline.
            </p>
            <p className="mt-2 text-sm text-rose-600">
              Try refreshing the page or signing in again.
            </p>
          </div>
        ) : null}

        {!timelineQuery.isPending && !timelineQuery.isError && !hasTweets ? (
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">
              Your timeline is empty.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Follow a few people to start seeing tweets here.
            </p>
          </div>
        ) : null}

        {hasTweets ? (
          <div className="space-y-4">
            {tweets.map((tweet) => (
              <TweetCard key={tweet.id} tweet={tweet} />
            ))}
          </div>
        ) : null}

        {timelineQuery.hasNextPage ? (
          <button
            type="button"
            onClick={() => {
              void timelineQuery.fetchNextPage();
            }}
            disabled={timelineQuery.isFetchingNextPage}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {timelineQuery.isFetchingNextPage ? 'Loading more...' : 'Load more'}
          </button>
        ) : null}
      </div>
    </PageShell>
  );
};
