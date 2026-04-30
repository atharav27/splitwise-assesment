const { Activity } = require('../../models');
import logger from '../../utils/logger';

type ActivityLogInput = {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  groupId?: string | null;
  metadata?: Record<string, unknown>;
};

export const log = (data: ActivityLogInput) => {
  setImmediate(async () => {
    try {
      await Activity.create(data);
    } catch (err) {
      logger.error({ err }, 'Activity log write failed');
    }
  });
};

export const findByUser = (userId: string, cursor: string | undefined, limit: number) => {
  const filter: Record<string, unknown> = {
    userId,
    ...(cursor ? { _id: { $lt: cursor } } : {}),
  };

  return Activity.find(filter)
    .populate('userId', '_id name email avatar')
    .populate('groupId', '_id name')
    .sort({ _id: -1 })
    .limit(limit + 1)
    .lean();
};

export const findByGroup = (groupId: string, cursor: string | undefined, limit: number) => {
  const filter: Record<string, unknown> = {
    groupId,
    ...(cursor ? { _id: { $lt: cursor } } : {}),
  };

  return Activity.find(filter)
    .populate('userId', '_id name email avatar')
    .populate('groupId', '_id name')
    .sort({ _id: -1 })
    .limit(limit + 1)
    .lean();
};
