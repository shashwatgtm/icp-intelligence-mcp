/** Canonical decision limits. Conditions use only typed facts or arithmetic, never free-text matches. */
export interface DecisionLimit {
    text: string;
    stop: boolean;
}
export declare function decisionInputs(name: string): Record<string, unknown>;
export declare function decisionHelp(name: string): string;
export declare function decisionLimit(name: string, args: Record<string, unknown>): DecisionLimit;
//# sourceMappingURL=decision-limits.d.ts.map