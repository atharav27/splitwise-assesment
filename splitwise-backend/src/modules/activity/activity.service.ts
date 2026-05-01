import AppError from '../../utils/AppError';
import { paginateCursor } from '../../utils/pagination';
import * as groupRepo from '../groups/group.repository';
import * as userRepo from '../users/user.repository';
import * as activityRepo from './activity.repository';

type ActivityQuery = {
  cursor?: string;
  limit: number;
};

type ActivityItem = {
  _id: { toString: () => string };
};

type ResolvedUser = {
  _id: { toString: () => string };
  name?: string;
  email?: string;
  avatar?: string | null;
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
  const activities = await enrichActivityNames(data as Array<Record<string, unknown>>);
  return { activities, nextCursor };
};

export const getGroupActivity = async (groupId: string, userId: string, query: ActivityQuery) => {
  const isMember = await groupRepo.isActiveGroupMember(groupId, userId);
  if (isMember === null) throw new AppError('Group not found', 404);
  if (!isMember) throw new AppError('Access denied', 403);

  const raw = await activityRepo.findByGroup(groupId, query.cursor, query.limit);
  const { data, nextCursor } = paginateCursor(raw as ActivityItem[], query.limit);
  const activities = await enrichActivityNames(data as Array<Record<string, unknown>>);
  return { activities, nextCursor };
};

const extractId = (value: unknown): string | null => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && '_id' in value) {
    const idValue = (value as { _id?: unknown })._id;
    if (typeof idValue === 'string') return idValue;
    if (idValue && typeof (idValue as { toString?: () => string }).toString === 'function') {
      return (idValue as { toString: () => string }).toString();
    }
  }
  if (typeof (value as { toString?: () => string }).toString === 'function') {
    return (value as { toString: () => string }).toString();
  }
  return null;
};

const enrichActivityNames = async (items: Array<Record<string, unknown>>) => {
  const userIds = new Set<string>();
  items.forEach((item) => {
    const actorId = extractId(item.userId);
    if (actorId) userIds.add(actorId);
    const metadata = (item.metadata || {}) as { userId?: unknown };
    const targetId = extractId(metadata.userId);
    if (targetId) userIds.add(targetId);
  });

  const users = (userIds.size ? await userRepo.findByIds([...userIds]) : []) as ResolvedUser[];
  const userMap = new Map<string, ResolvedUser>(
    users.map((user) => [user._id.toString(), user])
  );

  return items.map((item) => {
    const metadata = (item.metadata || {}) as Record<string, unknown>;
    const actorId = extractId(item.userId);
    const targetId = extractId(metadata.userId);
    const actor = actorId ? userMap.get(actorId) : null;
    const target = targetId ? userMap.get(targetId) : null;
    const groupDoc = (item.groupId || null) as { name?: string } | null;

    return {
      ...item,
      actorName: actor?.name || 'Someone',
      targetName: target?.name || (typeof metadata.userName === 'string' ? metadata.userName : null) || 'user',
      groupName: groupDoc?.name || null,
      entity: metadata,
      actor: actor
        ? {
            _id: actor._id.toString(),
            name: actor.name || actor.email || 'User',
            avatar: actor.avatar || null,
          }
        : null,
    };
  });
};
