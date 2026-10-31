"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatMarketCurrency = formatMarketCurrency;
exports.marketSummary = marketSummary;
function formatMarketCurrency(num) {
    if (num >= 1000000000)
        return `$${(num / 1000000000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}B`;
    const oneDec = (x) => (Math.round(Number((x * 10).toPrecision(12))) / 10).toFixed(1);
    if (num >= 1000000)
        return oneDec(num / 1000000) === '1000.0' ? `$${(num / 1000000000).toFixed(2)}B` : `$${oneDec(num / 1000000)}M`;
    if (num >= 1000)
        return oneDec(num / 1000) === '1000.0' ? '$1.0M' : `$${oneDec(num / 1000).replace(/\.0$/, '')}K`;
    if (num > 0 && num < 1)
        return num.toFixed(2) === '0.00' ? 'under $0.01' : `$${num.toFixed(2)}`;
    if (/e/i.test(String(num)) || !Number.isInteger(num))
        return `$${num.toFixed(2)}`;
    return `$${num}`;
}
function marketSummary(args) {
    const companies = args.total_potential_companies, acv = args.average_contract_value, icp = args.icp_percentage ?? 30, share = args.year1_market_share_target ?? 3;
    if (![companies, acv, icp, share].every(x => typeof x === 'number' && Number.isFinite(x)) || companies < 0 || acv <= 0 || icp < 0 || icp > 100 || share < 0 || share > 100)
        return null;
    const tam = companies * acv, sam = tam * (icp / 100), som = sam * (share / 100), rawDeals = som / acv, deals = Math.round(rawDeals), monthly = Math.ceil(deals / 12), pipeline = som * 3;
    if (![tam, sam, som, rawDeals, deals, monthly, pipeline].every(Number.isFinite))
        return { kind: 'unavailable', reason: 'These inputs exceed the finite range for a structured calculation. Reduce their size.' };
    const icpExample = args.icp_percentage == null, shareExample = args.year1_market_share_target == null, derivedExample = icpExample || shareExample;
    const count = (n) => n === 0 && rawDeals > 0 ? 'fewer than 1 (rounds to 0)' : n.toLocaleString('en-US');
    const toolArguments = { total_potential_companies: companies, average_contract_value: acv };
    for (const key of ['icp_percentage', 'year1_market_share_target', 'data_sources', 'segment_name', 'product_category', 'company'])
        if (args[key] != null)
            toolArguments[key] = args[key];
    return { kind: 'market-sizing', toolArguments, figures: [{ key: 'TAM', label: 'Total addressable market', value: tam, display: formatMarketCurrency(tam), example: false }, { key: 'SAM', label: 'Serviceable addressable market', value: sam, display: formatMarketCurrency(sam), example: icpExample }, { key: 'SOM', label: 'Year 1 obtainable market', value: som, display: formatMarketCurrency(som), example: derivedExample }], inputs: [{ label: 'What you sell', display: String(args.product_category ?? 'Not supplied'), example: false }, { label: 'Companies that could buy', display: companies.toLocaleString('en-US'), example: false }, { label: 'Annual contract value', display: '$' + acv.toLocaleString('en-US'), example: false }, { label: 'ICP match rate', display: icp.toLocaleString('en-US', { maximumFractionDigits: 10 }) + '%', example: icpExample }, { label: 'Year 1 share of SAM', display: share.toLocaleString('en-US', { maximumFractionDigits: 10 }) + '%', example: shareExample }], rates: { icp, share }, targets: [{ label: 'Deals needed', value: deals, display: count(deals), example: derivedExample }, { label: 'Monthly deals', value: monthly, display: count(monthly), example: derivedExample }, { label: 'Pipeline at 3 times SOM', value: pipeline, display: formatMarketCurrency(pipeline), example: true }], validation: ['Cross-check the company count against at least two sources.', 'Validate annual contract value against recent closed deals.', 'Confirm the ICP match rate with customer analysis.', 'Check the Year 1 share against the deals your team can close.'], sourceNote: String(args.data_sources ?? 'No independent source supplied. These figures are calculated from your inputs.') };
}
//# sourceMappingURL=tam-summary.js.map