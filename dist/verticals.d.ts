export type VerticalId = 'logistics-tech' | 'fintech' | 'saas' | 'vertical-saas' | 'ai-native' | 'ites' | 'telecom' | 'software' | 'cybersecurity';
export interface Objection {
    objection: string;
    response: string;
}
export interface Vertical {
    id: VerticalId;
    name: string;
    match: RegExp;
    weak: RegExp;
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
/** What the reader looks at, in this order, each only when the earlier ones name no sector:
 *  - `seller`: the seller's own words (what it sells, its category, its product description, its value points);
 *  - `context`: free text about the deal (pain points, blockers, objections, notes, competitors), which tells what the product
 *    is for; a sector needs a second sector word (strong or weak) beside its strong word here, because words such as
 *    "security review" or "delivery" turn up in every deal;
 *  - `role`: the buyer's job titles (a CISO buys security, a head of last-mile operations buys logistics tools);
 *  - `buyer`: who the buyer is (target customer, industry, company name), the weakest evidence of what the seller sells.
 * One strong word is enough in `seller`, `role` and `buyer`. */
export interface ReaderInput {
    seller?: unknown[];
    context?: unknown[];
    role?: unknown[];
    buyer?: unknown[];
}
/** The sector read, with the words that decided it and where they came from ('seller' or 'buyer'). */
export declare function explainSector(...args: unknown[]): {
    vertical: Vertical | null;
    source: 'seller' | 'context' | 'role' | 'buyer' | null;
    strong: string[];
    weak: string[];
};
/** The sector read from what the user typed, or null when the words do not name one. Give plain texts (each is split at its
 * buyer marker such as "for banks") or { seller, context, role, buyer } (see ReaderInput) to say which words are the seller's,
 * which are free text about the deal, which are job titles and which say who the buyer is. The seller's words come first; the
 * later groups are used only when the earlier ones name no sector. Broad words alone never name a sector. */
export declare function detectVertical(...args: unknown[]): Vertical | null;
export type BusinessModel = 'saas' | 'services' | 'connectivity' | 'transactions' | 'marketplace' | 'hardware_software' | 'investment';
export declare const BUSINESS_MODELS: BusinessModel[];
export declare const MODEL_NAME: Record<BusinessModel, string>;
export declare const SECTOR_MODEL: Record<VerticalId, BusinessModel>;
/** The business model: the explicit input when given, else read from the SELLER's words, else the sector's usual model, else
 * null. Give plain texts or { seller: [...], buyer: [...] } as for detectVertical. */
export declare function detectModel(explicit: unknown, ...args: unknown[]): {
    model: BusinessModel | null;
    how: 'input' | 'read' | 'sector' | 'unknown';
};
/** Commercial trades a seller can ask for in return for a concession, by business model (no figures). */
export declare const MODEL_TRADES: Record<BusinessModel | 'unknown', string[]>;
/** Words that only fit a software subscription; tools never print them for another model unless the user typed them. */
export declare const SAAS_ONLY: RegExp;
//# sourceMappingURL=verticals.d.ts.map