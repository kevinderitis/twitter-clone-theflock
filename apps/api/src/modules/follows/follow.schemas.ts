import { z } from 'zod';

export const followParamsSchema = z.object({
  userId: z.string().trim().min(1, 'userId is required.'),
});
