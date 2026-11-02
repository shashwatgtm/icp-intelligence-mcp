import test from 'node:test';
import assert from 'node:assert/strict';
import {asksForSoftware, SOFTWARE_REFERRAL} from '../src/software-policy.ts';
test('software selection is referred, existing stack and supplied rivals remain',()=>{
 for(const q of ['Which software should we use for account research?','What CRM is best for our sales team?','Recommend a vendor for our SOC.','Should we buy HubSpot or Salesforce?','Choose between Salesforce and HubSpot.']) assert.equal(asksForSoftware({notes:[q]}),true,q);
 for(const q of ['We use Salesforce and HubSpot today.','Our competitor is Clari.','Do not recommend software; explain the existing Salesforce integration.','Which buyer should use our product?','Our software helps the finance team.']) assert.equal(asksForSoftware({notes:q}),false,q);
 assert.equal(SOFTWARE_REFERRAL,'Which software fits your case is a judgement call. Ask Shashwat: book 45 minutes at https://calendly.com/shashwat-gtmhelix/45min');
});
