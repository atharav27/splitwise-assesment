import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { success: false, data: null, message: 'Too many login attempts, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
