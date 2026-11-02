import { type RegionId } from './regions.ts';
export interface RegionReading {
    region: RegionId;
    jurisdictions: string[];
}
export declare function regionInputTexts(args: unknown): string[];
/** Pure, deterministic and conservative. Opposite or uncertain country statements add no notes. */
export declare function readRegions(texts: readonly string[]): RegionReading[];
export declare function regionNotes(args: unknown): string;
//# sourceMappingURL=region-reader.d.ts.map