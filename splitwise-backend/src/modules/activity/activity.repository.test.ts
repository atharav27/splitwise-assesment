import assert from 'node:assert/strict';
import test from 'node:test';
import * as activityRepo from './activity.repository';

const models = require('../../models');

test('findByUser queries activities where requester is actor or audience', async () => {
  const captured: { filter?: Record<string, unknown> } = {};
  const originalFind = models.Activity.find;
  models.Activity.find = (filter: Record<string, unknown>) => {
    captured.filter = filter;
    return {
      populate: () => ({
        populate: () => ({
          sort: () => ({
            limit: () => ({
              lean: async () => [],
            }),
          }),
        }),
      }),
    };
  };

  try {
    await activityRepo.findByUser('507f1f77bcf86cd799439011', undefined, 20);
    assert.deepEqual(captured.filter, {
      $or: [
        { userId: '507f1f77bcf86cd799439011' },
        { audienceUserIds: '507f1f77bcf86cd799439011' },
      ],
    });
  } finally {
    models.Activity.find = originalFind;
  }
});

test('log normalizes audience list to unique values', async () => {
  const calls: Array<Record<string, unknown>> = [];
  const originalCreate = models.Activity.create;
  models.Activity.create = async (payload: Record<string, unknown>) => {
    calls.push(payload);
    return payload;
  };

  try {
    activityRepo.log({
      userId: '507f1f77bcf86cd799439011',
      action: 'settlement.paid',
      entityType: 'Settlement',
      entityId: '507f1f77bcf86cd799439012',
      audienceUserIds: [
        '507f1f77bcf86cd799439013',
        '507f1f77bcf86cd799439013',
        '507f1f77bcf86cd799439014',
      ],
      metadata: {},
    });

    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].audienceUserIds, [
      '507f1f77bcf86cd799439013',
      '507f1f77bcf86cd799439014',
    ]);
  } finally {
    models.Activity.create = originalCreate;
  }
});
