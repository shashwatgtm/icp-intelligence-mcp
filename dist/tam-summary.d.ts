export type MarketInputs = {
    total_potential_companies: number;
    average_contract_value: number;
    icp_percentage?: number | null;
    year1_market_share_target?: number | null;
    [key: string]: unknown;
};
export declare function formatMarketCurrency(num: number): string;
export declare function marketSummary(args: MarketInputs): {
    kind: string;
    reason: string;
    toolArguments?: undefined;
    figures?: undefined;
    inputs?: undefined;
    rates?: undefined;
    targets?: undefined;
    validation?: undefined;
    sourceNote?: undefined;
} | {
    kind: string;
    toolArguments: Record<string, unknown>;
    figures: {
        key: string;
        label: string;
        value: number;
        display: string;
        example: boolean;
    }[];
    inputs: {
        label: string;
        display: string;
        example: boolean;
    }[];
    rates: {
        icp: number;
        share: number;
    };
    targets: {
        label: string;
        value: number;
        display: string;
        example: boolean;
    }[];
    validation: string[];
    sourceNote: string;
    reason?: undefined;
} | null;
//# sourceMappingURL=tam-summary.d.ts.map