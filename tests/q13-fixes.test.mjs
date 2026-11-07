import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { softwareAdvice, SOFTWARE_REFERRAL } from '../src/software-policy.ts';
import { pointsFor, readProfile } from '../src/rw-icp.ts';
import { computeAccountPrioritization } from '../src/account-prioritization.ts';
import { explainSector } from '../src/verticals.ts';

test('RC-01 & RC-02: softwareAdvice triggers on comparative tool questions and suppresses on governance prose', () => {
  assert.equal(softwareAdvice({ product_category: 'Which contact database is better than ZoomInfo?' }), SOFTWARE_REFERRAL);
  assert.equal(softwareAdvice({ current_icp: 'Our governance rules require a signed DPIA before any software vendor is onboarded.' }), null);
});

test('RC-03 & Named Item 1: tam_sam_som_calculator does not print SOFTWARE_REFERRAL on ordinary sizing runs', () => {
  const src = readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /Company count accuracy\*\*:[^\n]*SOFTWARE_REFERRAL/);
  assert.doesNotMatch(src, /Company records already available to you\*\*:[^\n]*SOFTWARE_REFERRAL/);
});

test('RC-04: tam_sam_som_calculator caps Year 2 and Year 3 market share at 100% of SAM', () => {
  const src = readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8');
  assert.match(src, /Math\.min\(1, marketSharePercent \* 2\)/);
  assert.match(src, /Math\.min\(1, marketSharePercent \* 4\)/);
});

test('RC-08: vertical-saas matches salon, spa, fitness and clinic software', () => {
  const res = explainSector({ seller: ['Multi-location salon and spa booking software'] });
  assert.equal(res.vertical?.id, 'vertical-saas');
});

test('RC-09 & RC-22: readProfile preserves segments with inline (hypothetical) and moves negated segments to outside', () => {
  const p = readProfile('Mid-size logistics companies (hypothetical), fintechs; no enterprise accounts');
  assert.ok(p.hypothetical);
  assert.ok(p.segments.some(s => /logistics/i.test(s)));
  assert.ok(p.outside.some(s => /no enterprise/i.test(s)));
});

test('RC-11: pointsFor gives positive points to second positive value and 0 points to churn/disqualifier values', () => {
  const twoPositive = pointsFor('Cloud Budget', ['$50k+/month AWS spend', 'Rapidly scaling Kubernetes cluster'], 25, true);
  assert.equal(twoPositive.points[0], 25);
  assert.equal(twoPositive.points[1], 15);
  const withChurn = pointsFor('Segment Fit', ['Mid-market SaaS', 'Single-user trial signups that churn within 60 days'], 25, true);
  assert.equal(withChurn.points[0], 25);
  assert.equal(withChurn.points[1], 0);
});

test('RC-11: computeAccountPrioritization ignores zero-weight unknown dimensions and handles relationship=0 without assuming a warm contact', () => {
  const ranked = computeAccountPrioritization({
    prioritization_weights: { fit: 50, intent: 50, relationship: 0, timing: 0 },
    accounts: [
      { name: 'Acme', fit_score: 80, intent_signals: 60 },
      { name: 'Beta', fit_score: 70, intent_signals: 50 },
    ],
  });
  assert.equal(ranked.mode, 'ranking');
  const cold = computeAccountPrioritization({
    accounts: [{ name: 'ColdCo', fit_score: 85, intent_signals: 80, relationship: 0, timing: 'now' }],
  });
  assert.equal(cold.mode, 'ranking');
  assert.match(cold.scoredAccounts[0].nextAction, /relationship is 0, so map the buying group/);
});

test('Named Item 5: package.json check:current-dist sets WIDGET_TOOL_PROFILE=slice', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.scripts['check:current-dist'], 'WIDGET_TOOL_PROFILE=slice node scripts/check-current-dist.mjs');
});
