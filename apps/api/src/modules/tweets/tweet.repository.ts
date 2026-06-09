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
} satisfies Prisma.TweetSelect;

type PrismaTweet = Prisma.TweetGetPayload<{
  select: typeof tweetSelect;
}>;

const toTweetRecord = (tweet: PrismaTweet): TweetRecord => tweet;

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

  async deleteTweet(id: string) {
    await prisma.tweet.delete({
      where: { id },
    });
  }
}
