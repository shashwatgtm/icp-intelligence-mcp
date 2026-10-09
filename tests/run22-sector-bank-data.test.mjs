// Run 22 (test first): a bank data network (bank account connection, account and routing number verification, balance checks, ACH
// return risk) was read as lending and credit data because the words for bank connections were not in the payments and banking
// sub type. They are now; when income words also appear the reader names no sub type (generic fintech notes), never lending. A lender that only verifies income stays lending. Invented descriptions only.
// Same file in every repo that holds the shared sector file.
import { test } from "node:test";
import assert from "node:assert/strict";

const MODULE = process.env.VERTICALS_MODULE || "../dist/verticals.js";
const { explainSector } = await import(new URL(MODULE, import.meta.url));
const read = (text) => explainSector({ seller: [text] }).vertical;

test("a bank data network that also verifies income is not read as lending and credit data", () => {
  const v = read("A network for apps: bank account connection through a hosted widget, account and routing number verification, real-time balance checks, ACH return risk prediction and income verification");
  assert.equal(v && v.id, "fintech");
  assert.notEqual(v.subtype, "lending");
});

test("a bank data network without income words reads as payments and banking APIs", () => {
  const v = read("A network for apps: bank account connection through a hosted widget, account and routing number verification, real-time balance checks and ACH return risk prediction");
  assert.equal(v && v.id, "fintech");
  assert.equal(v.subtype, "payments-banking");
});

test("bank account connection and ACH payments alone read as payments and banking APIs", () => {
  const v = read("Bank account connection and ACH payments for software platforms that move money for their customers");
  assert.equal(v.subtype, "payments-banking");
});

test("a lender that verifies income stays lending and credit data", () => {
  const v = read("Loan origination software for lenders, with income verification and credit underwriting");
  assert.equal(v.subtype, "lending");
});

test("a bank statement analysis tool for lenders stays lending and credit data", () => {
  const v = read("Bank statement analysis and credit decisioning for consumer lending teams");
  assert.equal(v.subtype, "lending");
});
