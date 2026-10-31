"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.icpGaps = icpGaps;
exports.icpReview = icpReview;
const reserve_common_ts_1 = require("./reserve-common.js");
const keys = ['acv', 'cycle', 'win_rate', 'churn', 'nps'], names = { acv: 'Average contract value', cycle: 'Sales cycle (days)', win_rate: 'Win rate (%)', churn: 'Churn (%)', nps: 'NPS' }, bandsDefault = { acv: [50, 25], cycle: [30, 15], win_rate: [40, 20], churn: [40, 20], nps: [50, 25] }, up = new Set(['acv', 'win_rate', 'nps']), half = (n) => { if (!Number.isFinite(n) || Math.abs(n) > Number.MAX_SAFE_INTEGER)
    throw new Error('Gap exceeds the supported safe numeric range.'); return Math.floor(n + 0.5); }, fmt = (n) => Number.isInteger(n) ? n.toLocaleString('en-US') : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function icpGaps(a) {
    const rows = keys.map(metric => {
        const c = a.current?.[metric], t = a.target?.[metric], pair = a.bands?.[metric] ?? bandsDefault[metric];
        if (pair[0] < pair[1])
            throw new Error('High priority band must be at least the Medium band.');
        const [hi, me] = pair, row = { metric, name: names[metric], current: c ?? null, target: t ?? null, status: 'compared', met: false, ranked: false, gap: null, text: '', band: '', band_source: a.bands?.[metric] ? 'your bands' : 'example default bands' };
        if (c === undefined || t === undefined)
            return { ...row, status: 'missing', text: 'missing: no ' + [c === undefined ? 'current' : null, t === undefined ? 'target' : null].filter(Boolean).join(' and ') + ' value given, not compared', band: 'not compared' };
        if (metric === 'nps') {
            const pts = t - c;
            row.gap = pts;
            row.text = pts > 0 ? '+' + fmt(pts) + ' points needed' : pts === 0 ? 'target met' : 'target met: already ' + fmt(-pts) + ' points above target';
            row.met = pts <= 0;
            if (row.met)
                row.band = 'None (target met)';
            else if (c <= 0)
                row.band = "Not rated (today's NPS is 0 or below, so a relative change means nothing)";
            else {
                const rel = half((t - c) / c * 100);
                row.band = (rel > hi ? 'High' : rel > me ? 'Medium' : 'Low') + ' (on the relative change, ' + rel + '%)';
            }
            return row;
        }
        const diff = up.has(metric) ? t - c : c - t;
        if (diff <= 0) {
            const better = c > 0 ? half(-diff / c * 100) : 0;
            return { ...row, met: true, band: 'None (target met)', gap: better === 0 ? 0 : -better, text: better > 0 ? 'target met: already ' + better + '% better than target' : 'target met' };
        }
        if (c === 0)
            return { ...row, status: 'n/a', text: "n/a: today's value is 0, so no percentage can be taken", band: 'Not rated' };
        const gap = half(diff / c * 100);
        row.gap = gap || 0.5;
        row.ranked = true;
        row.band = gap === 0 ? 'Low' : gap > hi ? 'High' : gap > me ? 'Medium' : 'Low';
        row.text = gap === 0 ? 'less than 1% ' + (up.has(metric) ? 'increase' : 'reduction') + ' needed' : metric === 'acv' ? '+' + gap + '% increase needed' : metric === 'win_rate' ? '+' + gap + '% relative increase needed (+' + fmt(t - c) + ' points)' : gap + '% reduction needed';
        return row;
    });
    const ranked = rows.filter(r => r.ranked), max = Math.max(...ranked.map(r => r.gap)), ties = ranked.filter(r => r.gap === max).map(r => r.metric);
    return { rows, largest: ties[0] ?? null, largest_ties: ties.length > 1 ? ties : [], compared: rows.filter(r => r.status !== 'missing').length };
}
function icpReview(a) {
    (0, reserve_common_ts_1.requireDate)(a.as_of, 'Review date');
    const comparisons = a.comparisons ?? [], evidence = a.evidence ?? [], hypotheses = a.hypotheses ?? [];
    (0, reserve_common_ts_1.requireUnique)(evidence, 'id');
    (0, reserve_common_ts_1.requireUnique)(a.bases ?? [], 'metric');
    for (const c of comparisons) {
        if (c.icp_quote && !a.icp.includes(c.icp_quote))
            throw new Error('ICP comparison quote is not present in the supplied ICP.');
        if (c.customer_quote && !a.current_customers?.includes(c.customer_quote))
            throw new Error('Customer comparison quote is not present in the supplied customer description.');
    }
    for (const e of evidence)
        if (e.date)
            (0, reserve_common_ts_1.requireDate)(e.date, 'Evidence date', a.as_of);
    const gaps = icpGaps(a);
    for (const r of gaps.rows) {
        if (r.status === 'missing')
            continue;
        const b = (a.bases ?? []).find((x) => x.metric === r.metric);
        if (!b?.current_basis?.trim() || b.current_basis.trim().toLowerCase() !== b.target_basis?.trim().toLowerCase()) {
            r.status = 'basis unconfirmed';
            r.text = 'not compared: confirm matching period, definition and units';
            r.band = 'not compared';
            r.ranked = false;
            r.gap = null;
            r.met = false;
        }
    }
    const ranked = gaps.rows.filter(r => r.ranked), max = Math.max(...ranked.map(r => r.gap)), ties = ranked.filter(r => r.gap === max).map(r => r.metric);
    gaps.largest = ties[0] ?? null;
    gaps.largest_ties = ties.length > 1 ? ties : [];
    gaps.compared = gaps.rows.filter(r => !['missing', 'basis unconfirmed'].includes(r.status)).length;
    let intersection = null;
    if (a.counts) {
        const total = a.counts.total, parts = a.counts.parts;
        (0, reserve_common_ts_1.requireUnique)(parts, 'part');
        if (!Number.isSafeInteger(total) || parts.some((p) => !Number.isSafeInteger(p.count) || p.count > total))
            throw new Error('Part counts must be whole numbers between zero and the total.');
        const counts = parts.map((p) => p.count);
        intersection = { low: Math.max(0, counts.reduce((x, y) => x + y, 0) - (counts.length - 1) * total), high: Math.min(...counts), total, status: 'RANGE_FROM_MARGINAL_COUNTS_NOT_EXACT' };
    }
    const hs = hypotheses.map((h) => { if (new Set(h.evidence_ids).size !== h.evidence_ids.length)
        throw new Error('Duplicate evidence IDs do not count as separate support.'); const support = h.evidence_ids.map((id) => { const e = evidence.find((x) => x.id === id); if (!e)
        throw new Error('Hypothesis references an unknown evidence ID.'); return e; }); return { ...h, evidenceCount: support.length, evidence: support, status: support.length < 2 ? 'QUESTION_ONLY_SINGLE_SIGNAL' : 'HYPOTHESIS_TO_TEST', draftMark: support.length < 2 ? 'Question' : h.proposed_mark }; }).sort((x, y) => y.evidenceCount - x.evidenceCount);
    return { originalIcp: a.icp, reviewDate: a.as_of, comparisons: comparisons.map((c) => ({ ...c, classificationSource: 'Caller whole-meaning assessment, not independently verified' })), metricGaps: gaps, intersection, hypotheses: hs, draft: [{ mark: 'Keep', text: a.icp, status: 'Original wording retained, not independently validated' }, ...hs.map((h) => ({ mark: h.draftMark, text: h.change, status: h.status }))], crmFields: [...new Set(hs.flatMap((h) => h.crm_fields))], openQuestions: [...(!a.current_customers ? ['Supply the current customer description.'] : []), ...gaps.rows.filter(r => ['missing', 'basis unconfirmed'].includes(r.status)).map(r => 'Confirm ' + r.name + ' current value, target and matching basis.'), ...(evidence.length ? [] : ['Supply dated win, loss or market-change notes.'])] };
}
const vals = { acv: (0, reserve_common_ts_1.num)(), cycle: (0, reserve_common_ts_1.num)(), win_rate: (0, reserve_common_ts_1.num)(0, 100), churn: (0, reserve_common_ts_1.num)(0, 100), nps: (0, reserve_common_ts_1.num)(-100, 100) }, metric = (0, reserve_common_ts_1.choice)(...keys);
(0, reserve_common_ts_1.define)('icp_evidence_review', 'Review an existing ICP using supplied quotes, exact metric gaps, marginal-count bounds and evidence-linked hypotheses. Single signals remain questions. No invented cause, target or revised company fact.', (0, reserve_common_ts_1.object)({ icp: reserve_common_ts_1.text, current_customers: reserve_common_ts_1.text, as_of: reserve_common_ts_1.text, current: (0, reserve_common_ts_1.object)(vals, []), target: (0, reserve_common_ts_1.object)(vals, []), bands: (0, reserve_common_ts_1.object)(Object.fromEntries(keys.map(k => [k, (0, reserve_common_ts_1.array)((0, reserve_common_ts_1.num)(0, 1000000), 2, 2)])), []), bases: (0, reserve_common_ts_1.array)((0, reserve_common_ts_1.object)({ metric, current_basis: reserve_common_ts_1.text, target_basis: reserve_common_ts_1.text }), 5), comparisons: (0, reserve_common_ts_1.array)((0, reserve_common_ts_1.object)({ part: reserve_common_ts_1.text, icp_quote: reserve_common_ts_1.text, customer_quote: reserve_common_ts_1.text, classification: (0, reserve_common_ts_1.choice)('Matches', 'Partly', 'Not in the ICP', 'ICP part missing', 'Conflict', 'Open'), reason: reserve_common_ts_1.text }, ['part', 'classification', 'reason']), 30), evidence: (0, reserve_common_ts_1.array)((0, reserve_common_ts_1.object)({ id: reserve_common_ts_1.text, kind: (0, reserve_common_ts_1.choice)('win', 'loss', 'market_change', 'customer_note'), quote: reserve_common_ts_1.text, date: reserve_common_ts_1.text, stated_reason: reserve_common_ts_1.text }, ['id', 'kind', 'quote']), 100), hypotheses: (0, reserve_common_ts_1.array)((0, reserve_common_ts_1.object)({ change: reserve_common_ts_1.text, proposed_mark: (0, reserve_common_ts_1.choice)('Keep', 'Add on trial', 'Qualify out on trial', 'Question', 'Open'), evidence_ids: (0, reserve_common_ts_1.array)(reserve_common_ts_1.text, 20, 1), test: reserve_common_ts_1.text, disproof: reserve_common_ts_1.text, crm_fields: (0, reserve_common_ts_1.array)(reserve_common_ts_1.text, 20, 1) }), 30), counts: (0, reserve_common_ts_1.object)({ total: (0, reserve_common_ts_1.num)(0, 1000000000), parts: (0, reserve_common_ts_1.array)((0, reserve_common_ts_1.object)({ part: reserve_common_ts_1.text, count: (0, reserve_common_ts_1.num)(0, 1000000000) }), 20, 2) }) }, ['icp', 'as_of']), a => { const r = icpReview(a); return { title: 'ICP evidence review', summary: ['Review: existing ICP, as supplied', 'Compared metrics: ' + r.metricGaps.compared, 'Largest percentage gap: ' + (r.metricGaps.largest_ties.length ? r.metricGaps.largest_ties.join(' and ') + ' (tied)' : r.metricGaps.largest ?? 'Not established'), 'Next: test the evidence-linked hypotheses before changing targeting'], sections: [{ heading: 'Metric gaps', table: { headers: ['Metric', 'Today', 'Target', 'Gap', 'Priority source'], rows: r.metricGaps.rows.map(x => [x.name, x.current, x.target, x.text, x.band + '; ' + x.band_source]) } }, { heading: 'Hypotheses', table: { headers: ['Proposed change', 'Evidence count', 'Status', 'Test', 'Disproof'], rows: r.hypotheses.map((x) => [x.change, x.evidenceCount, x.status, x.test, x.disproof]) } }, { heading: 'Marked draft', table: { headers: ['Mark', 'Wording', 'Status'], rows: r.draft.map(x => [x.mark, x.text, x.status]) } }, { heading: 'Fit-count range', body: r.intersection ? JSON.stringify(r.intersection) : 'No marginal counts supplied.' }, { heading: 'Open questions', body: r.openQuestions.join(' ') }], data: r, limitations: ['Default priority bands are example starting points, not benchmarks. NPS points are never ranked with percentage gaps.', 'Comparison classes and proposed wording are supplied by the conversational caller after reading whole quotes. Matching text does not verify its truth.', 'One evidence item opens a question; even multiple items remain a hypothesis requiring the supplied test and disproof. No CRM change is made.', 'Marginal counts provide bounds only; an exact intersection needs record-level data.'] }; });
//# sourceMappingURL=icp-review.js.map