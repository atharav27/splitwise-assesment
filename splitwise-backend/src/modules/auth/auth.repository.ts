const { User } = require('../../models');

type AuthUserDoc = {
  _id: unknown;
  name: string;
  email: string;
  avatar?: string | null;
  createdAt: Date;
  passwordHash?: string;
};

export const findByEmail = (email: string, withPassword = false): Promise<AuthUserDoc | null> => {
  const query = User.findOne({ email, isActive: true });
  return withPassword ? query.select('+passwordHash') : query;
};

export const createUser = (userData: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<AuthUserDoc> => User.create(userData);
