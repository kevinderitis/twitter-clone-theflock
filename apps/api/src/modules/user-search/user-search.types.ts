export type UserSearchResult = {
  id: string;
  username: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
};

export type UserSearchQuery = {
  q: string;
  limit: number;
};

export interface UserSearchStore {
  searchUsers(query: UserSearchQuery): Promise<UserSearchResult[]>;
}
