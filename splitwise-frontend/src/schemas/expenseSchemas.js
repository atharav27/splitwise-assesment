import { z } from 'zod';

export const expenseFormSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z
    .string()
    .refine((value) => Number(value) > 0, 'Amount must be positive')
    .refine((value) => /^\d+(\.\d{1,2})?$/.test(value), 'Max 2 decimal places'),
  currency: z.string().min(1),
  category: z.string().min(1),
  groupId: z.string().optional(),
  paidBy: z.string().min(1, 'Paid by is required'),
});
