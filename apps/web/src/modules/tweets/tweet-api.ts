import { apiRequest } from '../../lib/api';
import type { TimelineTweet } from '../timeline/timeline.types';

export type CreateTweetPayload = {
  content: string;
};

export type CreateTweetResponse = {
  tweet: TimelineTweet;
};

export const createTweetRequest = (
  token: string,
  payload: CreateTweetPayload,
) =>
  apiRequest<CreateTweetResponse>('/tweets', {
    method: 'POST',
    token,
    body: payload,
  });
