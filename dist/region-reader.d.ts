import { type RegionId } from './regions.ts';
export declare const NO_REGION_SUFFIX = "\n\nRegion context: Which region applies: India, Southeast Asia, Middle East, UK, Western Europe or North America? Add it to your description and rerun.";
export interface RegionMatch {
    region_id: RegionId;
    countries: string[];
    jurisdictions: string[];
    evidence: string[];
    vertical_id: string | null;
    subtype_id: string | null;
}
export interface RegionReading {
    regions: RegionMatch[];
    unresolved_hints: string[];
}
/** Bind product evidence to its affirmative selling clause, before subtype selection. */
export declare function sellerProductForMarket(args: unknown, market?: string): string[];
/** How the seller's own words treat each named market. Used to hold advice when a selected market contradicts them. */
export declare function sellerMarketStates(args: unknown): {
    country: string | null;
    region: string;
    kind: string;
    state: 'yes' | 'no' | 'unclear';
}[];
export declare function readRegionContext(args: unknown): RegionReading;
export declare function regionNotes(args: unknown): string;
//# sourceMappingURL=region-reader.d.ts.map