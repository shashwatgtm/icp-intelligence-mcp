import {buildHandoff, ROLES, getRole, setRole, roleLine} from './handoff.mjs';

const excluded = path => /^\/(?:assistant|ai-trendwatch|lets-get-started|contact|contact-us|forms?|thank-you|thanks|error|404|500)(?:[/.]|$)/i.test(path) || /\/(?:thank-you|subscribed|success|error)(?:\/|$)/i.test(path);
const path = location.pathname.replace(/\/index\.html$/, '/');
const toolPath = /^\/tools\/[^/]+\/?$/.test(path);
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
 const footer=node('div','',{class:'panel-actions'}),link=node('a','Get your answer in ChatGPT',{class:'primary',target:'_blank',rel:'noopener noreferrer'}),consult=node('a','Consult with Shashwat',{class:'primary consult',href:'https://gtmhelix.com/lets-get-started/'}),copy=node('button','Copy prompt',{type:'button',class:'text-link'});
 const privacy=node('details','',{class:'privacy'});privacy.append(node('summary','Privacy and prompt'),node('p','Your role and question stay only in this page’s memory. Opening ChatGPT sends the prompt in the link URL to OpenAI; Send starts the conversation. You can copy it instead.',{class:'note'}));
 const prompt=node('textarea','',{id:'helix-prompt',readonly:'',rows:'5','aria-label':'Prepared prompt'});privacy.append(prompt);
 const status=node('p','',{role:'status','aria-live':'polite',class:'status'}),shortened=node('p','Your question was shortened for the link. Add remaining detail in ChatGPT.',{class:'note'});shortened.hidden=true;
 const extras=node('div','',{class:'extras'});extras.append(copy,privacy);footer.append(link,consult,next,node('p','In ChatGPT, check the assumptions before acting on the recommendation.',{class:'note answer-note'}),extras,status,shortened);consult.hidden=true;
 panel.append(header,body,footer);
 const launcher=node('button','Ask Helix',{type:'button',class:'launcher','aria-controls':'helix-panel','aria-expanded':'false','aria-haspopup':'dialog'}),row=node('div','',{class:'launcher-row'});row.append(launcher);root.append(panel,row);
 const general=[['Size a market','How should I size the market for my B2B offer?'],['Sharpen positioning','How can I sharpen our positioning so buyers understand why to choose us?'],['Check product-market fit','How can I check whether we have product-market fit?'],['Plan a renewal','How should I plan an upcoming customer renewal?']];
 const questionsByMode={};
 let mode='A',tool=null,sites={},selectedSite=null,app='Claude',sectionVisible=false,current,ready=false;
 let origin=location.origin;
 try{const canonical=new URL(document.querySelector('link[rel="canonical"]')?.href);if(/(^|\.)gtmhelix\.com$/.test(canonical.hostname))origin=canonical.origin;}catch{}
 const pageURL=origin+path;
 const baseMode=()=>path==='/about/'||path==='/about'?'B':/^\/(?:connect|connectors|plugins)(?:\/|$)/.test(path)||(/^\/tools\/?$/.test(path)&&origin.includes('tools.gtmhelix.com'))?'D':toolPath?'E':sectionVisible?'D':'A';
 function chooseRole(role){setRole(role);roleNote.textContent=getRole()&&!ROLES.includes(getRole())?'Your role: '+getRole():'';roleNote.hidden=!roleNote.textContent;for(const b of roleButtons)b.setAttribute('aria-pressed',String(b.textContent===getRole()));update();updatePagePrompts();}
 function updatePagePrompts(){for(const quote of document.querySelectorAll('[aria-labelledby="ai-h"] blockquote')){if(!quote.dataset.helixBase)quote.dataset.helixBase=quote.textContent.replace(/^(?:I am a (?:Founder|CEO|CMO|CRO|Demand generation head|Marketing team member|Customer Success professional|Sales\/AE)\.|My role is not stated\. Ask me for my role first\.)\s*/,'');quote.textContent=roleLine(getRole())+'\n'+quote.dataset.helixBase;}}
 function update(){
  const q=mode==='D'?`How do I connect ${selectedSite?.name||'the Helix skills package'} in ${app}? ${question.value.trim()}`:question.value.trim()||(mode==='E'?`Help me use ${tool?.title||document.querySelector('h1')?.textContent||'the tool on this page'}.`:undefined);
  current=buildHandoff(q,{}, {role:getRole(),page:pageURL,tool:mode==='E'?tool?.title:undefined});link.href=current.url;prompt.value=current.prompt;shortened.hidden=!current.truncated;status.textContent='';
 }
 const suite='https://github.com/shashwatgtm/helix-gtm-suite';
 const appSelect=node('select','',{id:'helix-app','aria-label':'Which app do you use?'});
 for(const name of ['Claude','ChatGPT','Gemini CLI','Antigravity','Cursor','VS Code','Windsurf'])appSelect.append(node('option',name,{value:name}));
 const copyCommand=node('button','Copy setup command',{type:'button',class:'secondary'});
 const siteSelect=node('select','',{id:'helix-connector','aria-label':'Choose a connector'}),steps=node('p','',{class:'steps'}),address=node('code','',{class:'address'}),command=node('pre','',{class:'command'}),copyAddress=node('button','Copy MCP address',{type:'button',class:'secondary'}),setup=node('p','',{class:'setup note'}),skillsNote=node('p','',{class:'note'});
 connect.append(appSelect,siteSelect,steps,command,copyCommand,setup,address,copyAddress,skillsNote);
 function connection(){
  app=appSelect.value;const packageRoute=app==='Gemini CLI'||app==='Antigravity';siteSelect.hidden=Boolean(sites[new URL(origin).hostname])||packageRoute;const mcp=selectedSite?.mcp;address.hidden=packageRoute&&!mcp;address.textContent=mcp||'Choose a connector to see its MCP address.';copyAddress.hidden=!mcp;command.hidden=true;command.textContent='';setup.textContent='';
  const key=selectedSite?.repository?.replace(/-mcp$/,'')||'helix';
  if(app==='Gemini CLI'||app==='Antigravity'){
   steps.textContent='Install the Helix GTM Suite skills package with this command:';
   command.hidden=false;command.textContent=app==='Gemini CLI'?`gemini extensions install ${suite}`:`agy plugin install ${suite}`;copyAddress.textContent='Copy MCP address';
  } else if(!mcp){steps.textContent='Choose the connector you want to see its setup steps.';}
  else if(selectedSite?.held){steps.textContent='See setup guide: '+selectedSite.guide;}
  else if(app==='Claude'){steps.textContent=`In Claude, open Customize, then Connectors, select + and Add custom connector. Name it ${selectedSite.name}, paste this MCP address and leave sign in fields empty.`;}
  else if(app==='ChatGPT'){steps.textContent='In ChatGPT settings, open the apps or connectors section. Enable developer mode if your plan requires it, create a connector with this URL and no authentication, then enable it in a chat. Menu names and availability depend on your plan.';}
  else {const configs={Cursor:['~/.cursor/mcp.json or .cursor/mcp.json',{mcpServers:{[key]:{url:mcp}}}], 'VS Code':['.vscode/mcp.json',{servers:{[key]:{type:'http',url:mcp}}}],Windsurf:['~/.codeium/windsurf/mcp_config.json',{mcpServers:{[key]:{serverUrl:mcp}}}]};const [file,value]=configs[app];steps.textContent='Add this configuration in '+file+'. See the connector setup page for the full context.';command.hidden=false;command.textContent=JSON.stringify(value,null,2);}
  copyCommand.hidden=command.hidden;copyCommand.textContent=packageRoute?'Copy setup command':'Copy configuration';
  skillsNote.textContent='Connectors: Claude, ChatGPT, Cursor, VS Code and Windsurf. Skills package: Claude Code, ChatGPT, Gemini CLI, Antigravity, Cursor and VS Code; also available through skills.sh.';
  update();
 }
 copyCommand.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(command.textContent);status.textContent='Setup copied.';}catch{status.textContent='Select and copy the setup text above.';const range=document.createRange();range.selectNodeContents(command);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);}});
 appSelect.addEventListener('change',connection);siteSelect.addEventListener('change',()=>{selectedSite=sites[siteSelect.value]||null;connection();});
 copyAddress.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(selectedSite.mcp);status.textContent='MCP address copied.';}catch{status.textContent='Select and copy the MCP address above.';const range=document.createRange();range.selectNodeContents(address);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);}});
 function render(){
  const nextMode=baseMode();if(nextMode!==mode){questionsByMode[mode]=question.value;question.value=questionsByMode[nextMode]||'';}mode=nextMode;host.dataset.mode=mode;next.hidden=mode!=='E';launcher.textContent=mode==='B'?'Ask Shashwat':mode==='E'?'Ask about this tool':'Ask Helix';heading.textContent=mode==='D'?'Which app do you use?':mode==='E'?(tool?.title||document.querySelector('h1')?.textContent||'This tool'):mode==='B'?'What would you ask Shashwat?':'What are you trying to work out?';consult.hidden=mode!=='B';link.textContent='Get your answer in ChatGPT';body.replaceChildren();topics.replaceChildren();next.replaceChildren();
  if(mode==='D'){body.append(roles,label,question,connect);connection();}
  else{body.append(roles,label,question,topics);const questions=mode==='E'?(tool?.questions||['What inputs does this tool need?','How should I read this tool’s result?']).map(q=>[q,q]):general;for(const [text,q]of questions){const b=node('button',text,{type:'button'});b.addEventListener('click',()=>{question.value=q;update();});topics.append(b);}if(mode==='E'&&tool?.next){next.append(node('h3','Next tool'),node('a',tool.next.title,{href:tool.next.url}),node('p',tool.why));}}
  update();
 }
 question.addEventListener('input',update);
 copy.addEventListener('click',async()=>{const value=current.prompt;try{await navigator.clipboard.writeText(value);status.textContent='Prompt copied. Paste it into your own ChatGPT.';}catch{privacy.open=true;prompt.focus();prompt.select();status.textContent='Select and copy the prompt below.';}});
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
  tool=map.tools.find(t=>t.url.replace(/\/$/,'')===pageURL.replace(/\/$/,''));sites=config.sites;selectedSite=sites[new URL(origin).hostname]||null;siteSelect.append(node('option','Choose a connector',{value:''}));for(const [key,site]of Object.entries(sites))siteSelect.append(node('option',site.name,{value:key}));siteSelect.value=selectedSite?new URL(origin).hostname:'';siteSelect.hidden=Boolean(selectedSite);ready=true;host.dataset.ready='true';render();
 }).catch(()=>{host.dataset.ready='unavailable';status.textContent='Page details are unavailable. Ask about the current page.';});
 if(path==='/'&&/(?:^https:\/\/gtmhelix\.com$|tools\.gtmhelix\.com)/.test(origin)){
  const visible=new Set(),observer=new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting)visible.add(e.target);else visible.delete(e.target);}const nextVisible=visible.size>0;if(nextVisible!==sectionVisible){sectionVisible=nextVisible;render();}}, {threshold:0.1});
  for(const section of document.querySelectorAll(origin==='https://gtmhelix.com'?'#tools':'#where,#connectors,#plugins'))observer.observe(section);
 }
 updatePagePrompts();
}
