import { apiRequest } from '../../lib/api';

type FollowResponse = {
  follow: {
    followerId: string;
    followingId: string;
    createdAt: string;
  };
};

type UnfollowResponse = {
  success: true;
};

export const followUserRequest = (token: string, userId: string) =>
  apiRequest<FollowResponse>(`/users/${userId}/follow`, {
    method: 'POST',
    token,
  });

export const unfollowUserRequest = (token: string, userId: string) =>
  apiRequest<UnfollowResponse>(`/users/${userId}/follow`, {
    method: 'DELETE',
    token,
  });
