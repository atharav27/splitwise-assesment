import * as userRepo from './user.repository';
import AppError from '../../utils/AppError';

export const getAllUsers = () => userRepo.findAll();

export const getUserById = async (id: string) => {
  const user = await userRepo.findById(id);
  if (!user) throw new AppError('User not found', 404);
  return user;
};
