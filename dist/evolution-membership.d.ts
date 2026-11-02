type MatchState = 'match' | 'different' | 'unknown';
export interface EvolutionPart {
    name: string;
    expected: string[];
    observed: string[];
    state: MatchState;
}
export interface EvolutionMatch {
    parts: EvolutionPart[];
    matched: string[];
    different: string[];
    unknown: string[];
}
export declare function evolutionMatch(icp: string, win: string): EvolutionMatch;
export {};
//# sourceMappingURL=evolution-membership.d.ts.map