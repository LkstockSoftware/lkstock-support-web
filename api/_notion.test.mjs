import test from 'node:test';
import assert from 'node:assert/strict';

import { notionState } from './_notion.js';

test('maps portal actions to Notion ticket states', () => {
  assert.equal(notionState('takeover'), 'En atención');
  assert.equal(notionState('return_to_bot'), 'Pendiente');
  assert.equal(notionState('close'), 'Cerrado');
});
