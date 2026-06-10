import { apiRequest } from '../../lib/api';
import type { ProfileResponse, ProfileTweetsResponse } from './profile.types';

export const getProfileRequest = (token: string, username: string) =>
  apiRequest<ProfileResponse>(`/users/${username}`, {
    token,
  });

export const getProfileTweetsRequest = (
  token: string,
  username: string,
  limit = 20,
) => {
  const params = new URLSearchParams({
    limit: String(limit),
  });

  return apiRequest<ProfileTweetsResponse>(
    `/tweets/user/${username}?${params.toString()}`,
    {
      token,
    },
  );
};
