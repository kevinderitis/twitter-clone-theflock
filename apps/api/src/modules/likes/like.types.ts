export type LikeRecord = {
  userId: string;
  tweetId: string;
  createdAt: Date;
};

export interface LikeStore {
  createLike(userId: string, tweetId: string): Promise<LikeRecord>;
  findLike(userId: string, tweetId: string): Promise<LikeRecord | null>;
  deleteLike(userId: string, tweetId: string): Promise<void>;
  countLikes(tweetId: string): Promise<number>;
}
