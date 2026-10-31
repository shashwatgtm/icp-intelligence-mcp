"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachWidgets = attachWidgets;
const tam_summary_ts_1 = require("./tam-summary.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const widget_model_ts_1 = require("./widget-model.js");
const widget_document_ts_1 = require("./widget-document.js");
const widget_registry_ts_1 = require("./widget-registry.js");
const uri = (name) => `ui://helix-wave2/${name}.html`;
function attachWidgets(server) {
    server.registerCapabilities({ resources: {} });
    const register = server.setRequestHandler.bind(server);
    server.setRequestHandler = ((schema, handler) => register(schema, async (request, extra) => {
        const result = await handler(request, extra);
        if (request.method === 'tools/list')
            return { ...result, tools: result.tools.map((t) => Object.prototype.hasOwnProperty.call(widget_registry_ts_1.WIDGETS, t.name) ? { ...t, _meta: { ...t._meta, ui: { ...t._meta?.ui, resourceUri: uri(t.name), visibility: t.name === 'tam_sam_som_calculator' ? ['model', 'app'] : ['model'] }, 'openai/outputTemplate': uri(t.name) } } : t) };
        if (request.method === 'tools/call' && !result.isError && Object.prototype.hasOwnProperty.call(widget_registry_ts_1.WIDGETS, request.params.name)) {
            const text = result.content?.filter((c) => c.type === 'text').map((c) => c.text).join('\n');
            if (typeof text === 'string')
                return { ...result, structuredContent: { ...(0, widget_model_ts_1.widgetPayload)(request.params.name, widget_registry_ts_1.WIDGETS[request.params.name], text), ...(request.params.name === 'tam_sam_som_calculator' ? { marketSizing: (0, tam_summary_ts_1.marketSummary)(request.params.arguments) } : {}) } };
        }
        return result;
    }));
    register(types_js_1.ListResourcesRequestSchema, async () => ({ resources: Object.entries(widget_registry_ts_1.WIDGETS).map(([name, title]) => ({ uri: uri(name), name: title + ' result', mimeType: 'text/html;profile=mcp-app', description: 'Optional read-only view; the tool text remains available.' })) }));
    register(types_js_1.ReadResourceRequestSchema, async (request) => { const entry = Object.entries(widget_registry_ts_1.WIDGETS).find(([name]) => uri(name) === request.params.uri); if (!entry)
        throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, 'Unknown result resource'); return { contents: [{ uri: request.params.uri, mimeType: 'text/html;profile=mcp-app', text: widget_document_ts_1.WIDGET_HTML, _meta: { ui: { prefersBorder: true, csp: { connectDomains: [], resourceDomains: [] } }, 'openai/widgetDescription': entry[1] + ' result with source text and table views.', 'openai/widgetPrefersBorder': true, 'openai/widgetCSP': { connect_domains: [], resource_domains: [] }, 'openai/ui': { availableDisplayModes: ['inline'] } } }] }; });
}
//# sourceMappingURL=widget-layer.js.map