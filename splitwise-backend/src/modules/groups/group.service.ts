const { Group, User } = require('../../models');
import AppError from '../../utils/AppError';
import * as groupRepo from './group.repository';
import type { CreateGroupInput } from './group.validator';

type GroupDocLike = {
  _id: { toString: () => string };
  members: Array<{ _id?: { toString: () => string }; toString: () => string }>;
  createdBy: { toString: () => string };
};

export const createGroup = async (payload: CreateGroupInput, creatorId: string) => {
  const memberSet = [...new Set([...payload.members, creatorId.toString()])];
  if (memberSet.length > 50) {
    throw new AppError('Group member limit exceeded', 400);
  }
  await assertUsersExist(memberSet);

  const group = await groupRepo.create({
    name: payload.name,
    description: payload.description,
    members: memberSet,
    createdBy: creatorId,
    currency: payload.currency,
  });

  return groupRepo.findById(group._id.toString());
};

export const getMyGroups = (userId: string) => groupRepo.findByMember(userId);

export const getGroupById = async (groupId: string, requesterId: string) => {
  const group = await groupRepo.findById(groupId);
  if (!group) throw new AppError('Group not found', 404);
  assertMember(group, requesterId);
  return group;
};

export const addMember = async (groupId: string, targetUserId: string, requesterId: string) => {
  const group = await getGroupRaw(groupId);
  assertAdmin(group, requesterId);
  await assertUsersExist([targetUserId]);
  return groupRepo.addMember(groupId, targetUserId);
};

export const removeMember = async (groupId: string, targetUserId: string, requesterId: string) => {
  const group = await getGroupRaw(groupId);
  assertAdmin(group, requesterId);

  if (group.createdBy.toString() === targetUserId.toString()) {
    throw new AppError('Cannot remove the group creator', 400);
  }

  return groupRepo.removeMember(groupId, targetUserId);
};

export const deleteGroup = async (groupId: string, requesterId: string) => {
  const group = await getGroupRaw(groupId);
  assertAdmin(group, requesterId);
  await groupRepo.softDelete(groupId);
};

const getGroupRaw = async (groupId: string) => {
  const group = await Group.findOne({ _id: groupId, isActive: true });
  if (!group) throw new AppError('Group not found', 404);
  return group as GroupDocLike;
};

const assertMember = (group: GroupDocLike, userId: string) => {
  const isMember = group.members.some(
    (m) => m._id?.toString() === userId.toString() || m.toString() === userId.toString()
  );
  if (!isMember) throw new AppError('Access denied — not a group member', 403);
};

const assertAdmin = (group: GroupDocLike, userId: string) => {
  if (group.createdBy.toString() !== userId.toString()) {
    throw new AppError('Access denied — only the group admin can perform this action', 403);
  }
};

const assertUsersExist = async (userIds: string[]) => {
  const found = await User.find({ _id: { $in: userIds }, isActive: true }).select('_id');
  const foundIds = found.map((u: { _id: { toString: () => string } }) => u._id.toString());
  const foundSet = new Set(foundIds);
  const missing = userIds.filter((id) => !foundSet.has(id.toString()));
  if (missing.length > 0) {
    throw new AppError(`Users not found: ${missing.join(', ')}`, 400);
  }
};
