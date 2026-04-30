import { cn, formatCurrency } from '../../lib/utils';

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg font-medium',
  xl: 'text-2xl font-semibold',
};

export const AmountDisplay = ({ amount, direction = 'neutral', size = 'md', showSign = false, currency = 'INR' }) => {
  const colorClass = {
    owe: 'text-red-500',
    owed: 'text-emerald-500',
    neutral: 'text-foreground',
  }[direction];

  const sign = showSign
    ? (direction === 'owe' ? '-' : direction === 'owed' ? '+' : '')
    : '';

  return (
    <span className={cn('font-mono tabular-nums', sizeClasses[size], colorClass)}>
      {sign}{formatCurrency(Math.abs(amount), currency)}
    </span>
  );
};
