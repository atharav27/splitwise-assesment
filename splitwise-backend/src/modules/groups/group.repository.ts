const { Group } = require('../../models');

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
