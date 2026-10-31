import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
export type Row = Record<string, any>;
export type Schema = {
    type: string;
    properties?: Record<string, Schema>;
    items?: Schema;
    required?: string[];
    enum?: string[];
    maxItems?: number;
    minItems?: number;
    maxLength?: number;
    minimum?: number;
    maximum?: number;
    additionalProperties?: boolean;
    description?: string;
};
export declare const text: Schema;
export declare const num: (minimum?: number, maximum?: number) => Schema;
export declare const bool: Schema;
export declare const choice: (...values: string[]) => Schema;
export declare const object: (properties: Record<string, Schema>, required?: string[]) => Schema;
export declare const array: (items: Schema, maxItems?: number, minItems?: number) => Schema;
export declare const iso: (s: unknown) => s is string;
export declare const days: (from: string, to: string) => number;
export declare const plusDays: (date: string, n: number) => string;
export declare const round: (n: number) => number;
export declare const sum: (values: number[]) => number;
export declare function requireDate(date: unknown, label: string, asOf?: string): void;
export declare function requireUnique(rows: Row[], key: string): void;
export type Report = {
    title: string;
    summary: string[];
    metrics?: {
        label: string;
        value: string | number | null;
        example?: boolean;
    }[];
    sections?: {
        heading: string;
        body?: string;
        table?: {
            headers: string[];
            rows: (string | number | null)[][];
        };
    }[];
    data: Row;
    limitations?: string[];
};
export declare const esc: (value: unknown) => string;
export declare function reportText(report: Report): string;
export declare function define(name: string, description: string, schema: Schema, run: (a: Row) => Report): void;
export declare const reserveTools: () => {
    inputSchema: {
        [x: string]: unknown;
        type: "object";
        properties?: {
            [x: string]: object;
        } | undefined;
        required?: string[] | undefined;
    };
    name: string;
    description?: string | undefined;
    outputSchema?: {
        [x: string]: unknown;
        type: "object";
        properties?: {
            [x: string]: object;
        } | undefined;
        required?: string[] | undefined;
    } | undefined;
    annotations?: {
        title?: string | undefined;
        readOnlyHint?: boolean | undefined;
        destructiveHint?: boolean | undefined;
        idempotentHint?: boolean | undefined;
        openWorldHint?: boolean | undefined;
    } | undefined;
    execution?: {
        taskSupport?: "optional" | "required" | "forbidden" | undefined;
    } | undefined;
    _meta?: {
        [x: string]: unknown;
    } | undefined;
    icons?: {
        src: string;
        mimeType?: string | undefined;
        sizes?: string[] | undefined;
        theme?: "light" | "dark" | undefined;
    }[] | undefined;
    title?: string | undefined;
}[];
export declare const isReserveTool: (name: string) => boolean;
export declare function callReserveTool(name: string, args: unknown): CallToolResult;
//# sourceMappingURL=reserve-common.d.ts.map