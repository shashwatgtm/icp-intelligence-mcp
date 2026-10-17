// Run 22 (test first): a localisation or translation management platform is software sold by subscription, so it reads as SaaS.
// Before this change the shared reader returned no sector for it, and the tools printed "sector not clear" with generic tiers.
// Invented descriptions only. Same file in every repo that holds the shared sector file.
import { test } from "node:test";
import assert from "node:assert/strict";

const MODULE = process.env.VERTICALS_MODULE || "../dist/verticals.js";
const { explainSector } = await import(new URL(MODULE, import.meta.url));
const idOf = (text) => { const e = explainSector({ seller: [text] }); return e.vertical ? e.vertical.id : null; };

test("a localisation platform for product and marketing teams is SaaS", () => {
  assert.equal(idOf("A localization platform that helps product, engineering and marketing teams translate and ship software in many languages"), "saas");
  assert.equal(idOf("Localisation management software with an API and plugins for apps and websites"), "saas");
});

test("translation management software is SaaS", () => {
  assert.equal(idOf("Translation management software with a command line tool and SDKs for apps"), "saas");
  assert.equal(idOf("A translation platform for websites and documentation"), "saas");
});

test("software localization wording is SaaS", () => {
  assert.equal(idOf("Software localization for mobile games and apps"), "saas");
});

test("indoor localization hardware is not read as SaaS", () => {
  assert.notEqual(idOf("Indoor localization sensors that track assets and forklifts in warehouses"), "saas");
  assert.notEqual(idOf("Robot localization modules for autonomous vehicles"), "saas");
});

test("a company that translates documents for people (a services firm) is not read as SaaS by this rule", () => {
  assert.notEqual(idOf("Certified human translation services for legal contracts and court documents"), "saas");
});
