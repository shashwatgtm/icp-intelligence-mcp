export type VerticalId = 'logistics-tech' | 'fintech' | 'saas' | 'vertical-saas' | 'ai-native' | 'ites' | 'telecom' | 'software' | 'cybersecurity';
export interface Objection {
    objection: string;
    response: string;
}
export interface Vertical {
    id: VerticalId;
    name: string;
    match: RegExp;
    vocabulary: string[];
    buyerRoles: string[];
    committee: string;
    objections: Objection[];
    salesMotion: string;
    metrics: string[];
    proofShape: string;
    discovery: string[];
}
export declare const VERTICALS: Vertical[];
/** The sector read from what the user typed, or null when the text does not name one clearly. Counts the DIFFERENT sector
 * words found per sector; a sector is chosen only with at least 2 different words and more than any other sector, so a
 * single shared word (for example "security" or "delivery") never puts a company in the wrong sector. */
export declare function detectVertical(...texts: unknown[]): Vertical | null;
export type BusinessModel = 'saas' | 'services' | 'connectivity' | 'transactions' | 'marketplace' | 'hardware_software' | 'investment';
export declare const BUSINESS_MODELS: BusinessModel[];
export declare const MODEL_NAME: Record<BusinessModel, string>;
export declare const SECTOR_MODEL: Record<VerticalId, BusinessModel>;
/** The business model: the explicit input when given, else read from the text, else the sector's usual model, else null. */
export declare function detectModel(explicit: unknown, ...texts: unknown[]): {
    model: BusinessModel | null;
    how: 'input' | 'read' | 'sector' | 'unknown';
};
/** Commercial trades a seller can ask for in return for a concession, by business model (no figures). */
export declare const MODEL_TRADES: Record<BusinessModel | 'unknown', string[]>;
/** Words that only fit a software subscription; tools never print them for another model unless the user typed them. */
export declare const SAAS_ONLY: RegExp;
//# sourceMappingURL=verticals.d.ts.map