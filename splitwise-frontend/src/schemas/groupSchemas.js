import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  description: z.string().max(300, 'Description must be at most 300 characters').optional(),
  members: z.array(z.string()).min(1, 'Add at least 1 other member'),
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP']),
});
