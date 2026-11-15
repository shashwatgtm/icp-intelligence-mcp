export declare function calculateMarket(args: Record<string, any>): {
    inputs: {
        total_potential_companies: any;
        average_contract_value: any;
    };
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
//# sourceMappingURL=market-sizing.d.ts.map