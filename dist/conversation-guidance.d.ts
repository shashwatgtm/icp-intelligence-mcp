export declare const CONVERSATION_INSTRUCTIONS = "For market sizing, ask what they sell, how many companies could buy, and the annual contract value before calling. Never estimate or invent these. Clarify unlabelled numbers and percentage fractions. This calculator displays USD only: do not treat rupees as dollars or invent an exchange rate. Ask for a user-confirmed USD amount. Defaults are examples, not research.";
export declare function conversationDefinition<T extends {
    name: string;
    description: string;
    inputSchema: any;
}>(definition: T): T;
//# sourceMappingURL=conversation-guidance.d.ts.map