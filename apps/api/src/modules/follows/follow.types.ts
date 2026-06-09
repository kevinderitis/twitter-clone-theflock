export type FollowRecord = {
  followerId: string;
  followingId: string;
  createdAt: Date;
};

export type FollowProfile = {
  id: string;
  username: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
};

export type FollowListQuery = {
  limit: number;
};

export interface FollowStore {
  createFollow(followerId: string, followingId: string): Promise<FollowRecord>;
  findFollow(
    followerId: string,
    followingId: string,
  ): Promise<FollowRecord | null>;
  deleteFollow(followerId: string, followingId: string): Promise<void>;
  listFollowers(
    userId: string,
    query: FollowListQuery,
  ): Promise<FollowProfile[]>;
  listFollowing(
    userId: string,
    query: FollowListQuery,
  ): Promise<FollowProfile[]>;
}
