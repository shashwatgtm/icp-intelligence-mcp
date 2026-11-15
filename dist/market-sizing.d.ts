export declare function calculateMarket(args: Record<string, any>): {
    inputs: {
        total_potential_companies: any;
        average_contract_value: any;
    };
    rangeSupported: boolean;
    rangeMessage: string;
    currency: string;
    totalCompanies: any;
    acv: any;
    icpPercent: number;
    marketSharePercent: number;
    tam: number;
    sam: number;
    som: number;
    exampleAssumptions: {
        icp: boolean;
        share: boolean;
    };
    scenarios: {
        name: string;
        share: number;
        som: number;
    }[];
};
export declare function structuredMarket(args: Record<string, any>): {
    tam: number | null;
    sam: number | null;
    som: number | null;
    scenarios: {
        som: number | null;
        name: string;
        share: number;
    }[];
    inputs: {
        total_potential_companies: any;
        average_contract_value: any;
    };
    rangeSupported: boolean;
    rangeMessage: string;
    currency: string;
    totalCompanies: any;
    acv: any;
    icpPercent: number;
    marketSharePercent: number;
    exampleAssumptions: {
        icp: boolean;
        share: boolean;
    };
};
export declare function marketTextMetadata(args: Record<string, unknown>): {
    helixMarketSizing: {
        textCodePoints: Record<string, number[]>;
    };
};
//# sourceMappingURL=market-sizing.d.ts.map