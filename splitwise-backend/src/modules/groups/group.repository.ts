import { DUST_THRESHOLD } from '../../utils/constants';

const { Group, Ledger } = require('../../models');

const MEMBER_POPULATE = { path: 'members', select: '_id name email avatar' };
const CREATOR_POPULATE = { path: 'createdBy', select: '_id name email' };

type GroupCreateInput = {
  name: string;
  description: string;
  members: string[];
  createdBy: string;
  currency: string;
};

export const create = (data: GroupCreateInput) => Group.create(data);

export const findById = (id: string) =>
  Group.findOne({ _id: id, isActive: true }).populate(MEMBER_POPULATE).populate(CREATOR_POPULATE);

export const findActiveById = (id: string) => Group.findOne({ _id: id, isActive: true }).select('members createdBy');

export const findByMember = (userId: string) =>
  Group.find({ members: userId, isActive: true })
    .populate(MEMBER_POPULATE)
    .populate(CREATOR_POPULATE)
    .sort({ createdAt: -1 });

export const addMember = (groupId: string, userId: string) =>
  Group.findByIdAndUpdate(groupId, { $addToSet: { members: userId } }, { new: true })
    .populate(MEMBER_POPULATE)
    .populate(CREATOR_POPULATE);

export const removeMember = (groupId: string, userId: string) =>
  Group.findByIdAndUpdate(groupId, { $pull: { members: userId } }, { new: true })
    .populate(MEMBER_POPULATE)
    .populate(CREATOR_POPULATE);

export const softDelete = (groupId: string) =>
  Group.findByIdAndUpdate(groupId, { isActive: false }, { new: true });

export const findActiveGroupMemberIds = async (groupId: string): Promise<string[] | null> => {
  const group = await Group.findOne({ _id: groupId, isActive: true }).select('members');
  if (!group) return null;
  return group.members.map((m: { toString: () => string }) => m.toString());
};

export const isActiveGroupMember = async (groupId: string, userId: string): Promise<boolean | null> => {
  const memberIds = await findActiveGroupMemberIds(groupId);
  if (!memberIds) return null;
  return memberIds.some((id) => id.toString() === userId.toString());
};

export const hasOutstandingForMemberInGroup = async (groupId: string, userId: string): Promise<boolean> => {
  const outstanding = await Ledger.exists({
    groupId,
    $or: [{ fromUser: userId }, { toUser: userId }],
    $and: [{ $or: [{ amount: { $gt: DUST_THRESHOLD } }, { amount: { $lt: -DUST_THRESHOLD } }] }],
  });
  return Boolean(outstanding);
};
