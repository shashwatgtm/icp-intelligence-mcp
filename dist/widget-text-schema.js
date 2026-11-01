"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.widgetTextSchema = widgetTextSchema;
// Generated into every widget server by build.mjs.
// Hosts may consume structuredContent without content or component metadata.
function widgetTextSchema(schema) {
    return {
        type: "object",
        ...schema,
        properties: {
            ...schema?.properties,
            plainText: {
                type: "string",
                description: "The complete answer, identical to the text content.",
            },
        },
        required: [...new Set([...(schema?.required ?? []), "plainText"])],
    };
}
//# sourceMappingURL=widget-text-schema.js.map