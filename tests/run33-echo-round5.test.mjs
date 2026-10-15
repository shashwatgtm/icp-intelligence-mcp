// Run 33D round 5 (from the GTM Alpha round 4 auditor): an image whose quoted title holds "(" was left live, on the base too.
// Same file in every repo. The import path is the only difference: set ECHO_MODULE (default ../dist/echo-safe.js).
import test from "node:test";
import assert from "node:assert/strict";

const MODULE = process.env.ECHO_MODULE || "../dist/echo-safe.js";
const { neutraliseText, neutraliseAnswer } = await import(new URL(MODULE, import.meta.url));
// an image is live when "![" is not escaped (CommonMark: a backslash before "[" makes it plain text)
const LIVE_BANG = /(?<!\\)!\[(?!\\)/;

test("an image whose title holds an unbalanced ( is made inert, in a field and in an answer", () => {
  for (const input of [
    "![a](https://evil.example/c.png '(')",
    "![a](https://evil.example/c.png \"(x\")",
    "![a](https://evil.example/c.png '((')",
    "Logo: ![a](https://evil.example/c.png '(') here",
  ]) {
    for (const o of [neutraliseText(input), neutraliseAnswer(input)]) {
      assert.doesNotMatch(o, LIVE_BANG, `live: ${o}`);
      assert.ok(o.includes("evil.example/c.png"), `words lost: ${o}`);
    }
    assert.equal(neutraliseText(neutraliseText(input)), neutraliseText(input), `not idempotent: ${input}`);
  }
});

test("an image with a balanced title is still replaced by its alt text, as before", () => {
  assert.equal(neutraliseText("![a](<https://evil.example/c.png> '(')"), "[image removed: a]");
  assert.equal(neutraliseText("x ![a](https://evil.example/c.png (\"t\"))"), "x [image removed: a]");
  assert.equal(neutraliseText("![logo](https://evil.example/c.png \"Logo\")"), "[image removed: logo]");
});
