export declare function listText(items: string[]): string;
export declare function coverage(item: string, text: string): number;
export interface ProfileRead {
    segments: string[];
    subs: Array<{
        main: string;
        sub: string;
    }>;
    teams: string[];
    sizes: string[];
    allSizes: boolean;
    places: string[];
    roles: string[];
    roleNotes: string[];
    roleSource: 'buyer' | 'mention' | 'none';
    problems: string[];
    claims: string[];
    descr: string[];
    outside: string[];
    other: string[];
    hypothetical: boolean;
}
export declare function readProfile(raw: string): ProfileRead;
export declare function roleAlternatives(list: string[]): string[];
export interface MetricRow {
    label: string;
    cur: string;
    tar: string;
    gap: string;
    priority: string;
    both: boolean;
    behind: boolean;
    met: boolean;
    key: string;
}
export interface GapDeps {
    company: string;
    companyLine: string;
    contextLine: string;
    sectorName: string;
    sectorRoles: string[];
    sectorNotes: string;
    sectorObjections: string[];
    sectorProof: string;
    sectorMetrics: string[];
    modelKnown: boolean;
    pricingAction: string;
    acvNoun: string;
    money: (n: number) => string;
    targetAcv: number | undefined;
    metricTable: string;
    metricRows: MetricRow[];
    anyMetric: boolean;
    anyPair: boolean;
    onlyOneSide: string[];
    notGivenAtAll: string[];
    productGiven: boolean;
    modelGiven: boolean;
    bestRole: (a: string, list: string[]) => string | undefined;
    aliasRole: (r: string) => string;
    sameRole: (a: string, b: string) => boolean;
    planNote: string;
}
export declare function gapAnalysis(curText: string, idlText: string, d: GapDeps): string;
export type PointKind = 'single' | 'graded' | 'named';
export declare function pointsFor(criterion: string, values: string[], weight: number, userGiven: boolean): {
    kind: PointKind;
    points: number[];
    closing: boolean;
};
export declare function splitStatements(text: string): string[];
//# sourceMappingURL=rw-icp.d.ts.map