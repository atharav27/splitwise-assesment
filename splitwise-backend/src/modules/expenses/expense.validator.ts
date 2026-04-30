import { z } from 'zod';

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId');

const splitDetailSchema = z.object({
  userId: objectId,
  amount: z.number().positive().optional(),
  percentage: z.number().min(0).max(100).optional(),
});

export const createExpenseSchema = z.object({
  description: z.string().trim().min(1).max(255),
  amount: z.number().positive('Amount must be > 0'),
  currency: z.string().length(3).toUpperCase().optional().default('INR'),
  paidBy: objectId,
  groupId: objectId.optional().nullable(),
  category: z.enum(['food', 'travel', 'utilities', 'entertainment', 'other']).default('other'),
  splitType: z.enum(['equal', 'unequal', 'percentage']),
  splitDetails: z.array(splitDetailSchema).min(1, 'At least one participant required'),
});

export const updateExpenseSchema = createExpenseSchema
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field required for update' });

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  groupId: objectId.optional(),
  category: z.enum(['food', 'travel', 'utilities', 'entertainment', 'other']).optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpensePaginationInput = z.infer<typeof paginationSchema>;
