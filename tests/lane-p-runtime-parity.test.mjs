import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerHooks} from 'node:module';
// TypeScript source keeps its emitted .js specifiers. Resolve only missing
// relative source imports to .ts, without changing production or built files.
registerHooks({resolve(specifier,context,nextResolve){
 try{return nextResolve(specifier,context);}
 catch(error){
  if(error.code==='ERR_MODULE_NOT_FOUND'&&specifier.startsWith('.')&&specifier.endsWith('.js')&&context.parentURL?.includes('/src/'))return nextResolve(specifier.slice(0,-3)+'.ts',context);
  throw error;
 }
}});
const alpha=JSON.parse(readFileSync(new URL('../package.json',import.meta.url))).name.includes('gtm-alpha');
const source=await import('../src/region-reader.ts');
const compiled=await import(alpha?'../netlify/lib/region-reader.js':'../dist/region-reader.js');
for(const product_description of [
 'We receive payments into our India bank account and sell lending software in Singapore.',
 'We sell lending software in India. We do not sell payment gateway software in India.',
 'We do not sell payment gateway software in India. We sell lending software in India.',
 'We sell lending software in India and we do not sell payment gateway software in India.',
 'We sell lending software in India. We do not sell lending software in India.',
 'We sell lending software in India. We cannot sell in India.',
 'We sell lending software in India and managed SOC services in Singapore.',
 'We sell lending software in Singapore under contracts denominated in INR.',
 'We sell lending software in the UK. The UK is not an EU member.',
])test('source and compiled reader parity: '+product_description,()=>{
 const args={product_description};
 assert.deepEqual(compiled.readRegionContext(args),source.readRegionContext(args));
 assert.equal(compiled.regionNotes(args),source.regionNotes(args));
});
