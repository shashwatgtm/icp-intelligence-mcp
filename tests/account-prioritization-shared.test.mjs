// Account Prioritization: the text answer and the results view come from one calculation (src/account-prioritization.ts),
// so the ranking in the text table and the ranking in structuredContent are the same rows in the same order.
import test from 'node:test';
import assert from 'node:assert/strict';
const { default: handler } = await import(new URL('../netlify/functions/mcp.mjs', import.meta.url));
let id = 0;
const call = async (args) => (await (await handler(new Request('https://local.invalid/mcp', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: JSON.stringify({ jsonrpc: '2.0', id: ++id, method: 'tools/call', params: { name: 'account_prioritization', arguments: args } }) }))).json()).result;
const cells = (line) => line.split('|').slice(1, -1).map((c) => c.trim().replace(/\*\*/g, ''));
const rows = (text, header) => { const lines = text.split('\n'), i = lines.findIndex((l) => l.startsWith(header)); const out = []; for (let j = i + 2; i >= 0 && j < lines.length && lines[j].startsWith('|'); j++) out.push(cells(lines[j])); return out; };
const a = (name, fit, intent, rel, timing) => ({ name, fit_score: fit, intent_signals: intent, relationship: rel, timing });

test('ranked answers: text table rows equal the structured ranking, with reasons and next steps for the first five only', async () => {
  for (const args of [
    { accounts: [a('Account Alpha', 40, 30, 20, 'later'), a('Account Beta', 95, 90, 80, 'now'), a('Account Gamma', 70, 60, 50, 'soon')] },
    { accounts: [1, 2, 3, 4, 5, 6, 7].map((n) => a('Account ' + n, 100 - n * 9, 90 - n * 7, 80 - n * 5, ['now', 'soon', 'later'][n % 3])), prioritization_weights: { fit: 35, intent: 35, relationship: 15, timing: 15 } },
    { accounts: [a('Account Alpha', 88.5, 72.25, 61, 'now'), a('Account Beta', 41.75, 33, 22, 'later')], prioritization_weights: { fit: 33.3, intent: 33.3, relationship: 33.3, timing: 0.1 } },
  ]) {
    const r = await call(args), text = r.content[0].text, result = r.structuredContent.result;
    assert.equal(result.mode, 'ranking');
    assert.deepEqual(rows(text, '| Rank | Account |').map((c) => [c[0], c[1], c[6], c[7]]), result.accounts.map((x) => [String(x.rank), x.name, String(x.total), x.tier]));
    for (const x of result.accounts) {
      if (x.rank <= 5) { assert.ok(text.includes('- **Why prioritized**: ' + x.reason)); assert.ok(text.includes('- **Recommended action**: ' + x.nextAction)); }
      else { assert.equal(x.reason, null); assert.equal(x.nextAction, null); }
    }
    assert.deepEqual(r._meta.helixResults.accounts, result);
    assert.deepEqual(await call(args), r);
  }
});

test('missing signals: possible score ranges and ranks equal the text, and no rank is invented where ranges overlap', async () => {
  for (const args of [
    { accounts: [a('Account Alpha', 80, 70, undefined, 'now'), a('Account Beta', 30, 20, 10, 'later')] },
    { accounts: [{ name: 'Account Alpha', timing: 'now' }, { name: 'Account Beta', timing: 'soon' }] },
    { accounts: [a('Account Alpha', 70, 70, 70, 'now'), a('Account Beta', 70, 70, 70, 'now')] },
    { accounts: [a('Account Alpha', 80, 70, 60, 'not now'), a('Account Beta', 70, 60, 50, 'soon')] },
  ]) {
    const r = await call(JSON.parse(JSON.stringify(args))), text = r.content[0].text, result = r.structuredContent.result;
    assert.equal(result.mode, 'intervals');
    assert.deepEqual(rows(text, '| Account | Fit | Intent |').map((c) => [c[0], c[5], c[6]]), result.accounts.map((x) => [x.name, `${x.low} to ${x.high} of ${result.maximum}`, x.rank === null ? 'Unresolved: overlapping intervals' : String(x.rank)]));
    if (result.nextEvidence) assert.ok(text.includes(`Confirm ${result.nextEvidence.factor} for ${result.nextEvidence.account || 'the unnamed account'} first.`));
  }
});

test('no accounts: the framework answer carries an empty ranking; an input error carries none', async () => {
  const r = await call({ product_category: 'a project planning workspace for agency teams' });
  assert.equal(r.structuredContent.result.mode, 'framework');
  assert.deepEqual(r.structuredContent.result.accounts, []);
  const e = await call({ accounts: [{ name: 'Account Alpha', fit_score: 150 }] });
  assert.equal(e.isError, true);
  assert.equal(e.structuredContent, undefined);
});
