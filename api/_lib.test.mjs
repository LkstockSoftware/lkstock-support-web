import test from 'node:test';
import assert from 'node:assert/strict';

import { allowedOperator, bearerToken } from './_lib.js';

test('only the configured operator email is authorized', () => {
  assert.equal(allowedOperator('lkstocksoftware@gmail.com', 'lkstocksoftware@gmail.com'), true);
  assert.equal(allowedOperator('other@example.com', 'lkstocksoftware@gmail.com'), false);
  assert.equal(allowedOperator('', 'lkstocksoftware@gmail.com'), false);
});

test('extracts a bearer access token only from the Bearer scheme', () => {
  assert.equal(bearerToken('Bearer token-123'), 'token-123');
  assert.equal(bearerToken('Basic token-123'), null);
  assert.equal(bearerToken(null), null);
});
