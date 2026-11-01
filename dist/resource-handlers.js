"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.composeResources = composeResources;
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
// SDK 1.x has no public handler getter. Fail explicitly if this pinned internal
// registry changes, rather than silently replacing resources from another module.
function composeResources(server, listWidgets, readWidget) {
    const handlers = server._requestHandlers;
    if (!(handlers instanceof Map))
        throw new Error("MCP handler registry changed; resource composition requires review.");
    const lists = [], reads = [];
    const beforeList = handlers.get("resources/list"), beforeRead = handlers.get("resources/read");
    if (beforeList)
        lists.push(beforeList);
    if (beforeRead)
        reads.push(beforeRead);
    const register = server.setRequestHandler.bind(server);
    register(types_js_1.ListResourcesRequestSchema, async (request, extra) => {
        const results = [];
        for (const handler of lists)
            results.push(await handler(request, extra));
        const own = await listWidgets(request, extra), resources = new Map();
        for (const result of [...results, own])
            for (const resource of result.resources ?? [])
                resources.set(resource.uri, resource);
        const paginated = results.filter((result) => result.nextCursor !== undefined);
        if (paginated.length > 1)
            throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, "Multiple paginated resource providers need a shared cursor adapter.");
        return {
            ...(results[0] ?? {}),
            ...own,
            ...(paginated[0] ? { nextCursor: paginated[0].nextCursor } : {}),
            resources: [...resources.values()],
        };
    });
    register(types_js_1.ReadResourceRequestSchema, async (request, extra) => {
        for (const handler of [readWidget, ...reads.slice().reverse()]) {
            try {
                const result = await handler(request, extra);
                if (result?.contents?.some((content) => content.uri === request.params.uri))
                    return result;
            }
            catch (error) {
                if (![-32602, -32002].includes(error?.code))
                    throw error;
            }
        }
        throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, "Unknown result resource");
    });
    server.setRequestHandler = ((schema, handler) => {
        const method = schema?.shape?.method?.value;
        if (method === "resources/list") {
            lists.push(handler);
            return;
        }
        if (method === "resources/read") {
            reads.push(handler);
            return;
        }
        return register(schema, handler);
    });
}
//# sourceMappingURL=resource-handlers.js.map