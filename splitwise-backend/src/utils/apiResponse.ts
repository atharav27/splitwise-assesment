import { Response } from 'express';

type ErrorField = {
  field: string;
  message: string;
};

export const success = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200
) => {
  return res.status(statusCode).json({ success: true, data, message });
};

export const error = (
  res: Response,
  message = 'Something went wrong',
  statusCode = 500,
  errors: ErrorField[] = []
) => {
  return res.status(statusCode).json({ success: false, data: null, message, errors });
};
