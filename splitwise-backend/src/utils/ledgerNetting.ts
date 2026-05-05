import type mongoose from 'mongoose';
import { DUST_THRESHOLD } from './constants';
import { round2 } from './splitCalculator';
import * as expenseRepo from '../modules/expenses/expense.repository';

const { Ledger } = require('../models');

type Session = mongoose.ClientSession;

/**
 * Cancels mutual debt between two users across ledger scopes (FIFO by row order).
 * Canonical row (fromUser, toUser): amount > 0 means fromUser owes toUser; amount < 0 means reverse.
 * Returns total amount cancelled (0 if nothing to net).
 */
export const applyMutualNetting = async (
  userA: string,
  userB: string,
  session: Session
): Promise<number> => {
  const rows = await expenseRepo.findAllLedgerRowsForPair(userA, userB, session);
  const positiveRows = rows.filter((r: { amount: number }) => r.amount > DUST_THRESHOLD);
  const negativeRows = rows.filter((r: { amount: number }) => r.amount < -DUST_THRESHOLD);

  const sumPos = round2(positiveRows.reduce((s: number, r: { amount: number }) => s + r.amount, 0));
  const sumNegAbs = round2(
    Math.abs(negativeRows.reduce((s: number, r: { amount: number }) => s + r.amount, 0))
  );

  let netCancel = round2(Math.min(sumPos, sumNegAbs));
  if (netCancel <= DUST_THRESHOLD) return 0;

  let remaining = netCancel;

  for (const row of positiveRows) {
    if (remaining <= DUST_THRESHOLD) break;
    const take = round2(Math.min(remaining, row.amount));
    await Ledger.findOneAndUpdate(
      { _id: row._id },
      { $inc: { amount: -take }, $set: { lastUpdatedAt: new Date() } },
      { session }
    );
    remaining = round2(remaining - take);
  }

  remaining = netCancel;

  for (const row of negativeRows) {
    if (remaining <= DUST_THRESHOLD) break;
    const absAmt = round2(Math.abs(row.amount));
    const take = round2(Math.min(remaining, absAmt));
    await Ledger.findOneAndUpdate(
      { _id: row._id },
      { $inc: { amount: take }, $set: { lastUpdatedAt: new Date() } },
      { session }
    );
    remaining = round2(remaining - take);
  }

  return netCancel;
};

/**
 * Signed debt from payer perspective: positive means `fromUserId` owes `toUserId`
 * for a ledger row (canonical pair, amount S). S > 0 => canonFrom owes canonTo.
 */
export const signedDebtFromUserToUser = (
  fromUserId: string,
  toUserId: string,
  rowAmount: number
): number => {
  const ids = [fromUserId.toString(), toUserId.toString()].sort();
  const [c0, c1] = ids;
  if (fromUserId.toString() === c0 && toUserId.toString() === c1) return round2(rowAmount);
  if (fromUserId.toString() === c1 && toUserId.toString() === c0) return round2(-rowAmount);
  return 0;
};
