const text = { type: "string" };
const figure = {
  type: "object", required: ["key", "label", "value", "display", "example"],
  properties: { key: text, label: text, value: { type: "number" }, display: text, example: { type: "boolean" } },
  additionalProperties: false,
};
const target = { ...figure, required: ["label", "value", "display", "example"] };
const unavailable = { type: "object", required: ["kind", "reason"], properties: { kind: { const: "unavailable" }, reason: text }, additionalProperties: false };

// This contract is advertised only when the slice widget is enabled.
export function widgetOutputSchema(payload: "meta" | "full") {
  const summary = {
    type: "object", required: ["kind", "figures", "targets", "rates"],
    properties: {
      kind: { const: "market-sizing" },
      figures: { type: "array", items: figure, minItems: 3, maxItems: 3 },
      targets: { type: "array", items: target, minItems: 3, maxItems: 3 },
      rates: { type: "object", required: ["icp", "share"], properties: { icp: {type:"number",minimum:0,maximum:100}, share: {type:"number",minimum:0,maximum:100} }, additionalProperties: false },
      ...(payload === "full" ? { toolArgumentsEncoded: text, inputs: {type:"array",items:{type:"object",required:["label","display","example"],properties:{label:text,display:text,example:{type:"boolean"}},additionalProperties:false}}, validation:{type:"array",items:text}, sourceNote:text } : {}),
    }, additionalProperties: false,
  };
  return {
    type: "object" as const, required: ["marketSizing", "plainText"],
    properties: { plainText: text, marketSizing: { oneOf: [summary, unavailable] },
      ...(payload === "full" ? {tool:text,title:text,sections:{type:"array",items:{type:"object"}},presentation:text} : {}),
    }, additionalProperties: false,
  };
}
