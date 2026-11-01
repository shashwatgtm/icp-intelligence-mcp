export declare function widgetTextSchema(schema?: {
    type?: string;
    properties?: Record<string, unknown>;
    required?: string[];
    [key: string]: unknown;
}): {
    properties: {
        plainText: {
            type: string;
            description: string;
        };
    };
    required: string[];
    type: string;
};
//# sourceMappingURL=widget-text-schema.d.ts.map