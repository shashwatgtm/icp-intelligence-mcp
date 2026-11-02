import test from 'node:test';
import assert from 'node:assert/strict';
import {detectBilling as detectModel} from '../src/verticals.ts';
test('billing is independent of product and buyer nouns, and respects the opposite statement', () => {
 for (const product of ['Dispatch planning software for freight fleets','Payment reconciliation software for finance teams','Onboarding software for account teams','Dental scheduling software for clinic managers','AI invoice extraction software for finance teams','Service desk software for support teams','Network monitoring software for telecom operations','Inventory software for manufacturers','Vulnerability triage software for SOC teams']) {
  for (const fact of ['We charge a monthly subscription per user.','Customers pay us a recurring monthly fee for each user.']) assert.deepEqual(detectModel(undefined,{seller:[product+'. '+fact]}),{model:'saas',how:'read'});
  assert.notEqual(detectModel(undefined,{seller:[product]}).how,'read');
  assert.deepEqual(detectModel(undefined,{seller:[product+'. We do not sell subscriptions. Customers pay once for a perpetual licence.']}),{model:null,how:'unknown'});
 }
 assert.deepEqual(detectModel('services',{seller:['Software with a subscription']}),{model:'services',how:'input'});
});
