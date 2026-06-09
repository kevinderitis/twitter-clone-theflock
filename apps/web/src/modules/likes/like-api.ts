import { apiRequest } from '../../lib/api';

type LikeResponse = {
  likesCount: number;
};

export const likeTweetRequest = (token: string, tweetId: string) =>
  apiRequest<LikeResponse>(`/tweets/${tweetId}/like`, {
    method: 'POST',
    token,
  });

export const unlikeTweetRequest = (token: string, tweetId: string) =>
  apiRequest<LikeResponse>(`/tweets/${tweetId}/like`, {
    method: 'DELETE',
    token,
  });
