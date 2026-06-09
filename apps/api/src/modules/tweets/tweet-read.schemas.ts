import { z } from 'zod';

export const tweetIdParamsSchema = z.object({
  tweetId: z.string().trim().min(1, 'tweetId is required.'),
});

export const usernameParamsSchema = z.object({
  username: z.string().trim().min(1, 'username is required.'),
});

export const userTweetsQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int('limit must be an integer.')
    .min(1, 'limit must be at least 1.')
    .max(50, 'limit must be 50 or fewer.')
    .default(20),
});
