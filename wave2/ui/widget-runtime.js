(()=>{'use strict';
const $=id=>document.getElementById(id);const make=(tag,text,attrs={})=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);return n;};let payload=null,requestId=0;const pending=new Map();let hostOrigin='*',bridgeReady=false,calculationRevision=0;
const decode=value=>String(value??'').replace(/&(amp|lt|gt|quot|#39|#124|#96|#91|#93);/g,(m,k)=>({amp:'&',lt:'<',gt:'>',quot:'"','#39':"'",'#124':'|','#96':'`','#91':'[','#93':']'}[k]));
// Render a bounded Markdown subset using DOM nodes only. Tool text is never HTML.
function inline(parent,source,depth=0){
 const value=String(source??'');if(depth>12){parent.append(document.createTextNode(decode(value)));return;}
 const pattern=/\\([\\`*_[\]{}()#+.!|>~\-])|(`+)([^`\n]*?)\2|\*\*([^\n]+?)\*\*|__([^\n]+?)__|\*([^*\n]+?)\*|_([^_\n]+?)_|\[([^\]\n]+)\]\(([^\s)]+)\)/g;
 let last=0,match;while((match=pattern.exec(value))){if(match.index>last)parent.append(document.createTextNode(decode(value.slice(last,match.index))));
  if(match[1])parent.append(document.createTextNode(match[1]));
  else if(match[2])parent.append(make('code',decode(match[3])));
  else if(match[4]||match[5]){const n=make('strong');inline(n,match[4]??match[5],depth+1);parent.append(n);}
  else if(match[6]||match[7]){const n=make('em');inline(n,match[6]??match[7],depth+1);parent.append(n);}
  else {const label=make('span');inline(label,match[8],depth+1);parent.append(label);/* Links remain readable labels; no navigation from untrusted text. */}
  last=pattern.lastIndex;
 }
 if(last<value.length)parent.append(document.createTextNode(decode(value.slice(last))));
}
function rowCells(line){const cells=[];let cell='',escaped=false;for(const c of line.trim()){if(escaped){cell+=c;escaped=false;}else if(c==='\\'){cell+=c;escaped=true;}else if(c==='|'){cells.push(cell.trim());cell='';}else cell+=c;}cells.push(cell.trim());if(!cells[0])cells.shift();if(!cells.at(-1))cells.pop();return cells;}
function renderTable(parent,headers,rows,caption){const grid=make('table',undefined,{class:'evidence-ledger'});if(caption){const c=make('caption');inline(c,caption);grid.append(c);}const head=make('thead'),tr=make('tr');headers.forEach(h=>{const th=make('th',undefined,{scope:'col'});inline(th,h);tr.append(th);});head.append(tr);grid.append(head);const body=make('tbody');rows.forEach(row=>{const tr=make('tr');row.forEach((cell,i)=>{const th=make(i===0?'th':'td',undefined,{'data-label':decode(headers[i]??'Value').replace(/[*_`]/g,''),...(i===0?{scope:'row'}:{})});inline(th,cell);tr.append(th);});body.append(tr);});grid.append(body);parent.append(grid);}
function markdown(parent,source){
 const lines=String(source??'').split('\n');let i=0;
 while(i<lines.length){const line=lines[i];if(!line.trim()){i++;continue;}
  const fence=/^\s*(`{3,}|~{3,})([^`]*)$/.exec(line);
  if(fence){const block=[],marker=fence[1][0],length=fence[1].length;i++;while(i<lines.length&&!new RegExp('^\\s*'+marker+'{'+length+',}\\s*$').test(lines[i]))block.push(lines[i++]);if(i<lines.length)i++;const pre=make('pre');pre.append(make('code',decode(block.join('\n'))));parent.append(pre);continue;}
  const heading=/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);if(heading){const h=make('h'+heading[1].length);inline(h,heading[2]);parent.append(h);i++;continue;}
  if(/^\s{0,3}(?:-\s*){3,}$|^\s{0,3}(?:\*\s*){3,}$|^\s{0,3}(?:_\s*){3,}$/.test(line)){parent.append(make('hr'));i++;continue;}
  if(/^\s*>/.test(line)){const quoted=[];while(i<lines.length&&/^\s*>/.test(lines[i]))quoted.push(lines[i++].replace(/^\s*> ?/,''));const quote=make('blockquote');markdown(quote,quoted.join('\n'));parent.append(quote);continue;}
  const item=/^\s*(?:([-+*])|(\d+)[.)])\s+(.+)$/.exec(line);if(item){const ordered=!!item[2],list=make(ordered?'ol':'ul');if(ordered&&Number(item[2])!==1)list.setAttribute('start',item[2]);while(i<lines.length){const m=/^\s*(?:([-+*])|(\d+)[.)])\s+(.+)$/.exec(lines[i]);if(!m||!!m[2]!==ordered)break;const li=make('li');inline(li,m[3]);list.append(li);i++;}parent.append(list);continue;}
  if(line.includes('|')&&i+1<lines.length&&/^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[i+1])){const headers=rowCells(line),rows=[];i+=2;while(i<lines.length&&lines[i].includes('|')){const row=rowCells(lines[i]);if(row.length!==headers.length)break;rows.push(row);i++;}renderTable(parent,headers,rows);continue;}
  const p=make('p');inline(p,line);parent.append(p);i++;
 }
}

function renderMarket(data){
 const root=$('sections'),summary=data.marketSizing;if(summary.kind!=='market-sizing'){root.append(make('p',summary.reason));return;}
 const lead=make('section',undefined,{class:'market-summary'});lead.append(make('h2','Your market sizing'));const cards=make('div',undefined,{class:'market-cards'});
 for(const figure of summary.figures){const card=make('div',undefined,{class:'market-card','data-figure':figure.key});card.append(make('h3',figure.key),make('p',figure.display,{class:'market-value'}),make('p',figure.label));if(figure.example)card.append(make('p','Example figure',{class:'example-label'}));cards.append(card);}lead.append(cards);
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');for(const [k,v]of Object.entries({viewBox:'0 0 300 132',role:'img','aria-label':'TAM, then SAM, then SOM. Stage diagram, not to scale.'}))svg.setAttribute(k,v);
 for(const [points,color]of [['0,0 300,0 260,40 40,40','#641220'],['40,46 260,46 220,86 80,86','#C1121F'],['80,92 220,92 180,132 120,132','#1A0E10']]){const p=document.createElementNS('http://www.w3.org/2000/svg','polygon');p.setAttribute('points',points);p.setAttribute('fill',color);svg.append(p);}lead.append(svg,make('p','Stages shown from TAM to SAM to SOM. Diagram is not to scale.'));root.append(lead);
 const inputs=make('section');inputs.append(make('h2','Your inputs'));const dl=make('dl');for(const input of summary.inputs){dl.append(make('dt',input.label));const dd=make('dd',input.display);if(input.example)dd.append(make('span',' Example figure',{class:'example-label'}));dl.append(dd);}inputs.append(dl,make('p',summary.sourceNote));root.append(inputs);
 const targets=make('section');targets.append(make('h2','Deals needed'));for(const target of summary.targets){const p=make('p',target.label+': '+target.display);if(target.example)p.append(make('span',' Example figure',{class:'example-label'}));targets.append(p);}root.append(targets);
 const validation=make('section');validation.append(make('h2','Validate before using these figures'));const list=make('ul');summary.validation.forEach(item=>list.append(make('li',item)));validation.append(list);root.append(validation);
 const controls=make('section');controls.append(make('h2','Try different rates'),make('p','The server recalculates using your company count and contract value. Entering both rates replaces the presets for this scenario.'));
 for(const [id,label,value]of [['market-icp','ICP match rate (%)',summary.rates.icp],['market-share','Year 1 share of SAM (%)',summary.rates.share]]){controls.append(make('label',label,{for:id}));const input=make('input',undefined,{id,type:'number',min:'0',max:'100',step:'any',required:''});input.value=String(value);controls.append(input);}
 const button=make('button','Recalculate with these rates',{type:'button',id:'market-recalculate'});button.disabled=!bridgeReady;controls.append(button);const hint=make('p',bridgeReady?'Calculations run in the original server tool.':'Recalculation becomes available when the host connects.',{id:'market-recalculate-status',role:'status'});controls.append(hint);root.append(controls);
 button.addEventListener('click',async()=>{const icp=$('market-icp'),share=$('market-share');if(!icp.value.trim()||!share.value.trim()||![Number(icp.value),Number(share.value)].every(x=>Number.isFinite(x)&&x>=0&&x<=100)){hint.textContent='Enter both rates from 0 to 100.';return;}const args={...summary.toolArguments,icp_percentage:Number(icp.value),year1_market_share_target:Number(share.value)};const revision=++calculationRevision;button.disabled=true;hint.textContent='Recalculating on the server.';try{const next=await request('tools/call',{name:'tam_sam_som_calculator',arguments:args});if(revision!==calculationRevision)return;if(next?.isError||!next?.structuredContent?.marketSizing){render(null);$('status').textContent='The server could not calculate these inputs. Review the tool response in the conversation.';}else render(next.structuredContent);}catch{if(revision!==calculationRevision)return;render(null);$('status').textContent='Recalculation was not completed. Ask the tool in the conversation.';}});
}

function render(data){
 if(!data||typeof data.plainText!=='string'||!Array.isArray(data.sections)){payload=null;$('status').textContent='Waiting for a tool result. Run the linked tool in the conversation.';$('sections').replaceChildren();$('full').textContent='';$('title').textContent='Helix GTM Consulting';return;}
 payload=data;$('title').textContent=String(data.title??'Tool result');$('full').replaceChildren();markdown($('full'),data.plainText);$('sections').replaceChildren();
 if(data.marketSizing)renderMarket(data);else for(const section of data.sections){const article=make('section');const heading=make('h2');inline(heading,section.heading);article.append(heading);if(section.body?.trim())markdown(article,section.body);
 for(const table of section.tables??[]){if(Array.isArray(table.headers)&&Array.isArray(table.rows))renderTable(article,table.headers,table.rows,section.heading+' table');}
 $('sections').append(article);}
 $('status').textContent='Tool result received. Review assumptions and missing evidence in the result.';filter();notifyHeight();
}
function filter(){const needle=$('filter').value.trim().toLocaleLowerCase();let shown=0;for(const section of $('sections').children){section.hidden=!!needle&&!section.textContent.toLocaleLowerCase().includes(needle);if(!section.hidden)shown++;}$('filter-status').textContent=payload?`${shown} of ${$('sections').children.length} sections shown.`:'';notifyHeight();}
function notifyHeight(){if(window.parent!==window&&bridgeReady)window.parent.postMessage({jsonrpc:'2.0',method:'ui/notifications/size-changed',params:{height:document.documentElement.scrollHeight}},hostOrigin);}
function request(method,params){const id=++requestId;window.parent.postMessage({jsonrpc:'2.0',id,method,params},hostOrigin);return new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{pending.delete(id);reject(new Error('Host initialization did not respond.'));},10000);pending.set(id,{resolve,reject,timeout});});}
window.addEventListener('message',event=>{if(event.source!==window.parent)return;const message=event.data;if(!message||message.jsonrpc!=='2.0')return;if(event.origin&&event.origin!=='null')hostOrigin=event.origin;
 if(message.id!==undefined&&pending.has(message.id)){const p=pending.get(message.id);pending.delete(message.id);clearTimeout(p.timeout);message.error?p.reject(new Error('Host initialization failed.')):p.resolve(message.result);return;}
 if(message.method==='ui/notifications/tool-input'){calculationRevision++;$('filter').value='';render(null);}
 if(message.method==='ui/notifications/tool-result'){if(message.params?.isError){render(null);$('status').textContent='The tool reported an input error. Review its text response and correct the inputs.';}else render(message.params?.structuredContent);}
});
$('filter').addEventListener('input',filter);$('clear-filter').addEventListener('click',()=>{$('filter').value='';filter();$('filter').focus();});
$('full-toggle').addEventListener('click',()=>{const visible=$('full').hidden;$('full').hidden=!visible;$('full-toggle').setAttribute('aria-expanded',String(visible));$('full-toggle').textContent=visible?'Hide full text':'Show full text';notifyHeight();});
// Compatibility with hosts that still publish the optional ChatGPT globals.
window.addEventListener('openai:set_globals',event=>{const globals=event.detail?.globals;if(globals&&Object.prototype.hasOwnProperty.call(globals,'toolOutput'))render(globals.toolOutput);});
if(window.openai?.toolOutput)render(window.openai.toolOutput);else render(null);
if(window.parent!==window)request('ui/initialize',{appInfo:{name:'Helix result viewer',version:'draft'},appCapabilities:{},protocolVersion:'2026-01-26'}).then(()=>{bridgeReady=true;window.parent.postMessage({jsonrpc:'2.0',method:'ui/notifications/initialized',params:{}},hostOrigin);if(payload?.marketSizing)render(payload);else notifyHeight();}).catch(()=>{if(!payload)$('status').textContent='No host result received. The tool text remains available in the conversation.';});
})();
