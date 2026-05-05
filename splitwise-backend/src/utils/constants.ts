export const SPLIT_TYPES = {
  EQUAL: 'equal',
  UNEQUAL: 'unequal',
  PERCENTAGE: 'percentage',
} as const;

export const CATEGORIES = {
  FOOD: 'food',
  TRAVEL: 'travel',
  UTILITIES: 'utilities',
  ENTERTAINMENT: 'entertainment',
  OTHER: 'other',
} as const;

export const ACTIVITY_ACTIONS = {
  EXPENSE_CREATED: 'expense.created',
  EXPENSE_UPDATED: 'expense.updated',
  EXPENSE_DELETED: 'expense.deleted',
  SETTLEMENT_PAID: 'settlement.paid',
  BALANCE_AUTO_NETTED: 'balance.auto_netted',
  GROUP_CREATED: 'group.created',
  MEMBER_ADDED: 'member.added',
  MEMBER_REMOVED: 'member.removed',
} as const;

export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'] as const;

export const DUST_THRESHOLD = 0.01;
