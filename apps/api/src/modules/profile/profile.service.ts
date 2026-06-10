import { ZodError } from 'zod';

import { AppError } from '../../lib/errors.js';
import type { AuthUserStore } from '../auth/auth.types.js';
import type { FollowStore } from '../follows/follow.types.js';
import { followUsernameParamsSchema } from '../follows/follow.schemas.js';
import type { TweetStore } from '../tweets/tweet.types.js';
import type { UserProfile } from './profile.types.js';

const mapValidationError = (error: ZodError) =>
  error.issues.map((issue) => issue.message);

export class ProfileService {
  constructor(
    private readonly authUserStore: AuthUserStore,
    private readonly followStore: FollowStore,
    private readonly tweetStore: TweetStore,
  ) {}

  async getProfile(usernameParam: string): Promise<{ user: UserProfile }> {
    const username = this.validateUsername(usernameParam);
    const user = await this.authUserStore.findByUsername(username);

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found.');
    }

    const [followersCount, followingCount, tweetsCount] = await Promise.all([
      this.followStore.countFollowers(user.id),
      this.followStore.countFollowing(user.id),
      this.tweetStore.countTweetsByAuthorId(user.id),
    ]);

    return {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        followersCount,
        followingCount,
        tweetsCount,
      },
    };
  }

  private validateUsername(usernameParam: string) {
    try {
      return followUsernameParamsSchema.parse({ username: usernameParam })
        .username;
    } catch (error) {
      if (error instanceof ZodError) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Invalid profile request.',
          mapValidationError(error),
        );
      }

      throw error;
    }
  }
}
