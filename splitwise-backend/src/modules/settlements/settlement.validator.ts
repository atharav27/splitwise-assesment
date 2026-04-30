import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId');

export const paySchema = z.object({
  fromUser: objectId,
  toUser: objectId,
  amount: z.number().positive('Settlement amount must be > 0'),
  groupId: objectId.optional().nullable(),
  note: z.string().trim().max(500).optional().default(''),
});

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PayInput = z.infer<typeof paySchema>;
export type SettlementPaginationInput = z.infer<typeof paginationSchema>;
