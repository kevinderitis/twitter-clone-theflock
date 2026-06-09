import { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import type {
  TimelinePage,
  TimelineQuery,
  TimelineStore,
} from './timeline.types.js';

const tweetSelect = {
  id: true,
  content: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: {
      id: true,
      username: true,
      name: true,
      avatarUrl: true,
    },
  },
} satisfies Prisma.TweetSelect;

type PrismaTweet = Prisma.TweetGetPayload<{
  select: typeof tweetSelect;
}>;

const toTimelinePage = (tweets: PrismaTweet[], limit: number): TimelinePage => {
  const hasMore = tweets.length > limit;
  const visibleTweets = hasMore ? tweets.slice(0, limit) : tweets;

  return {
    tweets: visibleTweets,
    nextCursor: hasMore ? (visibleTweets.at(-1)?.id ?? null) : null,
  };
};

export class PrismaTimelineStore implements TimelineStore {
  async listTimeline(viewerId: string, query: TimelineQuery) {
    const follows = await prisma.follow.findMany({
      where: { followerId: viewerId },
      select: { followingId: true },
    });

    const followedUserIds = follows.map((follow) => follow.followingId);

    if (followedUserIds.length === 0) {
      return {
        tweets: [],
        nextCursor: null,
      };
    }

    let cursorFilter: Prisma.TweetWhereInput | undefined;

    if (query.cursor) {
      const cursorTweet = await prisma.tweet.findUnique({
        where: { id: query.cursor },
        select: {
          id: true,
          createdAt: true,
        },
      });

      if (cursorTweet) {
        cursorFilter = {
          OR: [
            { createdAt: { lt: cursorTweet.createdAt } },
            {
              AND: [
                { createdAt: cursorTweet.createdAt },
                { id: { lt: cursorTweet.id } },
              ],
            },
          ],
        };
      }
    }

    const tweets = await prisma.tweet.findMany({
      where: {
        authorId: {
          in: followedUserIds,
        },
        ...(cursorFilter ?? {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
      select: tweetSelect,
    });

    return toTimelinePage(tweets, query.limit);
  }
}
