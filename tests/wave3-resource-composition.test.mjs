import test from 'node:test';import assert from 'node:assert/strict';
import {Server} from '@modelcontextprotocol/sdk/server/index.js';import {Client} from '@modelcontextprotocol/sdk/client/index.js';import {InMemoryTransport} from '@modelcontextprotocol/sdk/inMemory.js';import {ListResourcesRequestSchema,ReadResourceRequestSchema,McpError,ErrorCode} from '@modelcontextprotocol/sdk/types.js';import {composeResources} from '../dist/resource-handlers.js';
test('resources registered before and after the widget adapter survive and real provider errors propagate',async()=>{
 const server=new Server({name:'composition-test',version:'test'},{capabilities:{resources:{}}});
 const list=uri=>async()=>({resources:[{uri,name:uri}]}),read=uri=>async request=>{if(request.params.uri==='ui://provider-failure')throw new McpError(ErrorCode.InternalError,'Real provider failure');if(request.params.uri!==uri)throw new McpError(ErrorCode.InvalidParams,'Unknown resource');return {contents:[{uri,text:uri,mimeType:'text/plain'}]};};
 server.setRequestHandler(ListResourcesRequestSchema,list('ui://before'));server.setRequestHandler(ReadResourceRequestSchema,read('ui://before'));
 composeResources(server,list('ui://widget'),read('ui://widget'));
 server.setRequestHandler(ListResourcesRequestSchema,list('ui://after'));server.setRequestHandler(ReadResourceRequestSchema,read('ui://after'));
 const client=new Client({name:'resource-test',version:'test'}),[a,b]=InMemoryTransport.createLinkedPair();await Promise.all([server.connect(a),client.connect(b)]);
 try{assert.deepEqual(new Set((await client.listResources()).resources.map(r=>r.uri)),new Set(['ui://before','ui://widget','ui://after']));for(const uri of ['ui://before','ui://widget','ui://after'])assert.equal((await client.readResource({uri})).contents[0].text,uri);await assert.rejects(()=>client.readResource({uri:'ui://provider-failure'}),/Real provider failure/);await assert.rejects(()=>client.readResource({uri:'ui://unknown'}),/Unknown result resource/);}finally{await client.close();await server.close();}
});
