export type SearchUser = {
  id: string;
  username: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  isFollowing: boolean;
};

export type SearchUsersResponse = {
  users: SearchUser[];
};
