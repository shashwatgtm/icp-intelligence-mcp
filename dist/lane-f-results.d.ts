import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
type Part = {
    heading: string;
    level: number;
    text: string;
};
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
export declare const URI = "ui://helix/lane-f/results/v1.html";
export declare const MIME = "text/html;profile=mcp-app";
export declare function sectionsOf(text: string): Part[];
export declare function project(name: string, response: Response | undefined): Record<string, unknown> | null;
export declare function attachWidget(name: string, response: Response): Response | {
    _meta: {
        helixLaneF: Record<string, unknown>;
    };
    content?: Array<{
        type: string;
        text?: string;
    }>;
    structuredContent?: any;
    isError?: boolean;
};
export declare function resourceMetadata(): {
    ui: {
        csp: {
            connectDomains: never[];
            resourceDomains: never[];
            frameDomains: never[];
        };
    };
};
export declare function toolMetadata(existing?: Record<string, any>): {
    ui: any;
    'openai/outputTemplate': string;
};
export declare function attachLaneFResults(server: Server): void;
export {};
//# sourceMappingURL=lane-f-results.d.ts.map