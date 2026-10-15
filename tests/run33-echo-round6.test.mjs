// Run 33D round 6 (from the IMPACT round 4 auditor). Same file in every repo; set ECHO_MODULE (default ../dist/echo-safe.js).
// (1) a code span that runs over lines must not hide an image's "[" (live again on round 4);
// (2) ordinary multi line answers stay byte identical: no backslash before the tool's own "]", a user's task list or link;
// (3) an image with a destination longer than the scan window is inert; (4) a long field does not take quadratic time.
import test from "node:test";
import assert from "node:assert/strict";

const MODULE = process.env.ECHO_MODULE || "../dist/echo-safe.js";
const { neutraliseText, neutraliseAnswer } = await import(new URL(MODULE, import.meta.url));
// an image can only start at "![" whose "!" is not escaped and whose "[" is not escaped
const liveImage = (o) => /(^|[^\\])(\\\\)*!\[/.test(o);

test("a code span that runs over lines does not hide an image", () => {
  for (const answer of [
    "Company: x `y\nz` ![a `\nTarget: b](https://evil.example/c.png)",
    "x `y\nz` ![a `\nb](https://evil.example/c.png)",
    "Note: ``a\n`` ![q ``\nr](https://evil.example/c.png)",
  ]) {
    assert.ok(!liveImage(neutraliseAnswer(answer)), `live: ${JSON.stringify(neutraliseAnswer(answer))}`);
  }
  assert.ok(!liveImage(neutraliseText("x `y\nz` ![a `\nb](https://evil.example/c.png)")));
});

test("ordinary multi line answers with the tool's own brackets, task lists and links stay byte identical", () => {
  for (const answer of [
    "**Proof:** [Only if true and provable: our onboarding\ntakes two weeks for most customers]\n- [ ] security review\n- [x] pricing agreed\nSee [the case study](https://gtmhelix.com/case/) for details.",
    "[Example, replace with your own: Series A logistics software\ncompany, 40 reps (hypothetical)]\nNext: [the guide](https://gtmhelix.com/guide/)",
    "Open [\nthen a line with ] and (a note)",
  ]) {
    assert.equal(neutraliseAnswer(answer), answer);
  }
});

test("an image whose destination is longer than the scan window is inert", () => {
  for (const n of [1500, 1600, 5000]) {
    const input = "![a](https://evil.example/" + "p".repeat(n) + ")";
    assert.ok(!liveImage(neutraliseText(input)), `live for ${n}`);
    assert.ok(!liveImage(neutraliseAnswer("Logo: " + input)), `live in an answer for ${n}`);
  }
});

test("a long field with many brackets does not take quadratic time", () => {
  const field = "[a](".repeat(5000) + "x".repeat(50000);
  const t0 = Date.now();
  neutraliseAnswer("Field: " + field + "\nNext line");
  neutraliseText(field);
  assert.ok(Date.now() - t0 < 4000, `took ${Date.now() - t0} ms`);
});
