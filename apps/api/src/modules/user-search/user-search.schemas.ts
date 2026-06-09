import { z } from 'zod';

export const userSearchQuerySchema = z.object({
  q: z.string().trim().min(1, 'q is required.'),
  limit: z.coerce
    .number()
    .int('limit must be an integer.')
    .min(1, 'limit must be at least 1.')
    .max(30, 'limit must be 30 or fewer.')
    .default(10),
});
