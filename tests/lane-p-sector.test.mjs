import test from 'node:test';import assert from 'node:assert/strict';
import {explainSector} from '../dist/verticals.js';
for(const [text,want,subtype] of [
 ['We do not sell lending software in India. We sell warehouse management software to warehouse operators in Singapore.','logistics-tech','warehousing'],
 ['We sell warehouse management software to warehouse operators in Singapore. We do not sell lending software in India.','logistics-tech','warehousing'],
 ['We do not sell wealth management software in UAE. We sell payment gateway software in India.','fintech','payments-banking'],
 ['We do not sell managed SOC services in India. We sell lending software in Singapore.','fintech','lending'],
])test('M077 whole sector: '+text,()=>{
 const read=()=>explainSector({seller:[text]});const first=read();assert.equal(first.vertical?.id,want);assert.equal(first.vertical?.subtype,subtype);assert.deepEqual(read(),first);assert.deepEqual(read(),first);
});
