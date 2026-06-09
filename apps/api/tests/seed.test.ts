import { describe, expect, it } from 'vitest';

import { buildSeedPlan } from '../prisma/seed.data.js';

describe('seed data', () => {
  const plan = buildSeedPlan('hashed-password');

  it('includes the required demo accounts', () => {
    expect(plan.users).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          email: 'demo@example.com',
          username: 'demo',
          name: 'Demo User',
          passwordHash: 'hashed-password',
        }),
        expect.objectContaining({
          email: 'kevin@example.com',
          username: 'kevin',
          name: 'Kevin',
          passwordHash: 'hashed-password',
        }),
      ]),
    );
  });

  it('creates realistic volumes of users and tweets', () => {
    expect(plan.users).toHaveLength(12);
    expect(plan.tweets.length).toBeGreaterThanOrEqual(50);
    expect(plan.tweets.length).toBeLessThanOrEqual(100);
  });

  it('gives every user tweets and multiple follow relationships', () => {
    const tweetCounts = new Map<string, number>();
    const followingCounts = new Map<string, number>();

    for (const tweet of plan.tweets) {
      tweetCounts.set(
        tweet.authorId,
        (tweetCounts.get(tweet.authorId) ?? 0) + 1,
      );
    }

    for (const follow of plan.follows) {
      followingCounts.set(
        follow.followerId,
        (followingCounts.get(follow.followerId) ?? 0) + 1,
      );
    }

    for (const user of plan.users) {
      expect(tweetCounts.get(user.id) ?? 0).toBeGreaterThan(0);
      expect(followingCounts.get(user.id) ?? 0).toBeGreaterThanOrEqual(2);
    }
  });

  it('creates a mixed likes distribution with empty, few, and many liked tweets', () => {
    const likeCounts = new Map<string, number>();

    for (const like of plan.likes) {
      likeCounts.set(like.tweetId, (likeCounts.get(like.tweetId) ?? 0) + 1);
    }

    const counts = plan.tweets.map((tweet) => likeCounts.get(tweet.id) ?? 0);

    expect(counts.some((count) => count === 0)).toBe(true);
    expect(counts.some((count) => count >= 1 && count <= 3)).toBe(true);
    expect(counts.some((count) => count >= 7)).toBe(true);
  });
});
