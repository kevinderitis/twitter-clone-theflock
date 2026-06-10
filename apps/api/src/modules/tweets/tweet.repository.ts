import { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import type {
  CreateTweetInput,
  TweetRecord,
  TweetStore,
} from './tweet.types.js';

const tweetSelect = {
  id: true,
  content: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: {
      id: true,
      username: true,
      name: true,
      avatarUrl: true,
    },
  },
  _count: {
    select: {
      likes: true,
    },
  },
} satisfies Prisma.TweetSelect;

type PrismaTweet = Prisma.TweetGetPayload<{
  select: typeof tweetSelect;
}>;

const toTweetRecord = (tweet: PrismaTweet): TweetRecord => ({
  id: tweet.id,
  content: tweet.content,
  authorId: tweet.authorId,
  createdAt: tweet.createdAt,
  updatedAt: tweet.updatedAt,
  author: tweet.author,
  likesCount: tweet._count.likes,
});

export class PrismaTweetStore implements TweetStore {
  async createTweet(input: CreateTweetInput) {
    const tweet = await prisma.tweet.create({
      data: {
        content: input.content,
        authorId: input.authorId,
      },
      select: tweetSelect,
    });

    return toTweetRecord(tweet);
  }

  async findTweetById(id: string) {
    const tweet = await prisma.tweet.findUnique({
      where: { id },
      select: tweetSelect,
    });

    return tweet ? toTweetRecord(tweet) : null;
  }

  async findTweetsByUsername(username: string, limit: number) {
    const tweets = await prisma.tweet.findMany({
      where: {
        author: {
          username,
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
      select: tweetSelect,
    });

    return tweets.map(toTweetRecord);
  }

  async userExistsByUsername(username: string) {
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    return Boolean(user);
  }

  async countTweetsByAuthorId(authorId: string) {
    return prisma.tweet.count({
      where: { authorId },
    });
  }

  async deleteTweet(id: string) {
    await prisma.tweet.delete({
      where: { id },
    });
  }
}
