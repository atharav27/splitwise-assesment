import express from 'express';
import { protect } from '../../middlewares/auth.middleware';
import { success } from '../../utils/apiResponse';
import * as balanceService from './balance.service';

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  const balances = await balanceService.getGlobalBalances(req.user!.id);
  return success(res, balances, 'Balances fetched');
});

router.get('/group/:id', async (req, res) => {
  const balances = await balanceService.getGroupBalances(req.params.id, req.user!.id);
  return success(res, balances, 'Group balances fetched');
});

export default router;
