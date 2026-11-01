import { widgetTextSchema } from "./widget-text-schema.ts";
import { composeResources } from "./resource-handlers.ts";
import { WIDGET_ORIGIN } from "./widget-origin.ts";
import { widgetOutputSchema } from "./widget-output-schema.ts";
import { BUILD_PROFILE } from './build-profile.ts';
import { marketSummary } from "./tam-summary.ts";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  McpError,
  ErrorCode,
} from "@modelcontextprotocol/sdk/types.js";
import { widgetPayload } from "./widget-model.ts";
import { WIDGET_HTML } from "./widget-document.ts";
import { WIDGETS } from "./widget-registry.ts";
const uri = (name: string) => `ui://helix-wave3-${BUILD_PROFILE.buildHash}/${name}.html`;
export function attachWidgets(server: Server): void {
  const selected = BUILD_PROFILE.profile === "wave" ? WIDGETS : Object.fromEntries(Object.entries(WIDGETS).filter(([name]) => name === "tam_sam_som_calculator"));
  if (!Object.keys(selected).length) return;
  server.registerCapabilities({ resources: {} });
  const register = server.setRequestHandler.bind(server);
  server.setRequestHandler = ((schema: any, handler: any) =>
    register(schema, async (request: any, extra: any) => {
      const result = await handler(request, extra);
      if (request.method === "tools/list")
        return {
          ...result,
          tools: result.tools.map((t: any) =>
            Object.prototype.hasOwnProperty.call(selected, t.name)
              ? {
                  ...t,
                  outputSchema: t.name === "tam_sam_som_calculator" ? widgetOutputSchema(BUILD_PROFILE.payload) : widgetTextSchema(t.outputSchema),
                  _meta: {
                    ...t._meta,
                    ui: {
                      ...t._meta?.ui,
                      resourceUri: uri(t.name),
                      visibility:
                        t.name === "tam_sam_som_calculator"
                          ? ["model", "app"]
                          : ["model"],
                    },
                    "openai/outputTemplate": uri(t.name),
                  },
                }
              : t,
          ),
        };
      if (
        request.method === "tools/call" &&
        !result.isError &&
        Object.prototype.hasOwnProperty.call(selected, request.params.name)
      ) {
        const text = result.content
          ?.filter((c: any) => c.type === "text")
          .map((c: any) => c.text)
          .join("\n");
        if (typeof text === "string") {
          const display: any = { ...result.structuredContent, ...widgetPayload(request.params.name, WIDGETS[request.params.name], text) };
          const facts: any = { plainText: text };
          const summary = request.params.name === 'tam_sam_som_calculator' ? marketSummary(request.params.arguments) : null;
          if (summary) display.marketSizing = summary;
          if (summary?.kind === 'market-sizing') facts.marketSizing = { kind: summary.kind, figures: summary.figures, targets: summary.targets, rates: summary.rates };
          else if (summary) facts.marketSizing = summary;

          if (BUILD_PROFILE.payload === 'full') return { ...result, structuredContent: display };
          // Rich display data stays in the component; every host also gets the full text.
          if (display.marketSizing) {
            const { toolArgumentsEncoded, ...summary } = display.marketSizing;
            display.marketSizing = summary;
          }
          const { structuredContent, ...plain } = result;
          return { ...plain, structuredContent: facts, _meta: { ...result._meta, ...display, toolArguments: request.params.arguments } };
        }
      }
      return result;
    })) as typeof server.setRequestHandler;
  const listWidgets = async () => ({
    resources: Object.entries(selected).map(([name, title]) => ({
      uri: uri(name),
      name: title + " result",
      mimeType: "text/html;profile=mcp-app",
      description: name === "tam_sam_som_calculator" ? "Market sizing result; recalculate when the host enables tool calls." : "Result view with the complete source text.",
    })),
  });
  const readWidget = async (request: any) => {
    const entry = Object.entries(selected).find(
      ([name]) => uri(name) === request.params.uri,
    );
    if (!entry)
      throw new McpError(ErrorCode.InvalidParams, "Unknown result resource");
    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: "text/html;profile=mcp-app",
          text: WIDGET_HTML,
          _meta: {
            ui: {
              prefersBorder: true,
              ...(BUILD_PROFILE.domainEnabled && WIDGET_ORIGIN ? {domain: WIDGET_ORIGIN} : {}),
              csp: { connectDomains: [], resourceDomains: [] },
            },
            "openai/widgetDescription":
              entry[1] + " result with source text and table views.",
            "openai/widgetPrefersBorder": true,
            ...(BUILD_PROFILE.domainEnabled && WIDGET_ORIGIN ? {"openai/widgetDomain": WIDGET_ORIGIN} : {}),
            "openai/widgetCSP": { connect_domains: [], resource_domains: [] },
            "openai/ui": { availableDisplayModes: ["inline", "fullscreen"] },
          },
        },
      ],
    };
  };
  composeResources(server, listWidgets, readWidget);
}
