"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachWidgets = attachWidgets;
const widget_origin_ts_1 = require("./widget-origin.js");
const widget_output_schema_ts_1 = require("./widget-output-schema.js");
const build_profile_ts_1 = require("./build-profile.js");
const tam_summary_ts_1 = require("./tam-summary.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const widget_model_ts_1 = require("./widget-model.js");
const widget_document_ts_1 = require("./widget-document.js");
const widget_registry_ts_1 = require("./widget-registry.js");
const uri = (name) => `ui://helix-wave3-${build_profile_ts_1.BUILD_PROFILE.buildHash}/${name}.html`;
function attachWidgets(server) {
    const selected = build_profile_ts_1.BUILD_PROFILE.profile === "wave" ? widget_registry_ts_1.WIDGETS : Object.fromEntries(Object.entries(widget_registry_ts_1.WIDGETS).filter(([name]) => name === "tam_sam_som_calculator"));
    if (!Object.keys(selected).length)
        return;
    server.registerCapabilities({ resources: {} });
    const register = server.setRequestHandler.bind(server);
    server.setRequestHandler = ((schema, handler) => register(schema, async (request, extra) => {
        const result = await handler(request, extra);
        if (request.method === "tools/list")
            return {
                ...result,
                tools: result.tools.map((t) => Object.prototype.hasOwnProperty.call(selected, t.name)
                    ? {
                        ...t,
                        ...(t.name === "tam_sam_som_calculator" ? { outputSchema: (0, widget_output_schema_ts_1.widgetOutputSchema)(build_profile_ts_1.BUILD_PROFILE.payload) } : {}),
                        _meta: {
                            ...t._meta,
                            ui: {
                                ...t._meta?.ui,
                                resourceUri: uri(t.name),
                                visibility: t.name === "tam_sam_som_calculator"
                                    ? ["model", "app"]
                                    : ["model"],
                            },
                            "openai/outputTemplate": uri(t.name),
                        },
                    }
                    : t),
            };
        if (request.method === "tools/call" &&
            !result.isError &&
            Object.prototype.hasOwnProperty.call(selected, request.params.name)) {
            const text = result.content
                ?.filter((c) => c.type === "text")
                .map((c) => c.text)
                .join("\n");
            if (typeof text === "string") {
                const display = { ...result.structuredContent, ...(0, widget_model_ts_1.widgetPayload)(request.params.name, widget_registry_ts_1.WIDGETS[request.params.name], text) };
                const facts = {};
                const summary = request.params.name === 'tam_sam_som_calculator' ? (0, tam_summary_ts_1.marketSummary)(request.params.arguments) : null;
                if (summary)
                    display.marketSizing = summary;
                if (summary?.kind === 'market-sizing')
                    facts.marketSizing = { kind: summary.kind, figures: summary.figures, targets: summary.targets, rates: summary.rates };
                else if (summary)
                    facts.marketSizing = summary;
                if (build_profile_ts_1.BUILD_PROFILE.payload === 'full')
                    return { ...result, structuredContent: display };
                // Display data and caller context are delivered only to the component.
                if (display.marketSizing) {
                    const { toolArgumentsEncoded, ...summary } = display.marketSizing;
                    display.marketSizing = summary;
                }
                const { structuredContent, ...plain } = result;
                return { ...plain, ...(Object.keys(facts).length ? { structuredContent: facts } : {}), _meta: { ...result._meta, ...display, toolArguments: request.params.arguments } };
            }
        }
        return result;
    }));
    register(types_js_1.ListResourcesRequestSchema, async () => ({
        resources: Object.entries(selected).map(([name, title]) => ({
            uri: uri(name),
            name: title + " result",
            mimeType: "text/html;profile=mcp-app",
            description: name === "tam_sam_som_calculator" ? "Market sizing result; recalculate when the host enables tool calls." : "Result view with the complete source text.",
        })),
    }));
    register(types_js_1.ReadResourceRequestSchema, async (request) => {
        const entry = Object.entries(selected).find(([name]) => uri(name) === request.params.uri);
        if (!entry)
            throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, "Unknown result resource");
        return {
            contents: [
                {
                    uri: request.params.uri,
                    mimeType: "text/html;profile=mcp-app",
                    text: widget_document_ts_1.WIDGET_HTML,
                    _meta: {
                        ui: {
                            prefersBorder: true,
                            ...(build_profile_ts_1.BUILD_PROFILE.domainEnabled && widget_origin_ts_1.WIDGET_ORIGIN ? { domain: widget_origin_ts_1.WIDGET_ORIGIN } : {}),
                            csp: { connectDomains: [], resourceDomains: [] },
                        },
                        "openai/widgetDescription": entry[1] + " result with source text and table views.",
                        "openai/widgetPrefersBorder": true,
                        ...(build_profile_ts_1.BUILD_PROFILE.domainEnabled && widget_origin_ts_1.WIDGET_ORIGIN ? { "openai/widgetDomain": widget_origin_ts_1.WIDGET_ORIGIN } : {}),
                        "openai/widgetCSP": { connect_domains: [], resource_domains: [] },
                        "openai/ui": { availableDisplayModes: ["inline", "fullscreen"] },
                    },
                },
            ],
        };
    });
}
//# sourceMappingURL=widget-layer.js.map