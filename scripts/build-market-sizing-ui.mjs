import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const config = JSON.parse(read('ui/market-sizing-fields.json'));
const base = read('src/widget-document.ts').match(/export const \w+ = (".*");/s);
if (!base) throw new Error('Cannot read the original Helix Paper view.');
let html = JSON.parse(base[1]);
function replace(before, after) {
  if (!html.includes(before)) throw new Error('The upstream view changed at ' + before.slice(0, 70));
  html = html.replace(before, () => after);
}
const form = '<details id="tool-editor"><summary>Edit inputs</summary><form><div data-fields></div><button type="submit" data-run>Run again</button><button type="button" data-reset>Restore inputs</button><p role="status" aria-live="polite"></p></form></details>';
replace('</main>', form + '</main>');
replace('</style>', '#tool-editor textarea,#tool-editor input,#tool-editor select,#result textarea{box-sizing:border-box;width:100%;max-width:100%;padding:.55rem;font:inherit;color:inherit;background:var(--paper,#fff);border:1px solid currentColor;border-radius:.4rem}#tool-editor label{display:block;margin:.8rem 0}#tool-editor fieldset{min-width:0;margin:.6rem 0}#tool-editor button{margin:.4rem .5rem .4rem 0}</style>');
const editorSource = read('ui/market-sizing-editor.js');
const definition = JSON.stringify(config);
const install = `const editor = createResultEditor($("tool-editor"), ${definition}, {
    available: () => bridgeReady && !!hostCapabilities.serverTools,
    call: (name, args) => request("tools/call", {name, arguments: args}),
    render: res => {
      if(res?.isError) { render(null); $("status").textContent = res.content?.filter(x=>x.type==="text").map(x=>x.text).join("\\n") || "Review the inputs."; }
      else render(resultPayload(res));
    }
  });
  if(window.openai?.toolInput) editor.acceptInput(window.openai.toolInput);
  `;
replace('  window.addEventListener("message", (event) => {', editorSource + '\n' + install + 'window.addEventListener("message", (event) => {');
replace('bridgeReady = true;', 'bridgeReady = true; editor.sync();');
replace('if (message.method === "ui/notifications/tool-input") {', 'if (message.method === "ui/notifications/tool-input") {\n      if (!editor.acceptInput(message.params?.arguments)) return;');
replace('if (message.method === "ui/notifications/tool-result") {', 'if (message.method === "ui/notifications/tool-result") {\n      if (!editor.acceptResult()) return;');
replace('if (message.method === "ui/resource-teardown") {', 'if (message.method === "ui/resource-teardown") {\n        editor.close();');
replace('if (globals && Object.prototype.hasOwnProperty.call(globals, "toolOutput"))', 'if (globals?.toolInput) editor.acceptInput(globals.toolInput);\n    if (globals && Object.prototype.hasOwnProperty.call(globals, "toolOutput") && editor.acceptResult())');
replace('if (metadata.toolArguments) toolInput = metadata.toolArguments;', 'if (metadata.toolArguments) {toolInput = metadata.toolArguments; editor.acceptInput(toolInput);}');
const start = html.indexOf('    const controls = make("section");', html.indexOf('  function renderMarket(data)'));
const end = html.indexOf('  function renderAudit(data)', start);
if(start < 0 || end < 0) throw new Error('Market controls changed upstream.');
html = html.slice(0,start) + '    if (summary.toolArgumentsEncoded) editor.acceptInput(JSON.parse(decodeURIComponent(summary.toolArgumentsEncoded)));\n  }\n\n' + html.slice(end);

// The standalone page uses the same market summary as the hosted widget. It has
// no connector credentials and never sends a request to an external service.
const { default: ts } = await import('typescript');
function browserModule(file) {
  const source = read('src/' + file + '.ts').replace(/^import .*?;\s*$/gm, '').replace(/^export /gm, '');
  return ts.transpileModule(source, {compilerOptions: {target: ts.ScriptTarget.ES2022, module:ts.ModuleKind.None, removeComments:true}}).outputText;
}
const marketCode = browserModule('escape-inputs') + '\n' + browserModule('tam-summary');
replace('const editor = createResultEditor',marketCode + `
  function standaloneMarket(args) {
    const summary = marketSummary(args);
    if (!summary || summary.kind !== 'market-sizing') {
      return {isError:true,content:[{type:'text',text:summary?.reason || 'Enter a valid company count, positive USD contract value and rates from 0 to 100.'}]};
    }
    const lines = [...summary.figures.map(f=>f.label+': '+f.display+(f.example?' (example)':'')), 'Source: '+summary.sourceNote];
    return {_meta:{plainText:lines.join('\\n'),title:'Market sizing',marketSizing:summary,sections:[],toolArguments:args}};
  }
  const editor = createResultEditor`);
replace('available: () => bridgeReady && !!hostCapabilities.serverTools', 'available: () => window.parent === window || (bridgeReady && !!hostCapabilities.serverTools)');
replace('call: (name, args) => request("tools/call", {name, arguments: args})', 'call: (name, args) => window.parent === window ? standaloneMarket(args) : request("tools/call", {name, arguments: args})');

html = html.replace(/[ \t]+$/gm, '');
for (const [tag, directive] of [['script','script-src'],['style','style-src']]) {
  const source = html.match(new RegExp('<' + tag + '>([\\s\\S]*?)</' + tag + '>'))[1];
  const hash = createHash('sha256').update(source).digest('base64');
  html = html.replace(new RegExp(directive + " 'sha256-[^']+'"), directive + " 'sha256-" + hash + "'");
}
const output = '// Generated by scripts/build-market-sizing-ui.mjs from the existing Helix Paper result and its editor.\nexport const EDITABLE_RESULTS_HTML: string = ' + JSON.stringify(html) + ';\n';
const destination = path.join(root, 'src/market-sizing-editor-html.ts');
if (process.argv.includes('--check')) {
  if (fs.readFileSync(destination, 'utf8') !== output) throw new Error('The committed result view needs rebuilding.');
} else fs.writeFileSync(destination, output);

const page = path.join(root, 'public/lab/market-sizing/index.html');
if (process.argv.includes('--check')) {
  if (fs.readFileSync(page, 'utf8') !== html) throw new Error('The standalone file differs from the widget.');
} else {
  fs.mkdirSync(path.dirname(page), {recursive:true});
  fs.writeFileSync(page, html);
}
