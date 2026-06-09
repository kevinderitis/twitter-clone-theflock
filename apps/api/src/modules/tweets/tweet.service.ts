import { ZodError } from 'zod';

import { AppError } from '../../lib/errors.js';
import type { AuthUserRecord } from '../auth/auth.types.js';
import { createTweetSchema } from './tweet.schemas.js';
import type { TweetStore } from './tweet.types.js';

const mapValidationError = (error: ZodError) =>
  error.issues.map((issue) => issue.message);

export class TweetService {
  constructor(private readonly tweetStore: TweetStore) {}

  async createTweet(input: unknown, authUser: AuthUserRecord) {
    try {
      const validatedInput = createTweetSchema.parse(input);

      const tweet = await this.tweetStore.createTweet({
        content: validatedInput.content,
        authorId: authUser.id,
      });

      return {
        tweet,
      };
    } catch (error) {
      if (error instanceof ZodError) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Invalid tweet payload.',
          mapValidationError(error),
        );
      }

      throw error;
    }
  }

  async deleteTweet(tweetId: string, authUser: AuthUserRecord) {
    const tweet = await this.tweetStore.findTweetById(tweetId);

    if (!tweet) {
      throw new AppError(404, 'TWEET_NOT_FOUND', 'Tweet not found.');
    }

    if (tweet.authorId !== authUser.id) {
      throw new AppError(
        403,
        'TWEET_FORBIDDEN',
        "You cannot delete another user's tweet.",
      );
    }

    await this.tweetStore.deleteTweet(tweetId);

    return {
      success: true,
    };
  }
}
