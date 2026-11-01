import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  McpError,
  ErrorCode,
} from "@modelcontextprotocol/sdk/types.js";
type Handler = (request: any, extra: any) => Promise<any> | any;
// SDK 1.x has no public handler getter. Fail explicitly if this pinned internal
// registry changes, rather than silently replacing resources from another module.
export function composeResources(
  server: Server,
  listWidgets: Handler,
  readWidget: Handler,
): void {
  const handlers = (server as any)._requestHandlers;
  if (!(handlers instanceof Map))
    throw new Error(
      "MCP handler registry changed; resource composition requires review.",
    );
  const lists: Handler[] = [],
    reads: Handler[] = [];
  const beforeList = handlers.get("resources/list"),
    beforeRead = handlers.get("resources/read");
  if (beforeList) lists.push(beforeList);
  if (beforeRead) reads.push(beforeRead);
  const register = server.setRequestHandler.bind(server);
  register(ListResourcesRequestSchema, async (request, extra) => {
    const results = [];
    for (const handler of lists) results.push(await handler(request, extra));
    const own = await listWidgets(request, extra),
      resources = new Map<string, any>();
    for (const result of [...results, own])
      for (const resource of result.resources ?? [])
        resources.set(resource.uri, resource);
    const paginated = results.filter(
      (result) => result.nextCursor !== undefined,
    );
    if (paginated.length > 1)
      throw new McpError(
        ErrorCode.InternalError,
        "Multiple paginated resource providers need a shared cursor adapter.",
      );
    return {
      ...(results[0] ?? {}),
      ...own,
      ...(paginated[0] ? { nextCursor: paginated[0].nextCursor } : {}),
      resources: [...resources.values()],
    };
  });
  register(ReadResourceRequestSchema, async (request, extra) => {
    for (const handler of [readWidget, ...reads.slice().reverse()]) {
      try {
        const result = await handler(request, extra);
        if (
          result?.contents?.some(
            (content: any) => content.uri === request.params.uri,
          )
        )
          return result;
      } catch (error) {
        if (![-32602, -32002].includes((error as any)?.code)) throw error;
      }
    }
    throw new McpError(ErrorCode.InvalidParams, "Unknown result resource");
  });
  server.setRequestHandler = ((schema: any, handler: Handler) => {
    const method = schema?.shape?.method?.value;
    if (method === "resources/list") {
      lists.push(handler);
      return;
    }
    if (method === "resources/read") {
      reads.push(handler);
      return;
    }
    return register(schema, handler as any);
  }) as typeof server.setRequestHandler;
}
