// 13 Nov 2026 (owner): usage count records keep the day only and are deleted after 90 days.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cutoffDay, pruneUsage, KEEP_DAYS } from '../netlify/lib/usage-count.mjs';
test('usage counts: the key holds the day only, never the time', () => {
  const source = readFileSync(new URL('../netlify/lib/usage-count.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /Date\.now\(\)/);
  assert.match(source, /const key = `\$\{day\}\/\$\{server\}\/\$\{tool\}\/\$\{app\}\/\$\{route\}\/\$\{randomUUID\(\)\}`/);
  assert.match(source, /const day = new Date\(\)\.toISOString\(\)\.slice\(0, 10\)/);
});
test('usage counts: records older than 90 days are deleted, newer ones stay', async () => {
  assert.equal(KEEP_DAYS, 90);
  const now = new Date('2026-11-13T10:00:00Z');
  assert.equal(cutoffDay(now), '2026-08-15');
  const keys = ['2026-08-14/s/t/claude/mcp/a', '2026-08-15/s/t/claude/mcp/b', '2026-11-13/s/t/browser/web/c', '2026-01-01/s/t/none/mcp/d', 'not-a-day/x'];
  const deleted = [];
  const store = { list: async () => ({ blobs: keys.map(key => ({ key, etag: 'e' })), directories: [] }), delete: async key => { deleted.push(key); } };
  const result = await pruneUsage(store, now);
  assert.deepEqual(deleted, ['2026-08-14/s/t/claude/mcp/a', '2026-01-01/s/t/none/mcp/d']);
  assert.deepEqual(result, { cutoff: '2026-08-15', deleted: 2 });
});
test('usage counts: the prune runs daily as a scheduled function', async () => {
  const { config } = await import('../netlify/functions/usage-prune.mjs');
  assert.equal(config.schedule, '@daily');
});
test('privacy page states the day-only record and the 90 day deletion', () => {
  for (const file of ['../public/privacy/index.html', '../PRIVACY.md']) {
    const page = readFileSync(new URL(file, import.meta.url), 'utf8');
    assert.match(page, /usage count records keep only the day of the call, not the time, and every record is deleted after 90 days\./, file);
    assert.doesNotMatch(page, /no set end date|The date and time of the call/, file);
  }
});
