import express from 'express';
import { loginLimiter } from '../../middlewares/rateLimiter.middleware';
import { success } from '../../utils/apiResponse';
import * as authService from './auth.service';
import { loginSchema, signupSchema } from './auth.validator';

const router = express.Router();

router.post('/signup', async (req, res) => {
  const body = signupSchema.parse(req.body);
  const result = await authService.signup(body);
  return success(res, result, 'Account created', 201);
});

router.post('/login', loginLimiter, async (req, res) => {
  const body = loginSchema.parse(req.body);
  const result = await authService.login(body);
  return success(res, result, 'Login successful');
});

export default router;
