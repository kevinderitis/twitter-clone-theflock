import { z } from 'zod';

export const followParamsSchema = z.object({
  userId: z.string().trim().min(1, 'userId is required.'),
});

export const followUsernameParamsSchema = z.object({
  username: z.string().trim().min(1, 'username is required.'),
});

export const followListQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int('limit must be an integer.')
    .min(1, 'limit must be at least 1.')
    .max(50, 'limit must be 50 or fewer.')
    .default(20),
});
