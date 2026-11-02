import {readFileSync} from 'node:fs';
export const seedCases=JSON.parse(readFileSync(new URL('./fixtures/round5-reader-cases.json',import.meta.url),'utf8'));
export const verticalCases=[['logistics-tech','Logistics dispatch planning software'],['fintech','Fintech payment reconciliation'],['saas','SaaS subscription management platform'],['vertical-saas','Vertical SaaS retail execution software'],['ai-native','AI native document review agents'],['ites','ITeS business process outsourcing services'],['telecom','Telecom network connectivity services'],['software','API testing and monitoring tool for backend developers'],['cybersecurity','Cybersecurity threat detection software']];
export const regionCases=[['India','the Indian market','india'],['Southeast Asia','ASEAN','southeast-asia'],['Middle East','GCC','middle-east'],['United Kingdom','UK','united-kingdom'],['Europe','European market','europe'],['United States','USA','united-states']];
export async function rpc(handler,method,params={}){
 const response=await handler(new Request('https://example.com/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})}));
 const body=await response.json();if(body.error)throw new Error(JSON.stringify(body.error));return body.result;
}
