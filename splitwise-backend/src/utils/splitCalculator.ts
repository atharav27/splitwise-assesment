import AppError from './AppError';

export const round2 = (n: number) => Math.round(n * 100) / 100;

const calculateEqualSplit = (amount: number, participants: string[], payerId: string) => {
  if (!participants.length) throw new AppError('participants cannot be empty', 400);

  const base = round2(amount / participants.length);
  const totalBase = round2(base * participants.length);
  const remainder = round2(amount - totalBase);

  return participants.map((userId) => {
    const isRemainder = userId.toString() === payerId.toString();
    return {
      userId,
      amount: isRemainder ? round2(base + remainder) : base,
      percentage: null as number | null,
    };
  });
};

const calculateUnequalSplit = (
  amount: number,
  splitDetails: Array<{ userId: string; amount?: number }>
) => {
  const sum = round2(splitDetails.reduce((acc, d) => acc + (d.amount || 0), 0));
  const diff = round2(Math.abs(sum - amount));

  if (diff > 0.01) {
    throw new AppError(`Unequal split amounts sum to ${sum} but expense is ${amount} (diff: ${diff})`, 400);
  }

  return splitDetails.map((d) => ({ userId: d.userId, amount: round2(d.amount || 0), percentage: null }));
};

const calculatePercentageSplit = (
  amount: number,
  splitDetails: Array<{ userId: string; percentage?: number }>,
  payerId: string
) => {
  const totalPct = round2(splitDetails.reduce((acc, d) => acc + (d.percentage || 0), 0));
  if (Math.abs(totalPct - 100) > 0.01) {
    throw new AppError(`Percentages sum to ${totalPct}, must equal 100`, 400);
  }

  const computed = splitDetails.map((d) => ({
    userId: d.userId,
    amount: round2(((d.percentage || 0) / 100) * amount),
    percentage: d.percentage || 0,
  }));

  const sumAmounts = round2(computed.reduce((acc, d) => acc + d.amount, 0));
  const remainder = round2(amount - sumAmounts);
  if (remainder !== 0) {
    const payerEntry = computed.find((d) => d.userId.toString() === payerId.toString());
    if (payerEntry) payerEntry.amount = round2(payerEntry.amount + remainder);
  }

  return computed;
};

export const calculateSplit = (
  splitType: string,
  amount: number,
  splitDetails: Array<{ userId: string; amount?: number; percentage?: number }>,
  participants: string[],
  payerId: string
) => {
  switch (splitType) {
    case 'equal':
      return calculateEqualSplit(amount, participants, payerId);
    case 'unequal':
      return calculateUnequalSplit(amount, splitDetails);
    case 'percentage':
      return calculatePercentageSplit(amount, splitDetails, payerId);
    default:
      throw new AppError(`Unknown splitType: ${splitType}`, 400);
  }
};
