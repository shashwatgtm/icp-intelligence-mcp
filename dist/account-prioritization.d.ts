export declare function cleanNum1(n: number): string;
export declare function cleanPct(n: number): string;
export type AccountInput = {
    name?: string;
    fit_score?: number;
    intent_signals?: number;
    relationship?: number;
    timing?: string;
};
export type AccountArgs = {
    accounts?: AccountInput[];
    prioritization_weights?: {
        fit?: number;
        intent?: number;
        relationship?: number;
        timing?: number;
    };
    product_category?: string;
    company?: string;
};
export declare function computeAccountPrioritization(args: AccountArgs): {
    mode: "framework";
    weights: {
        fit: number;
        intent: number;
        relationship: number;
        timing: number;
    };
    givenWeights: {
        fit?: number;
        intent?: number;
        relationship?: number;
        timing?: number;
    };
    noWeights: boolean;
} | {
    mode: "intervals";
    W: number;
    tierA: number;
    tierB: number;
    tierC: number;
    next: {
        account: string | undefined;
        key: "timing" | "relationship" | "fit" | "intent";
        swing: number;
        overlap: boolean;
    };
    intervals: {
        overlap: boolean;
        rank: number | null;
        inputIndex: number;
        account: AccountInput;
        values: Record<"timing" | "relationship" | "fit" | "intent", number | undefined>;
        unknown: ("timing" | "relationship" | "fit" | "intent")[];
        low: number;
        high: number;
    }[];
    weights: {
        fit: number;
        intent: number;
        relationship: number;
        timing: number;
    };
    givenWeights: {
        fit?: number;
        intent?: number;
        relationship?: number;
        timing?: number;
    };
    noWeights: boolean;
} | {
    mode: "ranking";
    W: number;
    tierA: number;
    tierB: number;
    tierC: number;
    scoredAccounts: {
        rank: number;
        reason: string;
        weakest: [string, number];
        nextAction: string;
        inputIndex: number;
        name: string;
        fit: number;
        intent: number;
        relationship: number;
        timing: string;
        timingScore: number;
        totalScore: number;
        tier: string;
        defaults: {
            fit: boolean;
            intent: boolean;
            relationship: boolean;
            timing: boolean;
        };
    }[];
    weights: {
        fit: number;
        intent: number;
        relationship: number;
        timing: number;
    };
    givenWeights: {
        fit?: number;
        intent?: number;
        relationship?: number;
        timing?: number;
    };
    noWeights: boolean;
};
export type AccountModel = ReturnType<typeof computeAccountPrioritization>;
export declare function accountWidgetResult(model: AccountModel): {
    structuredContent: any;
};
//# sourceMappingURL=account-prioritization.d.ts.map