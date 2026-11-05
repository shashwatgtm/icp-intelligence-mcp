import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
type Response = {
    content?: Array<{
        type: string;
        text?: string;
    }>;
    structuredContent?: any;
    isError?: boolean;
    _meta?: Record<string, unknown>;
    [key: string]: unknown;
};
export declare const names: Record<string, string>;
export declare const URI = "ui://helix/results/v1.html";
export declare const RESOURCE_NAME = "helix-results";
export declare const MIME = "text/html;profile=mcp-app";
export declare function project(name: string, response: Response | undefined): Record<string, unknown> | null;
export declare function attachWidget(name: string, response: Response): Response | {
    _meta: {
        helixResults: Record<string, unknown>;
    };
    content?: Array<{
        type: string;
        text?: string;
    }>;
    structuredContent?: any;
    isError?: boolean;
};
export declare function resourceMetadata(domain?: string): {
    'openai/widgetCSP': {
        connect_domains: never[];
        resource_domains: never[];
        frame_domains: never[];
    };
    'openai/ui': {
        availableDisplayModes: string[];
    };
    'openai/widgetDomain'?: string | undefined;
    ui: {
        csp: {
            connectDomains: never[];
            resourceDomains: never[];
            frameDomains: never[];
        };
        domain?: string | undefined;
        prefersBorder: boolean;
    };
    'openai/widgetDescription': string;
    'openai/widgetPrefersBorder': boolean;
};
export declare function toolMetadata(existing?: Record<string, any>): {
    ui: any;
    'openai/outputTemplate': string;
};
export declare function attachHelixResults(server: Server, domain?: string): void;
export {};
//# sourceMappingURL=helix-results.d.ts.map