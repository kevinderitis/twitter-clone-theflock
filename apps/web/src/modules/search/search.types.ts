export type SearchUser = {
  id: string;
  username: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
};

export type SearchUsersResponse = {
  users: SearchUser[];
};
