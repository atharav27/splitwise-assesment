import AppError from '../../utils/AppError';
import { paginateCursor } from '../../utils/pagination';
import * as groupRepo from '../groups/group.repository';
import * as activityRepo from './activity.repository';

type ActivityQuery = {
  cursor?: string;
  limit: number;
};

type ActivityItem = {
  _id: { toString: () => string };
};

export const logActivity = (
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  groupId: string | null = null,
  metadata: Record<string, unknown> = {}
) => {
  activityRepo.log({ userId, action, entityType, entityId, groupId, metadata });
};

export const getMyActivity = async (userId: string, query: ActivityQuery) => {
  const raw = await activityRepo.findByUser(userId, query.cursor, query.limit);
  const { data, nextCursor } = paginateCursor(raw as ActivityItem[], query.limit);
  return { activities: data, nextCursor };
};

export const getGroupActivity = async (groupId: string, userId: string, query: ActivityQuery) => {
  const isMember = await groupRepo.isActiveGroupMember(groupId, userId);
  if (isMember === null) throw new AppError('Group not found', 404);
  if (!isMember) throw new AppError('Access denied', 403);

  const raw = await activityRepo.findByGroup(groupId, query.cursor, query.limit);
  const { data, nextCursor } = paginateCursor(raw as ActivityItem[], query.limit);
  return { activities: data, nextCursor };
};
