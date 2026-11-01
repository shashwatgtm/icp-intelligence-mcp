import { BUILD_PROFILE } from "./build-profile.ts";
export const CONVERSATION_INSTRUCTIONS = "For market sizing, ask what they sell, how many companies could buy, and the annual contract value before calling. Never estimate or invent these. Clarify unlabelled numbers and percentage fractions. This calculator displays USD only: do not treat rupees as dollars or invent an exchange rate. Ask for a user-confirmed USD amount. Defaults are examples, not research.";
const TOOL_NAME = "tam_sam_som_calculator";
const DESCRIPTION = "Use when someone says size my market, market sizing, or how big is my market. Before calling, ask what they sell, how many companies could buy and the annual contract value; never estimate these. Clarify what unlabelled numbers mean. Calculate TAM, SAM and SOM from supplied figures, not market research. Values are displayed in USD only; for rupees ask for a user-confirmed USD amount, never relabel or invent a conversion. Rates use 0 to 100 percentage points: ask whether 0.2 means 0.2% or a fraction meaning 20%. Omitted rates are labelled examples.";
const FIELDS: Record<string, string> = {
  "total_potential_companies": "Number of companies that could buy, supplied by the user or a source they identify. Ask if missing; never estimate.",
  "average_contract_value": "Annual contract value in USD, confirmed by the user. This tool displays dollars only. Do not pass rupees as dollars or invent an exchange rate; ask for a confirmed USD amount.",
  "icp_percentage": "Percentage of potential companies that match the ideal customer profile, from 0 to 100. A value of 0.2 means 0.2%, not 20%. Clarify fraction notation first; convert an explicitly confirmed fraction to percentage points. Omitted: 30%, labelled as an example.",
  "year1_market_share_target": "Year 1 share as percentage points from 0 to 100. Clarify fractions: 0.03 means 0.03%, not 3%. Use only a confirmed value; omitted: 3%, labelled as an example.",
  "product_category": "Ask what they sell before calling. Use their words for the product or service; do not invent a category. Used for context, not arithmetic."
};
export function conversationDefinition<T extends {name: string; description: string; inputSchema: any}>(definition: T): T {
  if (BUILD_PROFILE.profile === "current" || definition.name !== TOOL_NAME) return definition;
  const schema = definition.inputSchema;
  return { ...definition, description: DESCRIPTION, inputSchema: { ...schema, properties: Object.fromEntries(Object.entries(schema.properties).map(([key,value]) => [key, FIELDS[key] ? {...(value as object), description: FIELDS[key]} : value])) } };
}
