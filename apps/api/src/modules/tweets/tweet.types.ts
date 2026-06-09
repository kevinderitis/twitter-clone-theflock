export type TweetAuthor = {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
};

export type TweetRecord = {
  id: string;
  content: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  author: TweetAuthor;
  likesCount: number;
  likedByMe?: boolean;
};

export type CreateTweetInput = {
  content: string;
  authorId: string;
};

export interface TweetStore {
  createTweet(input: CreateTweetInput): Promise<TweetRecord>;
  findTweetById(id: string): Promise<TweetRecord | null>;
  findTweetsByUsername(username: string, limit: number): Promise<TweetRecord[]>;
  userExistsByUsername(username: string): Promise<boolean>;
  deleteTweet(id: string): Promise<void>;
}
