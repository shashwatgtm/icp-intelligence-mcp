// Run 22 (test first): a human risk or security awareness training platform is not an email filter. Its words matched the email
// security sub type, so its answers carried gateway notes (monitor mode next to the current filter, mail flow risk). A sub type of
// its own, with its own notes, now reads it. Invented descriptions only. Same file in every repo that holds the shared sector file.
import { test } from "node:test";
import assert from "node:assert/strict";

const MODULE = process.env.VERTICALS_MODULE || "../dist/verticals.js";
const { explainSector, SUBTYPES } = await import(new URL(MODULE, import.meta.url));
const read = (text) => explainSector({ seller: [text] }).vertical;

test("a human risk platform with adaptive phishing training and awareness training reads as the awareness sub type", () => {
  const v = read("A human risk management platform that automates adaptive phishing training and security awareness training for staff, with one click reporting");
  assert.equal(v && v.id, "cybersecurity");
  assert.equal(v.subtype, "awareness-training");
});

test("the awareness notes do not talk about mail flow, gateways or monitor mode", () => {
  const v = read("Security awareness training that changes how employees handle suspicious messages");
  assert.equal(v.subtype, "awareness-training");
  const text = JSON.stringify([v.committee, v.objections, v.salesMotion, v.proofShape, v.discovery]).toLowerCase();
  assert.ok(!/monitor mode|mail flow|gateway|quarantine/.test(text), text.slice(0, 300));
  assert.match(v.metrics.join(" "), /report/i);
});

test("an email gateway product is still the email security sub type", () => {
  const v = read("A secure email gateway that blocks business email compromise and malicious attachments before they reach mailboxes");
  assert.equal(v.subtype, "email-security");
});

test("a product that says both phishing simulation and awareness training is not read as an email gateway", () => {
  const v = read("A human risk platform: phishing simulation and security awareness training for employees");
  assert.equal(v.id, "cybersecurity");
  assert.notEqual(v.subtype, "email-security");
});

test("the new sub type's text has no digit, dash, health word or named company", () => {
  const st = SUBTYPES.find((s) => s.id === "awareness-training");
  assert.ok(st, "sub type missing");
  const text = JSON.stringify([st.name, st.notes]);
  assert.ok(!/[0-9–—]/.test(text), "digit or long dash");
  assert.ok(!/clinic|pharmac|patient|hospital|medical|health/i.test(text), "health word");
});
