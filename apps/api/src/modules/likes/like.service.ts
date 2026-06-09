import { ZodError } from 'zod';

import { AppError } from '../../lib/errors.js';
import type { AuthUserRecord } from '../auth/auth.types.js';
import type { TweetStore } from '../tweets/tweet.types.js';
import { likeParamsSchema } from './like.schemas.js';
import type { LikeStore } from './like.types.js';

const mapValidationError = (error: ZodError) =>
  error.issues.map((issue) => issue.message);

export class LikeService {
  constructor(
    private readonly tweetStore: TweetStore,
    private readonly likeStore: LikeStore,
  ) {}

  async likeTweet(tweetIdParam: string, authUser: AuthUserRecord) {
    const tweetId = this.validateTweetId(tweetIdParam);
    const tweet = await this.tweetStore.findTweetById(tweetId);

    if (!tweet) {
      throw new AppError(404, 'TWEET_NOT_FOUND', 'Tweet not found.');
    }

    await this.likeStore.createLike(authUser.id, tweetId);

    return {
      likesCount: await this.likeStore.countLikes(tweetId),
    };
  }

  async unlikeTweet(tweetIdParam: string, authUser: AuthUserRecord) {
    const tweetId = this.validateTweetId(tweetIdParam);
    const tweet = await this.tweetStore.findTweetById(tweetId);

    if (!tweet) {
      throw new AppError(404, 'TWEET_NOT_FOUND', 'Tweet not found.');
    }

    const existingLike = await this.likeStore.findLike(authUser.id, tweetId);

    if (existingLike) {
      await this.likeStore.deleteLike(authUser.id, tweetId);
    }

    return {
      likesCount: await this.likeStore.countLikes(tweetId),
    };
  }

  private validateTweetId(tweetIdParam: string) {
    try {
      return likeParamsSchema.parse({ tweetId: tweetIdParam }).tweetId;
    } catch (error) {
      if (error instanceof ZodError) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Invalid like request.',
          mapValidationError(error),
        );
      }

      throw error;
    }
  }
}
