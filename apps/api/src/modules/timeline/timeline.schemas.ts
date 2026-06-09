import { z } from 'zod';

const limitSchema = z.coerce
  .number()
  .int('limit must be an integer.')
  .min(1, 'limit must be at least 1.')
  .max(50, 'limit must be 50 or fewer.');

export const timelineQuerySchema = z.object({
  limit: limitSchema.default(20),
  cursor: z.string().trim().min(1, 'cursor cannot be empty.').optional(),
});
