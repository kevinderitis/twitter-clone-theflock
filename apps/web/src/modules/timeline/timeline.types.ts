export type TimelineAuthor = {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
};

export type TimelineTweet = {
  id: string;
  content: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: TimelineAuthor;
  likesCount?: number;
  likedByMe?: boolean;
};

export type TimelineResponse = {
  tweets: TimelineTweet[];
  nextCursor: string | null;
};
