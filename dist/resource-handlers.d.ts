import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
type Handler = (request: any, extra: any) => Promise<any> | any;
export declare function composeResources(server: Server, listWidgets: Handler, readWidget: Handler): void;
export {};
//# sourceMappingURL=resource-handlers.d.ts.map