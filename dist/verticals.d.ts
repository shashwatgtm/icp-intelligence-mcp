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
    subtype?: string;
}
/** A kind of company inside a vertical (run 21b). `match` holds category nouns (what the product IS), never buzzwords such as AI, API, platform,
 * security or fraud. The notes replace the vertical's neutral base notes only when the seller's own words clearly name this one sub-type. */
export interface SubType {
    id: string;
    vertical: VerticalId;
    name: string;
    match: RegExp;
    model?: BusinessModel;
    notes: SectorNotes;
}
export declare const VERTICALS: Vertical[];
export declare const SUBTYPES: SubType[];
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
export type SectorNotes = Pick<Vertical, 'vocabulary' | 'buyerRoles' | 'committee' | 'objections' | 'salesMotion' | 'metrics' | 'proofShape' | 'discovery'>;
/** AI native, support automation: used only when the seller's own text names support, tickets, a help desk, a contact centre or a service desk. */
export declare const AI_SUPPORT_PROFILE: SectorNotes;
/** The notes for a seller that manages money (investment strategies, funds, portfolios) for allocators, whatever sector it was read in:
 * they replace the sector's notes, so an AI native investment manager never gets support-automation or corporate-finance notes. */
export declare const INVESTMENT_PROFILE: SectorNotes;
/** SaaS, billing and revenue operations: used when the seller sells billing, subscription billing, invoicing, revenue recognition,
 * usage-based pricing, dunning, proration or monetization (and is not a spend-management or payments seller), and the buyer persona is
 * not an engineering, product, IT or security leader. It replaces the plain SaaS notes (activation, expansion) and keeps the buyer out
 * of the finance block of the spend-management profile (accounts payable, card spends, claims, policy breaches). */
export declare const BILLING_PROFILE: SectorNotes;
/** What an AI native seller's product is for, read from the seller's own words only: 'support' when they name support, tickets, a
 * help desk, a contact centre or a service desk; 'investment' when the seller manages money (the investment business model);
 * else 'other'. Investment comes first. Accepts the same inputs as detectVertical. */
export declare function aiUseCase(...args: unknown[]): 'support' | 'investment' | 'other';
/** True when the seller's own words sell billing, subscription billing, invoicing, revenue recognition, usage-based pricing, dunning,
 * proration or monetization (not a spend-management, accounts payable or payments seller) and the job titles given, if any, are not
 * only engineering, product, IT or security titles. Accepts the same inputs as detectVertical. */
export declare function isBillingSeller(...args: unknown[]): boolean;
/** The sector notes that fit the business model: a seller that manages money (model 'investment') gets INVESTMENT_PROFILE in place of
 * the sector's roles, committee, objections, metrics, proof shape, discovery questions and vocabulary (the name says so); an AI native
 * seller of support automation gets the support notes. Every other case returns the vertical unchanged. Safe to call twice. */
export declare function profileFor(v: Vertical | null, model: BusinessModel | null | undefined, ...args: unknown[]): Vertical | null;
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
export declare function detectModel(explicit: unknown, ...args: unknown[]): {
    model: BusinessModel | null;
    how: 'input' | 'read' | 'sector' | 'unknown';
};
/** Commercial trades a seller can ask for in return for a concession, by business model (no figures). */
export declare const MODEL_TRADES: Record<BusinessModel | 'unknown', string[]>;
/** Words that only fit a software subscription; tools never print them for another model unless the user typed them. */
export declare const SAAS_ONLY: RegExp;
export interface BuyerContext {
    id: string;
    /** the industry in plain words, for a sentence ("financial services") */
    name: string;
    match: RegExp;
    /** who reviews a purchase, and what they ask for */
    reviews: string;
    /** what goes wrong for a buyer in this industry (the losses a risk case can count) */
    risks: string;
    /** how the buyer usually buys, and what that means for the plan */
    buying: string;
}
export declare const BUYER_CONTEXTS: BuyerContext[];
/** The buyer's industry read from the words that describe the buyer (industry, customer name, the industry before "deal for"); null when none matches. */
export declare function buyerContextFor(...texts: unknown[]): BuyerContext | null;
//# sourceMappingURL=verticals.d.ts.map