import {writeFileSync, readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
export default async function* (source) {
  const tests = [];
  let summary;
  for await (const event of source) {
    if (event.type === 'test:pass' || event.type === 'test:fail') {
      const d = event.data;
      // Test names only contain public scenario IDs; still publish a digest.
      const cause = d.details?.error?.cause;
      tests.push({test_sha256:createHash('sha256').update(d.name).digest('hex'), status:d.skip ? 'skipped' : event.type === 'test:pass' ? 'passed' : 'failed', file:d.file?.replaceAll('\\','/').split('/tests/').at(-1), line:d.line, error_code:d.details?.error?.code, operator:cause?.operator, failure_sha256:cause ? createHash('sha256').update(JSON.stringify({message:cause.message, actual:cause.actual, expected:cause.expected, operator:cause.operator})).digest('hex') : undefined});
    }
    if (event.type === 'test:summary') summary = event.data;
  }
  const receipt = {tests, counts:{tests:tests.length, passed:tests.filter(t=>t.status==='passed').length, failed:tests.filter(t=>t.status==='failed').length, skipped:tests.filter(t=>t.status==='skipped').length}, node:process.version};

  writeFileSync(process.env.PRIVATE_RECEIPT, JSON.stringify(receipt,null,2)+'\n');
  yield JSON.stringify(receipt.counts)+'\n';
}
