import { DUST_THRESHOLD } from './constants';
import { round2 } from './splitCalculator';

type LedgerEntry = {
  fromUser: string | { toString: () => string };
  toUser: string | { toString: () => string };
  amount: number;
};

type UserMap = Record<string, unknown>;

export const optimizeSettlements = (ledgerEntries: LedgerEntry[], userMap: UserMap) => {
  const netMap: Record<string, number> = {};

  ledgerEntries.forEach(({ fromUser, toUser, amount }) => {
    const from = fromUser.toString();
    const to = toUser.toString();
    if (!netMap[from]) netMap[from] = 0;
    if (!netMap[to]) netMap[to] = 0;

    netMap[from] = round2(netMap[from] - amount);
    netMap[to] = round2(netMap[to] + amount);
  });

  const creditors: Array<{ userId: string; amount: number }> = [];
  const debtors: Array<{ userId: string; amount: number }> = [];

  Object.entries(netMap).forEach(([userId, net]) => {
    const rounded = round2(net);
    if (rounded > DUST_THRESHOLD) creditors.push({ userId, amount: rounded });
    if (rounded < -DUST_THRESHOLD) debtors.push({ userId, amount: round2(-rounded) });
  });

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions: Array<{ from: unknown; to: unknown; amount: number }> = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const credit = creditors[ci];
    const debt = debtors[di];
    const settleAmount = round2(Math.min(credit.amount, debt.amount));

    transactions.push({
      from: userMap[debt.userId] || { _id: debt.userId },
      to: userMap[credit.userId] || { _id: credit.userId },
      amount: settleAmount,
    });

    credit.amount = round2(credit.amount - settleAmount);
    debt.amount = round2(debt.amount - settleAmount);

    if (credit.amount <= DUST_THRESHOLD) ci++;
    if (debt.amount <= DUST_THRESHOLD) di++;
  }

  return transactions;
};
