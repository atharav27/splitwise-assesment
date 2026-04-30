import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import AppError from '../utils/AppError';

const { User } = require('../models');

type TokenPayload = JwtPayload & {
  userId: string;
  email: string;
};

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('No token provided', 401));
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as TokenPayload;

  const user = await User.findById(decoded.userId).select('_id name email isActive');
  if (!user || !user.isActive) {
    return next(new AppError('User no longer exists', 401));
  }

  req.user = { id: user._id.toString(), name: user.name, email: user.email };
  return next();
};
