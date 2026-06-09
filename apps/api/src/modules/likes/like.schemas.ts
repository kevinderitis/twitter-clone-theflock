import { z } from 'zod';

export const likeParamsSchema = z.object({
  tweetId: z.string().trim().min(1, 'tweetId is required.'),
});
