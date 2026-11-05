// Helix results view for account_prioritization, pmf_scorecard and content_repurposer (register C46).
// Source: shashwatgtm/gtmhelix-tools-hub branch feat/widgets-names-20261105, commit 413e3fc48cef8579b5c8e6e7f3afcf7765e32ac4,
// lane-f/widgets/src/projection.mjs (git blob 365d5186976b0e61793efb5d72fb0579a694135d). names, URI, RESOURCE_NAME, MIME,
// project, attachWidget, resourceMetadata and toolMetadata keep that file's logic; only TypeScript types were added.
// registerResource(server, html, domain) is replaced by attachHelixResults(server, domain) below, because this server uses
// the low level Server, not McpServer. It is additive: tool names, descriptions and input schemas are untouched, the one
// widget tool gains _meta (the link to the view), and its successful answer gains _meta.helixResults. Text is never changed.
// Presentation only. Original server text and calculations remain authoritative.
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { HELIX_RESULTS_HTML } from "./helix-results-html.ts";

type Response = { content?: Array<{ type: string; text?: string }>; structuredContent?: any; isError?: boolean; _meta?: Record<string, unknown>; [key: string]: unknown };

export const names: Record<string, string> = { account_prioritization: 'Account Prioritization', pmf_scorecard: 'Product Market Fit Scorecard', content_repurposer: 'Content Repurposer' };
export const URI = 'ui://helix/results/v1.html';
export const RESOURCE_NAME = 'helix-results';
export const MIME = 'text/html;profile=mcp-app';
export function project(name: string, response: Response | undefined) {
 if (!names[name] || response?.isError) return null;
 const text = response?.content?.filter(x => x.type === 'text').map(x => x.text).join('\n');
 if (typeof text !== 'string' || !text.trim()) return null;
 const s = response!.structuredContent;
 const result: Record<string, unknown> = { version: 2, tool: name, title: names[name], text };
 // Account data is the server's shared scoring result, never rebuilt from Markdown.
 if (name === 'account_prioritization' && s?.tool === name && Array.isArray(s.result?.accounts)) {
  result.accounts = s.result; result.warnings = s.warnings ?? [];
 }
 return result;
}
export function attachWidget(name: string, response: Response) {
 const view = project(name, response); if (!view) return response;
 return { ...response, _meta: { ...response._meta, helixResults: view } };
}
// The same host declarations as the existing Helix market sizing widget. A domain is declared only when the server build enables it.
export function resourceMetadata(domain?: string) { return {
 ui: { prefersBorder: true, ...(domain ? { domain } : {}), csp: { connectDomains: [], resourceDomains: [], frameDomains: [] } },
 'openai/widgetDescription': 'Helix results view: the complete server answer in sections, with a copy control. It calculates nothing.',
 'openai/widgetPrefersBorder': true,
 ...(domain ? { 'openai/widgetDomain': domain } : {}),
 'openai/widgetCSP': { connect_domains: [], resource_domains: [], frame_domains: [] },
 'openai/ui': { availableDisplayModes: ['inline', 'fullscreen'] },
}; }
export function toolMetadata(existing: Record<string, any> = {}) { return { ...existing, ui: { ...existing.ui, resourceUri: URI }, 'openai/outputTemplate': URI }; }

type Handler = (request: any, extra: any) => Promise<any>;
// Called once, last in createServer, after every tool, safety, reader and widget wrapper is registered, so the view is built
// from the final answer. SDK 1.x has no public handler getter; like resource-handlers.ts this reads the pinned internal
// registry and fails explicitly if it changes. Existing resources (the market sizing widget) are kept and answered first
// for their own addresses.
export function attachHelixResults(server: Server, domain?: string): void {
 const handlers: Map<string, Handler> = (server as any)._requestHandlers;
 if (!(handlers instanceof Map)) throw new Error("MCP handler registry changed; the results view requires review.");
 const listTools = handlers.get("tools/list"), callTool = handlers.get("tools/call");
 if (!listTools || !callTool) throw new Error("Register tools before the results view.");
 const listResources = handlers.get("resources/list"), readResource = handlers.get("resources/read");
 server.registerCapabilities({ resources: {} });
 handlers.set("tools/list", async (request, extra) => {
  const result = await listTools(request, extra);
  return { ...result, tools: result.tools.map((tool: any) => Object.prototype.hasOwnProperty.call(names, tool.name) ? { ...tool, _meta: toolMetadata(tool._meta) } : tool) };
 });
 handlers.set("tools/call", async (request, extra) => attachWidget(String(request?.params?.name), await callTool(request, extra)));
 const resource = { uri: URI, name: RESOURCE_NAME, mimeType: MIME, _meta: resourceMetadata(domain) };
 handlers.set("resources/list", async (request, extra) => {
  const result = listResources ? await listResources(request, extra) : { resources: [] };
  return { ...result, resources: [...(result.resources ?? []).filter((r: any) => r.uri !== URI), resource] };
 });
 handlers.set("resources/read", async (request, extra) => {
  if (request?.params?.uri === URI) return { contents: [{ uri: URI, mimeType: MIME, text: HELIX_RESULTS_HTML, _meta: resourceMetadata(domain) }] };
  if (readResource) return readResource(request, extra);
  throw new McpError(ErrorCode.InvalidParams, "Unknown result resource");
 });
}
