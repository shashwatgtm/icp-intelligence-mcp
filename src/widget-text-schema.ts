// Generated into every widget server by build.mjs.
// Hosts may consume structuredContent without content or component metadata.
export function widgetTextSchema(schema?: {
  type?: string;
  properties?: Record<string, unknown>;
  required?: string[];
  [key: string]: unknown;
}) {
  return {
    type: "object" as const,
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
