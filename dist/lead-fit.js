"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leadFit = leadFit;
const reserve_common_ts_1 = require("./reserve-common.js");
const defaults = { critical: 25, important: 15, nice_to_have: 10 }, norm = (s) => s.trim().replace(/\s+/g, ' ').toLowerCase(), integer = (n, label) => { if (!Number.isSafeInteger(n))
    throw new Error(label + ' must be a whole number for this model.'); return n; };
function leadFit(a) {
    (0, reserve_common_ts_1.requireUnique)(a.criteria.map((c) => ({ criterion: norm(c.criterion) })), 'criterion');
    const own = a.default_weights ?? {}, weights = { ...defaults, ...own };
    Object.values(weights).forEach(w => integer(w, 'Default weight'));
    const criteria = a.criteria.map((c) => { (0, reserve_common_ts_1.requireUnique)(c.values.map((v) => ({ value: norm(v.value) })), 'value'); const importance = c.importance ?? 'nice_to_have', weight = integer(c.weight ?? weights[importance], 'Weight'), weightLabel = c.weight !== undefined ? 'Your weight' : Object.hasOwn(own, importance) ? 'Your default weight' : 'Example default weight'; return { criterion: c.criterion, importance: c.importance ?? 'Not given; scored as nice to have', weight, weightLabel, values: c.values.map((v, i) => { const points = v.points !== undefined ? integer(v.points, 'Points') : c.graded === false || c.values.length === 1 ? weight : Math.floor((2 * weight * (c.values.length - 1 - i) + (c.values.length - 1)) / (2 * (c.values.length - 1))); if (points > weight)
            throw new Error('Points cannot exceed the criterion weight.'); return { value: v.value.trim(), points, source: v.points !== undefined ? 'Your points' : c.graded === false || c.values.length === 1 ? 'Full weight' : 'Graded half up' }; }) }; });
    const max = (0, reserve_common_ts_1.sum)(criteria.map((c) => c.weight));
    if (max === 0)
        throw new Error('At least one criterion needs positive weight.');
    const percents = a.tier_percents ?? [80, 60, 40];
    if (percents.length !== 3 || !percents.every((x) => Number.isSafeInteger(x)) || !(100 >= percents[0] && percents[0] > percents[1] && percents[1] > percents[2] && percents[2] > 0))
        throw new Error('Tier percents must be three descending whole percentages above zero and at most 100.');
    const tiers = Object.fromEntries(['A', 'B', 'C'].map((k, i) => [k, Math.ceil(max * percents[i] / 100)]));
    const leads = (a.leads ?? []).map((ld) => { const fields = new Map(); for (const f of ld.fields) {
        const key = norm(f.criterion);
        fields.set(key, [...(fields.get(key) ?? []), f]);
    } const detail = [], missing = [], pending = []; let score = 0; for (const c of criteria) {
        const rows = fields.get(norm(c.criterion)) ?? [], given = [...new Set(rows.map(r => r.value))];
        if (given.length > 1) {
            missing.push(c.criterion);
            detail.push({ criterion: c.criterion, given, points: null, status: 'Conflicting values' });
            continue;
        }
        const value = given[0], hit = typeof value === 'string' ? c.values.find((v) => norm(v.value) === norm(value)) : undefined;
        if (hit) {
            score += hit.points;
            detail.push({ criterion: c.criterion, value: hit.value, points: hit.points });
        }
        else {
            missing.push(c.criterion);
            const isPending = value?.trim() && !['n/a', 'na', 'unknown', 'not known', 'tbd', '-', '?', 'none given'].includes(norm(value));
            if (isPending)
                pending.push({ criterion: c.criterion, value, listed: c.values.map((v) => v.value) });
            detail.push({ criterion: c.criterion, value: value ?? null, points: null, status: isPending ? 'Pending confirmation' : 'Missing' });
        }
    } return { label: ld.label, score, max, tier: missing.length ? null : score >= tiers.A ? 'A' : score >= tiers.B ? 'B' : score >= tiers.C ? 'C' : 'D', status: pending.length ? 'PENDING_CONFIRMATION' : missing.length ? 'INCOMPLETE' : 'SCORED', missing, pending, detail, ignored: ld.fields.filter((f) => !criteria.some((c) => norm(c.criterion) === norm(f.criterion))).map((f) => f.criterion) }; });
    let combinations = 1;
    for (const c of criteria)
        combinations *= c.values.length;
    const tierReading = [];
    if (combinations <= 200000) {
        for (const tier of ['A', 'B', 'C']) {
            let best = null;
            const walk = (i, score, full, chosen) => { if (i === criteria.length) {
                if (score >= tiers[tier] && (!best || full < best.full || full === best.full && score < best.score))
                    best = { full, score, chosen: [...chosen] };
                return;
            } const c = criteria[i]; for (const v of c.values)
                walk(i + 1, score + v.points, full + (c.weight > 0 && v.points === c.weight ? 1 : 0), [...chosen, { criterion: c.criterion, value: v.value, points: v.points }]); };
            walk(0, 0, 0, []);
            const needed = criteria.filter((c, i) => { const below = c.values.filter((v) => v.points < c.weight); if (!below.length)
                return false; const rest = (0, reserve_common_ts_1.sum)(criteria.filter((_, j) => j !== i).map((d) => Math.max(...d.values.map((v) => v.points)))); return rest + Math.max(...below.map((v) => v.points)) < tiers[tier]; }).map((c) => c.criterion);
            tierReading.push({ tier, minimum: tiers[tier], reachable: best !== null, ...(best ?? {}), requiredAtFull: needed });
        }
    }
    return { criteria, max, tiers, tierPercents: percents, tierLabel: a.tier_percents ? 'Your tier bands' : 'Example default bands', leads, tierReading, tierReadingStatus: combinations > 200000 ? 'NOT_COMPUTED_OVER_200000_COMBINATIONS' : 'COMPUTED', validation: ['Score your closed won and lost deals using the same fields.', 'Compare tiers with outcomes; inspect mismatches.', 'Change one weight at a time and rescore.', 'Set your own follow-up action for each tier.'] };
}
(0, reserve_common_ts_1.define)('lead_fit_score', 'Build and score a fit-only model from exact supplied criteria and lead values. Missing and unconfirmed values never receive a tier. Whole-point weights; source example defaults labelled.', (0, reserve_common_ts_1.object)({ criteria: (0, reserve_common_ts_1.array)((0, reserve_common_ts_1.object)({ criterion: reserve_common_ts_1.text, importance: (0, reserve_common_ts_1.choice)('critical', 'important', 'nice_to_have'), weight: (0, reserve_common_ts_1.num)(0, 1000000), graded: reserve_common_ts_1.bool, values: (0, reserve_common_ts_1.array)((0, reserve_common_ts_1.object)({ value: reserve_common_ts_1.text, points: (0, reserve_common_ts_1.num)(0, 1000000) }, ['value']), 30, 1) }, ['criterion', 'values']), 20, 1), default_weights: (0, reserve_common_ts_1.object)({ critical: (0, reserve_common_ts_1.num)(0, 1000000), important: (0, reserve_common_ts_1.num)(0, 1000000), nice_to_have: (0, reserve_common_ts_1.num)(0, 1000000) }, []), tier_percents: (0, reserve_common_ts_1.array)((0, reserve_common_ts_1.num)(1, 100), 3, 3), leads: (0, reserve_common_ts_1.array)((0, reserve_common_ts_1.object)({ label: reserve_common_ts_1.text, fields: (0, reserve_common_ts_1.array)((0, reserve_common_ts_1.object)({ criterion: reserve_common_ts_1.text, value: reserve_common_ts_1.text }), 50) }, ['label', 'fields']), 200) }, ['criteria']), a => { const r = leadFit(a); return { title: 'Lead fit model', summary: ['Scope: fit only, no engagement or MQL rule', 'Maximum: ' + r.max, 'Tier bands: ' + r.tierLabel, 'Scored leads: ' + r.leads.filter((x) => x.tier !== null).length + ' of ' + r.leads.length, 'Next: validate against your own closed won and lost deals'], sections: [{ heading: 'Model', table: { headers: ['Criterion', 'Weight source', 'Weight', 'Values and points'], rows: r.criteria.map((c) => [c.criterion, c.weightLabel, c.weight, c.values.map((v) => v.value + ' = ' + v.points).join('; ')]) } }, { heading: 'Lead results', table: { headers: ['Record', 'Points from known fields', 'Status', 'Tier'], rows: r.leads.map((x) => [x.label, x.score, x.status, x.tier]) } }, { heading: 'Values to confirm', body: JSON.stringify(r.leads.filter((x) => x.missing.length).map((x) => ({ label: x.label, missing: x.missing, pending: x.pending }))) }, { heading: 'Computed tier reading', body: JSON.stringify(r.tierReading.length ? r.tierReading : r.tierReadingStatus) }, { heading: 'Validation', body: r.validation.join(' ') }], data: r, limitations: ['Default weights 25, 15 and 10 and default tier bands 80%, 60% and 40% are starting examples, not benchmarks.', 'This port accepts whole-point weights, points and tier percentages. Numeric lead values must be supplied as their exact text; bands are never inferred.', 'A high fit score does not predict a win. Tier actions belong to the user.'] }; });
//# sourceMappingURL=lead-fit.js.map