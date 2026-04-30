import { NextFunction, Request, Response } from 'express';
import logger from '../utils/logger';

const { IdempotencyKey } = require('../models');

export const idempotencyCheck = async (req: Request, res: Response, next: NextFunction) => {
  const key = req.headers['idempotency-key'];
  if (!key || Array.isArray(key)) return next();

  try {
    const existing = await IdempotencyKey.findOne({ key });
    if (existing) {
      logger.info({ key }, 'Idempotency key hit - replaying cached response');
      return res.status(existing.statusCode).json(JSON.parse(existing.responseBody));
    }

    req.idempotencyKey = key;
    return next();
  } catch (err) {
    return next(err);
  }
};

export const saveIdempotencyRecord = async (
  key: string | undefined,
  responseBody: Record<string, unknown>,
  statusCode: number
) => {
  if (!key) return;
  try {
    await IdempotencyKey.create({ key, responseBody: JSON.stringify(responseBody), statusCode });
  } catch (err: any) {
    if (err.code !== 11000) throw err;
  }
};
