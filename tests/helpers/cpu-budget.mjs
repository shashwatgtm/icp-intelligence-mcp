// Keep the parent responsive so even a synchronous hang has a hard wall bound.
import assert from "node:assert/strict";
import { Worker } from "node:worker_threads";

const WORKER = `
  const { parentPort, workerData } = require("node:worker_threads");
  (async () => {
    const { moduleUrl, exportName, inputs } = workerData;
    const fn = (await import(moduleUrl))[exportName];
    // Warm each size once. Measure each once. No retries or best-of selection.
    for (const input of inputs) { fn(input.slice(0, Math.ceil(input.length / 4))); fn(input); }
    const samples = [];
    const measure = (input) => {
      const start = process.cpuUsage();
      const output = fn(input);
      const cpu = process.cpuUsage(start);
      if (typeof output !== "string") throw new Error("expected string output");
      return (cpu.user + cpu.system) / 1000;
    };
    for (const input of inputs) {
      samples.push([measure(input.slice(0, Math.ceil(input.length / 4))), measure(input)]);
    }
    parentPort.postMessage(samples);
  })().catch((error) => { throw error; });
`;

export async function assertCpuBudget(moduleUrl, exportName, inputs, budgetMs, aggregate = false) {
  const worker = new Worker(WORKER, {
    eval: true,
    workerData: { moduleUrl: String(moduleUrl), exportName, inputs },
  });
  let timer;
  let samples;
  try {
    samples = await new Promise((resolve, reject) => {
      // Includes import, warmup and measurement. Parent stays idle while measuring.
      timer = setTimeout(() => reject(new Error("timing worker exceeded 15000 ms wall bound")), 15000);
      worker.once("message", resolve);
      worker.once("error", reject);
      worker.once("exit", (code) => reject(new Error(`timing worker exited without samples: ${code}`)));
    });
  } finally {
    clearTimeout(timer);
    await worker.terminate();
  }
  assert.equal(samples.length, inputs.length);
  const large = samples.map((pair) => pair[1]);
  const checked = aggregate ? [large.reduce((a, b) => a + b, 0)] : large;
  for (const [index, ms] of checked.entries()) {
    assert.ok(Number.isFinite(ms) && ms < budgetMs,
      `CPU budget exceeded: ${ms.toFixed(2)} ms >= ${budgetMs} ms (${aggregate ? "all inputs" : `input ${index}`})`);
  }
  for (const [index, [small, large]] of samples.entries()) {
    // Four times the input allows up to eight times the CPU. A 5 ms floor
    // avoids dividing by timer noise for very cheap inputs. Quadratic growth
    // tends toward sixteen times and fails once the workload exceeds that floor.
    assert.ok(large < 8 * Math.max(small, 5),
      `superlinear CPU growth on input ${index}: ${small.toFixed(2)} -> ${large.toFixed(2)} ms`);
  }
  console.log(`timing CPU ms [quarter, full]: ${JSON.stringify(samples)}`);
}
