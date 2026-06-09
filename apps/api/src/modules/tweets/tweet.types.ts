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
};

export type CreateTweetInput = {
  content: string;
  authorId: string;
};

export interface TweetStore {
  createTweet(input: CreateTweetInput): Promise<TweetRecord>;
  findTweetById(id: string): Promise<TweetRecord | null>;
  deleteTweet(id: string): Promise<void>;
}
