// Result widget for account_prioritization, pmf_scorecard and content_repurposer (register C46, Lane F).
// Source: shashwatgtm/gtmhelix-tools-hub branch codex/night-old-jobs-20261103, commit b020fd20c20837545309edb537ff6d904ee5d06c,
// lane-f/widgets/src/projection.mjs (git blob 6c22080ae42661e95c9843293b274999855fe29c). names, URI, MIME, sectionsOf,
// project, attachWidget, resourceMetadata and toolMetadata keep that file's logic; only TypeScript types were added.
// registerResource(server, html) is replaced by attachLaneFResults(server) below, because this server uses the low level
// Server, not McpServer. It is additive: tool names, descriptions and input schemas are untouched, the three tools gain
// _meta (the widget link), and a successful answer of those tools gains _meta.helixLaneF. Content text is never changed.
// Presentation only. Original server text and calculations remain authoritative.
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { LANE_F_RESULTS_HTML } from "./lane-f-results-html.ts";

type Part = { heading: string; level: number; text: string };
type Response = { content?: Array<{ type: string; text?: string }>; structuredContent?: any; isError?: boolean; _meta?: Record<string, unknown>; [key: string]: unknown };

export const names: Record<string, string> = { account_prioritization: 'Account Prioritization', pmf_scorecard: 'Product Market Fit Scorecard', content_repurposer: 'Content Repurposer' };
export const URI = 'ui://helix/lane-f/results/v1.html';
export const MIME = 'text/html;profile=mcp-app';
export function sectionsOf(text: string): Part[] {
 const parts: Part[] = []; let part: Part = { heading: 'Before you use this result', level: 0, text: '' }, fence: string | null = null;
 for (const line of text.split('\n')) {
  const mark = /^\s*(`{3,}|~{3,})/.exec(line); if (mark) { if (!fence) fence = mark[1][0]; else if (fence === mark[1][0]) fence = null; }
  const h = !fence && /^(#{1,3})\s+(.+)$/.exec(line);
  if (h) { if (part.text.trim() || part.level) parts.push(part); part = { heading: h[2], level: h[1].length, text: '' }; }
  else part.text += (part.text ? '\n' : '') + line;
 } if (part.text.trim() || part.level) parts.push(part); return parts;
}
export function project(name: string, response: Response | undefined) {
 if (!names[name] || response?.isError) return null;
 const text = response?.content?.filter(x => x.type === 'text').map(x => x.text).join('\n');
 if (typeof text !== 'string' || !text.trim()) return null;
 const sections = sectionsOf(text), s = response!.structuredContent;
 const result: Record<string, unknown> = { version: 1, tool: name, title: names[name], text, sections };
 // Account data is the original shared scoring result, never rebuilt from Markdown.
 if (name === 'account_prioritization' && s?.tool === name && Array.isArray(s.result?.accounts)) {
  result.accounts = s.result; result.warnings = s.warnings ?? [];
 }
 return result;
}
export function attachWidget(name: string, response: Response) {
 const view = project(name, response); if (!view) return response;
 return { ...response, _meta: { ...response._meta, helixLaneF: view } };
}
export function resourceMetadata() { return { ui: { csp: { connectDomains: [], resourceDomains: [], frameDomains: [] } } }; }
export function toolMetadata(existing: Record<string, any> = {}) { return { ...existing, ui: { ...existing.ui, resourceUri: URI }, 'openai/outputTemplate': URI }; }

type Handler = (request: any, extra: any) => Promise<any>;
// Called once, last in createServer, after every tool, safety, reader and widget wrapper is registered, so the widget
// view is built from the final answer. SDK 1.x has no public handler getter; like resource-handlers.ts this reads the
// pinned internal registry and fails explicitly if it changes. Existing resources (the slice widget) are kept and
// answered first for their own addresses.
export function attachLaneFResults(server: Server): void {
 const handlers: Map<string, Handler> = (server as any)._requestHandlers;
 if (!(handlers instanceof Map)) throw new Error("MCP handler registry changed; the result widget requires review.");
 const listTools = handlers.get("tools/list"), callTool = handlers.get("tools/call");
 if (!listTools || !callTool) throw new Error("Register tools before the result widget.");
 const listResources = handlers.get("resources/list"), readResource = handlers.get("resources/read");
 server.registerCapabilities({ resources: {} });
 handlers.set("tools/list", async (request, extra) => {
  const result = await listTools(request, extra);
  return { ...result, tools: result.tools.map((tool: any) => Object.prototype.hasOwnProperty.call(names, tool.name) ? { ...tool, _meta: toolMetadata(tool._meta) } : tool) };
 });
 handlers.set("tools/call", async (request, extra) => attachWidget(String(request?.params?.name), await callTool(request, extra)));
 const resource = { uri: URI, name: 'helix-lane-f-results', mimeType: MIME, _meta: resourceMetadata() };
 handlers.set("resources/list", async (request, extra) => {
  const result = listResources ? await listResources(request, extra) : { resources: [] };
  return { ...result, resources: [...(result.resources ?? []).filter((r: any) => r.uri !== URI), resource] };
 });
 handlers.set("resources/read", async (request, extra) => {
  if (request?.params?.uri === URI) return { contents: [{ uri: URI, mimeType: MIME, text: LANE_F_RESULTS_HTML, _meta: resourceMetadata() }] };
  if (readResource) return readResource(request, extra);
  throw new McpError(ErrorCode.InvalidParams, "Unknown result resource");
 });
}
