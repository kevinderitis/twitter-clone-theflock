import type { TweetRecord } from '../tweets/tweet.types.js';

export type TimelineQuery = {
  limit: number;
  cursor?: string;
};

export type TimelinePage = {
  tweets: TweetRecord[];
  nextCursor: string | null;
};

export interface TimelineStore {
  listTimeline(viewerId: string, query: TimelineQuery): Promise<TimelinePage>;
}
