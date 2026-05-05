import assert from 'node:assert/strict';
import test from 'node:test';
import * as groupRepo from './group.repository';

const models = require('../../models');

test('hasOutstandingForMemberInGroup returns true when Ledger.exists finds a row', async () => {
  const originalExists = models.Ledger.exists;
  models.Ledger.exists = async () => ({ _id: 'ledger-row' });
  try {
    const result = await groupRepo.hasOutstandingForMemberInGroup(
      '507f1f77bcf86cd799439011',
      '507f1f77bcf86cd799439012'
    );
    assert.equal(result, true);
  } finally {
    models.Ledger.exists = originalExists;
  }
});

test('hasOutstandingForMemberInGroup returns false when Ledger.exists returns null', async () => {
  const originalExists = models.Ledger.exists;
  models.Ledger.exists = async () => null;
  try {
    const result = await groupRepo.hasOutstandingForMemberInGroup(
      '507f1f77bcf86cd799439011',
      '507f1f77bcf86cd799439012'
    );
    assert.equal(result, false);
  } finally {
    models.Ledger.exists = originalExists;
  }
});
