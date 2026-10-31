"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareOwn = compareOwn;
exports.pmfCheck = pmfCheck;
const reserve_common_ts_1 = require("./reserve-common.js");
const std = [['churn', 'Churn (%)', 'lower'], ['nps', 'NPS', 'higher'], ['ltv_cac', 'LTV to CAC ratio', 'higher'], ['retention', 'Retention (%)', 'higher'], ['activation', 'Activation (%)', 'higher']];
function compareOwn(key, name, better, value, target) { const row = { dimension: key, name, value: value ?? null, target: target ?? null, better, status: '', text: '', gap: null }; if (value === undefined || target === undefined) {
    const missing = [value === undefined ? 'value' : null, target === undefined ? 'target of yours' : null].filter(Boolean).join(' and ');
    return { ...row, status: value !== undefined && target === undefined ? 'no target' : 'missing', text: 'not scored: no ' + missing + ' given' };
} if (key === 'nps') {
    const pts = target - value;
    return { ...row, status: pts <= 0 ? 'met' : 'behind', text: pts <= 0 ? 'target met' : '+' + Number(pts.toFixed(10)) + ' points needed' };
} const diff = better === 'higher' ? target - value : value - target; if (diff <= 0)
    return { ...row, status: 'met', text: 'target met' }; if (value === 0)
    return { ...row, status: 'n/a', text: 'n/a: the value is 0, so no percentage can be taken' }; const raw = diff / Math.abs(value) * 100; if (!Number.isFinite(raw))
    throw new Error('Percentage gap exceeds the finite numeric range.'); const gap = Math.floor(raw + 0.5), word = better === 'higher' ? 'increase' : 'reduction'; return { ...row, status: 'behind', gap: gap === 0 ? 0.5 : gap, text: gap === 0 ? 'less than 1% ' + word + ' needed' : (better === 'higher' ? '+' : '') + gap + '% ' + word + ' needed' }; }
const checks = { churn: 'Compare churn by segment and fit; inspect time to first value and champion changes.', nps: 'Review low-scoring segments and detractor interview evidence.', ltv_cac: 'Compare acquisition cost by channel and contract value by segment.', retention: 'Split expansion from contraction and inspect shrinking segments.', activation: 'Inspect the step where new customers stall and confirm the activation event.' };
function pmfCheck(a) {
    const metrics = { ...(a.metrics ?? {}) }, targets = a.targets ?? {}, bases = a.bases ?? [];
    (0, reserve_common_ts_1.requireUnique)(bases, 'metric');
    (0, reserve_common_ts_1.requireUnique)(a.custom ?? [], 'name');
    if (metrics.ltv_cac === undefined && metrics.ltv !== undefined && metrics.cac > 0) {
        metrics.ltv_cac = metrics.ltv / metrics.cac;
        if (!Number.isFinite(metrics.ltv_cac))
            throw new Error('LTV/CAC exceeds the finite numeric range.');
    }
    const rows = std.map(([key, name, better]) => { if (key === 'activation' && ['services', 'connectivity', 'investment'].includes(a.business_model))
        return { dimension: key, name, value: metrics[key] ?? null, target: targets[key] ?? null, better, status: 'not applicable', text: 'not applicable for a ' + a.business_model + ' business: use the adoption measure your buyers use', gap: null }; if (key === 'ltv_cac' && metrics[key] === undefined && (metrics.ltv !== undefined || metrics.cac !== undefined))
        return { dimension: key, name, value: null, target: targets[key] ?? null, better, status: 'missing', text: 'not scored: needs both LTV and CAC, and CAC above 0', gap: null }; return compareOwn(key, name, better, metrics[key], targets[key]); });
    for (const c of a.custom ?? [])
        rows.push(compareOwn('custom:' + c.name, c.name, c.better, c.value, c.target));
    for (const r of rows) {
        if (['missing', 'no target', 'not applicable'].includes(r.status))
            continue;
        const b = bases.find((b) => b.metric === r.dimension);
        if (!b?.value_basis?.trim() || !b?.target_basis?.trim() || b.value_basis.trim().toLowerCase() !== b.target_basis.trim().toLowerCase()) {
            r.status = 'basis unconfirmed';
            r.text = 'not scored: confirm identical value and target definitions, period and units';
            r.gap = null;
        }
    }
    const scored = rows.filter(r => ['met', 'behind', 'n/a'].includes(r.status)), met = rows.filter(r => r.status === 'met'), ranked = rows.filter(r => r.status === 'behind' && r.gap !== null), top = Math.max(...ranked.map(r => r.gap)), ties = ranked.filter(r => r.gap === top).map(r => r.dimension);
    return { rows, scored: scored.length, met: met.length, weakest: ties[0] ?? null, weakest_ties: ties.length > 1 ? ties : [], model: a.business_model, checks: rows.filter(r => r.status === 'behind').map(r => ({ dimension: r.dimension, check: checks[r.dimension] ?? 'Confirm the metric definition and split your own observations to test the gap.', status: 'QUESTION_TO_TEST_NOT_FINDING' })), feedback: (a.feedback ?? []).map((f) => ({ ...f, classificationSource: 'Caller supplied whole-line classification; unverified quote' })), caution: rows.some(r => r.value !== null && r.value <= 0) ? 'Percentage gaps from negative or near-zero values require care; read the original value and target together.' : null };
}
const values = { churn: (0, reserve_common_ts_1.num)(0, 100), nps: (0, reserve_common_ts_1.num)(-100, 100), ltv_cac: (0, reserve_common_ts_1.num)(), retention: (0, reserve_common_ts_1.num)(0, 1000), activation: (0, reserve_common_ts_1.num)(0, 100) };
(0, reserve_common_ts_1.define)('pmf_target_check', 'Compare PMF dimensions only against supplied own targets on confirmed matching bases. No benchmark or fit-stage verdict. NPS is points and is never ranked with percentage gaps.', (0, reserve_common_ts_1.object)({ business_model: (0, reserve_common_ts_1.choice)('saas', 'services', 'connectivity', 'transactions', 'marketplace', 'hardware_software', 'investment'), metrics: (0, reserve_common_ts_1.object)({ ...values, ltv: (0, reserve_common_ts_1.num)(), cac: (0, reserve_common_ts_1.num)() }, []), targets: (0, reserve_common_ts_1.object)(values, []), bases: (0, reserve_common_ts_1.array)((0, reserve_common_ts_1.object)({ metric: reserve_common_ts_1.text, value_basis: reserve_common_ts_1.text, target_basis: reserve_common_ts_1.text }), 50), custom: (0, reserve_common_ts_1.array)((0, reserve_common_ts_1.object)({ name: reserve_common_ts_1.text, value: (0, reserve_common_ts_1.num)(-Number.MAX_VALUE), target: (0, reserve_common_ts_1.num)(-Number.MAX_VALUE), better: (0, reserve_common_ts_1.choice)('higher', 'lower') }, ['name', 'better']), 30), feedback: (0, reserve_common_ts_1.array)((0, reserve_common_ts_1.object)({ quote: reserve_common_ts_1.text, classification: (0, reserve_common_ts_1.choice)('story', 'result', 'claim', 'friction', 'unclassified') }), 50) }, ['business_model']), a => { const r = pmfCheck(a); return { title: 'Metrics against your own targets', summary: [r.met + ' of ' + r.scored + ' scored dimensions meet your own targets.', 'Furthest percentage gap: ' + (r.weakest_ties.length ? r.weakest_ties.join(' and ') + ' (tied)' : r.weakest ?? 'Not established'), 'NPS: reported in points separately', 'Next: ' + (r.scored ? 'Check the weakest dimension against your own data.' : 'Supply your targets and confirm matching metric bases.')], sections: [{ heading: 'Target comparison', table: { headers: ['Dimension', 'Your value', 'Your target', 'Gap', 'Status'], rows: r.rows.map(x => [x.name, x.value, x.target, x.text, x.status]) } }, { heading: 'Checks, not findings', table: { headers: ['Dimension', 'Check'], rows: r.checks.map(x => [x.dimension, x.check]) } }, { heading: 'Feedback as supplied', table: { headers: ['Quote', 'Caller classification'], rows: r.feedback.map((f) => [f.quote, f.classification]) } }], data: r, limitations: ['Every target is supplied by you. No published benchmark or fit-stage label is used.', 'Matching basis strings are caller confirmation, not independent verification. Conflicting periods or units are never compared.', 'Feedback classification is supplied by the conversational caller after reading the whole quote, not inferred from keyword matching.', ...(r.caution ? [r.caution] : [])] }; });
//# sourceMappingURL=pmf-target.js.map