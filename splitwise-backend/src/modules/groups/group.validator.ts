import { z } from 'zod';

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId');

export const createGroupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  description: z.string().trim().max(500).optional().default(''),
  members: z.array(objectId).optional().default([]),
  currency: z.string().length(3).toUpperCase().optional().default('INR'),
});

export const addMemberSchema = z.object({
  userId: objectId,
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
