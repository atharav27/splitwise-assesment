import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import logger from '../utils/logger';
import { error as sendError } from '../utils/apiResponse';
import AppError from '../utils/AppError';

const errorMiddleware: ErrorRequestHandler = (err, req, res, next) => {
  logger.error({ err, url: req.url, method: req.method }, 'Request error');

  if (err?.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e: any) => ({
      field: e.path,
      message: e.message,
    }));
    return sendError(res, 'Validation failed', 400, errors);
  }

  if (err?.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return sendError(res, `${field} already exists`, 409);
  }

  if (err?.name === 'JsonWebTokenError') return sendError(res, 'Invalid token', 401);
  if (err?.name === 'TokenExpiredError') return sendError(res, 'Token expired', 401);

  if (err instanceof ZodError) {
    const errors = err.issues.map((e) => ({ field: e.path.join('.'), message: e.message }));
    return sendError(res, 'Validation failed', 400, errors);
  }

  if (err instanceof AppError || err?.isOperational) {
    return sendError(res, err.message, err.statusCode);
  }

  return sendError(res, 'Internal server error', 500);
};

export default errorMiddleware;
