export type UserProfile = {
  id: string;
  username: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  followersCount: number;
  followingCount: number;
  tweetsCount: number;
};
