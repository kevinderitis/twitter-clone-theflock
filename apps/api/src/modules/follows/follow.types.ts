export type FollowRecord = {
  followerId: string;
  followingId: string;
  createdAt: Date;
};

export interface FollowStore {
  createFollow(followerId: string, followingId: string): Promise<FollowRecord>;
  findFollow(
    followerId: string,
    followingId: string,
  ): Promise<FollowRecord | null>;
  deleteFollow(followerId: string, followingId: string): Promise<void>;
}
