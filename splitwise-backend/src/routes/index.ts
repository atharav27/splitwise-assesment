import express from 'express';
import mongoose from 'mongoose';
import authRouter from '../modules/auth/auth.controller';
import activityRouter from '../modules/activity/activity.controller';
import balanceRouter from '../modules/balances/balance.controller';
import expenseRouter from '../modules/expenses/expense.controller';
import groupsRouter from '../modules/groups/group.controller';
import settlementRouter from '../modules/settlements/settlement.controller';
import usersRouter from '../modules/users/user.controller';

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      uptime: Math.floor(process.uptime()),
      dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV,
    },
    message: 'Server is running',
  });
});

router.use('/auth', authRouter);
router.use('/activity', activityRouter);
router.use('/balances', balanceRouter);
router.use('/expenses', expenseRouter);
router.use('/groups', groupsRouter);
router.use('/settlements', settlementRouter);
router.use('/users', usersRouter);

export default router;
