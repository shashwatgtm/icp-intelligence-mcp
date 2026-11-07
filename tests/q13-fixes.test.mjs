import test from 'node:test';
import assert from 'node:assert/strict';
import { computeAccountPrioritization } from '../src/account-prioritization.ts';

test('RC-11: computeAccountPrioritization handles relationship=0 without assuming a warm contact', () => {
  const cold = computeAccountPrioritization({
    accounts: [{ name: 'ColdCo', fit_score: 85, intent_signals: 80, relationship: 0, timing: 'now' }],
  });
  assert.equal(cold.mode, 'ranking');
  assert.match(cold.scoredAccounts[0].nextAction, /relationship is 0, so map the buying group/);
});

test('RC-11: a relationship score above 0 keeps the champion introduction step', () => {
  const warm = computeAccountPrioritization({
    accounts: [{ name: 'WarmCo', fit_score: 85, intent_signals: 80, relationship: 40, timing: 'now' }],
  });
  assert.equal(warm.mode, 'ranking');
  assert.match(warm.scoredAccounts[0].nextAction, /relationship is 40, so ask your champion or a mutual contact/);
});
