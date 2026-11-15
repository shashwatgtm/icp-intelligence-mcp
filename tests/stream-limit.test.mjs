import test from 'node:test';
import assert from 'node:assert/strict';
import { readLimitedText } from '../netlify/lib/read-limited-text.mjs';

test('stream counts bytes, preserves split UTF8 and cancels before another read', async () => {
  const bytes = new TextEncoder().encode('A€');
  function example() {
    let position = 0;
    let cancelled = false;
    const body = new ReadableStream({
      pull(controller) {
        if (position === bytes.length) return controller.close();
        controller.enqueue(bytes.subarray(position, ++position));
      },
      cancel() { cancelled = true; },
    }, { highWaterMark: 0 });
    return { body, state: () => ({ position, cancelled }) };
  }
  assert.equal(await readLimitedText(example(), 4), 'A€');
  const short = example();
  assert.equal(await readLimitedText(short, 2), null);
  assert.deepEqual(short.state(), { position: 3, cancelled: true });
  assert.equal(await readLimitedText({ body: null }, 2), '');
});
