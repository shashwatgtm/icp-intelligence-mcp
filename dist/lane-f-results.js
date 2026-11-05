"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MIME = exports.URI = exports.names = void 0;
exports.sectionsOf = sectionsOf;
exports.project = project;
exports.attachWidget = attachWidget;
exports.resourceMetadata = resourceMetadata;
exports.toolMetadata = toolMetadata;
exports.attachLaneFResults = attachLaneFResults;
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const lane_f_results_html_ts_1 = require("./lane-f-results-html.js");
exports.names = { account_prioritization: 'Account Prioritization', pmf_scorecard: 'Product Market Fit Scorecard', content_repurposer: 'Content Repurposer' };
exports.URI = 'ui://helix/lane-f/results/v1.html';
exports.MIME = 'text/html;profile=mcp-app';
function sectionsOf(text) {
    const parts = [];
    let part = { heading: 'Before you use this result', level: 0, text: '' }, fence = null;
    for (const line of text.split('\n')) {
        const mark = /^\s*(`{3,}|~{3,})/.exec(line);
        if (mark) {
            if (!fence)
                fence = mark[1][0];
            else if (fence === mark[1][0])
                fence = null;
        }
        const h = !fence && /^(#{1,3})\s+(.+)$/.exec(line);
        if (h) {
            if (part.text.trim() || part.level)
                parts.push(part);
            part = { heading: h[2], level: h[1].length, text: '' };
        }
        else
            part.text += (part.text ? '\n' : '') + line;
    }
    if (part.text.trim() || part.level)
        parts.push(part);
    return parts;
}
function project(name, response) {
    if (!exports.names[name] || response?.isError)
        return null;
    const text = response?.content?.filter(x => x.type === 'text').map(x => x.text).join('\n');
    if (typeof text !== 'string' || !text.trim())
        return null;
    const sections = sectionsOf(text), s = response.structuredContent;
    const result = { version: 1, tool: name, title: exports.names[name], text, sections };
    // Account data is the original shared scoring result, never rebuilt from Markdown.
    if (name === 'account_prioritization' && s?.tool === name && Array.isArray(s.result?.accounts)) {
        result.accounts = s.result;
        result.warnings = s.warnings ?? [];
    }
    return result;
}
function attachWidget(name, response) {
    const view = project(name, response);
    if (!view)
        return response;
    return { ...response, _meta: { ...response._meta, helixLaneF: view } };
}
function resourceMetadata() { return { ui: { csp: { connectDomains: [], resourceDomains: [], frameDomains: [] } } }; }
function toolMetadata(existing = {}) { return { ...existing, ui: { ...existing.ui, resourceUri: exports.URI }, 'openai/outputTemplate': exports.URI }; }
// Called once, last in createServer, after every tool, safety, reader and widget wrapper is registered, so the widget
// view is built from the final answer. SDK 1.x has no public handler getter; like resource-handlers.ts this reads the
// pinned internal registry and fails explicitly if it changes. Existing resources (the slice widget) are kept and
// answered first for their own addresses.
function attachLaneFResults(server) {
    const handlers = server._requestHandlers;
    if (!(handlers instanceof Map))
        throw new Error("MCP handler registry changed; the result widget requires review.");
    const listTools = handlers.get("tools/list"), callTool = handlers.get("tools/call");
    if (!listTools || !callTool)
        throw new Error("Register tools before the result widget.");
    const listResources = handlers.get("resources/list"), readResource = handlers.get("resources/read");
    server.registerCapabilities({ resources: {} });
    handlers.set("tools/list", async (request, extra) => {
        const result = await listTools(request, extra);
        return { ...result, tools: result.tools.map((tool) => Object.prototype.hasOwnProperty.call(exports.names, tool.name) ? { ...tool, _meta: toolMetadata(tool._meta) } : tool) };
    });
    handlers.set("tools/call", async (request, extra) => attachWidget(String(request?.params?.name), await callTool(request, extra)));
    const resource = { uri: exports.URI, name: 'helix-lane-f-results', mimeType: exports.MIME, _meta: resourceMetadata() };
    handlers.set("resources/list", async (request, extra) => {
        const result = listResources ? await listResources(request, extra) : { resources: [] };
        return { ...result, resources: [...(result.resources ?? []).filter((r) => r.uri !== exports.URI), resource] };
    });
    handlers.set("resources/read", async (request, extra) => {
        if (request?.params?.uri === exports.URI)
            return { contents: [{ uri: exports.URI, mimeType: exports.MIME, text: lane_f_results_html_ts_1.LANE_F_RESULTS_HTML, _meta: resourceMetadata() }] };
        if (readResource)
            return readResource(request, extra);
        throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, "Unknown result resource");
    });
}
//# sourceMappingURL=lane-f-results.js.map