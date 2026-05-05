import assert from 'node:assert/strict';
import test from 'node:test';
import { signedDebtFromUserToUser } from './ledgerNetting';

test('signedDebtFromUserToUser returns positive when payer owes payee in canonical order', () => {
  const debt = signedDebtFromUserToUser('111111111111111111111111', '222222222222222222222222', 75);
  assert.equal(debt, 75);
});

test('signedDebtFromUserToUser flips sign when payer/payee are reverse canonical order', () => {
  const debt = signedDebtFromUserToUser('222222222222222222222222', '111111111111111111111111', 75);
  assert.equal(debt, -75);
});
