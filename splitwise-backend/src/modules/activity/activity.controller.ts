import express from 'express';
import { z } from 'zod';
import { protect } from '../../middlewares/auth.middleware';
import { success } from '../../utils/apiResponse';
import * as activityService from './activity.service';

const router = express.Router();

const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

router.use(protect);

router.get('/', async (req, res) => {
  const query = paginationSchema.parse(req.query);
  const result = await activityService.getMyActivity(req.user!.id, query);
  return success(res, result, 'Activity fetched');
});

router.get('/group/:id', async (req, res) => {
  const query = paginationSchema.parse(req.query);
  const result = await activityService.getGroupActivity(req.params.id, req.user!.id, query);
  return success(res, result, 'Group activity fetched');
});

export default router;
