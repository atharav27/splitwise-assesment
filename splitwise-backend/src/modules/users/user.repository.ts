const { User } = require('../../models');

type UserListItem = {
  _id: unknown;
  name: string;
  email: string;
  avatar?: string | null;
  createdAt: Date;
};

export const findAll = (): Promise<UserListItem[]> =>
  User.find({ isActive: true }).select('_id name email avatar createdAt').sort({ name: 1 });

export const findById = (id: string): Promise<UserListItem | null> =>
  User.findById(id).select('_id name email avatar createdAt');
