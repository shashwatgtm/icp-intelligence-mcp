import {marketSummary} from './tam-summary.ts';
import {Server} from '@modelcontextprotocol/sdk/server/index.js';
import {ListResourcesRequestSchema,ReadResourceRequestSchema,McpError,ErrorCode} from '@modelcontextprotocol/sdk/types.js';
import {widgetPayload} from './widget-model.ts';
import {WIDGET_HTML} from './widget-document.ts';
import {WIDGETS} from './widget-registry.ts';
const uri=(name:string)=>`ui://helix-wave2/${name}.html`;
export function attachWidgets(server:Server):void{
 server.registerCapabilities({resources:{}});
 const register=server.setRequestHandler.bind(server);
 server.setRequestHandler=((schema:any,handler:any)=>register(schema,async(request:any,extra:any)=>{
  const result=await handler(request,extra);
  if(request.method==='tools/list')return {...result,tools:result.tools.map((t:any)=>Object.prototype.hasOwnProperty.call(WIDGETS,t.name)?{...t,_meta:{...t._meta,ui:{...t._meta?.ui,resourceUri:uri(t.name),visibility:t.name==='tam_sam_som_calculator'?['model','app']:['model']},'openai/outputTemplate':uri(t.name)}}:t)};
  if(request.method==='tools/call'&&!result.isError&&Object.prototype.hasOwnProperty.call(WIDGETS,request.params.name)){
   const text=result.content?.filter((c:any)=>c.type==='text').map((c:any)=>c.text).join('\n');
   if(typeof text==='string')return {...result,structuredContent:{...widgetPayload(request.params.name,WIDGETS[request.params.name],text),...(request.params.name==='tam_sam_som_calculator'?{marketSizing:marketSummary(request.params.arguments)}:{})}};
  }
  return result;
 })) as typeof server.setRequestHandler;
 register(ListResourcesRequestSchema,async()=>({resources:Object.entries(WIDGETS).map(([name,title])=>({uri:uri(name),name:title+' result',mimeType:'text/html;profile=mcp-app',description:'Optional read-only view; the tool text remains available.'}))}));
 register(ReadResourceRequestSchema,async request=>{const entry=Object.entries(WIDGETS).find(([name])=>uri(name)===request.params.uri);if(!entry)throw new McpError(ErrorCode.InvalidParams,'Unknown result resource');return {contents:[{uri:request.params.uri,mimeType:'text/html;profile=mcp-app',text:WIDGET_HTML,_meta:{ui:{prefersBorder:true,csp:{connectDomains:[],resourceDomains:[]}},'openai/widgetDescription':entry[1]+' result with source text and table views.','openai/widgetPrefersBorder':true,'openai/widgetCSP':{connect_domains:[],resource_domains:[]},'openai/ui':{availableDisplayModes:['inline']}}}]};});
}
