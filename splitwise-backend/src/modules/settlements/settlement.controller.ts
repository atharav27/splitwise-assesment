import express from 'express';
import { protect } from '../../middlewares/auth.middleware';
import { success } from '../../utils/apiResponse';
import * as settlementService from './settlement.service';
import { paginationSchema, paySchema } from './settlement.validator';

const router = express.Router();

router.use(protect);

router.post('/pay', async (req, res) => {
  const body = paySchema.parse(req.body);
  const settlement = await settlementService.pay(body, req.user!.id);
  return success(res, settlement, 'Settlement recorded', 201);
});

router.get('/', async (req, res) => {
  const query = paginationSchema.parse(req.query);
  const result = await settlementService.getMySettlements(req.user!.id, query);
  return success(res, result, 'Settlements fetched');
});

router.get('/group/:id', async (req, res) => {
  const query = paginationSchema.parse(req.query);
  const result = await settlementService.getGroupSettlements(req.params.id, req.user!.id, query);
  return success(res, result, 'Group settlements fetched');
});

router.get('/optimize/group/:id', async (req, res) => {
  const result = await settlementService.getOptimizedSettlements(req.params.id, req.user!.id);
  return success(res, result, 'Optimized settlements computed');
});

export default router;
