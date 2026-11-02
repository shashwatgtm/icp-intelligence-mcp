import {buildHandoff, ROLES, getRole, setRole, roleLine, GEMINI_URL} from './handoff.mjs';

const excluded = path => /^\/(?:assistant|ai-trendwatch|lets-get-started|contact|contact-us|forms?|thank-you|thanks|error|404|500)(?:[/.]|$)/i.test(path) || /\/(?:thank-you|subscribed|success|error)(?:\/|$)/i.test(path);
const reportInputs = document.getElementById('helix-result-inputs');
const alphaPage = Boolean(reportInputs) || /^https:\/\/gtmalpha\.gtmhelix\.com(?:\/|$)/.test(document.querySelector('link[rel="canonical"]')?.href || location.href);
const path = location.pathname.replace(/\/index\.html$/, '/').replace(alphaPage ? /^\/(consultation|integration)(?:\.html|\/)?$/ : /$^/, '/$1');
const toolPath = /^\/tools\/[^/]+\/?$/.test(path) || (alphaPage && (path === '/consultation' || Boolean(reportInputs)));
if (!document.getElementById('helix-assistant-launcher') && !excluded(path) && (toolPath || !document.querySelector('main form:not([role="search"])'))) {
 const node=(tag,text='',attrs={})=>{const el=document.createElement(tag);el.textContent=text;for(const [k,v]of Object.entries(attrs))el.setAttribute(k,v);return el;};
 const host=node('div','',{id:'helix-assistant-launcher'});host.hidden=true;
 const root=host.attachShadow({mode:'open'}),style=node('link','',{rel:'stylesheet',href:new URL('./launcher.css',import.meta.url).href});root.append(style);
 const panel=node('section','',{class:'panel',id:'helix-panel',role:'dialog','aria-labelledby':'helix-heading'});panel.hidden=true;
 const header=node('div','',{class:'heading'}),heading=node('h2','What are you trying to work out?',{id:'helix-heading'}),close=node('button','Close',{type:'button',class:'close','aria-label':'Close panel'});header.append(heading,close);
 const body=node('div','',{class:'panel-body'}),roles=node('div','',{class:'roles',role:'group','aria-label':'Your role'});
 const roleNote=node('span','',{class:'role-note'});
 const roleButtons=ROLES.map(role=>{const b=node('button',role,{type:'button','aria-pressed':'false'});b.addEventListener('click',()=>chooseRole(role));roles.append(b);return b;});roles.append(roleNote);
 const question=node('textarea','',{id:'helix-question',rows:'2',maxlength:'10000',placeholder:'What decision do you need to make?'}),label=node('label','Your question',{for:'helix-question'}),topics=node('div','',{class:'topics','aria-label':'Questions for this page'});
 const next=node('section','',{class:'next'}),connect=node('section','',{class:'connect'});
 const footer=node('div','',{class:'panel-actions'}),link=node('a','Get your answer in ChatGPT',{class:'primary',target:'_blank',rel:'noopener noreferrer'}),consult=node('a','Book 45 minutes with Shashwat',{class:'primary consult',href:'https://calendly.com/shashwat-gtmhelix/45min'}),copy=node('button','Copy prompt',{type:'button',class:'text-link'});
 const listing=node('a','Open in ChatGPT',{class:'text-link listing',target:'_blank',rel:'noopener noreferrer'});listing.hidden=true;
 const gemini=node('a','Open in Gemini',{class:'text-link gemini',href:GEMINI_URL,target:'_blank',rel:'noopener noreferrer'});gemini.hidden=true;
 const privacy=node('details','',{class:'privacy'});privacy.append(node('summary','Privacy and prompt'),node('p','Your role and question stay only in this page’s memory. Opening ChatGPT sends the prompt in the link URL to OpenAI; Send starts the conversation. You can copy it instead.',{class:'note'}));
 const prompt=node('textarea','',{id:'helix-prompt',readonly:'',rows:'5','aria-label':'Prepared prompt'});const manualOpen=node('a','',{class:'text-link',target:'_blank',rel:'noopener noreferrer'});manualOpen.hidden=true;privacy.append(prompt,manualOpen);const privacyText=privacy.querySelector('p');
 const status=node('p','',{role:'status','aria-live':'polite',class:'status'}),shortened=node('p','Your question was shortened for the link. Add remaining detail in ChatGPT.',{class:'note'});shortened.hidden=true;
 const usp=node('p','',{class:'note usp'}),findTool=node('a','Find the right tool',{href:'https://tools.gtmhelix.com/tools/',class:'primary find-tool'});
 const extras=node('div','',{class:'extras'});extras.append(copy,privacy);footer.append(usp,findTool,link,consult,listing,next,node('p','In ChatGPT, check the assumptions before acting on the recommendation.',{class:'note answer-note'}),gemini,extras,status,shortened);consult.hidden=true;
 panel.append(header,body,footer);
 const launcher=node('button','Ask Helix',{type:'button',class:'launcher','aria-controls':'helix-panel','aria-expanded':'false','aria-haspopup':'dialog'}),row=node('div','',{class:'launcher-row'});row.append(launcher);root.append(panel,row);
 const general=[['Size a market','https://icp-intelligence.gtmhelix.com/tools/tam-sam-som-calculator/'],['Sharpen positioning','https://impact.gtmhelix.com/tools/impact-full-audit/'],['Check product-market fit','https://craft-gtm.gtmhelix.com/tools/pmf-scorecard/'],['Plan a renewal','https://craft-gtm.gtmhelix.com/tools/retention-playbook/']];
 const questionsByMode={};
 let mode='A',tool=null,sites={},selectedSite=null,app='Claude',sectionVisible=false,current,ready=false;
 let origin=location.origin;
 try{const canonical=new URL(document.querySelector('link[rel="canonical"]')?.href);if(/(^|\.)gtmhelix\.com$/.test(canonical.hostname))origin=canonical.origin;}catch{}
 if(reportInputs)origin='https://gtmalpha.gtmhelix.com';
 const pageURL=reportInputs?origin+'/consultation':origin+path;
 const form=document.querySelector('form.hx-form,form#gtmForm');
 let result=form?.helixResult||null;
 if(reportInputs){try{result={inputs:JSON.parse(reportInputs.textContent),text:document.querySelector('[data-helix-report]')?.innerText||''};}catch{}}
 const hasResult=()=>Boolean(result?.text?.trim());
 const briefInputs=inputs=>Object.entries(inputs||{}).map(([key,value])=>{const text=typeof value==='string'?value:JSON.stringify(value);return key+': '+(text.length>240?text.slice(0,240)+'… [input shortened]':text);}).join('\n');
 const pluginPage=/^\/plugins(?:\/|$)/.test(path);
 const answerHosts=()=>pluginPage?['claude','gemini']:(sites[new URL(origin).hostname]?.hosts||(/^(?:icp-intelligence|gtmalpha)\./.test(new URL(origin).hostname)?['claude','gemini']:['chatgpt']));
 let lastAnswerApp='';
 function routeCopy(chosen){
  const dual=answerHosts()[0]==='claude',name=chosen||(dual?'Claude':'ChatGPT');lastAnswerApp=name;
  const answer=(mode==='E'&&hasResult())||(mode==='D'&&pluginPage);
  link.hidden=mode!=='E'&&!(mode==='D'&&pluginPage);
  link.textContent=mode==='E'?(hasResult()?'Take this result to '+(dual?'Claude':'ChatGPT'):'Run this tool'):'Get your answer in Claude';
  gemini.hidden=!answer||!dual;extras.hidden=!answer;shortened.hidden=!answer||!current?.truncated;
  footer.querySelector('.answer-note').hidden=!answer;
  footer.querySelector('.answer-note').textContent='Review the explanation against the supplied result before acting.';
  privacyText.textContent='Your role, question, inputs and result stay only in this page’s memory. Choosing '+name+' sends the prepared prompt in its link URL. Long prompts are copied in full first; paste and send them in your own account. We do not send them to another Helix server.';
  shortened.textContent='The full prompt exceeds the link limit. It will be copied first; the short prefill asks you to paste it.';
  const value=sites[new URL(origin).hostname]?.listing||'';
  listing.hidden=mode!=='E'||!/^https:\/\/chatgpt\.com\/plugins\/[A-Za-z0-9_-]+\/?$/.test(value);if(!listing.hidden)listing.href=value;
 }

 const baseMode=()=>alphaPage&&path==='/integration'?'D':path==='/about/'||path==='/about'?'B':/^\/(?:connect|connectors|plugins)(?:\/|$)/.test(path)||(/^\/tools\/?$/.test(path)&&origin.includes('tools.gtmhelix.com'))?'D':toolPath?'E':'A';
 function chooseRole(role){setRole(role);roleNote.textContent=getRole()&&!ROLES.includes(getRole())?'Your role: '+getRole():'';roleNote.hidden=!roleNote.textContent;for(const b of roleButtons)b.setAttribute('aria-pressed',String(b.textContent===getRole()));update();updatePagePrompts();}
 function updatePagePrompts(){for(const quote of document.querySelectorAll('[aria-labelledby="ai-h"] blockquote')){if(!quote.dataset.helixBase)quote.dataset.helixBase=quote.textContent.replace(/^(?:I am a (?:Founder|CEO|CMO|CRO|Demand generation head|Marketing team member|Customer Success professional|Sales\/AE)\.|My role is not stated\. Ask me for my role first\.)\s*/,'');quote.textContent=roleLine(getRole())+'\n'+quote.dataset.helixBase;}}
 function update(){
  const q=mode==='D'?`${pluginPage||app==='Gemini CLI'||app==='Antigravity'?'How do I install and use the Helix skills package':'How do I connect '+(selectedSite?.name||'a Helix connector')} in ${app}? ${question.value.trim()}`:question.value.trim();
  current=buildHandoff(q,{}, {host:answerHosts()[0],role:getRole(),page:pageURL,tool:mode==='E'?(tool?.tool||tool?.title||document.querySelector('h1')?.textContent):undefined,inputs:hasResult()?briefInputs(result.inputs):undefined,result:hasResult()?result.text:undefined});
  link.href=mode==='E'&&!hasResult()?'#'+(form?.id||'tool-form'):current.url;prompt.value=current.prompt;status.textContent='';manualOpen.hidden=true;routeCopy();
 }

 const suite='https://github.com/shashwatgtm/helix-gtm-suite';
 const appSelect=node('select','',{id:'helix-app','aria-label':'Which app do you use?'});
 for(const name of (pluginPage?['Claude','Gemini CLI','Antigravity']:['Claude','ChatGPT','Gemini CLI','Antigravity','Cursor','VS Code','Windsurf']))appSelect.append(node('option',name,{value:name}));
 const copyCommand=node('button','Copy setup command',{type:'button',class:'secondary'});
 const siteSelect=node('select','',{id:'helix-connector','aria-label':'Choose a connector'}),steps=node('p','',{class:'steps'}),address=node('code','',{class:'address'}),command=node('pre','',{class:'command'}),copyAddress=node('button','Copy MCP address',{type:'button',class:'secondary'}),setup=node('p','',{class:'setup note'}),skillsNote=node('p','',{class:'note'});
 connect.append(appSelect,siteSelect,steps,command,copyCommand,setup,address,copyAddress,skillsNote);
 function connection(){
  app=appSelect.value;const packageRoute=pluginPage||app==='Gemini CLI'||app==='Antigravity';if(packageRoute){selectedSite=null;siteSelect.value='';}else if(!selectedSite){selectedSite=sites[new URL(origin).hostname]?.mcp?sites[new URL(origin).hostname]:(sites[siteSelect.value]||null);}siteSelect.hidden=Boolean(sites[new URL(origin).hostname]?.mcp)||packageRoute;const mcp=selectedSite?.mcp;address.hidden=packageRoute;address.textContent=mcp||'Choose a connector to see its MCP address.';copyAddress.hidden=packageRoute||!mcp;command.hidden=true;command.textContent='';setup.textContent='';
  const key=selectedSite?.repository?.replace(/-mcp$/,'')||'helix';
  if(packageRoute){
   steps.textContent='Install the Helix GTM Suite skills package with this command:';
   command.hidden=false;command.textContent=app==='Gemini CLI'?`gemini extensions install ${suite}`:app==='Antigravity'?`agy plugin install ${suite}`:`claude plugin marketplace add ${suite}`;copyAddress.textContent='Copy MCP address';if(pluginPage&&app==='Claude'){command.hidden=true;steps.textContent='Use the Claude plugin installation steps on this page. For the full Helix package, follow its skills package instructions.';}
  } else if(!mcp){steps.textContent='Choose the connector you want to see its setup steps.';}
  else if(selectedSite?.held){steps.textContent='See setup guide: '+selectedSite.guide;}
  else if(app==='Claude'){steps.textContent=`In Claude, open Customize, then Connectors, select + and Add custom connector. Name it ${selectedSite.name}, paste this MCP address and leave sign in fields empty.`;}
  else if(app==='ChatGPT'){steps.textContent='In ChatGPT settings, open the apps or connectors section. Enable developer mode if your plan requires it, create a connector with this URL and no authentication, then enable it in a chat. Menu names and availability depend on your plan.';}
  else {const configs={Cursor:['~/.cursor/mcp.json or .cursor/mcp.json',{mcpServers:{[key]:{url:mcp}}}], 'VS Code':['.vscode/mcp.json',{servers:{[key]:{type:'http',url:mcp}}}],Windsurf:['~/.codeium/windsurf/mcp_config.json',{mcpServers:{[key]:{serverUrl:mcp}}}]};const [file,value]=configs[app];steps.textContent='Add this configuration in '+file+'. See the connector setup page for the full context.';command.hidden=false;command.textContent=JSON.stringify(value,null,2);}
  copyCommand.hidden=command.hidden;copyCommand.textContent=packageRoute?'Copy setup command':'Copy configuration';
  skillsNote.textContent=pluginPage?'Skills package: Claude, Gemini CLI and Antigravity. See the package instructions for installation.':'Connectors: Claude, ChatGPT, Cursor, VS Code and Windsurf. Skills package: Claude Code, ChatGPT, Gemini CLI, Antigravity, Cursor and VS Code; also available through skills.sh.';
  update();
 }
 copyCommand.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(command.textContent);status.textContent='Setup copied.';}catch{status.textContent='Select and copy the setup text above.';const range=document.createRange();range.selectNodeContents(command);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);}});
 appSelect.addEventListener('change',connection);siteSelect.addEventListener('change',()=>{selectedSite=sites[siteSelect.value]||null;connection();});
 copyAddress.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(selectedSite.mcp);status.textContent='MCP address copied.';}catch{status.textContent='Select and copy the MCP address above.';const range=document.createRange();range.selectNodeContents(address);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);}});
 function render(){
  const nextMode=baseMode();if(nextMode!==mode){questionsByMode[mode]=question.value;question.value=questionsByMode[nextMode]||'';}mode=nextMode;
  question.placeholder=mode==='D'?'What is stopping you from connecting?':'What decision do you need to make?';host.dataset.mode=mode;host.dataset.result=hasResult()?'ready':'empty';
  next.hidden=mode!=='E'||!hasResult();launcher.textContent=mode==='B'?'Work with Shashwat':mode==='E'?'Use this tool':'Find your tool';
  heading.textContent=mode==='D'?'Which app do you use?':mode==='E'?(tool?.title||document.querySelector('h1')?.textContent||'This tool'):mode==='B'?'Work through your GTM decision':'What are you trying to work out?';
  consult.hidden=mode!=='B';usp.hidden=mode==='B'||mode==='D';findTool.hidden=mode!=='A';
  usp.textContent=mode==='E'?'This tool uses fixed rules, so the same inputs give the same result. AI then helps you act on it.':'Plain AI can change its answer each time. Helix tools use fixed rules, so the same inputs give the same result.';
  body.replaceChildren();topics.replaceChildren();next.replaceChildren();
  if(mode==='D'){body.append(roles);if(pluginPage)body.append(label,question);body.append(connect);connection();}
  else if(mode==='A'){body.append(roles,topics);for(const [text,url]of general)topics.append(node('a',text,{href:url}));}
  else if(mode==='B'){body.append(node('p','Bring the decision, the evidence you have and the part your team cannot settle.'));}
  else {body.append(roles);if(hasResult()){body.append(label,question,topics);for(const q of (tool?.questions||['What does this result support?','What should I check before acting?'])){const b=node('button',q,{type:'button'});b.addEventListener('click',()=>{question.value=q;update();});topics.append(b);}if(tool?.next)next.append(node('h3','Next tool'),node('a',tool.next.title,{href:tool.next.url}),node('p',tool.why));}else body.append(node('p','Enter your own inputs and run the tool. Then take its actual result into your own chat.'));}
  update();
 }
 document.addEventListener('helix:result',event=>{if(mode==='E'||toolPath){result=event.detail?.text?event.detail:null;render();}});

 question.addEventListener('input',update);
 copy.addEventListener('click',async()=>{const value=current.prompt;try{await navigator.clipboard.writeText(value);status.textContent=answerHosts()[0]==='claude'?'Prompt copied. Paste it if it is not already there.':'Prompt copied. Paste it into your own ChatGPT.';}catch{privacy.open=true;prompt.focus();prompt.select();status.textContent='Select and copy the prompt below.';}});
 async function openAnswer(event,name){
  if(mode==='E'&&!hasResult()){
   event.preventDefault();open(false);if(form){form.scrollIntoView({block:'start',behavior:'auto'});const field=form.querySelector('input:not([type="hidden"]):not([name="leave_this_empty"]):not([disabled]),textarea:not([disabled]),select:not([disabled])');(field||form).focus({preventScroll:true});}return;
  }
  const hostName=name==='Gemini'?'gemini':answerHosts()[0];const destination=buildHandoff(question.value.trim()||(mode==='D'?`Help me install the Helix skills package in ${app}.`:undefined),{}, {host:hostName,role:getRole(),page:pageURL,tool:mode==='E'?(tool?.tool||tool?.title):undefined,inputs:hasResult()?briefInputs(result.inputs):undefined,result:hasResult()?result.text:undefined});
  if(!destination.copyRequired)return;
  event.preventDefault();routeCopy(name);prompt.value=destination.prompt;
  try{await navigator.clipboard.writeText(destination.prompt);status.textContent=destination.truncated?'Full prompt copied. Paste it if it is not already there. The link contains a short request to paste the full text.':'Prompt copied. Paste it if it is not already there.';window.open(destination.url,'_blank','noopener,noreferrer');}
  catch{privacy.open=true;manualOpen.textContent='Open '+name+' after copying';manualOpen.href=destination.url;manualOpen.hidden=false;prompt.focus();prompt.select();status.textContent='Copy was unavailable. Select and copy the full prompt below, then open '+name+'.';}
 }
 link.addEventListener('click',event=>openAnswer(event,answerHosts()[0]==='claude'?'Claude':'ChatGPT'));gemini.addEventListener('click',event=>openAnswer(event,'Gemini'));

 function open(value){panel.hidden=!value;launcher.setAttribute('aria-expanded',String(value));if(value){body.scrollTop=0;close.focus({preventScroll:true});}else launcher.focus({preventScroll:true});position();}
 launcher.addEventListener('click',()=>open(panel.hidden));close.addEventListener('click',()=>open(false));document.addEventListener('helix:open',()=>open(true));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){e.preventDefault();open(false);}});
 const roleNames={founder:'Founder',ceo:'CEO',cmo:'CMO',cro:'CRO',demandgen:'Demand generation head','demand-generation-head':'Demand generation head',team:'Marketing team member',cs:'Customer Success professional',sales:'Sales/AE'};
 document.addEventListener('click',e=>{const chip=e.target.closest?.('[data-role]');if(chip&&roleNames[chip.dataset.role])chooseRole(roleNames[chip.dataset.role]);});
 for(const chip of document.querySelectorAll('[data-role][aria-pressed="true"]'))if(roleNames[chip.dataset.role])setRole(roleNames[chip.dataset.role]);
 let frame=null,banner;const resized=new ResizeObserver(()=>schedule());
 function position(){frame=null;const b=document.querySelector('#hx-consent, [data-cookie-banner], #cookie-banner');if(b!==banner){if(banner)resized.unobserve(banner);banner=b;if(banner)resized.observe(banner);}const view=window.visualViewport,top=view?.offsetTop||0,bottom=top+(view?.height||innerHeight),r=banner?.getBoundingClientRect(),visible=r&&r.height>0&&r.bottom>top&&r.top<bottom&&getComputedStyle(banner).visibility!=='hidden';const offset=Math.max(10,innerHeight-bottom+10,visible?innerHeight-r.top+10:0);for(const [k,v]of [['--helix-bottom',offset+'px'],['--helix-panel-height',Math.max(120,innerHeight-offset-top-62)+'px']])if(host.style.getPropertyValue(k)!==v)host.style.setProperty(k,v);}
 function schedule(){if(frame===null)frame=requestAnimationFrame(position);}
 new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class','style']});window.addEventListener('resize',schedule);window.visualViewport?.addEventListener('resize',schedule);window.visualViewport?.addEventListener('scroll',schedule);
 style.addEventListener('load',()=>{host.hidden=false;position();},{once:true});style.addEventListener('error',()=>host.remove(),{once:true});
 document.body.append(host);render();chooseRole(getRole());position();
 Promise.all([fetch(new URL('./tool-next.json',import.meta.url),{credentials:'omit'}).then(r=>{if(!r.ok)throw Error('Tool map unavailable');return r.json();}),fetch(new URL('./sites.json',import.meta.url),{credentials:'omit'}).then(r=>{if(!r.ok)throw Error('Setup map unavailable');return r.json();})]).then(([map,config])=>{
  tool=map.tools.find(t=>t.url.replace(/\/$/,'')===pageURL.replace(/\/$/,''));sites=config.sites;selectedSite=sites[new URL(origin).hostname]?.mcp?sites[new URL(origin).hostname]:null;siteSelect.append(node('option','Choose a connector',{value:''}));for(const [key,site]of Object.entries(sites))if(site.mcp)siteSelect.append(node('option',site.name,{value:key}));siteSelect.value=selectedSite?new URL(origin).hostname:'';siteSelect.hidden=Boolean(selectedSite);ready=true;host.dataset.ready='true';render();
 }).catch(()=>{host.dataset.ready='unavailable';status.textContent='Page details are unavailable. Ask about the current page.';});
 if(path==='/'&&/(?:^https:\/\/gtmhelix\.com$|tools\.gtmhelix\.com)/.test(origin)){
  const visible=new Set(),observer=new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting)visible.add(e.target);else visible.delete(e.target);}const nextVisible=visible.size>0;if(nextVisible!==sectionVisible){sectionVisible=nextVisible;render();}}, {threshold:0.1});
  for(const section of document.querySelectorAll(origin==='https://gtmhelix.com'?'#tools':'#where,#connectors,#plugins'))observer.observe(section);
 }
 updatePagePrompts();
}
