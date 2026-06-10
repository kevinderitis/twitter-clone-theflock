import { apiRequest } from '../../lib/api';
import type { FollowersResponse, FollowingResponse } from './follow-list.types';

export const getFollowersRequest = (
  token: string,
  username: string,
  limit: number,
) => {
  const params = new URLSearchParams({
    limit: String(limit),
  });

  return apiRequest<FollowersResponse>(
    `/users/${username}/followers?${params.toString()}`,
    {
      token,
    },
  );
};

export const getFollowingRequest = (
  token: string,
  username: string,
  limit: number,
) => {
  const params = new URLSearchParams({
    limit: String(limit),
  });

  return apiRequest<FollowingResponse>(
    `/users/${username}/following?${params.toString()}`,
    {
      token,
    },
  );
};
