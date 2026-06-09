import { z } from 'zod';

export const createTweetSchema = z.object({
  content: z
    .string('Content must be a string.')
    .trim()
    .min(1, 'Content is required.')
    .max(280, 'Content must be 280 characters or fewer.'),
});
