import express from 'express';
import { protect } from '../../middlewares/auth.middleware';
import { success } from '../../utils/apiResponse';
import * as userService from './user.service';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  const users = await userService.getAllUsers();
  return success(res, users, 'Users fetched');
});

export default router;
