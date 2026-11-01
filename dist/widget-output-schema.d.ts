export declare function widgetOutputSchema(payload: "meta" | "full"): {
    type: "object";
    required: string[];
    properties: {
        tool?: {
            type: string;
        } | undefined;
        title?: {
            type: string;
        } | undefined;
        plainText?: {
            type: string;
        } | undefined;
        sections?: {
            type: string;
            items: {
                type: string;
            };
        } | undefined;
        presentation?: {
            type: string;
        } | undefined;
        marketSizing: {
            oneOf: ({
                type: string;
                required: string[];
                properties: {
                    kind: {
                        const: string;
                    };
                    reason: {
                        type: string;
                    };
                };
                additionalProperties: boolean;
            } | {
                type: string;
                required: string[];
                properties: {
                    toolArgumentsEncoded?: {
                        type: string;
                    } | undefined;
                    inputs?: {
                        type: string;
                        items: {
                            type: string;
                            required: string[];
                            properties: {
                                label: {
                                    type: string;
                                };
                                display: {
                                    type: string;
                                };
                                example: {
                                    type: string;
                                };
                            };
                            additionalProperties: boolean;
                        };
                    } | undefined;
                    validation?: {
                        type: string;
                        items: {
                            type: string;
                        };
                    } | undefined;
                    sourceNote?: {
                        type: string;
                    } | undefined;
                    kind: {
                        const: string;
                    };
                    figures: {
                        type: string;
                        items: {
                            type: string;
                            required: string[];
                            properties: {
                                key: {
                                    type: string;
                                };
                                label: {
                                    type: string;
                                };
                                value: {
                                    type: string;
                                };
                                display: {
                                    type: string;
                                };
                                example: {
                                    type: string;
                                };
                            };
                            additionalProperties: boolean;
                        };
                        minItems: number;
                        maxItems: number;
                    };
                    targets: {
                        type: string;
                        items: {
                            required: string[];
                            type: string;
                            properties: {
                                key: {
                                    type: string;
                                };
                                label: {
                                    type: string;
                                };
                                value: {
                                    type: string;
                                };
                                display: {
                                    type: string;
                                };
                                example: {
                                    type: string;
                                };
                            };
                            additionalProperties: boolean;
                        };
                        minItems: number;
                        maxItems: number;
                    };
                    rates: {
                        type: string;
                        required: string[];
                        properties: {
                            icp: {
                                type: string;
                                minimum: number;
                                maximum: number;
                            };
                            share: {
                                type: string;
                                minimum: number;
                                maximum: number;
                            };
                        };
                        additionalProperties: boolean;
                    };
                };
                additionalProperties: boolean;
            })[];
        };
    };
    additionalProperties: boolean;
};
//# sourceMappingURL=widget-output-schema.d.ts.map