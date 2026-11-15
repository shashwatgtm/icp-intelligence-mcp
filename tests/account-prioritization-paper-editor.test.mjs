import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';
const load = file => readFileSync(new URL(file, import.meta.url),'utf8');
const config = JSON.parse(load('../ui/account-prioritization-fields.json'));
const source = load('../ui/account-prioritization-editor.js');
const generated = load('../src/account-prioritization-editor-html.ts');
const html = JSON.parse(generated.match(/export const EDITABLE_RESULTS_HTML: string = (".*");/s)[1]);
function mount() {
  const {document,window} = parseHTML(html);
  const panel = document.getElementById('tool-editor');
  const form = panel.querySelector('form');
  const requests = [], outputs = [];
  const hook = vm.runInNewContext(source + '\ncreateResultEditor', {document});
  const editor = hook(panel,config,{
    available: () => true,
    call(name,args) {return new Promise((resolve,reject)=> requests.push({name,args,resolve,reject}));},
    render(result) {outputs.push(result);}
  });
  const inputs = [...form.querySelectorAll('textarea,input,select')];
  // linkedom exposes select.value as a getter. Chromium also has the standard setter.
  for(const select of form.querySelectorAll('select')){
    Object.defineProperty(select,'value',{get(){return this.querySelector('option[selected]')?.value ?? '';},set(v){for(const opt of this.querySelectorAll('option')) {if(opt.value===v)opt.setAttribute('selected','');else opt.removeAttribute('selected');}}});
  }
  const submit=()=>form.dispatchEvent(new window.Event('submit',{cancelable:true,bubbles:true}));
  const edit=()=>form.dispatchEvent(new window.Event('input',{bubbles:true}));
  return {editor,inputs,submit,edit,panel,requests,outputs};
}
test('the existing Paper view contains one editor, one host handshake and matching CSP hashes',()=>{
  assert.equal((html.match(/id="tool-editor"/g)||[]).length,1);
  for(const tag of ['script','style']){
    const body=html.match(new RegExp('<'+tag+'>([\\s\\S]*?)</'+tag+'>'))[1];
    assert.ok(html.includes("sha256-"+createHash('sha256').update(body).digest('base64')));
  }
  assert.equal((html.match(/<script>/g)||[]).length,1);
  assert.ok(html.includes('ui/initialize'));
});
test('the editor preserves supplied values including zero, omitted fields and literal text',()=>{
  const ui=mount(),args={"product_category": "access review", "accounts": [{"name": "Account A", "fit_score": 35, "intent_signals": 0, "relationship": 65, "timing": "later"}, {"name": "Account B", "fit_score": 90, "intent_signals": 95, "relationship": 55, "timing": "now"}]};
  assert.ok(ui.editor.acceptInput(args));
  ui.submit();
  assert.equal(ui.requests.length,1);
  assert.equal(ui.requests[0].name,config.tool);
  assert.deepEqual(JSON.parse(JSON.stringify(ui.requests[0].args)),args);
});
test('late results, errors and unrelated host updates preserve local edits',async()=>{
  const ui=mount();
  ui.submit();
  ui.edit();
  assert.equal(ui.editor.acceptInput({}),false);
  assert.equal(ui.editor.acceptResult(),false);
  ui.requests[0].resolve({content:[]});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(ui.outputs.length,0);
  ui.submit();
  ui.edit();
  ui.requests[1].reject(new Error('late'));
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(ui.outputs.length,0);
  ui.submit();
  ui.requests[2].resolve({content:[{type:'text',text:'Current response'}]});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(ui.outputs.length,1);
});
