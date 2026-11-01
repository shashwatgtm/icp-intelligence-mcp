/** Canonical deterministic clause reader. Generated copies must not be edited.
 * A match is evidence of a stated fact, never independent evidence that it is true.
 */
export type SignalState = 'affirmed' | 'negated' | 'unclear' | 'absent';
export interface SignalReading {
    state: SignalState;
    evidence: string[];
    matched: string[];
}
export declare const SIGNALS: Record<string, RegExp>;
export declare function clauses(text: string): string[];
export declare function readSignal(text: string, floor: RegExp, additional?: RegExp): SignalReading;
export declare function hasSignal(text: string, floor: RegExp, kind?: string): boolean;
export declare function signal(text: string, kind: string): SignalReading;
/** A refund approval workflow is a product capability, not a refund requested by a dissatisfied customer. */
export declare function adverseResult(text: string): SignalReading;
export declare function evidenceLine(label: string, reading: SignalReading): string;
export declare function confirmedMatches(text: string, floor: RegExp, additional?: RegExp): string[];
/** Timing is a stated buying horizon. Contradictory or denied horizons stay at the documented unknown score. */
export declare function timingFact(text: string): {
    score: number;
    state: SignalState;
    evidence: string[];
};
export declare function correlationFact(text: string): 'positive' | 'negative' | 'unknown';
export declare const SECTOR_LABELS: Record<string, string>;
/** An explicit trade label before a buyer marker names the vendor. Feature words and buyer names do not. */
export declare function sellerSectorLabel(text: string): {
    id: string | null;
    evidence: string;
    state: SignalState;
};
export declare function sectorChoiceNotice(tool: string, args: Record<string, unknown>, infer: (text: string) => {
    id?: string;
    name?: string;
    source?: string | null;
}): string;
/** EPIC rules retain the documented trigger floor, with clause evidence and optional confirmed facts. */
export declare function epicReading(text: string, floor: RegExp, kind: string, typed?: unknown): SignalReading;
export declare function epicChannelReview(text: string, nrrLow: boolean, selfServe: boolean | null): string[];
export declare function readerLabel(value: string): string;
/** Validation text only: translate the generated field path, never a caller's quoted value. */
export declare function readerIssue(value: string): string;
export declare function claimRisk(text: string): {
    hold: boolean;
    reason: string;
    evidence: string;
};
export declare function outcomeReading(text: string): SignalReading;
export declare function contactDeclined(text: string, typed?: unknown): SignalReading;
export declare function claimOwnerConflict(text: string, alternatives: string[], ownProduct: string): boolean;
/** These labels classify stated goals, not achieved business results. */
export declare function launchGoalReading(text: string): {
    kind: string;
    evidence: string;
    state: SignalState;
};
export declare function securityIncident(text: string): SignalReading;
export declare function illustrativeProof(text: string): SignalReading;
export declare function scopeDisposition(text: string): SignalReading;
export declare function statedGoalCount(text: string): {
    count: number;
    phrase: string;
    unit: string;
} | null;
export declare function buyingConstraint(text: string): SignalReading;
export type ObjectionKind = 'price' | 'comparison' | 'timing' | 'capability' | 'explain' | 'risk' | 'security' | 'other';
/** Same clause reading for a spoken response and its approach. Question syntax alone is not a stated concern. */
export declare function objectionKind(text: string, named?: boolean): ObjectionKind;
/** Preserve the text and delimiters of straight or typographic double-quoted passages. */
export declare function quotedPassages(text: string): string[];
export declare function launchFollowup(goals: string[], fallback: string): string;
//# sourceMappingURL=text-signals.d.ts.map