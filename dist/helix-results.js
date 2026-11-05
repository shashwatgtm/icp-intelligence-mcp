"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MIME = exports.RESOURCE_NAME = exports.URI = exports.names = void 0;
exports.project = project;
exports.attachWidget = attachWidget;
exports.resourceMetadata = resourceMetadata;
exports.toolMetadata = toolMetadata;
exports.attachHelixResults = attachHelixResults;
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const helix_results_html_ts_1 = require("./helix-results-html.js");
exports.names = { account_prioritization: 'Account Prioritization', pmf_scorecard: 'Product Market Fit Scorecard', content_repurposer: 'Content Repurposer' };
exports.URI = 'ui://helix/results/v1.html';
exports.RESOURCE_NAME = 'helix-results';
exports.MIME = 'text/html;profile=mcp-app';
function project(name, response) {
    if (!exports.names[name] || response?.isError)
        return null;
    const text = response?.content?.filter(x => x.type === 'text').map(x => x.text).join('\n');
    if (typeof text !== 'string' || !text.trim())
        return null;
    const s = response.structuredContent;
    const result = { version: 2, tool: name, title: exports.names[name], text };
    // Account data is the server's shared scoring result, never rebuilt from Markdown.
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
    return { ...response, _meta: { ...response._meta, helixResults: view } };
}
// The same host declarations as the existing Helix market sizing widget. A domain is declared only when the server build enables it.
function resourceMetadata(domain) {
    return {
        ui: { prefersBorder: true, ...(domain ? { domain } : {}), csp: { connectDomains: [], resourceDomains: [], frameDomains: [] } },
        'openai/widgetDescription': 'Helix results view: the complete server answer in sections, with a copy control. It calculates nothing.',
        'openai/widgetPrefersBorder': true,
        ...(domain ? { 'openai/widgetDomain': domain } : {}),
        'openai/widgetCSP': { connect_domains: [], resource_domains: [], frame_domains: [] },
        'openai/ui': { availableDisplayModes: ['inline', 'fullscreen'] },
    };
}
function toolMetadata(existing = {}) { return { ...existing, ui: { ...existing.ui, resourceUri: exports.URI }, 'openai/outputTemplate': exports.URI }; }
// Called once, last in createServer, after every tool, safety, reader and widget wrapper is registered, so the view is built
// from the final answer. SDK 1.x has no public handler getter; like resource-handlers.ts this reads the pinned internal
// registry and fails explicitly if it changes. Existing resources (the market sizing widget) are kept and answered first
// for their own addresses.
function attachHelixResults(server, domain) {
    const handlers = server._requestHandlers;
    if (!(handlers instanceof Map))
        throw new Error("MCP handler registry changed; the results view requires review.");
    const listTools = handlers.get("tools/list"), callTool = handlers.get("tools/call");
    if (!listTools || !callTool)
        throw new Error("Register tools before the results view.");
    const listResources = handlers.get("resources/list"), readResource = handlers.get("resources/read");
    server.registerCapabilities({ resources: {} });
    handlers.set("tools/list", async (request, extra) => {
        const result = await listTools(request, extra);
        return { ...result, tools: result.tools.map((tool) => Object.prototype.hasOwnProperty.call(exports.names, tool.name) ? { ...tool, _meta: toolMetadata(tool._meta) } : tool) };
    });
    handlers.set("tools/call", async (request, extra) => attachWidget(String(request?.params?.name), await callTool(request, extra)));
    const resource = { uri: exports.URI, name: exports.RESOURCE_NAME, mimeType: exports.MIME, _meta: resourceMetadata(domain) };
    handlers.set("resources/list", async (request, extra) => {
        const result = listResources ? await listResources(request, extra) : { resources: [] };
        return { ...result, resources: [...(result.resources ?? []).filter((r) => r.uri !== exports.URI), resource] };
    });
    handlers.set("resources/read", async (request, extra) => {
        if (request?.params?.uri === exports.URI)
            return { contents: [{ uri: exports.URI, mimeType: exports.MIME, text: helix_results_html_ts_1.HELIX_RESULTS_HTML, _meta: resourceMetadata(domain) }] };
        if (readResource)
            return readResource(request, extra);
        throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, "Unknown result resource");
    });
}
//# sourceMappingURL=helix-results.js.map