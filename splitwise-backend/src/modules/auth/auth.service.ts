import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import AppError from '../../utils/AppError';
import * as activityService from '../activity/activity.service';
import * as authRepo from './auth.repository';
import type { LoginInput, SignupInput } from './auth.validator';

type UserView = {
  _id: unknown;
  name: string;
  email: string;
  avatar?: string | null;
  createdAt: Date;
};

const SALT_ROUNDS = 12;

export const signup = async ({ name, email, password }: SignupInput) => {
  const existing = await authRepo.findByEmail(email);
  if (existing) throw new AppError('Email already in use', 409);

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await authRepo.createUser({ name, email, passwordHash });
  const userId = String(user._id);
  activityService.logActivity(userId, 'group.created', 'User', userId, null, {
    name: user.name,
  });

  const token = signToken(user._id, user.email);
  return { token, user: sanitizeUser(user) };
};

export const login = async ({ email, password }: LoginInput) => {
  const GENERIC_ERROR = new AppError('Invalid credentials', 401);

  const user = await authRepo.findByEmail(email, true);
  if (!user?.passwordHash) throw GENERIC_ERROR;

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw GENERIC_ERROR;

  const token = signToken(user._id, user.email);
  return { token, user: sanitizeUser(user) };
};

const signToken = (userId: unknown, email: string) =>
  {
    const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];
    return jwt.sign({ userId, email }, process.env.JWT_SECRET as string, { expiresIn });
  };

const sanitizeUser = (user: UserView) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  createdAt: user.createdAt,
});
