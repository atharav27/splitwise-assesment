import express from 'express';
import mongoose from 'mongoose';
import authRouter from '../modules/auth/auth.controller';
import groupsRouter from '../modules/groups/group.controller';
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
router.use('/groups', groupsRouter);
router.use('/users', usersRouter);

// Modules plugged in per phase:
// router.use('/expenses',    require('../modules/expenses/expense.controller'));
// router.use('/balances',    require('../modules/balances/balance.controller'));
// router.use('/settlements', require('../modules/settlements/settlement.controller'));
// router.use('/activity',    require('../modules/activity/activity.controller'));

export default router;
