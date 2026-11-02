export type RegionId = 'india' | 'southeast-asia' | 'middle-east' | 'uk' | 'western-europe' | 'north-america';
export type ContextField = 'decision_approvers' | 'sector_regulator' | 'procurement_payment' | 'data_privacy' | 'buyer_language' | 'proof' | 'objections' | 'sales_motion';
export type CellStatus = 'specific' | 'inherited' | 'waiting_for_source';
export interface RegionChoice {
    id: RegionId;
    name: string;
}
export interface RegionNote {
    text: string;
    kind: 'legal' | 'operating' | 'question';
    source_ids: string[];
    jurisdictions: string[];
    applies_when: string;
}
export type RegionContext = Record<ContextField, RegionNote[]>;
export interface RegionCountry {
    code: string;
    name: string;
    aliases: string[];
    cities: string[];
    currencies: string[];
    regulators: string[];
}
export interface RegionCell {
    vertical_id: string;
    subtype_id?: string;
    status: CellStatus;
    inherits_from: string;
    inheritance_note: string;
    context: RegionContext;
    pending_topics: string[];
}
export interface RegionData {
    schema_version: string;
    region_id: RegionId;
    region_name: string;
    review_status: 'draft';
    updated_at: string;
    scope_note: string;
    reader_hints: {
        aliases: string[];
        countries: RegionCountry[];
    };
    defaults: RegionContext;
    verticals: RegionCell[];
    subtypes: RegionCell[];
}
export interface RegionSource {
    source_id: string;
    region_id: string;
    jurisdiction: string;
    title: string;
    publisher: string;
    url: string;
    publication_date: string;
    accessed_date: string;
    primary_source: string;
    claim_scope: string;
    limitations: string;
}
export interface RegionTaxonomy {
    schema_version: string;
    source_repository: string;
    source_commit: string;
    requested_subtype_count: number;
    observed_subtype_count: number;
    verticals: {
        id: string;
        name: string;
    }[];
    subtypes: {
        id: string;
        vertical_id: string;
        name: string;
    }[];
}
export interface RegionCoverage {
    expected: number;
    specific: number;
    inherited: number;
    waiting_for_source: number;
    missing: number;
    duplicate: number;
}
export interface RegionGeneration {
    schema_version: string;
    data_sha256: string;
    missing_regions: string[];
    complete: boolean;
    coverage: Record<string, {
        verticals: RegionCoverage;
        subtypes: RegionCoverage;
    }>;
}
export declare const REGION_CHOICES: readonly RegionChoice[];
export declare const REGION_DATA: readonly RegionData[];
export declare const REGION_SOURCES: Readonly<Record<string, RegionSource>>;
export declare const REGION_TAXONOMY: RegionTaxonomy;
export declare const REGION_GENERATION: RegionGeneration;
//# sourceMappingURL=regions.d.ts.map