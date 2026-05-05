import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import app from './app';

test('GET /api/health returns server health payload', async () => {
  const response = await request(app).get('/api/health');

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.message, 'Server is running');
  assert.equal(typeof response.body.data?.uptime, 'number');
  assert.ok(['connected', 'disconnected'].includes(response.body.data?.dbStatus));
});
