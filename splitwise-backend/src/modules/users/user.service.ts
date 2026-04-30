import * as userRepo from './user.repository';

export const getAllUsers = () => userRepo.findAll();

export const getUserById = (id: string) => userRepo.findById(id);
