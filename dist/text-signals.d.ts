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
//# sourceMappingURL=text-signals.d.ts.map