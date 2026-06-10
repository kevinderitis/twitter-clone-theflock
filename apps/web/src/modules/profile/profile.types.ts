export type ProfileUser = {
  id: string;
  username: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  followersCount: number;
  followingCount: number;
  tweetsCount: number;
  isFollowing: boolean;
};

export type ProfileResponse = {
  user: ProfileUser;
};

export type ProfileTweet = {
  id: string;
  content: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  author: {
    id: string;
    username: string;
    name: string;
    avatarUrl: string | null;
  };
};

export type ProfileTweetsResponse = {
  tweets: ProfileTweet[];
};
