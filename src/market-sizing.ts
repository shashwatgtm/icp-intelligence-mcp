// Shared arithmetic for the existing tool and the bundled offline component.
export function calculateMarket(args: Record<string, any>) {
    const totalCompanies = args.total_potential_companies;
    const acv = args.average_contract_value;
    const icp = args.icp_percentage ?? 30;
    const share = args.year1_market_share_target ?? 3;
    for (const [name, value, maximum, positive] of [
        ['total_potential_companies', totalCompanies, Infinity, false],
        ['average_contract_value', acv, Infinity, true],
        ['icp_percentage', icp, 100, false],
        ['year1_market_share_target', share, 100, false],
    ] as const) {
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > maximum || (positive && value === 0)) {
            throw new Error(`${name} must be a finite number ${positive ? 'greater than 0' : 'at least 0'}${maximum === 100 ? ' and at most 100' : ''}.`);
        }
    }
    const icpPercent = icp / 100;
    const marketSharePercent = share / 100;
    const tam = totalCompanies * acv;
    const sam = tam * icpPercent;
    const som = sam * marketSharePercent;
    if (![tam, sam, som].every(Number.isFinite))
        throw new Error('Calculation exceeds the supported numeric range. Use smaller inputs.');
    return {
        inputs: { ...args, total_potential_companies: totalCompanies, average_contract_value: acv },
        currency: 'USD', totalCompanies, acv, icpPercent, marketSharePercent, tam, sam, som,
        exampleAssumptions: { icp: args.icp_percentage == null, share: args.year1_market_share_target == null },
        scenarios: [0.5, 1, 1.5].map((factor, i) => {
            const scenarioShare = Math.min(100, share * factor);
            return { name: ['Lower share', 'Entered share', 'Higher share'][i], share: scenarioShare, som: sam * (scenarioShare / 100) };
        }),
    };
}
