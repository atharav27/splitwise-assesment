export const SplitTotalsFooter = ({ splitType, totalAmount, sumAmount, sumPercentage }) => {
  const amountOk = Math.abs((sumAmount || 0) - (totalAmount || 0)) < 0.01;
  const percentOk = Math.abs((sumPercentage || 0) - 100) < 0.01;

  if (splitType === 'equal') {
    return (
      <p className="text-xs text-muted-foreground">
        {(totalAmount || 0).toFixed(2)} split equally.
      </p>
    );
  }

  if (splitType === 'unequal') {
    return (
      <p className={`text-xs ${amountOk ? 'text-emerald-600' : 'text-destructive'}`}>
        Total: ₹{(sumAmount || 0).toFixed(2)} {amountOk ? '✓' : '✗'}
      </p>
    );
  }

  return (
    <p className={`text-xs ${percentOk ? 'text-emerald-600' : 'text-destructive'}`}>
      Total: {(sumPercentage || 0).toFixed(2)}% {percentOk ? '✓' : '✗'}
    </p>
  );
};

