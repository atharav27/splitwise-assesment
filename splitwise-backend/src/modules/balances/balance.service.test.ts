import assert from 'node:assert/strict';
import test from 'node:test';
import { filterGroupRowsByGlobalTruth } from './balance.service';

const user = (id: string) => ({ _id: { toString: () => id }, name: id });

test('filterGroupRowsByGlobalTruth hides group row when pair is globally settled', () => {
  const rows = filterGroupRowsByGlobalTruth(
    [{ userId: 'u1', amount: 50, direction: 'owe', groupId: 'g1' }],
    []
  );
  assert.equal(rows.length, 0);
});

test('filterGroupRowsByGlobalTruth keeps row when global outstanding exists in same direction', () => {
  const rows = filterGroupRowsByGlobalTruth(
    [{ userId: 'u1', amount: 50, direction: 'owe', groupId: 'g1' }],
    [{ user: user('u1'), netAmount: 80, direction: 'owe' }]
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].userId, 'u1');
  assert.equal(rows[0].direction, 'owe');
});

test('filterGroupRowsByGlobalTruth hides row when global direction mismatches', () => {
  const rows = filterGroupRowsByGlobalTruth(
    [{ userId: 'u1', amount: 50, direction: 'owe', groupId: 'g1' }],
    [{ user: user('u1'), netAmount: 50, direction: 'owed' }]
  );
  assert.equal(rows.length, 0);
});
