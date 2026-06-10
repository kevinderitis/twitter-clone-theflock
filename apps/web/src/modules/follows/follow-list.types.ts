export type FollowListUser = {
  id: string;
  username: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
};

export type FollowersResponse = {
  followers: FollowListUser[];
};

export type FollowingResponse = {
  following: FollowListUser[];
};
