import assert from 'node:assert/strict';
import test from 'node:test';
import { optimizeSettlements } from './settlementOptimizer';

test('optimizeSettlements collapses a simple chain into one transaction', () => {
  const entries = [
    { fromUser: 'A', toUser: 'B', amount: 50 },
    { fromUser: 'B', toUser: 'C', amount: 50 },
  ];
  const userMap = {
    A: { _id: 'A', name: 'A' },
    B: { _id: 'B', name: 'B' },
    C: { _id: 'C', name: 'C' },
  };

  const transactions = optimizeSettlements(entries, userMap);

  assert.equal(transactions.length, 1);
  assert.equal((transactions[0].from as { _id: string })._id, 'A');
  assert.equal((transactions[0].to as { _id: string })._id, 'C');
  assert.equal(transactions[0].amount, 50);
});
