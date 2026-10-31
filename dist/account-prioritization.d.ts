export type AccountInputs = {
    accounts?: Array<{
        name?: string;
        fit_score?: number;
        intent_signals?: number;
        relationship?: number;
        timing?: string;
    }>;
    prioritization_weights?: {
        fit?: number;
        intent?: number;
        relationship?: number;
        timing?: number;
    };
    product_category?: string;
    company?: string;
};
export declare function computeAccountPrioritization(args: AccountInputs): {
    mode: "ranking";
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
    W: number;
    tierA: number;
    tierB: number;
    tierC: number;
    scoredAccounts: {
        rank: number;
        id: string;
        reason: string;
        nextAction: string | null;
        weakest: [string, number];
        contributions: {
            fit: number;
            intent: number;
            relationship: number;
            timing: number;
        };
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
} | {
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
    W: number;
    tierA: number;
    tierB: number;
    tierC: number;
    scoredAccounts: Array<{
        inputIndex: number;
        name: string;
        fit: number;
        intent: number;
        relationship: number;
        timing: string;
        timingScore: number;
        totalScore: number;
        tier: string;
        defaults: Record<string, boolean>;
        rank: number;
        id: string;
        reason: string;
        nextAction: string | null;
        weakest: [string, number];
        contributions: Record<string, number>;
    }>;
};
export declare const ACCOUNT_UI_URI = "ui://helix/account-prioritization/v1.html";
export declare const ACCOUNT_UI_MIME = "text/html;profile=mcp-app";
export declare const ACCOUNT_UI_META: {
    ui: {
        csp: {
            connectDomains: never[];
            resourceDomains: never[];
            frameDomains: never[];
        };
    };
};
export declare function accountInputSnapshot(input: any): AccountInputs;
export declare function accountWidgetResult(model: ReturnType<typeof computeAccountPrioritization>, safe: any, literal: any, textFallback: string): {
    structuredContent: any;
    _meta: {
        helixAccountPrioritization: {
            inputsBase64: string;
        };
    };
};
//# sourceMappingURL=account-prioritization.d.ts.map