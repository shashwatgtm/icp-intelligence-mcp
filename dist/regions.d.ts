import type { VerticalId } from './verticals.ts';
export type RegionId = 'india' | 'southeast-asia' | 'middle-east' | 'united-kingdom' | 'europe' | 'united-states';
export interface Region {
    id: RegionId;
    name: string;
    buying: string;
    procurement: string;
    language: string;
    proof: string;
}
export interface RegionSource {
    id: string;
    title: string;
    url: string;
    published: string;
    scope: string;
    checked: string;
}
export declare const REGION_REVIEW_DATE = "2026-11-02";
export declare const REGIONS: readonly Region[];
export interface JurisdictionNote {
    label: string;
    privacy: string;
    sources: string[];
    language?: string;
    proof?: string;
}
export declare const JURISDICTIONS: Record<string, JurisdictionNote>;
export interface SectorRegionNote {
    region: RegionId;
    jurisdiction: string;
    vertical: VerticalId;
    text: string;
    sources: string[];
}
export declare const SECTOR_REGION_NOTES: readonly SectorRegionNote[];
export declare const REGION_SOURCES: readonly RegionSource[];
//# sourceMappingURL=regions.d.ts.map