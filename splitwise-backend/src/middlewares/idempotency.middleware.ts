import { NextFunction, Request, Response } from 'express';

export const idempotencyCheck = (req: Request, res: Response, next: NextFunction) => next();
