"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NO_REGION_SUFFIX = void 0;
exports.sellerProductForMarket = sellerProductForMarket;
exports.readRegionContext = readRegionContext;
exports.regionNotes = regionNotes;
const regions_ts_1 = require("./regions.js");
const verticals_ts_1 = require("./verticals.js");
exports.NO_REGION_SUFFIX = '\n\nRegion context: Which region applies: India, Southeast Asia, Middle East, UK, Western Europe or North America? Add it to your description and rerun.';
const SELLER = new Set(['product_feature', 'product_context', 'positioning_statement', 'document_content', 'potential_crises', 'your_sector', 'industry', 'product_category', 'product_description', 'your_product', 'category', 'company_description', 'offering', 'what_you_sell', 'product', 'sector']);
const MARKET = new Set(['target_segments', 'seller_market', 'target_market', 'target_regions', 'region', 'regions', 'geography', 'geographies', 'country', 'countries', 'city', 'cities', 'currency', 'currencies', 'regulator', 'regulators', 'market_name', 'market', 'markets', 'segment_name']);
const BUYER = new Set(['target_customer', 'target_customers', 'target_audience', 'target_company_type', 'customer_descriptions', 'current_customers', 'current_icp', 'ideal_icp', 'icp_firmographics', 'firmographics', 'customers', 'accounts', 'segments', 'potential_segments', 'industry', 'industries', 'location', 'locations']);
const IGNORE = new Set(['company', 'company_name', 'name', 'customer', 'account', 'role', 'champion_title', 'typical_champion', 'known_stakeholders', 'competitors', 'competitor_weaknesses', 'tech_stack', 'data_sources', 'evidence', 'quotes', 'key_quotes', 'customer_metrics', 'proof_points']);
const keyOf = (key) => key.toLowerCase().replace(/[ -]+/g, '_');
/** Traverse only supplied context, never company identities, rival evidence or quotations. */
function fragments(args) {
    const out = { seller: [], market: [], buyer: [] };
    const visit = (value, group = null, depth = 0) => {
        if (depth > 12)
            return;
        if (typeof value === 'string') {
            const v = value.trim();
            if (!v)
                return;
            if (/^[\[{]/.test(v)) {
                try {
                    visit(JSON.parse(v), group, depth + 1);
                    return;
                }
                catch { /* plain text */ }
            }
            if (group)
                out[group].push(v);
        }
        else if (Array.isArray(value))
            value.forEach(v => visit(v, group, depth + 1));
        else if (value && typeof value === 'object')
            for (const [key, v] of Object.entries(value)) {
                const k = keyOf(key);
                if (IGNORE.has(k))
                    continue;
                if (SELLER.has(k))
                    visit(v, group === 'buyer' ? 'buyer' : 'seller', depth + 1);
                else if (MARKET.has(k))
                    visit(v, group === 'buyer' ? 'buyer' : 'market', depth + 1);
                else if (BUYER.has(k))
                    visit(v, 'buyer', depth + 1);
            }
    };
    visit(args);
    return out;
}
const COUNTRY_SEEDS = [
    ['india', 'IN', ['India', 'Indian market']],
    ['southeast-asia', 'SG', ['Singapore']], ['southeast-asia', 'ID', ['Indonesia']], ['southeast-asia', 'MY', ['Malaysia']], ['southeast-asia', 'TH', ['Thailand']], ['southeast-asia', 'VN', ['Vietnam']], ['southeast-asia', 'PH', ['Philippines']],
    ['middle-east', 'AE', ['United Arab Emirates', 'UAE']], ['middle-east', 'SA', ['Saudi Arabia']], ['middle-east', 'QA', ['Qatar']], ['middle-east', 'BH', ['Bahrain']], ['middle-east', 'OM', ['Oman']], ['middle-east', 'KW', ['Kuwait']],
    ['uk', 'GB', ['United Kingdom', 'UK', 'Britain']],
    ['western-europe', 'DE', ['Germany', 'German market']], ['western-europe', 'FR', ['France']], ['western-europe', 'NL', ['Netherlands']], ['western-europe', 'BE', ['Belgium']], ['western-europe', 'AT', ['Austria']], ['western-europe', 'CH', ['Switzerland']], ['western-europe', 'LU', ['Luxembourg']], ['western-europe', 'LI', ['Liechtenstein']],
    ['north-america', 'US', ['United States', 'USA']], ['north-america', 'CA', ['Canada']], ['north-america', 'MX', ['Mexico']]
];
// Seeds make the named region reader usable before sourced data lands. They are only geography,
// never legal applicability. Authored country hints extend this list without replacing it.
const EXTRA_SEEDS = [
    ['india', 'IN', 'Bengaluru', 'city'], ['india', 'IN', 'Bangalore', 'city'], ['india', 'IN', 'Mumbai', 'city'], ['india', 'IN', 'New Delhi', 'city'], ['india', 'IN', 'INR', 'currency'], ['india', 'IN', 'Indian rupee', 'currency'], ['india', 'IN', 'Reserve Bank of India', 'regulator'], ['india', 'IN', 'RBI', 'regulator'],
    ['southeast-asia', 'SG', 'SGD', 'currency'], ['southeast-asia', 'SG', 'Singapore dollar', 'currency'], ['southeast-asia', 'SG', 'Monetary Authority of Singapore', 'regulator'], ['southeast-asia', 'SG', 'MAS', 'regulator'], ['southeast-asia', 'ID', 'Jakarta', 'city'], ['southeast-asia', 'TH', 'Bangkok', 'city'],
    ['middle-east', 'AE', 'Dubai', 'city'], ['middle-east', 'AE', 'Abu Dhabi', 'city'], ['middle-east', 'AE', 'AED', 'currency'], ['middle-east', 'SA', 'Riyadh', 'city'], ['middle-east', 'SA', 'SAR', 'currency'], ['middle-east', 'SA', 'Saudi Central Bank', 'regulator'],
    ['uk', 'GB', 'London', 'city'], ['uk', 'GB', 'GBP', 'currency'], ['uk', 'GB', 'pound sterling', 'currency'], ['uk', 'GB', 'Financial Conduct Authority', 'regulator'], ['uk', 'GB', 'FCA', 'regulator'],
    ['western-europe', 'DE', 'Berlin', 'city'], ['western-europe', 'DE', 'Munich', 'city'], ['western-europe', 'DE', 'BaFin', 'regulator'], ['western-europe', 'NL', 'Amsterdam', 'city'],
    ['north-america', 'CA', 'CAD', 'currency'], ['north-america', 'CA', 'Canadian dollar', 'currency'], ['north-america', 'CA', 'Toronto', 'city'], ['north-america', 'US', 'New York', 'city'], ['north-america', 'US', 'San Francisco', 'city']
];
const AMBIGUOUS = /\b(?:USD|EUR|euro|euros|dollars?|Paris|Birmingham|Cambridge|Manchester|Georgia|SEC|APAC|EMEA|Europe|European Union)\b|[$€]/i;
function clues() {
    const all = regions_ts_1.REGION_CHOICES.map(r => ({ region: r.id, value: r.name, kind: 'region' }));
    for (const [region, value] of [['southeast-asia', 'South East Asia'], ['southeast-asia', 'South-East Asia'], ['middle-east', 'Middle Eastern market'], ['western-europe', 'Western European market'], ['north-america', 'North American market']])
        all.push({ region, value, kind: 'region' });
    for (const [region, country, names] of COUNTRY_SEEDS)
        for (const value of names)
            all.push({ region, country, value, kind: 'country' });
    for (const [region, country, value, kind] of EXTRA_SEEDS)
        all.push({ region, country, value, kind });
    for (const r of regions_ts_1.REGION_DATA) {
        for (const value of r.reader_hints.aliases)
            all.push({ region: r.region_id, value, kind: 'region' });
        for (const c of r.reader_hints.countries) {
            for (const value of [c.name, ...c.aliases])
                all.push({ region: r.region_id, country: c.code, value, kind: 'country' });
            for (const kind of ['city', 'currency', 'regulator']) {
                const values = kind === 'city' ? c.cities : kind === 'currency' ? c.currencies : c.regulators;
                for (const value of values)
                    all.push({ region: r.region_id, country: c.code, value, kind });
            }
        }
    }
    for (const [value, code] of Object.entries(US_STATES))
        if (!['Georgia', 'Washington'].includes(value))
            all.push({ region: 'north-america', country: 'US', jurisdiction: 'US-' + code, value, kind: 'state' });
    const seen = new Set();
    return all.filter(c => { const key = [c.region, c.country, c.value.toLowerCase(), c.kind].join('|'); if (seen.has(key))
        return false; seen.add(key); return true; }).sort((a, b) => b.value.length - a.value.length);
}
function normalize(text) {
    return text.normalize('NFKC').replace(/[‘’]/g, "'").replace(/\bU\.S\.(?:A\.)?/g, 'United States').replace(/\bU\.K\./gi, 'United Kingdom').replace(/\bUS\b/g, 'United States').replace(/\b(don't|doesn't|didn't|isn't|aren't|wasn't|weren't|won't|can't|haven't|hasn't)\b/gi, m => ({ "don't": 'do not', "doesn't": 'does not', "didn't": 'did not', "isn't": 'is not', "aren't": 'are not', "wasn't": 'was not', "weren't": 'were not', "won't": 'will not', "can't": 'cannot', "haven't": 'have not', "hasn't": 'has not' }[m.toLowerCase()] || m));
}
const escaped = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function pattern(c) {
    // Short all capital abbreviations are case sensitive: "us" and "in" are ordinary words.
    const flags = /^[A-Z]{2,4}$/.test(c.value) ? 'g' : 'gi';
    return new RegExp('(?<![\\p{L}\\p{N}_])' + escaped(c.value) + '(?![\\p{L}\\p{N}_])', flags + 'u');
}
function polarity(clause, start, end, all) {
    const prefix = clause.slice(0, start).replace(/\bnot only\b/gi, ''), suffix = clause.slice(end);
    // Commas inside product or country lists retain polarity. A new seller clause resets it.
    const before = prefix.split(/;|\b(?:but|however|whereas|while)\b|(?:,\s*|\band\s+)(?=(?:we|our company|our business)\s+(?:do|sell|serve|target|are|may|might|could)\b)/i).at(-1) || '';
    const after = suffix.split(/[,;]|\b(?:and|but|however|whereas|while)\b/i)[0];
    // A product feature such as no license fees does not negate the market.
    let placePrefix = before;
    for (const c of all)
        placePrefix = placePrefix.replace(pattern(c), 'PLACE');
    const directExclusion = /\b(?:not|never|no|neither|nor|without|except|excluding|exclude|outside|avoid|left|exited|formerly|previously|historically|used to|no longer|stopped|ceased|cannot)\b\s*(?:(?:in|into|to|for|within|the|market|markets|country|countries|of)\s+)*(?:PLACE\s*(?:(?:,|and|or|nor)\s*)?)*$/i;
    const negatedSelling = /\b(?:not|never|no longer|stopped|ceased|cannot)\s+(?:(?:currently|actively|yet|now|ever|presently|really)\s+)*(?:sell(?:ing|s)?|sold|serv(?:es?|ing)|target(?:s|ing)?|operat(?:e|es|ing)|expand(?:s|ing)?|enter(?:s|ing)?|market(?:s|ing)?|offer(?:s|ing)?|do(?:ing)? business|trade|trading)\b/i;
    const absentSales = /\b(?:(?:no|without)\s+(?:sales?|selling|customers?|buyers?|business|presence|operations?|offices?)|(?:sell(?:ing|s)?|sold|serv(?:es?|ing)|target(?:s|ing)?)\s+no\b|(?:formerly|previously|historically|used to)\b[^;]*\b(?:sell|sold|serve|served|operate|operated))\b/i;
    if (directExclusion.test(placePrefix) || negatedSelling.test(before) || absentSales.test(before) || /\b(?:excluded|excluded from|out of scope|off limits)\s+(?:markets?|countries?|regions?)\s*:/i.test(before))
        return 'no';
    if (/^\s*(?:(?:is|are|was|were|has been|have been)\s+)?(?:not|no longer|excluded|out of scope|off limits)\b/i.test(after))
        return 'no';
    let tail = suffix;
    for (const c of all)
        tail = tail.replace(pattern(c), 'PLACE');
    const listTail = tail.replace(/^\s*(?:(?:,\s*(?:and\s+|or\s+)?|and\s+|or\s+)PLACE\s*)+/i, '');
    if (listTail !== tail) {
        if (/^\s*(?:(?:is|are|was|were|have been|has been)\s+)?(?:not|excluded|out of scope|off limits|(?:our|a|the|their)\s+(?:previous|former|historical|competitor|rival)|previous|former|historical|competitor|rival)\b/i.test(listTail))
            return 'no';
        if (/^\s*(?:could|might|may|would|is being considered|are being considered|is not confirmed|are not confirmed)\b/i.test(listTail))
            return 'unclear';
    }
    if (/\?|\b(?:may|might|could|perhaps|maybe|whether|consider(?:ing)?|uncertain|unsure|if|hypothetical|example|competitors?|rivals?)\b/i.test(before) || /\?|\b(?:uncertain|unconfirmed|not confirmed)\b/i.test(after))
        return 'unclear';
    if (/^\s*(?:(?:is|are|was|were|has been|have been)\s+)?(?:(?:our|a|the|their)\s+)?(?:previous|former|historical|competitor|rival)\b/i.test(after))
        return 'no';
    if (/^\s*(?:could|might|may|would|is being considered|is not confirmed)\b/i.test(after))
        return 'unclear';
    if (/^\s*(?:should|would|can)\s+(?:we|our)\b/i.test(clause))
        return 'unclear';
    return 'yes';
}
// A denial of one known product does not deny a different active product in
// the same country. Unqualified market exclusions still apply to all offers.
function offeringType(prefix) {
    const before = prefix.split(/;|\b(?:but|however|whereas|while)\b|(?:,\s*|\band\s+)(?=(?:we|our company|our business)\s+(?:do|sell|serve|target|are|may|might|could)\b)/i).at(-1) || '';
    const product = before.match(/\b(?:sell(?:ing|s)?|sold|offer(?:s|ing)?|provide(?:s|ing)?)\s+(.+?)\s+(?:in|into|to|within)\s+(?:the\s+)?$/i)?.[1];
    if (!product || /\b(?:and|or|nor)\b/i.test(product))
        return;
    const sector = (0, verticals_ts_1.explainSector)({ seller: [product] });
    if (sector.source === 'seller' && sector.vertical)
        return { vertical: sector.vertical.id, subtype: sector.vertical.subtype };
}
function distinctOfferings(first, second) {
    const a = offeringType(first), b = offeringType(second);
    return Boolean(a && b && (a.vertical !== b.vertical || (a.subtype && b.subtype && a.subtype !== b.subtype)));
}
function scan(texts, all) {
    const found = [], unresolved = [];
    for (const text of texts) {
        const normalized = normalize(text);
        // A clue absent from the complete text cannot occur in any of its clauses.
        // Filter once, preserving order, before the per-clause polarity checks.
        const present = all.filter(clue => pattern(clue).test(normalized));
        for (const clause of normalized.match(/[^.!?\n]+[.!?]?/g) || []) {
            const hits = [];
            for (const clue of present)
                for (const m of clause.matchAll(pattern(clue)))
                    hits.push({ clue, start: m.index, end: m.index + m[0].length });
            const detailed = hits.filter(h => h.clue.kind !== 'region');
            for (const hit of hits) {
                // Longest place name owns its span: New Mexico must not also mean Mexico.
                if (hits.some(h => h.start <= hit.start && h.end >= hit.end && (h.start < hit.start || h.end > hit.end)))
                    continue;
                // An address country resolves a same-name foreign city, such as London, Ontario, Canada.
                if (hit.clue.kind === 'city' && hits.some(h => h.clue.kind === 'country' && h.clue.country !== hit.clue.country && h.start > hit.end && /^\s*,?(?:\s*[\p{L}]+\s*,?){0,3}\s*$/u.test(clause.slice(hit.end, h.start)) && !/\b(?:and|or|but|sell|selling|to)\b/i.test(clause.slice(hit.end, h.start))))
                    continue;
                // A regional alias inside a country name must not bypass a negated country.
                if (hit.clue.kind === 'region' && detailed.some(h => h.start <= hit.start && h.end >= hit.end))
                    continue;
                if (['city', 'currency', 'regulator'].includes(hit.clue.kind) && AMBIGUOUS.test(hit.clue.value)) {
                    unresolved.push(hit.clue.value);
                    continue;
                }
                const state = polarity(clause, hit.start, hit.end, present);
                const competing = hits.filter(h => h.start === hit.start && h.end === hit.end && h.clue.region !== hit.clue.region);
                if (competing.length) {
                    unresolved.push(hit.clue.value);
                    continue;
                }
                found.push({ clue: hit.clue, state, evidence: clause.trim(), offeringPrefix: clause.slice(0, hit.start) });
            }
            if (!hits.length && AMBIGUOUS.test(clause))
                unresolved.push(clause.match(AMBIGUOUS)[0]);
        }
    }
    return { found, unresolved };
}
/** Explicit selling destinations outrank a seller's headquarters or incidental location. */
function marketText(text, all) {
    const currencies = all.filter(c => c.kind === 'currency').map(c => escaped(c.value)).join('|');
    // Billing units describe a transaction, not the market where it happens.
    const billing = new RegExp('\\b(?:invoice|invoices|invoicing|bill|bills|billing)\\s+in\\s+(?:' + currencies + ')(?![\\p{L}\\p{N}_])', 'giu');
    const denomination = new RegExp('\\b(?:under\\s+)?contracts?\\s+(?:denominated|priced)\\s+in\\s+(?:' + currencies + ')(?![\\p{L}\\p{N}_])', 'giu');
    const clean = normalize(text).replace(denomination, '').replace(/\b(?:receiv(?:e|ing)\s+(?:our\s+)?payments?\s+into|paid\s+into)\s+[^.;!?]*?\bbank\s+account\b|\b(?:our|the)\s+(?:[a-z]+\s+){0,4}bank\s+account\b/gi, '').replace(/"[^"\n]*"|“[^”\n]*”|(?<![\p{L}\p{N}])'[^\n]*?'(?![\p{L}\p{N}])/gu, '').replace(billing, '');
    return (clean.match(/[^.!?\n]+[.!?]?/g) || []).map(sentence => {
        // A buyer buying from a vendor names the destination before the vendor's office.
        const purchase = sentence.match(/\bbuy(?:ing|s)?\b[^.;!?]*?\bfrom\b/i);
        if (purchase)
            return sentence.slice(0, purchase.index + purchase[0].lastIndexOf('from'));
        const m = sentence.match(/\b(?:sell(?:ing|s)?|sold|expand(?:s|ing)?|enter(?:s|ing)?|target(?:s|ing)?|serv(?:es?|ing))\b/i);
        if (m) {
            const qualifier = sentence.slice(0, m.index).match(/\b(?:not|never|no longer|stopped|ceased|used to|formerly|previously|historically|if|may|might|could|cannot|perhaps|maybe|considering|should we|would we|can we|competitor|rival)[^,;.!?]*$/i)?.[0] || '';
            // A source office following from is not a selling destination, in either order.
            const places = all.filter(c => ['region', 'country', 'city', 'state'].includes(c.kind) && (!/^[A-Z]{2,4}$/.test(c.value) || ['UK', 'UAE', 'USA'].includes(c.value))).map(c => escaped(c.value)).join('|');
            const place = '(?:' + places + ')';
            const origin = new RegExp('\\bfrom\\s+(?:(?:our|the|a|an|vendor\'s|seller\'s|company\'s)\\s+)?(?:(?:office|offices|headquarters|base|team|company|vendor|seller)\\s+(?:in|at)\\s+)?' + place + '(?![\\p{L}\\p{N}_])(?:\\s*(?:,|and|or)\\s*' + place + '(?![\\p{L}\\p{N}_]))*(?:\\s+(?:offices?|headquarters|base|team|company|vendor|seller|suppliers?))?', 'giu');
            const selling = sentence.slice(m.index);
            const namedDestination = new RegExp('\\b(?:in|into|to|serves?|serving|targets?|targeting)\\s+(?:the\\s+)?' + place + '(?![\\p{L}\\p{N}_])', 'iu');
            const destination = selling.replace(/\bfrom\s+[^.;!?]*?(?=\s+(?:to|into)\s+|[.;!?]|$)/gi, (span, offset, whole) => {
                origin.lastIndex = 0;
                if (!origin.test(span))
                    return span;
                // Preserve an entire source postal address when stripping it, not only its first city.
                if (/^\s+(?:to|into)\s+/i.test(whole.slice(offset + span.length)) || namedDestination.test(whole.slice(0, offset)))
                    return '';
                origin.lastIndex = 0;
                return span.replace(origin, '');
            });
            return qualifier + destination;
        }
        if (/\b(?:not\s+(?:an?\s+)?(?:EU|European Union)\s+member|(?:EU|European Union)\s+membership)\b/i.test(sentence))
            return '';
        // Identity and reference evidence alone cannot establish a selling destination.
        if (/\b(?:(?:company|business|product|brand)\s+(?:is\s+)?(?:called|named)|(?:is|was)\s+(?:our|the)\s+(?:company|business|product|brand)\s+name|(?:our|the)\s+(?:reference\s+(?:customer|client)|cloud\s+(?:vendor|provider)|suppliers?)\b)/i.test(sentence))
            return '';
        return sentence.replace(/\b(?:our|the)\s+(?:company|business|product|brand)(?:'s)?\s+name\s+(?:is|:)\s+[^,;.]+/gi, '').replace(/\b(?:based|headquartered|located|founded)\s+in\s+[^,;.]+/gi, '');
    }).join(' ');
}
const US_STATES = { Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA', Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE', Florida: 'FL', Georgia: 'GA', Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL', Indiana: 'IN', Iowa: 'IA', Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD', Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN', Mississippi: 'MS', Missouri: 'MO', Montana: 'MT', Nebraska: 'NE', Nevada: 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', Ohio: 'OH', Oklahoma: 'OK', Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC', 'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT', Vermont: 'VT', Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV', Wisconsin: 'WI', Wyoming: 'WY' };
/** Split distinct offers joined without a repeated seller subject, preserving place lists. */
function offeringClauses(text, all) {
    const out = [];
    for (const clause of normalize(text).split(/[.!?\n;]+|(?:,\s*|\b(?:but|however|whereas|while|and)\s+)(?=(?:we\s+|(?:now\s+)?sell\b|our\s+(?:company|business)\s+))/i)) {
        const markets = new Set(scan([marketText(clause, all)], all).found.filter(x => x.state === 'yes' && x.clue.country).map(x => x.clue.country));
        if (markets.size < 2) {
            out.push(clause);
            continue;
        }
        let start = 0;
        for (const m of clause.matchAll(/\band\s+/gi)) {
            const left = clause.slice(start, m.index), right = clause.slice(m.index + m[0].length);
            const a = scan([marketText(left, all)], all).found.filter(x => x.state === 'yes' && x.clue.country);
            if (!a.length || !/^.+?\b(?:in|into|to)\s+/i.test(right))
                continue;
            const b = scan([marketText(right, all)], all).found.filter(x => x.state === 'yes' && x.clue.country);
            const sector = (0, verticals_ts_1.explainSector)({ seller: [right] });
            if (b.some(x => !a.some(y => x.clue.country === y.clue.country)) && sector.source === 'seller' && sector.vertical) {
                out.push(left);
                start = m.index + m[0].length;
            }
        }
        out.push(clause.slice(start));
    }
    return out;
}
/** Bind product evidence to its affirmative selling clause, before subtype selection. */
function sellerProductForMarket(args, market) {
    const all = clues(), f = fragments(args), local = [], general = [];
    for (const text of f.seller)
        for (const clause of offeringClauses(text, all)) {
            if (!clause.trim())
                continue;
            if (/\b(?:not|never|cannot|no longer|stopped|ceased|used to|formerly|previously|historically|may|might|could)\s+(?:(?:currently|actively|now|yet|only)\s+)*(?:sell(?:ing|s)?|sold|serve|offer|provide|target|operate)\b|\b(?:competitor|rival)\b|\bif\s+we\b/i.test(clause))
                continue;
            const clean = marketText(clause, all), reading = scan([clean], all);
            const yes = reading.found.filter(m => m.state === 'yes');
            if (yes.some(m => market === m.clue.country || market === m.clue.region))
                local.push(clause);
            else if (!reading.found.length && !reading.unresolved.length)
                general.push(clause);
        }
    // General product descriptions can accompany a dedicated market field. Never use
    // an offering assigned only to another country as the fallback for this market.
    return local.length ? local : general;
}
function readRegionContext(args) {
    const f = fragments(args), all = clues();
    const explicit = scan(f.market, all), seller = scan(f.seller.map(text => marketText(text, all)), all);
    // Customer location alone is not evidence that the seller is selling there.
    // A dedicated market field wins over incidental locations in the description.
    const chosen = explicit.found.length || explicit.unresolved.length ? explicit : seller;
    const regions = [];
    for (const r of regions_ts_1.REGION_CHOICES) {
        const mentions = chosen.found.filter(m => m.clue.region === r.id);
        if (mentions.some(m => m.clue.kind === 'region' && m.state !== 'yes'))
            continue;
        const affirmative = mentions.filter(m => m.state === 'yes' && !mentions.some(n => n.clue.kind === 'country' && n.clue.country === m.clue.country && n.state !== 'yes' && !distinctOfferings(m.offeringPrefix, n.offeringPrefix)));
        if (!affirmative.length)
            continue;
        const countries = [...new Set(affirmative.map(m => m.clue.country).filter((x) => Boolean(x)))];
        // One entry per country keeps two countries in the same region from sharing notes.
        for (const country of countries.length ? countries : [null]) {
            const evidence = [...new Set(affirmative.filter(m => !country || m.clue.country === country).map(m => m.evidence))];
            const states = [...new Set(affirmative.filter(m => m.clue.country === country && m.clue.kind === 'state').map(m => m.clue.jurisdiction))];
            for (const state of states.length ? states : [null]) {
                const jurisdictions = country ? [country, ...(state ? [state] : [])] : [];
                const product = sellerProductForMarket(args, country || r.id);
                const sector = (0, verticals_ts_1.explainSector)({ seller: product, buyer: f.buyer });
                const inferred = sector.source === 'seller' ? sector.vertical : null;
                const input = args && typeof args === 'object' && !Array.isArray(args) ? args : {};
                const selected = input.your_sector ?? input.industry;
                const selectedId = typeof selected === 'string' ? selected.replace(/_/g, '-') : null;
                const validSelection = selected === 'other' || regions_ts_1.REGION_TAXONOMY.verticals.some(v => v.id === selectedId);
                const v = validSelection ? (selected === 'other' ? null : inferred?.id === selectedId ? inferred : { id: selectedId, subtype: undefined }) : inferred;
                const subtype = v?.subtype ? regions_ts_1.REGION_TAXONOMY.subtypes.find(s => s.id === v.subtype || s.name === v.subtype)?.id || null : null;
                regions.push({ region_id: r.id, countries: country ? [country] : [], jurisdictions, evidence, vertical_id: v?.id || null, subtype_id: subtype });
            }
        }
    }
    return { regions, unresolved_hints: [...new Set(chosen.unresolved)] };
}
const LABELS = { decision_approvers: 'Who decides and approves', sector_regulator: 'Sector rules to check', procurement_payment: 'Procurement and payment', data_privacy: 'Data and privacy', buyer_language: 'Buyer language', proof: 'Proof to prepare', objections: 'Objections to test', sales_motion: 'Sales motion' };
const EU_COUNTRIES = new Set(['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE']);
function applies(n, match) { return !n.jurisdictions.length || n.jurisdictions.some(j => match.jurisdictions.includes(j) || (j === 'EU' && match.countries.some(c => EU_COUNTRIES.has(c)))); }
function renderNote(n, countries) {
    const countryScope = '';
    const condition = n.applies_when ? ' Check scope: ' + n.applies_when : '';
    const sources = n.source_ids.map(id => regions_ts_1.REGION_SOURCES[id]).filter(Boolean).map(s => `${s.title}: <${s.url}> (source checked ${s.accessed_date})`).join('; ');
    return countryScope + n.text + condition + (sources ? ' Source: ' + sources + '.' : '');
}
function regionNotes(args) {
    const reading = readRegionContext(args);
    if (!reading.regions.length)
        return exports.NO_REGION_SUFFIX;
    const out = ['', '', '## Region and industry context', '', 'Draft for owner review. These checks use the market context in your description. They do not change the scores or market arithmetic above.'];
    for (const match of reading.regions) {
        const choice = regions_ts_1.REGION_CHOICES.find(x => x.id === match.region_id);
        const data = regions_ts_1.REGION_DATA.find(x => x.region_id === match.region_id);
        const country = match.countries[0];
        const countryName = data?.reader_hints.countries.find(c => c.code === country)?.name || COUNTRY_SEEDS.find(c => c[1] === country)?.[2][0];
        const state = match.jurisdictions.find(j => j.startsWith('US-'));
        const stateName = state ? Object.entries(US_STATES).find(([, code]) => 'US-' + code === state)?.[0] : undefined;
        out.push('', `### ${choice.name}${countryName && countryName !== choice.name ? ' · ' + countryName : ''}${stateName ? ' · ' + stateName : ''}`);
        if (!country)
            out.push('Which buyer country applies? Country specific rules are omitted until you name it.');
        if (!data) {
            out.push('Regional industry notes are awaiting source review. Confirm the buyer country and approval requirements before using regional advice.');
            continue;
        }
        const vertical = data.verticals.find(x => x.vertical_id === match.vertical_id), subtype = match.subtype_id ? data.subtypes.find(x => x.subtype_id === match.subtype_id) : undefined;
        let shown = 0, sourced = 0;
        const levels = [data.defaults, ...(vertical ? [vertical.context] : []), ...(subtype ? [subtype.context] : [])];
        for (const field of Object.keys(LABELS)) {
            const seen = new Set(), notes = levels.flatMap(c => c[field]).filter(n => { const key = JSON.stringify(n); if (seen.has(key) || !applies(n, match))
                return false; seen.add(key); return true; });
            shown += notes.length;
            sourced += notes.filter(n => n.source_ids.length).length;
            if (notes.length)
                out.push('', LABELS[field] + ':', ...notes.map(n => renderNote(n, match.countries)));
        }
        if (!sourced)
            out.push('No sourced note is available for this market and industry combination. No other country has been substituted.');
        if (!match.vertical_id)
            out.push('Describe what you sell to add the matching industry and subtype checks.');
        const pending = [...(vertical?.pending_topics || []), ...(subtype?.pending_topics || [])];
        if (pending.length)
            out.push('This regional data file still has source gaps. Confirm the country and activity specific evidence before using it. No conclusion is drawn on unverified topics.');
    }
    out.push('', 'Next action for each named market: The account owner confirms the buyer country and contracting entity. Procurement confirms the order and payment steps. The relevant risk or privacy reviewer records the applicable rules and missing proof. Revisit this when the market, entity or data flow changes.');
    return out.join('\n');
}
//# sourceMappingURL=region-reader.js.map