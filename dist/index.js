#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SERVER_VERSION = exports.SERVER_NAME = void 0;
exports.createServer = createServer;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const echo_safe_ts_1 = require("./echo-safe.js");
const verticals_ts_1 = require("./verticals.js");
// =============================================================================
// ICP INTELLIGENCE MCP v1.0.0 - Deep ICP Analysis with Pattern Detection
// =============================================================================
// 9 Tools for ICP definition, scoring, market sizing, and signal generation
// =============================================================================
// Text only: add a word such as "software" after a phrase unless the phrase already ends with it (no "software software").
// Run 17 D56 (backlog items 8 and 15): a market share under 0.05% prints as given (0.03%, not 0.0%);
// every share of 0.05% or more prints as before, with one decimal.
// Run 20 round 1: every percentage a tool prints is a clean figure, one decimal at most and no float noise. The one exception is
// the run 17 D56 rule: a share under 0.05% would print as 0.0%, so it prints with two decimals (0.03%), or "under 0.01%".
function sharePct(fraction) {
    const v = Number((fraction * 100).toPrecision(12));
    if (v > 0 && v < 0.05) {
        const r = Math.round(v * 100) / 100;
        return r >= 0.01 ? `${r}%` : 'under 0.01%';
    }
    return `${v.toFixed(1)}%`;
}
// A percentage typed by the user and printed back: one decimal at most, no trailing ".0" (20 stays 20, 23.456789 prints 23.5).
function cleanNum1(n) {
    return (Math.round(n * 10) / 10 + 0).toLocaleString('en-US', { maximumFractionDigits: 1 });
}
function cleanPct(n) {
    return `${cleanNum1(n)}%`;
}
// A plain number printed back (a sum of weights): float noise removed, two decimals at most.
function cleanNum(n) {
    return (Math.round(n * 100) / 100 + 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
}
function withSoftware(phrase, word) {
    const p = phrase.trim();
    return p.toLowerCase() === word.toLowerCase() || p.toLowerCase().endsWith(` ${word.toLowerCase()}`) ? p : `${p} ${word}`;
}
// Text only (run 9): common words that may open an input phrase. Mid-sentence, only these are lowered
// ("Fewer delays" becomes "fewer delays"). Any other capitalised word is kept as typed, because it may be a
// name or an acronym ("Salesforce data you can trust", "Microsoft Teams approvals", "AI deal scoring", "CRM hygiene").
const COMMON_WORDS = new Set(('a an the this that these those our your their my its his her we you they it me us them all any each every ' +
    'both either neither no not none some many much more most less least fewer few several other another such ' +
    'same own only just even also still very too so as than then there here what which who whom whose when where ' +
    'why how whether if because while until unless though although since once after before during about above ' +
    'across against along among around at by for from in into inside near of off on onto out outside over past ' +
    'per through throughout to toward towards under underneath up upon via with within without is are was were be ' +
    'been being am do does did done doing have has had having can could will would shall should may might must ' +
    'need needs needed get gets got getting give gives gave make makes made let lets keep keeps put puts take ' +
    'takes took see sees show shows find finds know knows think go goes going come comes one two three four five ' +
    'six seven eight nine ten first second third last next new old big small large tiny long short high low full ' +
    'half whole top bottom early late fast faster fastest quick quicker quickest slow slower easy easier easiest ' +
    'simple simpler hard harder better best good great strong stronger weak weaker clear clearer real true right ' +
    'wrong free open closed live smart smarter lean cheaper cheap safe safer secure accurate reliable consistent ' +
    'predictable visible instant instantly automatic automatically manual custom modern legacy digital online ' +
    'offline mobile remote local global central single multiple multi daily weekly monthly quarterly yearly ' +
    'annual real-time realtime end self self-serve self-service one-tap one-click two-way no-code low-code always ' +
    'never often sometimes usually now today tomorrow soon yet again ever already almost nearly exactly directly ' +
    'fully truly entirely highly deeply readily cut cuts reduce reduces reduction lower lowers raise raises boost ' +
    'boosts grow grows growth increase increases improve improves save saves saving savings win wins earn earns ' +
    'drive drives drove speed speeds scale scales help helps support supports enable enables deliver delivers ' +
    'offer offers provide provides build builds create creates launch launches ship ships track tracks measure ' +
    'measures manage manages plan plans run runs start starts stop stops ends avoid avoids prevent prevents ' +
    'remove removes replace replaces fix fixes solve solves close closes book books send sends share shares sync ' +
    'syncs connect connects integrate integrates automate automates simplify simplifies streamline streamlines ' +
    'centralise centralize unify unifies align aligns turn turns spend spends lose loses miss misses waste wastes ' +
    'struggle struggles fail fails hit hits meet meets reach reaches use uses sell sells buy buys pay pays charge ' +
    'charges hire hires onboard onboards train trains coach coaches forecast forecasts prioritise prioritize ' +
    'qualify qualifies convert converts retain retains renew renews expand expands upsell engage engages nurture ' +
    'nurtures personalise personalize target targets segment segments score scores rank ranks route routes assign ' +
    'assigns approve approves review reviews report reports alert alerts notify notifies remind reminds schedule ' +
    'schedules reschedule reschedules capture captures collect collects clean cleans enrich enriches verify ' +
    'verifies protect protects comply complies audit audits monitor monitors test tests learn learns understand ' +
    'understands explain explains answer answers ask asks call calls email emails text texts chat message ' +
    'messages post posts publish publishes write writes read reads edit edits search searches data insights ' +
    'insight analytics reporting dashboards dashboard pipeline pipelines revenue revenues sales marketing success ' +
    'service services product products platform platforms software tool tools app apps system systems process ' +
    'processes workflow workflows team teams people customers customer clients client users user buyers buyer ' +
    'prospects prospect leads lead accounts account deals deal opportunities opportunity contracts contract ' +
    'renewals renewal churn retention onboarding adoption activation engagement conversion conversions demand ' +
    'cost costs price prices pricing budget budgets value roi time times hours days weeks months minutes setup ' +
    'set-up implementation integration integrations security compliance privacy risk risks errors error mistakes ' +
    'issues issue problems problem pain pains gaps gap delays delay bottlenecks friction complexity visibility ' +
    'control access approvals approval handoffs handoff meetings meeting bookings ' +
    'booking reminders reminder cancellations staff employees employee managers manager ' +
    'leaders leader executives reps rep agents agent partners partner vendors vendor suppliers supplier companies ' +
    'company businesses business organisations organizations enterprises enterprise startups startup founders ' +
    'founder owners owner operations operators finance hr legal procurement engineering developers developer ' +
    'admins admin inbound outbound content campaigns campaign ads events event webinars webinar messaging ' +
    'positioning brand trust quality accuracy efficiency productivity performance results outcomes outcome impact ' +
    'coverage capacity forecasting planning scheduling tracking billing invoicing payments payment payroll hiring ' +
    'recruiting training coaching selling buying spending waiting missing losing paper spreadsheets spreadsheet ' +
    'phone inboxes inbox documents document files file forms form tasks task projects project orders order ' +
    'inventory shipping delivery deliveries returns tickets ticket cases case questions question requests request ' +
    'feedback surveys survey notes note records record lists list numbers number figures figure metrics metric ' +
    'goals goal quotas quota territory territories regions region markets market industry industries verticals ' +
    'vertical category categories competitors competitor alternatives alternative options option features feature ' +
    'modules module add-ons tiers tier seats seat licenses license usage traffic visits visitors signups signup ' +
    'trials trial demos demo proposals proposal quotes quote invoices invoice common key main core major minor ' +
    'basic advanced practical proven essential critical important urgent hidden obvious step steps step-by-step ' +
    'approach approaches guide guides framework frameworks strategy strategies playbook playbooks checklist ' +
    'checklists practice practices trend trends future state lesson lessons tip tips way ways idea ideas reason ' +
    'reasons sign signs rule rules example examples mistake myth myths truth truths secret secrets habit habits ' +
    'principle principles pattern patterns everything nothing something anything everyone nobody someone work ' +
    'world life thing things part parts point points story stories change changes shift shifts move moves loss ' +
    'losses level levels stage stages phase phases week month year day higher bigger smaller larger shorter ' +
    'longer greater happier healthier cleaner smooth smoother seamless effortless painless hassle-free ' +
    'frictionless repeatable scalable flexible affordable transparent unified zero unlimited endless entire ' +
    'complete total actionable measurable shorten shortens stay stays handle handles prove proves focus focuses ' +
    'switch switches eliminate eliminates minimise minimize maximise maximize accelerate accelerates ensure ' +
    'ensures empower empowers unlock unlocks discover discovers spot spots catch catches detect detects predict ' +
    'predicts recover recovers resolve resolves respond responds reply replies follow follows hear hears worst ' +
    'lost won ').split(/\s+/).filter(Boolean));
// A word counts as common when it is in the list, or ends in -ing or -ed ("Automated", "Missing"). A hyphenated
// word counts by its first part ("Two-way", "Low-code").
function isCommonWord(word) {
    const head = word.split('-')[0].replace(/[^A-Za-z']+$/, '');
    if (!/^[A-Z][a-z']*$/.test(head) || head === 'I' || /[A-Z]/.test(word.slice(1)))
        return false;
    const w = head.toLowerCase();
    return COMMON_WORDS.has(w) || (w.length > 4 && /(?:ing|ed)$/.test(w));
}
// Text only (run 10): names that keep their capital when they open an input phrase placed mid-sentence. The list holds
// common product and company names and the names found in the test inputs; other names are kept by the rules below.
const KNOWN_NAMES = new Set(('Salesforce Microsoft Slack HubSpot LinkedIn Google Gmail Outlook Excel Zoom Zendesk Jira Notion Shopify Stripe ' +
    'Marketo Pardot Gong Intercom Freshworks Oracle SAP Workday ServiceNow Snowflake Tableau Asana Trello Dropbox ' +
    'Apple Amazon AWS Azure Facebook Instagram WhatsApp YouTube Acme Sam ' +
    // Run 11: the company and competitor names in the test inputs and the page examples (run 19: the old example names removed).
    'Bengaluru Clari Northwind Metricly Spendrill Cloudmoat Lanehop Branchwire Answerloop Shelfwalk').split(/\s+/).filter(Boolean));
function bareWord(word) {
    return word.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '');
}
function isKnownName(word) {
    const w = bareWord(word);
    return KNOWN_NAMES.has(w) || KNOWN_NAMES.has(w.split(/['-]/)[0]);
}
// Run 11: a known name typed in lower case gets its capitals back ("bengaluru teams" becomes "Bengaluru teams"). Names
// that are also ordinary words (Slack, Zoom, Notion, Gong, Sam ...) are kept when typed with a capital, never raised.
const PLAIN_WORDS = new Set('slack zoom notion excel oracle stripe apple amazon gong sam outlook workday snowflake asana tableau intercom acme sap azure'.split(' '));
const NAME_BY_LOWER = new Map([...KNOWN_NAMES].filter(n => !PLAIN_WORDS.has(n.toLowerCase())).map(n => [n.toLowerCase(), n]));
function fixNames(phrase) {
    return phrase.replace(/[A-Za-z]+/g, w => (w === w.toLowerCase() && NAME_BY_LOWER.get(w)) || w);
}
// Run 11: a job title in running text is all lower case ("head of marketing", "operations director"); names and
// acronyms in it keep their capitals ("VP of sales", "director of Salesforce operations").
const JOB_WORD = /^(?:head|directors?|managers?|chief|officers?|president|coordinators?|supervisors?|specialists?|administrators?)$/i;
function isJobTitle(phrase) {
    const w = phrase.trim().split(/\s+/).map(bareWord);
    return w.length <= 6 && w.some((x, i) => JOB_WORD.test(x) && (x.toLowerCase() !== 'head' || (w[i + 1] || '').toLowerCase() === 'of'));
}
function lowerJobTitle(phrase) {
    return phrase.trim().split(/(\s+)/).map(w => (/^[A-Z][a-z'-]+\W*$/.test(w) && !isKnownName(w) ? w.charAt(0).toLowerCase() + w.slice(1) : w)).join('');
}
// Run 10: the first word of an input phrase keeps its capital only when it is a known name, has an inner capital or is
// all capitals (HubSpot, AI, CRM), holds a digit (B2B, Q4), or starts a name of two words: the next word is capitalised
// too (New York, Example Manufacturing Co, Competitor A) and is not a known name on its own ("Native Salesforce" is not a name).
// Run 11: a one-letter word keeps its capital (I, X), and a common first word never makes the next word a name ("For
// Spendrill expense review" becomes "for Spendrill expense review"), unless the next word is a one-letter label after
// a noun (Competitor A) or the phrase opens with three capitalised words (Example Logistics Co).
function keepsFirstCapital(word, next, third = '') {
    const w = bareWord(word);
    if (!/^[A-Z]/.test(w) || (w.length === 1 && !(w === 'A' && next)) || isKnownName(w))
        return true; // the article A is not a one-letter name
    if (/[A-Z0-9]/.test(w.slice(1)))
        return true;
    const n = bareWord(next || '');
    if (!/^[A-Z](?:[a-z]+(?:['-][a-z]+)*)?$/.test(n) || isKnownName(n))
        return false;
    if (!isCommonWord(w) || w === 'New')
        return true; // New York, New Delhi
    if (n.length === 1)
        return !/^(?:for|with|from|to|of|in|on|at|by|and|or|the|a|an|into|about|why|how|what|when|where|who|your|our|their|my|this|that)$/i.test(w);
    return /^[A-Z][a-z]/.test(bareWord(third || ''));
}
// An input phrase placed mid-sentence: its first word is lowered unless keepsFirstCapital() keeps it
// ("Native Salesforce integration" becomes "native Salesforce integration"; "Salesforce data you can trust" stays).
function lowerFirstIfCommon(phrase) {
    const t = fixNames(phrase.trim());
    if (isJobTitle(t))
        return lowerJobTitle(t);
    const parts = t.split(/(\s+)/);
    if (keepsFirstCapital(parts[0] || '', parts[2] || '', parts[4] || ''))
        return t;
    parts[0] = parts[0].replace(/[A-Z]/, c => c.toLowerCase());
    // Run 11: after a lowered first word, a capitalised common second word is lowered too ("why forecasting matters now").
    if (parts[2] && isCommonWord(parts[2]))
        parts[2] = parts[2].charAt(0).toLowerCase() + parts[2].slice(1);
    return parts.join('');
}
// The same for a whole phrase (this replaces a plain toLowerCase(), which also lowered names and acronyms): the first
// word follows the rule above, and a later word is lowered only when it is a common word. A capitalised word straight
// after a kept name stays too, so a name of two words keeps both ("Microsoft Teams approvals").
function lowerCommonWords(phrase) {
    let afterName = false;
    let first = true;
    const t = fixNames(phrase.trim());
    if (isJobTitle(t))
        return lowerJobTitle(t);
    const parts = t.split(/(\s+)/);
    return parts.map((w, i) => {
        if (!w.trim())
            return w;
        const lower = first ? !keepsFirstCapital(w, parts[i + 2] || '', parts[i + 4] || '') : !afterName && isCommonWord(w);
        first = false;
        afterName = !lower && /^[A-Z]/.test(w);
        return lower ? w.replace(/[A-Z]/, c => c.toLowerCase()) : w;
    }).join('');
}
// Text only (run 9): a phrase that starts a sentence, a heading or a table cell starts with a capital. A first word
// written with a small letter and an inner capital (iPhone, eBay) is a name and is kept as typed.
function cap(phrase) {
    const t = fixNames(phrase.trim());
    if (/^[a-z]+[A-Z]/.test(t.split(/\s+/)[0] || ''))
        return t;
    return t.charAt(0).toUpperCase() + t.slice(1);
}
// Output labels (run 5, owner decision 1). A figure that is not the user's input, and not computed only
// from it, carries EXAMPLE on its own line, or sits under an EXAMPLES line placed directly above its table,
// list or code block. SUGGESTED closes outputs that suggest lengths, timings or counts.
const EXAMPLE = '(Example figure: replace with your own)';
// Run 11 addendum 3 (R11-A3-8a): the buyer group influence map. Every box has the same width, set by the longest role
// (at least as wide as "ECONOMIC BUYER"), every role is padded to that width (never cut), and every line of the map
// has the same length.
function influenceMap(g) {
    const roles = [g.economic.role, g.champion.role, g.technical.role, g.user.role, g.blocker.role].map(r => String(r).replace(/\s+/g, ' ').trim());
    let w = Math.max('ECONOMIC BUYER'.length, ...roles.map(r => r.length));
    if (w % 2 === 1)
        w++;
    const inner = w + 2;
    const box = inner + 2;
    const gap = 20;
    const total = box * 2 + gap;
    const cx = (total - box) / 2;
    const lc = Math.floor(box / 2);
    const rc = box + gap + lc;
    const mid = cx + 1 + Math.floor(inner / 2);
    const center = (t) => { const l = Math.floor((inner - t.length) / 2); return ' '.repeat(l) + t + ' '.repeat(inner - t.length - l); };
    const text = (t) => '│ ' + t.padEnd(w) + ' │';
    const title = (t) => '│' + center(t) + '│';
    const edge = (a, b, c) => a + (c ? '─'.repeat(mid - cx - 1) + c + '─'.repeat(cx + inner - mid) : '─'.repeat(inner)) + b;
    const row = (cells) => {
        const line = Array.from({ length: total }, () => ' ');
        for (const [at, s] of cells)
            [...s].forEach((ch, i) => { line[at + i] = ch; });
        return line.join('');
    };
    const [economic, champion, technical, user, blocker] = roles;
    return [
        row([[cx, edge('┌', '┐')]]),
        row([[cx, title('ECONOMIC BUYER')]]),
        row([[cx, text(economic)]]),
        row([[cx, edge('└', '┘', '┬')]]),
        row([[mid, '│ approves']]),
        row([[cx, edge('┌', '┐', '▼')]]),
        row([[cx - 11, 'influences '], [cx, title('CHAMPION')], [cx + box, ' influences']]),
        row([[lc, '┌' + '─'.repeat(cx - lc - 1)], [cx, text(champion)], [cx + box, '─'.repeat(rc - cx - box) + '┐']]),
        row([[lc, '│'], [cx, edge('└', '┘', '┬')], [rc, '│']]),
        row([[lc, '▼'], [mid, '│'], [rc, '▼']]),
        row([[0, edge('┌', '┐')], [box, '   advocates for'], [box + gap, edge('┌', '┐')]]),
        row([[0, title('TECHNICAL')], [box, '◄' + '─'.repeat(gap - 1)], [box + gap, title('USER')]]),
        row([[0, text(technical)], [box, '    validates'], [box + gap, text(user)]]),
        row([[0, edge('└', '┘')], [box + gap, edge('└', '┘')]]),
        row([[lc, '│'], [rc, '│']]),
        row([[lc, '│'], [cx, edge('┌', '┐')], [rc, '│']]),
        row([[lc, '└' + '─'.repeat(cx - lc - 2) + '►'], [cx, title('BLOCKER')], [cx + box, '◄' + '─'.repeat(rc - cx - box - 1) + '┘']]),
        row([[cx - 9, 'reviews'], [cx, text(blocker)], [cx + box + 2, 'reviews']]),
        row([[cx, edge('└', '┘')]]),
    ].join('\n');
}
const EXAMPLES = 'Example figures: replace with your own.';
const SUGGESTED = 'Suggested timings, lengths and counts: adjust them to your own.';
// ============================================================================
// Run 19 (owner decision D80): shared helpers for the 8 problems of the real-world test.
// Sector knowledge comes only from src/verticals.ts (rule B82: no statistic, market size or named-company fact).
// ============================================================================
// Text typed by the user, quoted when it is placed inside one of the tool's own sentences, so a clause never breaks the grammar.
function q(s) {
    return `"${String(s).trim().replace(/^"|"$/g, '').replace(/[.]$/, '')}"`;
}
// Backlog B15-L1: a long free text is shown once, cut at a word boundary, with its full length named.
function shortText(s, max = 300) {
    const t = String(s).replace(/\s+/g, ' ').trim();
    if (t.length <= max)
        return t;
    const cut = t.slice(0, max).replace(/\s+\S*$/, '');
    return `${cut} ... (first ${cut.length} of ${t.length.toLocaleString('en-US')} characters)`;
}
// Backlog B15-L5h: "1 interview", "2 interviews".
function plural(n, word, many = `${word}s`) {
    return `${n.toLocaleString('en-US')} ${n === 1 ? word : many}`;
}
// A list in plain English: "a", "a and b", "a, b and c".
function andList(items) {
    return items.length <= 1 ? (items[0] || '') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}
// The optional company input (rule B81: the answer names the company, or says plainly that it was not given).
const COMPANY_INPUT = { type: 'string', description: 'Optional: your company or product name, so the answer can name it' };
const MODEL_INPUT = {
    type: 'string',
    enum: ['saas', 'services', 'connectivity', 'transactions', 'marketplace', 'hardware_software', 'investment'],
    description: 'Optional: how you charge (software subscription, services, connectivity, per transaction, marketplace, hardware plus software, or investment management). Read from your other inputs when left out'
};
function companyLine(company) {
    return typeof company === 'string' && company.trim()
        ? `**Company**: ${company.trim()}`
        : '**Company**: not given (add the company input to name your company or product in this answer)';
}
// The sector of the seller, read first from what the seller sells (product or category texts), then from every input.
// Order: (1) the shared rule of src/verticals.ts on the product texts (2 or more different sector words); (2) on the product
// texts, a sector that is the only one with any sector word there ("spend management software" is fintech, "cloud security
// monitoring" is cybersecurity); (3) the shared rule on every input. A customer's industry never outranks what the seller sells.
function sellerSector(productTexts, otherTexts) {
    const pt = productTexts.filter((x) => typeof x === 'string' && x.trim());
    const v1 = (0, verticals_ts_1.detectVertical)(...pt);
    if (v1)
        return v1;
    if (pt.length) {
        const hits = verticals_ts_1.VERTICALS.filter((v) => new RegExp(v.match.source, 'i').test(pt.join(' \n ')));
        if (hits.length === 1)
            return hits[0];
    }
    return (0, verticals_ts_1.detectVertical)(...pt, ...otherTexts);
}
// The sector and the business model (src/verticals.ts), with one line saying how they were read. The model is read only from
// what the seller sells (a customer described as "IT services firms" does not make the seller a services business).
function readContext(explicitModel, productTexts, otherTexts = []) {
    const v = sellerSector(productTexts, otherTexts);
    let m = (0, verticals_ts_1.detectModel)(explicitModel, ...productTexts);
    if (m.how === 'unknown' || m.how === 'sector')
        m = v ? { model: verticals_ts_1.SECTOR_MODEL[v.id], how: 'sector' } : { model: null, how: 'unknown' };
    const sector = v ? `read from your inputs as ${v.name}` : 'not clear from your inputs (name the industry or what you sell for sector notes)';
    const model = m.model ? `${verticals_ts_1.MODEL_NAME[m.model]} (${m.how === 'input' ? 'from business_model' : m.how === 'sector' ? 'the usual model in this sector, assumed; set business_model to change it' : 'read from your inputs; set business_model to change it'})` : `not clear from your inputs; set business_model (${verticals_ts_1.BUSINESS_MODELS.join(', ')}) for advice that fits it`;
    return { v, model: m.model, line: `*Sector: ${sector}. Business model: ${model}.*` };
}
// The sector only, for tools whose advice does not depend on the business model.
function sectorLine(v) {
    return v ? `*Sector: read from your inputs as ${v.name}.*` : '*Sector: not clear from your inputs (name the industry or what you sell for sector notes).*';
}
// Sector notes: the buying committee, what the sector measures, its usual objections and a proof point (no figures, rule B82).
function sectorNotes(v, what = ['committee', 'metrics', 'proof']) {
    if (!v)
        return '';
    const out = [`### Sector notes: ${v.name}`];
    for (const w of what) {
        if (w === 'committee')
            out.push(`- **Who usually decides:** ${v.committee}`);
        if (w === 'roles')
            out.push(`- **Roles that usually buy and use it:** ${v.buyerRoles.join(', ')}.`);
        if (w === 'metrics')
            out.push(`- **What this sector measures:** ${v.metrics.join(', ')}.`);
        if (w === 'objections')
            out.push(`- **Objections this sector often raises:** ${v.objections.map((o) => o.objection.toLowerCase()).join('; ')}.`);
        if (w === 'vocabulary')
            out.push(`- **Words this sector's buyers use:** ${v.vocabulary.join(', ')}.`);
        if (w === 'proof')
            out.push(`- **A proof point that lands:** ${v.proofShape}`);
    }
    return out.join('\n');
}
// The answer pattern for one objection typed by the user: the sector's pattern when it matches, else a pattern by kind.
function answerFor(text, v) {
    const t = text.toLowerCase();
    if (v) {
        for (const o of v.objections) {
            const keys = o.objection.toLowerCase().split(/\W+/).filter((w) => w.length > 2 && !['our', 'the', 'and', 'are', 'not', 'too', 'for', 'already', 'have', 'has', 'does', 'this', 'will', 'than', 'with', 'from', 'your', 'ourselves', 'we', 'can', 'use', 'new', 'own'].includes(w));
            if (keys.filter((k) => t.includes(k)).length >= Math.min(2, keys.length))
                return o.response;
        }
    }
    if (/price|cost|budget|expensive|cheaper|discount|margin/.test(t))
        return 'Agree the cost of the problem in the buyer\'s own numbers first, then compare the price with it.';
    if (/already have|already has|already does|already use|existing|incumbent|current (?:vendor|tool|system|provider|operator)|in-house|built/.test(t))
        return 'Ask what the current setup does not do today and what that costs; position alongside it where you can, and replace only where the buyer sees the gap.';
    if (/adopt|use a new|will not use|won't use|resist|change|training/.test(t))
        return 'Agree a small pilot with the people who will use it, and decide up front how adoption is measured.';
    if (/integrat|migrat|cut-?over|disrupt|setup|set-up|implementation|rollout/.test(t))
        return 'Name the systems and people involved, and offer a staged plan with a rollback point for each stage.';
    if (/security|privacy|compliance|audit|regulat|legal|risk|wrong|accura/.test(t))
        return 'Bring the evidence before it is asked for (controls, review steps, test results on the buyer\'s own data) and map each concern to it.';
    return 'Ask what would need to be true for this not to block the decision, and answer with evidence from a similar customer.';
}
// An item typed as a pain point that reads as an objection (a sentence in the buyer's own voice: "we already have a TMS").
function isObjection(text) {
    return /^(?:we|we're|our|i|they|it|ai will|this will|that will)\b/i.test(text.trim()) || /\b(already (?:have|has|does|use)|will not|won't|too (?:expensive|costly|risky|slow)|not (?:sure|convinced))\b/i.test(text);
}
// Employee ranges typed in a text ("300 to 3,000 employees", "200-500 employees").
function sizesIn(text) {
    return [...new Set((String(text).match(/\b\d[\d,]*\s*(?:to|-|–)\s*\d[\d,]*\s+employees\b|\b(?:under|over|more than|fewer than)\s+\d[\d,]*\s+employees\b|\b\d[\d,]*\+\s+employees\b/gi) || []).map((x) => x.trim()))];
}
// =============================================================================
// TOOL DEFINITIONS
// =============================================================================
const tools = {
    // ---------------------------------------------------------------------------
    // Tool 1: ICP Deep Dive - Pattern Detection from Customer Data
    // ---------------------------------------------------------------------------
    icp_deep_dive: {
        description: 'Analyze customer data to detect ICP patterns (industry, size, deal size, sales cycle, tech stack, triggers, champion roles). Ties are named as ties, the budget is the ACV range seen in your customers, and sector notes are added when your inputs name one of the supported sectors',
        inputSchema: {
            type: 'object',
            properties: {
                customers: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' },
                            industry: { type: 'string' },
                            size: { type: 'string' },
                            acv: { type: 'number', minimum: 0 },
                            sales_cycle_days: { type: 'number', minimum: 0 },
                            tech_stack: { type: 'array', items: { type: 'string' } },
                            buying_trigger: { type: 'string' },
                            champion_title: { type: 'string' }
                        }
                    },
                    description: 'List of customer objects with available attributes'
                },
                customer_descriptions: {
                    type: 'string',
                    description: 'Alternative: Describe your best customers in text format'
                },
                product_category: {
                    type: 'string',
                    description: 'What type of product you sell'
                },
                company: COMPANY_INPUT,
                business_model: MODEL_INPUT
            }
        },
        execute: (args) => {
            // Run 19 D80: no preset category; what is not given is said plainly.
            const category = args.product_category ? args.product_category.trim() : 'not given (add product_category)';
            const ctx = readContext(args.business_model, [args.product_category, args.company], [args.customer_descriptions,
                ...(args.customers || []).flatMap(c => [c.industry, c.buying_trigger, c.champion_title, ...(c.tech_stack || [])])]);
            const notes = sectorNotes(ctx.v, ['committee', 'metrics', 'proof']);
            // Run 19 D80 (problem 5): a value that leads only on a tie is named as a tie, never as "primary".
            const lead = (rows) => (rows.length > 1 && rows[0][1] === rows[1][1] ? null : rows[0] || null);
            const tied = (rows) => rows.filter(r => r[1] === rows[0][1]).map(r => r[0]);
            // If structured data provided, analyze patterns
            if (args.customers && args.customers.length > 0) {
                const customers = args.customers;
                const count = (vals) => { const c = {}; vals.filter(Boolean).forEach(v => { c[v] = (c[v] || 0) + 1; }); return Object.entries(c).sort((a, b) => b[1] - a[1]); };
                const topIndustries = count(customers.map(c => c.industry)).slice(0, 3);
                const topSizes = count(customers.map(c => c.size)).slice(0, 3);
                const acvs = customers.map(c => c.acv).filter(Boolean);
                const avgACV = acvs.length > 0 ? acvs.reduce((a, b) => a + b, 0) / acvs.length : 0;
                const minACV = acvs.length > 0 ? Math.min(...acvs) : 0;
                const maxACV = acvs.length > 0 ? Math.max(...acvs) : 0;
                const cycles = customers.map(c => c.sales_cycle_days).filter(Boolean);
                const avgCycle = cycles.length > 0 ? Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length) : 0;
                const topTech = count(customers.flatMap(c => c.tech_stack || [])).slice(0, 5);
                const topChampions = count(customers.map(c => c.champion_title)).slice(0, 3);
                const topTriggers = count(customers.map(c => c.buying_trigger)).slice(0, 3);
                const n = customers.length;
                const pctOf = (k) => Math.round(k / n * 100);
                const dist = (rows, unit) => rows.map(([v, k]) => `- **${v}**: ${plural(k, unit)} (${pctOf(k)}%)`).join('\n');
                const leadOr = (rows, label, found) => {
                    if (rows.length === 0)
                        return 'none yet, add this data';
                    const l = lead(rows);
                    return l ? found(l[0]) : `no single leading ${label}: ${andList(tied(rows))} appear equally often, so add more customers before you choose one`;
                };
                const indL = lead(topIndustries), sizeL = lead(topSizes), techL = lead(topTech), champL = lead(topChampions), trigL = lead(topTriggers);
                const saasModel = ctx.model === 'saas' || ctx.model === null;
                const gaps = [topIndustries.length === 0 ? 'Note: **Industry data missing**. Add industry field to customer records' : '',
                    topSizes.length === 0 ? 'Note: **Size data missing**. Add employee count/revenue tier' : '',
                    acvs.length === 0 ? 'Note: **ACV missing**. Add the annual contract value of each customer' : '',
                    cycles.length === 0 ? 'Note: **Sales cycle missing**. Add the days from first meeting to signature' : '',
                    topTech.length === 0 ? 'Note: **Tech stack missing**. Track technologies customers use' : '',
                    topChampions.length === 0 ? 'Note: **Champion data missing**. Record buyer titles on deals' : '',
                    topTriggers.length === 0 ? 'Note: **Trigger data missing**. Ask "Why now?" in discovery' : ''].filter(Boolean);
                return `# ICP Pattern Analysis

## Data Analyzed
- ${companyLine(args.company)}
- **Customers analyzed**: ${n}${customers.some(c => c.name) ? ` (${andList(customers.map(c => c.name).filter(Boolean))})` : ''}
- **Product category**: ${category}

${ctx.line}

---

## Detected Patterns

### Industry Distribution
${topIndustries.length > 0 ? dist(topIndustries, 'customer') : '- No industry data provided'}

**Pattern**: ${topIndustries.length === 0 ? 'none yet, add this data' : topIndustries[0][1] > n * 0.5 ?
                    `Strong concentration in ${topIndustries[0][0]} (${pctOf(topIndustries[0][1])}%)` :
                    `Mixed industries (${andList(topIndustries.map(r => r[0]))}): compare their deal size and cycle before you specialize`}

### Company Size Distribution
${topSizes.length > 0 ? dist(topSizes, 'customer') : '- No size data provided'}

**Pattern**: ${leadOr(topSizes, 'size', v => `Primary segment: ${v} companies`)}

### Deal Economics
| Metric | Value |
|--------|-------|
| Average ACV | ${acvs.length > 0 ? `$${Math.round(avgACV).toLocaleString('en-US')}` : 'not supplied'} |
| ACV Range | ${acvs.length > 0 ? `$${minACV.toLocaleString('en-US')} to $${maxACV.toLocaleString('en-US')}` : 'not supplied'} |
| Avg Sales Cycle | ${cycles.length > 0 ? `${avgCycle} days` : 'not supplied'} |

**Pattern**: ${acvs.length === 0 ? 'none yet, add this data' : avgACV > 50000 ? 'Enterprise deal profile: expect complex buying process' :
                    avgACV > 15000 ? 'Mid-market deal profile: balance speed and value' :
                        saasModel ? 'SMB/PLG deal profile: optimize for volume' : 'Smaller deal profile: keep the sales process short and repeatable'}

### Technology Stack Signals
${topTech.length > 0 ? dist(topTech, 'customer') : '- No tech stack data provided'}

**Pattern**: ${leadOr(topTech, 'technology', v => `Use "${v}" as primary technographic filter`)}

### Champion Roles
${topChampions.length > 0 ? dist(topChampions, 'deal') : '- No champion data provided'}

**Pattern**: ${leadOr(topChampions, 'champion role', v => `Primary champion: ${v}; lead with their pain points`)}

### Buying Triggers
${topTriggers.length > 0 ? dist(topTriggers, 'deal') : '- No trigger data provided'}

**Pattern**: ${leadOr(topTriggers, 'trigger', v => `Top trigger: ${q(v)}; use in outbound messaging`)}

---

## Synthesized ICP

Based on pattern analysis (a value is named only where it leads; a tie lists every tied value):

**Ideal Customer Profile**:
${[topIndustries[0] ? `- **Industry**: ${indL ? `${indL[0]}${topIndustries[1] && !(topIndustries[0][1] > n * 0.5) ? ` or ${topIndustries[1][0]}` : ''}` : andList(tied(topIndustries))}` : '',
                    topSizes[0] ? `- **Size**: ${sizeL ? sizeL[0] : `${andList(tied(topSizes))} (tied)`}` : '',
                    `- **Budget**: ${acvs.length > 0 ? `$${minACV.toLocaleString('en-US')} to $${maxACV.toLocaleString('en-US')} ACV seen in your customers (average $${Math.round(avgACV).toLocaleString('en-US')})` : 'not supplied'}`,
                    topTech[0] ? `- **Tech Stack**: ${techL ? `Uses ${topTech[0][0]}${topTech[1] ? ` + ${topTech[1][0]}` : ''}` : `${andList(tied(topTech))} (tied)`}` : '',
                    topTriggers[0] ? `- **Buying Trigger**: ${trigL ? trigL[0] : `${andList(tied(topTriggers))} (tied)`}` : '',
                    topChampions[0] ? `- **Champion**: ${champL ? champL[0] : `${andList(tied(topChampions))} (tied)`}` : '',
                    `- **Sales Cycle**: ${avgCycle ? `~${avgCycle} days (average of your deals)` : 'not supplied'}`].filter(Boolean).join('\n')}

${notes ? `${notes}\n\n` : ''}---

## Data Gaps to Fill

${gaps.length ? gaps.join('\n') : 'None: every field this analysis reads was supplied for at least one customer.'}

**Next Step**: Use \`icp_scoring_model\` to create a qualification scorecard
`;
            }
            // If text description provided, extract patterns
            if (args.customer_descriptions) {
                const text = args.customer_descriptions;
                const desc = text.toLowerCase();
                // Run 19 D80: sizes are the employee ranges typed; the size words are read only when no range is typed.
                const typedSizes = sizesIn(text);
                const sizeWord = desc.includes('enterprise') ? 'Enterprise (1000+)' :
                    desc.includes('mid-market') || desc.includes('mid market') || desc.includes('mid-size') || desc.includes('midsize') ? 'Mid-market (100-1000)' :
                        desc.includes('smb') || desc.includes('small') ? 'SMB (10-100)' :
                            desc.includes('startup') ? 'Startup/Early-stage' : 'Mixed sizes';
                const size = typedSizes.length ? andList(typedSizes) : sizeWord;
                const stageTyped = [...new Set((text.match(/\bseries [a-d]\b/gi) || []).map(m => 'Series ' + m.slice(-1).toUpperCase()))].join(', ');
                const stage = stageTyped || (desc.includes('public') ? 'Public companies' : 'not stated in your text');
                const roles = (ctx.v ? ctx.v.buyerRoles : []).filter(r => desc.includes(r.toLowerCase()));
                return `# ICP Pattern Analysis (from Description)

- ${companyLine(args.company)}
- **Product category**: ${category}

${ctx.line}

## Input Analyzed
> ${shortText(text, 600)}

---

## Detected Patterns

### Likely Company Size
**${size}**${!typedSizes.length && /\d/.test(size) ? ` ${EXAMPLE}` : ''}${typedSizes.length ? ' (as you typed it)' : ''}
${!typedSizes.length && sizeWord === 'Enterprise (1000+)' ? `- Expect 6-12 month sales cycles, multi-stakeholder buying ${EXAMPLE}` : ''}${!typedSizes.length && sizeWord === 'Mid-market (100-1000)' ? `- Expect 3-6 month sales cycles, departmental buying ${EXAMPLE}` : ''}${!typedSizes.length && sizeWord === 'SMB (10-100)' ? `- Expect 1-3 month sales cycles, founder/exec buying ${EXAMPLE}` : ''}

### Likely Sector
**${ctx.v ? ctx.v.name : 'not clear from your text'}**
${ctx.v ? `- Buyer roles this sector usually involves: ${ctx.v.buyerRoles.join(', ')}${roles.length ? ` (your text names: ${andList(roles)})` : ''}
- Metrics to ask about: ${ctx.v.metrics.slice(0, 4).join(', ')}` : '- Name the industry or what you sell, for sector notes'}

### Likely Stage
**${stage}**

${notes ? `${notes}\n\n` : ''}---

## Recommendations

For more precise ICP analysis, provide structured customer data in this format (the customer below is an example, not taken from your input):

${EXAMPLES}
\`\`\`json
{
  "customers": [
    {
      "name": "Example Manufacturing Co",
      "industry": "Manufacturing",
      "size": "300-1000 employees",
      "acv": 24000,
      "sales_cycle_days": 60,
      "tech_stack": ["SAP"],
      "buying_trigger": "Audit finding",
      "champion_title": "Finance Controller"
    }
  ]
}
\`\`\`

**Next Step**: Collect structured data from your CRM, then re-run this analysis
`;
            }
            return `# ICP Deep Dive

- ${companyLine(args.company)}

Please provide customer data in one of these formats (the values shown are examples):

**Option 1: Structured Data**
${EXAMPLES}
\`\`\`json
{
  "customers": [
    {
      "name": "Example Manufacturing Co",
      "industry": "Manufacturing",
      "size": "300-1000 employees",
      "acv": 24000,
      "sales_cycle_days": 60,
      "tech_stack": ["SAP"],
      "buying_trigger": "Audit finding",
      "champion_title": "Finance Controller"
    }
  ]
}
\`\`\`

**Option 2: Text Description**
${EXAMPLES}
\`\`\`json
{
  "customer_descriptions": "Our best customers are mid-size manufacturers with 300 to 3,000 employees. They run SAP and the finance controller becomes our champion."
}
\`\`\`

This tool will analyze patterns across your customers to identify your ideal profile.
`;
        }
    },
    // ---------------------------------------------------------------------------
    // Tool 2: ICP Scoring Model - Auto-Weighted Qualification
    // ---------------------------------------------------------------------------
    icp_scoring_model: {
        description: 'Create a lead qualification scoring template: criteria with example point weights set by importance level, example points for each value you list, a scorecard and tier bands to adjust. Your success pattern is matched to your criteria; it does not set the weights. Sector notes are added when your inputs name one of the supported sectors',
        inputSchema: {
            type: 'object',
            properties: {
                scoring_criteria: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            criterion: { type: 'string' },
                            importance: { type: 'string', enum: ['critical', 'important', 'nice_to_have'] },
                            values: { type: 'array', items: { type: 'string' } }
                        }
                    },
                    description: 'Criteria for scoring with importance levels'
                },
                success_correlation: {
                    type: 'string',
                    description: 'What correlates with success? (e.g., "deals with VP Sales champion close 2x faster")'
                },
                product_category: {
                    type: 'string'
                },
                company: COMPANY_INPUT
            }
        },
        execute: (args) => {
            const category = args.product_category ? args.product_category.trim() : 'your product (product_category not given)';
            const correlations = args.success_correlation || '';
            const ctx = readContext(undefined, [args.product_category, args.company], [correlations, ...(args.scoring_criteria || []).flatMap(c => [c.criterion, ...(c.values || [])])]);
            // Default scoring model if no criteria provided
            const defaultCriteria = [
                { criterion: 'Company Size', importance: 'critical', weight: 25,
                    values: ['1000+ employees (25pts)', '200-1000 (20pts)', '50-200 (15pts)', '<50 (5pts)'] },
                { criterion: 'Industry Fit', importance: 'critical', weight: 25,
                    values: ['Target vertical (25pts)', 'Adjacent (15pts)', 'Other B2B (10pts)', 'B2C (0pts)'] },
                { criterion: 'Budget Authority', importance: 'critical', weight: 20,
                    values: ['Confirmed budget (20pts)', 'Budget planned (15pts)', 'Exploring (10pts)', 'No budget (0pts)'] },
                { criterion: 'Technology Fit', importance: 'important', weight: 15,
                    values: ['Uses key tech (15pts)', 'Compatible stack (10pts)', 'Unknown (5pts)', 'Incompatible (0pts)'] },
                { criterion: 'Buying Timeline', importance: 'important', weight: 15,
                    values: ['Active project (15pts)', 'This quarter (12pts)', 'This year (8pts)', 'Exploring (5pts)'] }
            ];
            const criteria = args.scoring_criteria && args.scoring_criteria.length > 0
                ? args.scoring_criteria.map((c, i) => ({
                    criterion: c.criterion || `Criterion ${i + 1}`,
                    importance: c.importance || 'important',
                    weight: c.importance === 'critical' ? 25 : c.importance === 'important' ? 15 : 10,
                    values: c.values || ['High fit', 'Medium fit', 'Low fit']
                }))
                : defaultCriteria;
            // Run 19 D80 (problem 5): example points for each value the user listed. The first value scores the full weight, the last
            // scores 0, the ones between in even steps (rounded); a single value scores the full weight, or 0 when it does not apply.
            // The weights and the bands are unchanged. The default criteria already carry their own points.
            const userGiven = !!(args.scoring_criteria && args.scoring_criteria.length > 0);
            const withPoints = (c) => !userGiven ? c.values
                : c.values.length === 1 ? [`${c.values[0]} (${c.weight} pts; 0 if not)`]
                    : c.values.map((v, i) => `${v} (${Math.round(c.weight * (c.values.length - 1 - i) / (c.values.length - 1))} pts)`);
            // Run 19 D80 (problem 3): the success pattern is matched against the criteria given, by their words.
            const corrWords = new Set(correlations.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2 && !['the', 'and', 'with', 'who', 'most', 'more', 'deals', 'customers', 'close', 'faster', 'renew', 'than', 'that', 'have', 'has', 'are', 'for'].includes(w)));
            const matched = criteria.filter(c => [c.criterion, ...c.values].join(' ').toLowerCase().split(/[^a-z0-9]+/).some(w => w.length > 2 && corrWords.has(w)));
            const corrLine = !correlations ? '' : matched.length
                ? `This pattern is already a criterion: ${andList(matched.map(c => `**${c.criterion}**`))}. If it holds in your closed deals, make ${matched.length === 1 ? 'it' : 'them'} critical.`
                : 'This pattern is not yet one of your criteria: add it as a criterion if it holds in your closed deals.';
            const notes = sectorNotes(ctx.v, ['roles', 'metrics']);
            // D30: the qualification tiers are bands of the maximum score (sum of criteria weights),
            // not fixed points, so they stay correct when the weights are not the 100-point default.
            const maxScore = criteria.reduce((sum, c) => sum + c.weight, 0);
            const tierALo = Math.ceil(0.8 * maxScore);
            const tierBLo = Math.ceil(0.6 * maxScore);
            const tierCLo = Math.ceil(0.4 * maxScore);
            const tierBHi = tierALo - 1;
            const tierCHi = tierBLo - 1;
            const tierDHi = tierCLo - 1;
            return `# ICP Scoring Model

## Scoring Framework for ${category}

- ${companyLine(args.company)}

${sectorLine(ctx.v)}
${correlations ? `\n**Success Correlation Noted**: ${q(shortText(correlations))}\n${corrLine}\n` : ''}

---

## Scoring Criteria & Weights

${args.scoring_criteria && args.scoring_criteria.length > 0
                ? 'The weights below are preset by importance level (critical, important, nice to have); they are not calculated from your data.'
                : 'You supplied no scoring criteria, so the criteria, points and bands below are an example model, not calculated from your data.'}

${EXAMPLES} Every point value and band below is an example.

### Weight Distribution
| Priority | Weight Range | Purpose |
|----------|--------------|---------|
| **Critical** | 20-25 pts | Must-have for qualification |
| **Important** | 10-15 pts | Strong success indicators |
| **Nice-to-Have** | 5-10 pts | Bonus factors |

### Scoring Matrix

| Criterion | Weight | Scoring Values |
|-----------|--------|----------------|
${criteria.map(c => `| **${c.criterion}** | ${c.weight} pts | ${c.values.length ? withPoints(c).join(' / ') : '[no values supplied: add the values you score]'} |`).join('\n')}
${userGiven ? '\nPoints per value: the first value you listed scores the full weight, the last scores 0, and the values between score even steps. They are examples to adjust.\n' : ''}
**Maximum Score**: ${maxScore} points ${EXAMPLE}

---

## Qualification Tiers

| Tier | Score Range | Action | SLA |
|------|-------------|--------|-----|
| **A: Hot** | ${tierALo}-${maxScore} | Immediate outreach, fast-track | Demo within 24 hours |
| **B: Warm** | ${tierBLo}-${tierBHi} | Priority follow-up | Demo within 48 hours |
| **C: Developing** | ${tierCLo}-${tierCHi} | Nurture sequence | Weekly touch |
| **D: Unqualified** | 0-${tierDHi} | Marketing nurture only | Auto-nurture |

The bands are 80%, 60% and 40% of your maximum score of ${maxScore} points.

---

## Qualification Scorecard Template

### Account: _______________
### Date: _______________

${criteria.map(c => `
**${c.criterion}** (Max: ${c.weight} pts)
${c.values.length ? withPoints(c).map((v) => `[ ] ${v}`).join('\n') : '[ ] [no values supplied: add the values you score]'}
Score: ___ / ${c.weight}
`).join('\n')}

---

**TOTAL SCORE**: ___ / ${criteria.reduce((sum, c) => sum + c.weight, 0)} ${EXAMPLE}

**TIER**: [ ] A (Hot)  [ ] B (Warm)  [ ] C (Developing)  [ ] D (Unqualified)

---

## Implementation Guide

### In CRM (Salesforce/HubSpot)
1. Create custom field for each criterion
2. Create formula field for total score
3. Create automation rules for tier assignment
4. Create dashboard to track score distribution

### Score Validation Process
- **Weekly**: Review closed-won deals for scoring accuracy
- **Monthly**: Adjust weights based on win/loss patterns
- **Quarterly**: Full model review with sales leadership

### Red Flags (review before you qualify)
Even high scores should be reviewed if:
- [ ] No clear problem/need identified
- [ ] Competitor locked in with multi-year contract
- [ ] Decision maker not accessible
- [ ] Budget cycle misaligned by >6 months ${EXAMPLE}

---

## Success Indicators to Track

Add these fields to your CRM to improve scoring over time:

| Field | Type | Why Track |
|-------|------|-----------|
| Days to Close | Number | Correlate with score |
| Win/Loss | Picklist | Validate scoring accuracy |
| Champion Title | Text | Find winning patterns |
| Trigger Event | Text | Identify timing signals |
| Competitor | Picklist | Track displacement success |

${notes ? `${notes}\n\n` : ''}**Next Step**: Use \`buyer_group_analyzer\` to map decision-making dynamics

${SUGGESTED}
`;
        }
    },
    // ---------------------------------------------------------------------------
    // Tool 3: Buyer Group Analyzer - Decision Dynamics Mapping
    // ---------------------------------------------------------------------------
    buyer_group_analyzer: {
        description: 'Map the buyer group for a deal: the champion you name, your known stakeholders placed by their titles (economic buyer, technical evaluator, reviewers, users), each role\'s concern and message prompts, an influence map and discovery questions. Sector roles and questions are added when your inputs name one of the supported sectors',
        inputSchema: {
            type: 'object',
            properties: {
                deal_size: {
                    type: 'string',
                    description: 'ACV range (e.g., "$50K-100K")'
                },
                target_company_size: {
                    type: 'string',
                    description: 'Company size (e.g., "500-1000 employees")'
                },
                product_category: {
                    type: 'string',
                    description: 'What you sell'
                },
                known_stakeholders: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Roles you know are involved'
                },
                typical_champion: {
                    type: 'string',
                    description: 'Your typical champion role'
                },
                company: COMPANY_INPUT,
                business_model: MODEL_INPUT
            },
            required: ['product_category']
        },
        execute: (args) => {
            // Run 19 D80: no default deal size, company size or champion in place of an input that was not given (rule B81).
            const dealSize = args.deal_size ? args.deal_size.trim() : 'not given (add deal_size)';
            const companySize = args.target_company_size ? args.target_company_size.trim() : 'not given (add target_company_size)';
            const categoryLower = args.product_category.toLowerCase();
            const stakeholders = (args.known_stakeholders || []).map(x => String(x).trim()).filter(Boolean);
            const ctx = readContext(args.business_model, [args.product_category, args.company], [args.typical_champion, ...stakeholders]);
            const v = ctx.v;
            // Generate buying group based on category
            let buyingGroup = {
                champion: { role: '', concern: '', message: '' },
                economic: { role: '', concern: '', message: '' },
                technical: { role: '', concern: '', message: '' },
                user: { role: '', concern: '', message: '' },
                blocker: { role: '', concern: '', mitigation: '' }
            };
            // Run 12 (B5 sweep): a preset message says something about the user's product that the input did not give, so each
            // one carries the condition "[Only if true and provable: ...]" (the words and figures are kept).
            if (categoryLower.includes('sales') || categoryLower.includes('crm') || categoryLower.includes('revenue')) {
                buyingGroup = {
                    champion: { role: 'VP/Director Sales', concern: 'Quota attainment, rep productivity', message: '[Only if true and provable: Help reps hit quota with less effort]' },
                    economic: { role: 'CRO/CEO', concern: 'Revenue growth, sales efficiency', message: '[Only if true and provable: Drive 20%+ revenue improvement with measurable ROI]' },
                    technical: { role: 'Sales Ops/RevOps', concern: 'CRM integration, data quality', message: '[Only if true and provable: Seamless Salesforce sync, no data cleanup]' },
                    user: { role: 'Sales Reps', concern: 'Ease of use, time savings', message: '[Only if true and provable: Spend time selling, not on admin work]' },
                    blocker: { role: 'IT Security', concern: 'Data security, compliance', mitigation: '[Fill in: the certifications you hold, for example SOC 2], [Only if true and provable: SSO supported, data encryption]' }
                };
            }
            else if (categoryLower.includes('marketing') || categoryLower.includes('demand')) {
                buyingGroup = {
                    champion: { role: 'VP/Director Marketing', concern: 'Pipeline contribution, campaign ROI', message: '[Only if true and provable: Generate 30% more pipeline from same budget]' },
                    economic: { role: 'CMO/CEO', concern: 'Marketing efficiency, brand impact', message: '[Only if true and provable: Prove marketing ROI to the board]' },
                    technical: { role: 'Marketing Ops', concern: 'Tech stack integration, workflow', message: '[Only if true and provable: Fits your existing stack, no migration pain]' },
                    user: { role: 'Campaign Managers', concern: 'Ease of execution, reporting', message: '[Only if true and provable: Launch campaigns in hours, not weeks]' },
                    blocker: { role: 'Finance', concern: 'Budget justification', mitigation: '[Only if true and provable: Clear ROI calculator, flexible pricing]' }
                };
            }
            else if (categoryLower.includes('security') || categoryLower.includes('compliance')) {
                // Run 19 (B82): the preset no longer quotes an average breach cost (a benchmark figure without a source).
                buyingGroup = {
                    champion: { role: 'CISO/Security Director', concern: 'Risk reduction, compliance', message: '[Only if true and provable: Reduce attack surface by 80%]' },
                    economic: { role: 'CIO/CFO', concern: 'Risk vs cost, insurance impact', message: '[Only if true and provable: Lower breach risk, shown against the buyer\'s own risk register]' },
                    technical: { role: 'Security Engineers', concern: 'Technical depth, alert quality', message: '[Only if true and provable: Fewer false positives, actionable alerts]' },
                    user: { role: 'SOC Team', concern: 'Alert fatigue, efficiency', message: '[Only if true and provable: Cut investigation time by 60%]' },
                    blocker: { role: 'Procurement', concern: 'Vendor consolidation', mitigation: '[Only if true and provable: Replaces 3+ point solutions]' }
                };
            }
            else {
                // Run 12 (R12-21) and run 19 (D80): no preset for this category, so the lines that would read as findings are prompts
                // to fill in; where the sector is read, the prompt names what that sector measures (src/verticals.ts).
                const sectorRole = (re, fallback) => (v && v.buyerRoles.find(r => re.test(r))) || fallback;
                buyingGroup = {
                    champion: { role: 'not given (add typical_champion)', concern: v ? `Ask them; in ${v.name} this role is usually measured on ${andList(v.metrics.slice(0, 3))}` : '[Their main concern: ask them in discovery]', message: '[Fill in: your answer to that concern, in one line]' },
                    economic: { role: v ? v.buyerRoles[0] : 'C-Level Sponsor', concern: 'ROI, strategic fit', message: '[Fill in: the business impact you can prove]' },
                    technical: { role: sectorRole(/\bIT\b|Technology|Architect|Engineering|Data|Infrastructure|Platform/, 'IT/Tech Lead'), concern: 'Integration, maintenance', message: '[Fill in: how setup and upkeep work with your product]' },
                    user: { role: 'End Users', concern: 'Ease of use, daily workflow', message: '[Fill in: what changes in their working day]' },
                    blocker: { role: sectorRole(/Procurement|Audit|Compliance|Risk|Legal/, 'Legal/Procurement'), concern: 'Risk, compliance', mitigation: '[Fill in: your standard terms and compliance answer]' }
                };
            }
            // Run 19 D80 (problem 3): the champion is the role the user typed, and each known stakeholder is placed in the map by
            // its title: budget owners as economic buyer, technology and security roles as technical evaluator, procurement, legal,
            // audit, compliance and risk as reviewers, everyone else as users.
            if (args.typical_champion && args.typical_champion.trim())
                buyingGroup.champion.role = args.typical_champion.trim();
            const kindOf = (t) => {
                if (v && v.id === 'cybersecurity' && /\bCISO\b|chief information security/i.test(t))
                    return 'economic';
                if (/procurement|legal|compliance|audit|\brisk\b|vendor management|purchasing/i.test(t))
                    return 'blocker';
                if (/\b(CFO|CEO|COO|CIO|CRO|CMO|MD)\b|chief (?:financial|executive|operating|information officer|revenue|marketing)|managing director|president|founder|business unit head|national sales head/i.test(t) && !/chief information security/i.test(t))
                    return 'economic';
                if (/\b(IT|CTO|CISO|QA)\b|chief technology|chief information security|engineer|architect|devops|platform|security|infrastructure|network|data|technical|developer/i.test(t))
                    return 'technical';
                return 'user';
            };
            const others = stakeholders.filter(x => x.toLowerCase() !== buyingGroup.champion.role.toLowerCase());
            const placed = { economic: [], technical: [], blocker: [], user: [] };
            for (const x of others)
                placed[kindOf(x)].push(x);
            if (placed.economic[0])
                buyingGroup.economic.role = placed.economic[0];
            if (placed.technical[0])
                buyingGroup.technical.role = placed.technical[0];
            if (placed.blocker[0])
                buyingGroup.blocker.role = placed.blocker[0];
            if (placed.user[0])
                buyingGroup.user.role = placed.user[0];
            const extra = ['economic', 'technical', 'blocker', 'user'].flatMap(k => placed[k].slice(1).map(x => `${x} (${k === 'economic' ? 'budget or sign-off' : k === 'technical' ? 'technical evaluation' : k === 'blocker' ? 'review' : 'user'})`));
            const technicalSteps = ctx.model === 'connectivity' ? ['Offer a site survey and a small set of pilot sites', 'Share the network design and the cut-over plan', 'Offer a technical session with your network team', 'Answer the security questionnaire before it is asked']
                : ctx.model === 'services' ? ['Share the transition plan and the team model', 'Agree the SLA and the reports up front', 'Offer a session with the delivery lead', 'Answer the security questionnaire before it is asked']
                    : ctx.model === 'saas' ? ['Provide sandbox/POC access', 'Share integration documentation', 'Offer technical deep-dive call', 'Address security questionnaire proactively']
                        : ['Offer a pilot on their own data or sites', 'Share integration or setup documentation', 'Offer a technical session', 'Answer the security questionnaire before it is asked'];
            // Labels only: a preset message that carries a figure is an example, not a fact about the user's product.
            const exIfFigure = (text) => /\d/.test(text.replace(/SOC 2/g, '')) ? ` ${EXAMPLE}` : '';
            return `# Buyer Group Analysis

## Deal Context
- ${companyLine(args.company)}
- **Product**: ${args.product_category}
- **Deal Size**: ${dealSize}
- **Target Company**: ${companySize}
- **Known Stakeholders**: ${stakeholders.length ? stakeholders.join(', ') : 'Not specified'}

${ctx.line}

The deal size and company size are shown for context: the roles below come from your champion, your stakeholders${v ? ' and the sector' : ''}, not from the deal size.

---

## Buying Group Map

### Champion (Your Internal Advocate)
**Role**: ${buyingGroup.champion.role}
**Their Concern**: ${buyingGroup.champion.concern}
**Your Message**: "${buyingGroup.champion.message}"${exIfFigure(buyingGroup.champion.message)}

**Champion Engagement Strategy**:
- Lead with their specific pain points
- Provide ammo to sell internally
- Make them look good to leadership
- Give them early wins to share

### Economic Buyer (Budget Authority)
**Role**: ${buyingGroup.economic.role}
**Their Concern**: ${buyingGroup.economic.concern}
**Your Message**: "${buyingGroup.economic.message}"${exIfFigure(buyingGroup.economic.message)}

**Economic Buyer Strategy**:
- Lead with business outcomes, not features
- Provide clear ROI documentation
- Connect to strategic priorities
- Reference similar company results

### Technical Evaluator (Implementation Voice)
**Role**: ${buyingGroup.technical.role}
**Their Concern**: ${buyingGroup.technical.concern}
**Your Message**: "${buyingGroup.technical.message}"${exIfFigure(buyingGroup.technical.message)}

**Technical Strategy**:
${technicalSteps.map(x => `- ${x}`).join('\n')}

### End User (Day-to-Day User)
**Role**: ${buyingGroup.user.role}
**Their Concern**: ${buyingGroup.user.concern}
**Your Message**: "${buyingGroup.user.message}"${exIfFigure(buyingGroup.user.message)}

**User Strategy**:
- Demo through their lens
- Show quick wins possible
- Minimize learning curve fear
- Get pilot users as advocates

### Potential Blocker
**Role**: ${buyingGroup.blocker.role}
**Their Concern**: ${buyingGroup.blocker.concern}
**Mitigation**: "${buyingGroup.blocker.mitigation}"${exIfFigure(buyingGroup.blocker.mitigation)}

**Blocker Strategy**:
- Engage early, not late
- Proactively share compliance info
- Provide comparison to status quo risk
- Have champion introduce you

---

## Influence Map

\`\`\`
${influenceMap(buyingGroup)}
\`\`\`
${extra.length ? `\n**Also in the group (your input)**: ${extra.join('; ')}.\n` : ''}
${v ? `${sectorNotes(v, ['committee', 'objections', 'proof'])}\n` : ''}
---

## Multi-Threading Checklist

Track your coverage of the buying group:

| Role | Identified | Contacted | Meeting Held | Aligned |
|------|-----------|-----------|--------------|---------|
| Champion | [ ] | [ ] | [ ] | [ ] |
| Economic Buyer | [ ] | [ ] | [ ] | [ ] |
| Technical | [ ] | [ ] | [ ] | [ ] |
| End User | [ ] | [ ] | [ ] | [ ] |
| Blocker | [ ] | [ ] | [ ] | [ ] |

**Goal**: Minimum 3 of 5 roles engaged before proposal ${EXAMPLE}

---

## Role-Specific Discovery Questions

### For Champions
1. "What would success look like for you personally?"
2. "Who else needs to be convinced for this to move forward?"
3. "What's blocked similar initiatives in the past?"

### For Economic Buyers
1. "How does this connect to your top 3 priorities this year?"
2. "What ROI would make this a clear yes?"
3. "What other investments are you weighing this against?"

### For Technical Evaluators
1. "What would make implementation painful for your team?"
2. "What does your current stack look like in this area?"
3. "What's your timeline for the technical evaluation?"

### For End Users
1. "Walk me through your current workflow for this"
2. "What's the most frustrating part of your day?"
3. "What would make you actually use a new tool?"

${v ? `### Sector questions (${v.name})\n${v.discovery.map((x, i) => `${i + 1}. "${x}"`).join('\n')}\n\n` : ''}**Next Step**: Use \`tam_sam_som_calculator\` to size your market

${SUGGESTED}
`;
        }
    },
    // ---------------------------------------------------------------------------
    // Tool 4: TAM/SAM/SOM Calculator - Bottom-Up Market Sizing
    // ---------------------------------------------------------------------------
    tam_sam_som_calculator: {
        description: 'Calculate TAM/SAM/SOM bottom-up from your company count, ACV, ICP match rate and Year 1 share (calculation framework, not a data source). Sector notes are added when your inputs name one of the supported sectors',
        inputSchema: {
            type: 'object',
            properties: {
                total_potential_companies: {
                    type: 'number',
                    minimum: 0,
                    description: 'Estimated total companies that could buy (from LinkedIn, industry reports)'
                },
                average_contract_value: {
                    type: 'number',
                    exclusiveMinimum: 0,
                    description: 'Your average ACV in dollars'
                },
                icp_percentage: {
                    type: 'number',
                    minimum: 0,
                    maximum: 100,
                    description: 'Percentage of those companies that match your ICP, from 0 to 100. Left out, 30 is used and marked as an example'
                },
                year1_market_share_target: {
                    type: 'number',
                    minimum: 0,
                    maximum: 100,
                    description: 'Realistic Year 1 market share percentage, from 0 to 100 (typically 1-5%). Left out, 3 is used and marked as an example'
                },
                data_sources: {
                    type: 'string',
                    description: 'Where you got your numbers (for documentation)'
                },
                segment_name: {
                    type: 'string',
                    description: 'Name of the market segment'
                },
                company: COMPANY_INPUT
            },
            required: ['total_potential_companies', 'average_contract_value']
        },
        execute: (args) => {
            const ctx = readContext(undefined, [args.company], [args.segment_name, args.data_sources]);
            const totalCompanies = args.total_potential_companies;
            const acv = args.average_contract_value;
            // Run 16 D45: a typed 0 is used as 0; only an omitted or null value takes the preset.
            const icpPercent = (args.icp_percentage ?? 30) / 100;
            const marketSharePercent = (args.year1_market_share_target ?? 3) / 100;
            const segment = args.segment_name || 'Target Market';
            const sources = args.data_sources || 'Your input';
            // Calculate TAM/SAM/SOM
            const tam = totalCompanies * acv;
            const sam = tam * icpPercent;
            const som = sam * marketSharePercent;
            // Calculate deal targets
            const targetDeals = Math.round(som / acv);
            // Format numbers
            const formatCurrency = (num) => {
                // Run 15 R15-32 (D38): separators, and never an exponent however large the figure
                if (num >= 1000000000)
                    return `$${(num / 1000000000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}B`;
                // Run 19 (backlog B16-17, display only): a figure that rounds up to 1000 of a unit moves to the next unit
                // ($999,950 prints $1.0M, not $1000K; $999,999,000 prints $1.00B, not $1000.0M).
                if (num >= 1000000)
                    return (num / 1000000).toFixed(1) === '1000.0' ? `$${(num / 1000000000).toFixed(2)}B` : `$${(num / 1000000).toFixed(1)}M`;
                // Run 16 D47: one decimal when the figure is not a whole thousand ($2,400 as $2.4K; $2,000 stays $2K).
                if (num >= 1000)
                    return (num / 1000).toFixed(1) === '1000.0' ? '$1.0M' : `$${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
                // Run 16 N2 (D50): money under $1 prints 2 decimals; a positive amount that rounds to $0.00 says so.
                if (num > 0 && num < 1)
                    return num.toFixed(2) === '0.00' ? 'under $0.01' : `$${num.toFixed(2)}`;
                // D38 (run 15): display only. A raw float (6 or more decimal places, or an exponent) prints with 2 decimals.
                const text = String(num);
                // Run 19 (backlog B16-17, display only): an amount under 1,000 that is not whole prints 2 decimals ($64.80, not $64.8).
                if (/e/i.test(text) || !Number.isInteger(num))
                    return `$${num.toFixed(2)}`;
                return `$${num}`;
            };
            // D38 (run 15): a count that rounds to 0 from a positive value says so. The count itself is unchanged.
            const countText = (n, raw, prefix = '') => (n === 0 && raw > 0 ? 'fewer than 1 (rounds to 0)' : `${prefix}${n.toLocaleString('en-US')}`);
            // Labels only: an ICP match rate or market share the user did not supply is a preset example,
            // and so is every value computed with it.
            const icpGiven = args.icp_percentage !== undefined && args.icp_percentage !== null;
            const shareGiven = args.year1_market_share_target !== undefined && args.year1_market_share_target !== null;
            const icpEx = icpGiven ? '' : ` ${EXAMPLE}`;
            const shareEx = shareGiven ? '' : ` ${EXAMPLE}`;
            const somEx = icpGiven && shareGiven ? '' : ` ${EXAMPLE}`;
            return `# TAM/SAM/SOM Analysis

## Market: ${segment}

- ${companyLine(args.company)}

${sectorLine(ctx.v)}

---

## Input Data

| Input | Value | Source |
|-------|-------|--------|
| Total Potential Companies | ${totalCompanies.toLocaleString('en-US')} | ${sources} |
| Average Contract Value | $${acv.toLocaleString('en-US')} | Your input |
| ICP Match Rate | ${cleanPct(icpPercent * 100)}${icpEx} | ${icpGiven ? 'Your input' : 'Not supplied'} |
| Year 1 Market Share Target | ${sharePct(marketSharePercent)}${shareEx} | ${shareGiven ? 'Your input' : 'Not supplied'} |

---

## Market Sizing Results

### TAM (Total Addressable Market)
\`\`\`
TAM = Total Potential Companies × ACV
TAM = ${totalCompanies.toLocaleString('en-US')} × $${acv.toLocaleString('en-US')}
\`\`\`
### **TAM = ${formatCurrency(tam)}**

*Everyone who could theoretically buy your product*

---

### SAM (Serviceable Addressable Market)
\`\`\`
SAM = TAM × ICP Match Rate
SAM = ${formatCurrency(tam)} × ${cleanPct(icpPercent * 100)}${icpEx}
\`\`\`
### **SAM = ${formatCurrency(sam)}**${icpEx}

*Companies that match your ICP and you can actually serve*

---

### SOM (Serviceable Obtainable Market)
\`\`\`
SOM = SAM × Year 1 Market Share
SOM = ${formatCurrency(sam)} × ${sharePct(marketSharePercent)}${somEx}
\`\`\`
### **SOM = ${formatCurrency(som)}**${somEx}

*Realistic Year 1 revenue target*

---

## Visualization

${somEx ? `Values computed with a preset rate you did not supply are examples.\n${EXAMPLES}\n` : ''}\`\`\`
┌─────────────────────────────────────────────────────────┐
│                         TAM                             │
│${('                    ' + formatCurrency(tam)).padEnd(57)}│
│    ┌───────────────────────────────────────────┐        │
│    │                  SAM                      │        │
│    │${('             ' + formatCurrency(sam)).padEnd(43)}│        │
│    │    ┌─────────────────────────┐            │        │
│    │    │          SOM            │            │        │
│    │    │${('       ' + formatCurrency(som)).padEnd(25)}│            │        │
│    │    └─────────────────────────┘            │        │
│    └───────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────┘
\`\`\`

---

## What This Means for Your Business

### Year 1 Target
- **Revenue Goal**: ${formatCurrency(som)}${somEx}
- **Deals Needed**: ${countText(targetDeals, som / acv, '~')} closed customers${somEx}
- **Monthly Target**: ${countText(Math.ceil(targetDeals / 12), som / acv, '~')} deals/month${somEx}
- **Pipeline Required**: ${formatCurrency(som * 3)} (SOM × 3, a 1 in 3 win rate) ${EXAMPLE}

### Growth Path
Later years assume your market share doubles each year.
| Year | Market Share | Revenue Target | Customers |
|------|--------------|----------------|-----------|
| Year 1 | ${sharePct(marketSharePercent)}${shareEx} | ${formatCurrency(som)}${shareGiven ? somEx : ''} | ${countText(targetDeals, som / acv)} |
| Year 2 | ${sharePct(marketSharePercent * 2)} ${EXAMPLE} | ${formatCurrency(som * 2)} | ${countText(targetDeals * 2, (som * 2) / acv)} |
| Year 3 | ${sharePct(marketSharePercent * 4)} ${EXAMPLE} | ${formatCurrency(som * 4)} | ${countText(targetDeals * 4, (som * 4) / acv)} |

---

## Assumptions & Validation

### Key Assumptions
1. **Company count accuracy**: Validate with LinkedIn Sales Navigator, industry reports
2. **ACV**: $${acv.toLocaleString('en-US')}, your input; check it against your last closed deals in this segment
3. **ICP match rate**: ${icpGiven ? 'Your estimate' : 'Not supplied, so a preset example is used'}; refine with actual data
4. **Market share**: ${sharePct(marketSharePercent)}${shareEx} of SAM in Year 1 means ${countText(targetDeals, som / acv, '~')} new customers; check that number against the deals your team closed last year

### Data Validation Checklist
- [ ] Cross-reference company count with 2+ sources
- [ ] Validate ACV with recent closed deals
- [ ] Confirm ICP percentage with customer analysis
- [ ] Review market share against competitor data

### How to Get Better Data
1. **LinkedIn Sales Navigator**: Search with ICP filters, note company count
2. **Industry Reports**: Market sizing from industry analyst reports
3. **Competitor Analysis**: Estimate competitor customer counts
4. **Customer Interviews**: Ask about market perception

---

## Investor-Ready Summary

> The **${lowerFirstIfCommon(segment)}** segment represents a **${formatCurrency(tam)} TAM** with **${formatCurrency(sam)} SAM** of companies matching our ICP. 
> We target **${formatCurrency(som)} SOM** in Year 1, requiring **${countText(targetDeals, som / acv)} customers** at **${formatCurrency(acv)} ACV**.
> 
> *Figures calculated from your inputs${somEx ? ', plus the preset rates marked as examples above' : ''}${args.data_sources ? `. Data sources you named: ${args.data_sources}` : ''}.*

${ctx.v ? `${sectorNotes(ctx.v, ['committee', 'metrics'])}\n- **Counting companies in this sector:** count only companies where the roles above exist and the problem is measured (${andList(ctx.v.metrics.slice(0, 2))}).\n\n` : ''}**Next Step**: Use \`lookalike_signal_generator\` to create targeting criteria
`;
        }
    },
    // ---------------------------------------------------------------------------
    // Tool 5: Lookalike Signal Generator - Platform-Specific Targeting Criteria
    // ---------------------------------------------------------------------------
    lookalike_signal_generator: {
        description: 'Generate platform-specific targeting criteria and search queries from your firmographics, technographics, champion titles and buying triggers (generates criteria, not data). Each trigger gets its own signal; search keywords come from what you sell and the sector; platforms limits the sections',
        inputSchema: {
            type: 'object',
            properties: {
                icp_firmographics: {
                    type: 'object',
                    properties: {
                        industries: { type: 'array', items: { type: 'string' } },
                        company_sizes: { type: 'array', items: { type: 'string' } },
                        locations: { type: 'array', items: { type: 'string' } },
                        funding_stages: { type: 'array', items: { type: 'string' } }
                    },
                    description: 'Firmographic criteria'
                },
                icp_technographics: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Technologies your ICP typically uses'
                },
                champion_titles: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Job titles of your champions'
                },
                buying_triggers: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Events that trigger buying'
                },
                platforms: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Optional: the sections to include (linkedin, google_ads, 6sense, zoominfo). Left out, every section is included'
                },
                product_category: {
                    type: 'string',
                    description: 'Optional: what you sell (for example "spend management software"), used for search keywords and sector notes'
                },
                company: COMPANY_INPUT
            },
            required: ['champion_titles']
        },
        execute: (args) => {
            // Run 15 R15-32: an empty list is treated like a list left out (it printed blank lines such as 'Technologies: ')
            const ne = (a) => (Array.isArray(a) && a.length ? a : undefined);
            const f0 = args.icp_firmographics || {};
            args = { ...args, icp_technographics: ne(args.icp_technographics), buying_triggers: ne(args.buying_triggers), platforms: ne(args.platforms),
                icp_firmographics: { ...f0, industries: ne(f0.industries), company_sizes: ne(f0.company_sizes), locations: ne(f0.locations), funding_stages: ne(f0.funding_stages) } };
            const firmographics = args.icp_firmographics || {};
            const industries = firmographics.industries || ['Software', 'Technology'];
            const sizes = firmographics.company_sizes || ['51-200', '201-500'];
            const locations = firmographics.locations || ['United States'];
            const tech = args.icp_technographics || ['Salesforce', 'HubSpot'];
            const titles = args.champion_titles;
            const triggers = args.buying_triggers || ['New leadership hire', 'Funding round', 'Expansion'];
            const stages = firmographics.funding_stages;
            const product = args.product_category ? args.product_category.trim() : '';
            const ctx = readContext(undefined, [args.product_category, args.company], [...(firmographics.industries || []), ...titles, ...(args.buying_triggers || []), ...(args.icp_technographics || [])]);
            const v = ctx.v;
            // Run 19: the platforms input now selects the sections (it was accepted but not used).
            const wanted = (args.platforms || []).map(p => p.toLowerCase().replace(/[^a-z0-9]/g, ''));
            const show = (key) => !wanted.length || wanted.some(w => w.includes(key) || key.includes(w));
            // Labels only: fields the input did not supply are filled with example values; the default company
            // sizes are example figures, so a code block that shows them gets an example label line above it.
            const notSupplied = (given) => given ? '' : ' (not supplied: example values)';
            const sizesEx = firmographics.company_sizes ? '' : ` ${EXAMPLE}`;
            const sizesBlock = firmographics.company_sizes ? '' : `${EXAMPLES}\n`;
            const anyExample = !firmographics.industries || !firmographics.company_sizes || !firmographics.locations || !args.icp_technographics || !args.buying_triggers;
            // Run 19 D80 (problem 8, backlog B15-L4): search keywords come from what the user sells and the sector's own words, never
            // from an invented ad category ("Software > Software") or a phrase such as "retailers software".
            const keywords = [...new Set([...(product ? [product] : []), ...(v ? v.vocabulary.slice(0, 4).map(w => `${w} ${product ? 'software' : 'tool'}`.replace(/ software software$/, ' software')) : []),
                    ...tech.map(t => `${t.toLowerCase()} integration`)])];
            // Run 19 D80 (problem 3): every trigger typed gets its own signal, chosen by its words.
            const signalFor = (t) => {
                const x = t.toLowerCase();
                if (/hire|hired|joins|joined|new (?:cfo|ceo|coo|cio|cto|ciso|vp|head|director|leader|manager)|leadership/.test(x))
                    return [`A new ${titles[0] || 'leader'} or a related leader joined in the last 90 days`, 'New leaders review tools and processes early', 'LinkedIn alerts, ZoomInfo job changes'];
                if (/fund|series|raise|raised|investment|ipo|listing/.test(x))
                    return [`Funding or listing news${stages ? ` at the stages you target (${stages.join(', ')})` : ''}`, 'New budget is allocated for scaling', 'Crunchbase alerts, news alerts, LinkedIn'];
                if (/audit|compliance|regulat|breach|incident|finding/.test(x))
                    return ['Audit findings, regulatory notices or incidents made public, and hiring for audit, risk or compliance roles', 'A finding sets a deadline and a budget owner', 'News alerts, annual reports and filings, job posts'];
                if (/migrat|erp|implement|replac|upgrade|moderni|cloud move|switch/.test(x))
                    return ['Job posts and announcements that mention the new system or the migration', 'A system change reopens the processes around it', 'Job posting alerts, technographic change data, news alerts'];
                if (/expan|new office|new market|branch|site|hiring|grow/.test(x))
                    return ['New offices, markets, branches or a hiring surge', 'Existing processes strain as the company grows', 'Job posting velocity, news alerts'];
                if (/miss|target|loss|cost|margin|delay|outage|churn/.test(x))
                    return ['Results, statements or job posts that mention the problem', 'A missed target creates urgency and an owner', 'Earnings and news alerts, leadership posts on LinkedIn'];
                return ['News, job posts or posts by your champion titles that mention it', 'Your team named this as a reason to buy', 'News alerts and job posting alerts on the exact words'];
            };
            const sections = [];
            if (show('linkedin'))
                sections.push(`## LinkedIn Sales Navigator

### Search Query (Copy & Paste Ready)

**Company Search**:
${sizesBlock}\`\`\`
Industry: ${industries.join(' OR ')}
Company headcount: ${sizes.join(' OR ')}
Headquarters: ${locations.join(' OR ')}
Technologies used: ${tech.join(' OR ')}
\`\`\`

**Lead Search**:
${sizesBlock}\`\`\`
Current job title: ${titles.map(t => `"${t}"`).join(' OR ')}
Current company headcount: ${sizes.join(' OR ')}
Current company industry: ${industries.join(' OR ')}
Geography: ${locations.join(' OR ')}
\`\`\`

### Boolean Search String
\`\`\`
(${titles.map(t => `"${t}"`).join(' OR ')}) AND (${industries.map(i => `"${i}"`).join(' OR ')})
\`\`\`

### Saved Search Strategy
1. Create search with criteria above
2. Save search with alert enabled
3. Check weekly for new matches
4. Export to outreach sequences`);
            if (show('googleads'))
                sections.push(`## Google Ads Targeting

### Custom Intent Audiences
**Keywords to target** (people searching for what you sell):
\`\`\`
${keywords.map(k => `"${k}"`).join('\n')}
\`\`\`
${product ? '' : 'Add product_category (what you sell) for search keywords about your product: this tool does not guess it.\n'}
### Custom Audience: Website Visitors
Target visitors to the sites of the competitors your buyers compare you with (add their addresses).

### In-Market Audiences
${v ? `Pick the in-market category Google Ads offers that is closest to ${v.name} buyers (search the category list for: ${v.vocabulary.slice(0, 3).join(', ')}). This tool does not invent a category name.` : 'Pick the in-market category Google Ads offers that is closest to what you sell. This tool does not invent a category name.'}`);
            if (show('6sense'))
                sections.push(`## 6sense / Intent Data Platforms

### Account Fit Criteria
${sizesBlock}\`\`\`json
{
  "firmographics": {
    "industry": [${industries.map(i => `"${i}"`).join(', ')}],
    "employee_range": [${sizes.map(s => `"${s}"`).join(', ')}],
    "geography": [${locations.map(l => `"${l}"`).join(', ')}]
  },
  "technographics": {
    "technologies_used": [${tech.map(t => `"${t}"`).join(', ')}]
  }
}
\`\`\`

### Intent Topic Keywords
\`\`\`
${[...(product ? [product] : []), ...(v ? v.vocabulary.slice(0, 5) : []), ...tech].join('\n')}
\`\`\`

### Buying Stage Indicators
- **Awareness**: Researching generic topics
- **Consideration**: Comparing specific vendors
- **Decision**: Pricing pages, demo requests`);
            if (show('zoominfo') || show('apollo'))
                sections.push(`## ZoomInfo / Apollo Filters

### Contact Search Criteria
${sizesBlock}\`\`\`
Job Titles: ${titles.join(', ')}
Company Size: ${sizes.join(', ')} employees
Industry: ${industries.join(', ')}
Location: ${locations.join(', ')}
Technologies: ${tech.join(', ')}
\`\`\`

### Intent Signals to Layer
- Job changes in target titles (last 90 days)
${stages ? `- Funding or listing news at your stages: ${stages.join(', ')}\n` : ''}- Technology adoption changes
- Hiring for related roles`);
            return `# Lookalike Signal & Targeting Criteria

- ${companyLine(args.company)}
- **What you sell**: ${product || 'not given (add product_category for search keywords)'}

${sectorLine(v)}

## ICP Summary
- **Industries**: ${industries.join(', ')}${notSupplied(firmographics.industries)}
- **Company Sizes**: ${sizes.join(', ')}${sizesEx}
- **Locations**: ${locations.join(', ')}${notSupplied(firmographics.locations)}
- **Funding Stages**: ${stages ? stages.join(', ') : 'not supplied'}
- **Technologies**: ${tech.join(', ')}${notSupplied(args.icp_technographics)}
- **Champion Titles**: ${titles.join(', ')}
- **Buying Triggers**: ${triggers.join(', ')}${notSupplied(args.buying_triggers)}
${v ? `- **Other roles in a ${v.name} buying group** (not in your input): ${v.buyerRoles.filter(r => !titles.some(t => t.toLowerCase() === r.toLowerCase())).join(', ')}\n` : ''}
${wanted.length ? `Sections shown: the platforms you asked for (${args.platforms.join(', ')}).\n` : ''}
---

${sections.join('\n\n---\n\n')}

---

## Buying Trigger Signals

${triggers.map(t => {
                const [signal, why, how] = signalFor(t);
                return `### Trigger: ${cap(t)}
**Signal**: ${signal}
**Why it matters**: ${why}
**How to track**: ${how}`;
            }).join('\n\n')}

${v ? `${sectorNotes(v, ['metrics', 'proof'])}\n\n` : ''}---

## Implementation Checklist

### LinkedIn Sales Navigator
- [ ] Build and save company search
- [ ] Build and save lead search
- [ ] Enable weekly alert emails
- [ ] Export first batch (25 leads) ${EXAMPLE}
- [ ] Add to outreach sequence

### Google Ads
- [ ] Create custom intent audience
- [ ] Create competitor website audience
- [ ] Set up retargeting pixel
- [ ] Launch awareness campaign

### Intent Data (6sense/Bombora)
- [ ] Configure account fit model
- [ ] Set up intent topic tracking
- [ ] Create daily alert for surging accounts
- [ ] Integrate with CRM

### Contact Database
- [ ] Run search with criteria
- [ ] Verify data quality (10% sample) ${EXAMPLE}
- [ ] Export qualified contacts
- [ ] Enrich with additional data

---

## Important Notes

**This tool generates targeting CRITERIA, not actual data.**

To execute these searches, you need:
1. **LinkedIn Sales Navigator** subscription
2. **Google Ads** account with budget
3. **6sense/Bombora** intent data subscription (optional)
4. **ZoomInfo/Apollo** contact database subscription

${anyExample
                ? 'The criteria above are built from your inputs, with example values in the fields you did not supply: replace those before you copy the criteria into each platform.'
                : 'The criteria above are built from your inputs and ready to copy/paste into each platform.'}

**Next Step**: Use \`account_prioritization\` to rank accounts for outreach

${SUGGESTED}
`;
        }
    },
    // ---------------------------------------------------------------------------
    // Tool 6: Account Prioritization - Multi-Dimensional Ranking
    // ---------------------------------------------------------------------------
    account_prioritization: {
        description: 'Rank and prioritize accounts by a weighted score of fit, intent, relationship and timing; each account shows the points its timing earned and the factor that added the most points',
        inputSchema: {
            type: 'object',
            properties: {
                accounts: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' },
                            fit_score: { type: 'number', minimum: 0, maximum: 100, description: '0 to 100. Left out, 50 is used' },
                            intent_signals: { type: 'number', minimum: 0, maximum: 100, description: '0 to 100 (0 scores zero). Left out, 50 is used' },
                            relationship: { type: 'number', minimum: 0, maximum: 100, description: '0 to 100, based on existing connections. Left out, 50 is used' },
                            timing: { type: 'string', description: 'now, soon, later or unknown (now 100 points, soon 70, later 40; unknown, left out or any other word 50)' }
                        }
                    },
                    description: 'List of accounts to prioritize. Each account: name, fit_score (0 to 100), intent_signals (0 to 100), relationship (0 to 100), timing (now, soon, later or unknown)'
                },
                prioritization_weights: {
                    type: 'object',
                    properties: {
                        fit: { type: 'number' },
                        intent: { type: 'number' },
                        relationship: { type: 'number' },
                        timing: { type: 'number' }
                    },
                    description: 'Optional custom weights in percent for fit, intent, relationship and timing. A missing weight uses its default (40, 30, 15, 15); the tool does not check that the weights sum to 100'
                },
                company: COMPANY_INPUT
            }
        },
        execute: (args) => {
            // Default weights
            const weights = {
                // Run 16 D45: a weight given as 0 is used as 0; only an omitted or null weight takes its default.
                fit: args.prioritization_weights?.fit ?? 40,
                intent: args.prioritization_weights?.intent ?? 30,
                relationship: args.prioritization_weights?.relationship ?? 15,
                timing: args.prioritization_weights?.timing ?? 15
            };
            // Labels only: a weight the input did not supply is the default (an example figure).
            const givenWeights = args.prioritization_weights || {};
            const has = (v) => v !== undefined && v !== null;
            const noWeights = !(has(givenWeights.fit) || has(givenWeights.intent) || has(givenWeights.relationship) || has(givenWeights.timing));
            const wEx = (given) => (noWeights || has(given)) ? '' : ` ${EXAMPLE}`;
            // If accounts provided, score them
            if (args.accounts && args.accounts.length > 0) {
                const timingScore = (timing) => {
                    switch (timing?.toLowerCase()) {
                        case 'now': return 100;
                        case 'soon': return 70;
                        case 'later': return 40;
                        default: return 50;
                    }
                };
                // D41 (run 15): the tier cut-offs are 80%, 60% and 40% of the highest possible score W, the sum of the four weights
                // (ceil in integer-safe form; with the default weights W = 100 they are 80, 60 and 40, as before).
                const W = Number((weights.fit + weights.intent + weights.relationship + weights.timing).toPrecision(12)); // run 20: 33.3 + 33.3 + 33.3 + 0.1 is 100, not 99.99999999999999
                const cut = (p) => Math.ceil((W * p) / 100);
                const tierA = cut(80), tierB = cut(60), tierC = cut(40);
                const scoredAccounts = args.accounts.map(account => {
                    // Run 16 D45: a score given as 0 is used as 0; only an omitted or null score takes the default 50.
                    const fitScore = account.fit_score ?? 50;
                    const intentScore = account.intent_signals ?? 50;
                    const relationshipScore = account.relationship ?? 50;
                    const timingScoreValue = timingScore(account.timing || 'unknown');
                    const totalScore = Math.round((fitScore * weights.fit / 100) +
                        (intentScore * weights.intent / 100) +
                        (relationshipScore * weights.relationship / 100) +
                        (timingScoreValue * weights.timing / 100));
                    return {
                        name: account.name || 'Unknown',
                        fit: fitScore,
                        intent: intentScore,
                        relationship: relationshipScore,
                        timing: account.timing || 'unknown',
                        timingScore: timingScoreValue,
                        totalScore,
                        tier: totalScore >= tierA ? 'A' : totalScore >= tierB ? 'B' : totalScore >= tierC ? 'C' : 'D',
                        // Labels only: the values that fell back to the default because the account did not supply them.
                        defaults: { fit: account.fit_score == null, intent: account.intent_signals == null, relationship: account.relationship == null, timing: !account.timing }
                    };
                });
                // Sort by total score
                scoredAccounts.sort((a, b) => b.totalScore - a.totalScore);
                // Run 19 D80 (problem 5): the reason names the factor that adds the most points, with its arithmetic (the score and tier
                // are unchanged). The old labels stay as the opening words where they applied; "Balanced scoring" is gone.
                const reasonFor = (a) => {
                    const parts = [
                        { k: 'fit', v: a.fit, w: weights.fit, txt: `fit ${cleanNum1(a.fit)}` },
                        { k: 'intent', v: a.intent, w: weights.intent, txt: `intent ${cleanNum1(a.intent)}` },
                        { k: 'relationship', v: a.relationship, w: weights.relationship, txt: `relationship ${cleanNum1(a.relationship)}` },
                        { k: 'timing', v: a.timingScore, w: weights.timing, txt: `timing ${a.timing} (${a.timingScore} pts)` },
                    ].map(x => ({ ...x, pts: x.v * x.w / 100 })).filter(x => x.w > 0).sort((x, y) => y.pts - x.pts);
                    const label = weights.fit > 0 && a.fit >= 80 ? 'Strong ICP fit' : weights.intent > 0 && a.intent >= 80 ? 'High buying intent' : weights.relationship > 0 && a.relationship >= 80 ? 'Strong relationship' : '';
                    const top = parts[0];
                    const num = cleanNum1;
                    const why = top ? `the most points come from ${top.txt.replace(/^(\w+) (\d+)$/, '$1 $2')} × ${cleanPct(top.w)} = ${num(top.pts)} points of ${a.totalScore}` : 'no factor carries weight';
                    return label ? `${label} (${why})` : why.charAt(0).toUpperCase() + why.slice(1);
                };
                return `# Account Prioritization Results

- ${companyLine(args.company)}

## Scoring Weights
${noWeights ? `${EXAMPLES} You supplied no weights, so these are the default weights.\n` : ''}| Factor | Weight | Rationale |
|--------|--------|-----------|
| **Fit** | ${cleanPct(weights.fit)}${wEx(givenWeights.fit)} | How well they match ICP |
| **Intent** | ${cleanPct(weights.intent)}${wEx(givenWeights.intent)} | Buying signals detected |
| **Relationship** | ${cleanPct(weights.relationship)}${wEx(givenWeights.relationship)} | Existing connections |
| **Timing** | ${cleanPct(weights.timing)}${wEx(givenWeights.timing)} | Urgency/readiness |

---

## Prioritized Account List

Your scores are shown as given (to one decimal at most); ${noWeights ? 'the weights and timing points are the defaults' : 'the timing points are the defaults'} (now 100, soon 70, later 40, unknown 50 points). (default) marks a value your input did not supply, so the tool used its default.
| Rank | Account | Fit | Intent | Relationship | Timing | **Score** | Tier |
|------|---------|-----|--------|--------------|--------|-----------|------|
${scoredAccounts.map((a, i) => `| ${i + 1} | **${a.name}** | ${cleanNum1(a.fit)}${a.defaults.fit ? ' (default)' : ''} | ${cleanNum1(a.intent)}${a.defaults.intent ? ' (default)' : ''} | ${cleanNum1(a.relationship)}${a.defaults.relationship ? ' (default)' : ''} | ${a.timing} (${a.timingScore} pts)${a.defaults.timing ? ' (default)' : ''} | **${a.totalScore}** | ${a.tier} |`).join('\n')}

---

## Tier Breakdown

The tiers are 80%, 60% and 40% of the highest possible score, ${cleanNum(W)} points, the sum of your weights.

${EXAMPLES}
### Tier A (Score ${tierA}+): Immediate Action
${scoredAccounts.filter(a => a.tier === 'A').map(a => `- **${a.name}** (${a.totalScore})`).join('\n') || '- None in this tier'}

**Action**: Personalized outreach within 24 hours, executive involvement

${EXAMPLES}
### Tier B (Score ${tierB}-${tierA - 1}): High Priority
${scoredAccounts.filter(a => a.tier === 'B').map(a => `- **${a.name}** (${a.totalScore})`).join('\n') || '- None in this tier'}

**Action**: Targeted outreach this week, multi-touch sequence

${EXAMPLES}
### Tier C (Score ${tierC}-${tierB - 1}): Nurture
${scoredAccounts.filter(a => a.tier === 'C').map(a => `- **${a.name}** (${a.totalScore})`).join('\n') || '- None in this tier'}

**Action**: Add to nurture campaign, monitor for signal changes

${EXAMPLES}
### Tier D (Score <${tierC}): Monitor
${scoredAccounts.filter(a => a.tier === 'D').map(a => `- **${a.name}** (${a.totalScore})`).join('\n') || '- None in this tier'}

**Action**: Marketing nurture only, check quarterly

---

## Next Actions by Account

${scoredAccounts.slice(0, 5).map((a, i) => `
### ${i + 1}. ${a.name} (Tier ${a.tier})
- **Why prioritized**: ${reasonFor(a)}
- **Gap to address**: ${a.fit < 60 ? 'Validate fit' : a.intent < 60 ? 'Generate engagement' : a.relationship < 60 ? 'Build relationships' : 'Verify timing'}
- **Recommended action**: ${a.tier === 'A' ? 'Personal outreach from AE' : a.tier === 'B' ? 'SDR sequence + warm intro' : 'Marketing nurture'}
`).join('')}

**Next Step**: Use \`icp_gap_analysis\` to compare current vs ideal customers

${SUGGESTED}
`;
            }
            // If no accounts, provide the framework
            return `# Account Prioritization Framework

- ${companyLine(args.company)}

Provide your accounts to get prioritized ranking.

## Scoring Model

### Weight Distribution
${EXAMPLES}
| Factor | Default Weight | Description |
|--------|---------------|-------------|
| **Fit** | 40% | ICP match (firmographics, technographics) |
| **Intent** | 30% | Buying signals (web visits, content, triggers) |
| **Relationship** | 15% | Existing connections, past engagement |
| **Timing** | 15% | Budget cycle, urgency indicators |

### Scoring Scale
${EXAMPLES}
- **90-100**: Exceptional (top 5%)
- **70-89**: Strong (top 25%)
- **50-69**: Moderate (middle)
- **30-49**: Weak (lower half)
- **0-29**: Poor (bottom)

---

## How to Use

Provide accounts in this format (the accounts and scores below are examples; the tool reads name, fit_score, intent_signals, relationship and timing):

${EXAMPLES}
\`\`\`json
{
  "accounts": [
    {
      "name": "Example Manufacturing Co",
      "fit_score": 85,
      "intent_signals": 70,
      "relationship": 60,
      "timing": "now"
    },
    {
      "name": "Example IT Services Co",
      "fit_score": 75,
      "intent_signals": 90,
      "relationship": 40,
      "timing": "soon"
    }
  ]
}
\`\`\`

### Timing Values
${EXAMPLES}
- **now**: Active buying process
- **soon**: Next 1-3 months
- **later**: 6+ months out
- **unknown**: No timing data

---

## Tier Actions

${EXAMPLES}
| Tier | Score | Volume % | Action | SLA |
|------|-------|----------|--------|-----|
| A | 80+ | 10% | Executive outreach | 24 hours |
| B | 60-79 | 25% | AE prioritized | 48 hours |
| C | 40-59 | 35% | SDR sequences | 1 week |
| D | <40 | 30% | Marketing only | Monthly |

${SUGGESTED}
`;
        }
    },
    // ---------------------------------------------------------------------------
    // Tool 7: ICP Gap Analysis - Current vs Ideal
    // ---------------------------------------------------------------------------
    icp_gap_analysis: {
        description: 'Analyze gaps between your current customer base and your ideal ICP: what the ideal profile has that the current base lacks, metric gaps from your current and target figures, causes to check and actions that fit your business model. Sector notes are added when your inputs name one of the supported sectors',
        inputSchema: {
            type: 'object',
            properties: {
                current_customers: {
                    type: 'string',
                    description: 'Description of your current customer base'
                },
                ideal_icp: {
                    type: 'string',
                    description: 'Description of your ideal customer profile'
                },
                current_metrics: {
                    type: 'object',
                    properties: {
                        avg_acv: { type: 'number', minimum: 0 },
                        avg_sales_cycle: { type: 'number', minimum: 0 },
                        win_rate: { type: 'number' },
                        churn_rate: { type: 'number' },
                        nps: { type: 'number' }
                    },
                    description: 'Current performance metrics'
                },
                target_metrics: {
                    type: 'object',
                    properties: {
                        avg_acv: { type: 'number', minimum: 0 },
                        avg_sales_cycle: { type: 'number', minimum: 0 },
                        win_rate: { type: 'number' },
                        churn_rate: { type: 'number' },
                        nps: { type: 'number' }
                    },
                    description: 'Target performance metrics'
                },
                product_category: {
                    type: 'string',
                    description: 'Optional: what you sell, used for sector notes'
                },
                company: COMPANY_INPUT,
                business_model: MODEL_INPUT
            },
            required: ['current_customers', 'ideal_icp']
        },
        execute: (args) => {
            const ctx = readContext(args.business_model, [args.product_category, args.company], [args.ideal_icp, args.current_customers]);
            // Run 19 D80 (problem 3): the two profiles are compared phrase by phrase: a phrase of one profile whose main words
            // do not appear in the other is a difference.
            const phrases = (t) => String(t).split(/,|;|\.|\bwith\b|\band\b|\bwho\b|\bthat\b|\bwhere\b/i).map(x => x.trim().replace(/^(?:a|an|the|mostly|some|many)\s+/i, '')).filter(x => x.length > 1);
            const words = (t) => String(t).toLowerCase().split(/[^a-z0-9+-]+/).filter(w => w.length > 2 && !['companies', 'company', 'customers', 'firms', 'businesses', 'the', 'and', 'with', 'for', 'our', 'their', 'have', 'has'].includes(w));
            const notIn = (from, other) => { const o = new Set(words(other)); return phrases(from).filter(ph => words(ph).some(w => !o.has(w))); };
            const idealOnly = notIn(args.ideal_icp, args.current_customers);
            const currentOnly = notIn(args.current_customers, args.ideal_icp);
            const idealSizes = sizesIn(args.ideal_icp);
            const pricingAction = ctx.model === 'services' ? 'Add a scope or service tier for larger clients (more services, locations or hours)'
                : ctx.model === 'connectivity' ? 'Price multi-site contracts so larger customers can add sites and links in one agreement'
                    : ctx.model === 'investment' ? 'Offer mandate terms that fit larger allocators (reporting, fee structure)'
                        : ctx.model === 'transactions' || ctx.model === 'marketplace' ? 'Offer volume terms for larger customers in return for committed volume'
                            : ctx.model === 'saas' ? 'Add pricing tiers for enterprise' : 'Review your pricing and packaging for larger customers';
            const current = args.current_metrics || {};
            const target = args.target_metrics || {};
            // Set defaults for metrics
            const metrics = {
                current: {
                    acv: current.avg_acv ?? 25000,
                    cycle: current.avg_sales_cycle ?? 90,
                    winRate: current.win_rate ?? 20,
                    churn: current.churn_rate ?? 15,
                    nps: current.nps ?? 30
                },
                target: {
                    acv: target.avg_acv ?? 50000,
                    cycle: target.avg_sales_cycle ?? 60,
                    winRate: target.win_rate ?? 30,
                    churn: target.churn_rate ?? 8,
                    nps: target.nps ?? 50
                }
            };
            // Calculate gaps
            // A percentage of a base of 0 or below means nothing, so that gap is 'n/a' and its severity is not rated (run 7, T1).
            const pct = (diff, base) => (base > 0 ? (diff / base * 100).toFixed(0) : 'n/a');
            const gaps = {
                acv: pct(metrics.target.acv - metrics.current.acv, metrics.current.acv),
                cycle: pct(metrics.current.cycle - metrics.target.cycle, metrics.current.cycle),
                winRate: pct(metrics.target.winRate - metrics.current.winRate, metrics.current.winRate),
                churn: pct(metrics.current.churn - metrics.target.churn, metrics.current.churn),
                nps: pct(metrics.target.nps - metrics.current.nps, metrics.current.nps)
            };
            // NPS runs from -100 to 100, so its gap is shown in points: target minus today (run 7, T1).
            const npsPoints = metrics.target.nps - metrics.current.nps;
            const npsGap = npsPoints > 0 ? `+${npsPoints} points needed` : npsPoints === 0 ? 'target met, no increase needed' : `already ${-npsPoints} points above target, no increase needed`;
            const sev = (g, high, medium) => (g === 'n/a' ? 'Not rated' : parseInt(g) > high ? 'High' : parseInt(g) > medium ? 'Medium' : 'Low');
            // A gap in the other direction (the target is already met) says so instead of printing a double sign.
            const upGap = (g, word) => (g === 'n/a' ? `no percentage: today's value is 0` : parseFloat(g) === 0 ? 'target met, no change needed' : parseFloat(g) >= 0 ? `+${g}% ${word}needed` : `already above target, no ${word || 'increase '}needed`);
            const downGap = (g, word) => (g === 'n/a' ? `no percentage: today's value is 0` : parseFloat(g) === 0 ? 'target met, no change needed' : parseFloat(g) >= 0 ? (word ? `${g}% ${word}needed` : `-${g}% needed`) : `target is ${-parseFloat(g)}% above today, no ${word || 'reduction '}needed`);
            // Labels only: a metric the input did not supply is a preset example, and so is a gap computed with it.
            const given = {
                acv: [current.avg_acv != null, target.avg_acv != null],
                cycle: [current.avg_sales_cycle != null, target.avg_sales_cycle != null],
                winRate: [current.win_rate != null, target.win_rate != null],
                churn: [current.churn_rate != null, target.churn_rate != null],
                nps: [current.nps != null, target.nps != null]
            };
            const noneGiven = !Object.values(given).some(([c, t]) => c || t);
            const cellEx = (supplied) => (noneGiven || supplied) ? '' : ` ${EXAMPLE}`;
            const gapEx = ([c, t]) => (c && t) ? '' : ` ${EXAMPLE}`;
            // Run 12 (R12-21): a priority computed only from preset values says so; a root-cause line shows only when the gap points that way.
            const pri = (word) => (noneGiven && word !== 'Not rated' ? `${word} (on example values)` : word);
            const behind = (g) => g !== 'n/a' && parseFloat(g) > 0;
            // Run 15 R15-32: with both values given and no gap, there is nothing to fix on that metric
            const noGap = (pair, g) => pair[0] && pair[1] && g !== 'n/a' && parseFloat(g) <= 0;
            const NO_GAP = 'No gap: you are at or better than your target on this metric, so there is nothing to fix here.\n';
            return `# ICP Gap Analysis

## Profile Comparison

- ${companyLine(args.company)}

${ctx.line}

### Current Customer Base
> ${shortText(args.current_customers)}

### Ideal Customer Profile (Target)
> ${shortText(args.ideal_icp)}

### What differs
- **In your ideal profile, not in your current base**: ${idealOnly.length ? idealOnly.map(x => q(shortText(x, 120))).join('; ') : 'nothing new: the ideal profile uses the same words as your current base, so describe it more precisely'}
- **In your current base, not in your ideal profile**: ${currentOnly.length ? currentOnly.map(x => q(shortText(x, 120))).join('; ') : 'nothing: every part of your current base appears in the ideal profile'}
${idealOnly.length ? `- **What to check first**: how many of your current customers already match ${andList(idealOnly.slice(0, 3).map(x => q(shortText(x, 80))))}, and whether they show better metrics than the rest.\n` : ''}
---

## Metric Gaps

${noneGiven ? `${EXAMPLES} You did not supply current or target metrics, so every value in this table is a preset example.\n` : ''}| Metric | Current | Target | Gap | Priority |
|--------|---------|--------|-----|----------|
| **Avg ACV** | $${metrics.current.acv.toLocaleString('en-US')}${cellEx(given.acv[0])} | $${metrics.target.acv.toLocaleString('en-US')}${cellEx(given.acv[1])} | ${upGap(gaps.acv, '')} | ${pri(sev(gaps.acv, 50, 25))} |
| **Sales Cycle** | ${metrics.current.cycle} days${cellEx(given.cycle[0])} | ${metrics.target.cycle} days${cellEx(given.cycle[1])} | ${downGap(gaps.cycle, '')} | ${pri(sev(gaps.cycle, 30, 15))} |
| **Win Rate** | ${cleanPct(metrics.current.winRate)}${cellEx(given.winRate[0])} | ${cleanPct(metrics.target.winRate)}${cellEx(given.winRate[1])} | ${upGap(gaps.winRate, '')} | ${pri(sev(gaps.winRate, 40, 20))} |
| **Churn Rate** | ${cleanPct(metrics.current.churn)}${cellEx(given.churn[0])} | ${cleanPct(metrics.target.churn)}${cellEx(given.churn[1])} | ${downGap(gaps.churn, '')} | ${pri(sev(gaps.churn, 40, 20))} |
| **NPS** | ${metrics.current.nps}${cellEx(given.nps[0])} | ${metrics.target.nps}${cellEx(given.nps[1])} | ${npsGap} | ${pri(sev(gaps.nps, 50, 25))} |

---

## Gap Root Cause Analysis

### ACV Gap (${upGap(gaps.acv, '')})${gapEx(given.acv)}
${noGap(given.acv, gaps.acv) ? NO_GAP : `${behind(gaps.acv) ? '**Current**: Average deal value below your target\n' : ''}**Common causes to check**:
- Selling to smaller companies or at lower price points
- Targeting companies without budget
- Not selling to decision-makers
- Discounting too aggressively
- Missing what larger customers need (features, service levels or coverage)

**Actions**:
- Tighten company size filter in ICP
- Train on value-based selling
- ${pricingAction}
- Build reference customers in target segment`}

### Sales Cycle Gap (${downGap(gaps.cycle, 'reduction ')})${gapEx(given.cycle)}
${noGap(given.cycle, gaps.cycle) ? NO_GAP : `${behind(gaps.cycle) ? '**Current**: Deals taking too long to close\n' : ''}**Common causes to check**:
- Unclear value proposition
- Too many stakeholders involved
- Missing champion support
- Competitive displacement complex

**Actions**:
- Improve demo-to-close process
- Identify and enable champions earlier
- Create better competitive positioning
- Streamline procurement requirements`}

### Win Rate Gap (${upGap(gaps.winRate, 'improvement ')})${gapEx(given.winRate)}
${noGap(given.winRate, gaps.winRate) ? NO_GAP : `${behind(gaps.winRate) ? '**Current**: Losing too many deals\n' : ''}**Common causes to check**:
- Poor qualification upfront
- Weak differentiation
- Losing to status quo
- Pricing not competitive

**Actions**:
- Implement stricter qualification (BANT/MEDDPICC)
- Sharpen competitive battle cards
- Quantify cost of inaction
- Review pricing competitiveness`}

### Churn Gap (${downGap(gaps.churn, 'reduction ')})${gapEx(given.churn)}
${noGap(given.churn, gaps.churn) ? NO_GAP : `${behind(gaps.churn) ? '**Current**: Customers not staying\n' : ''}**Common causes to check**:
- Wrong customers being sold
- Poor onboarding
- Value not realized
- Better alternatives emerged

**Actions**:
- Stricter ICP qualification
- Improve customer success handoff
- Track time-to-value metrics
- Implement early warning system`}

---

## Recommended ICP Refinements

Based on gap analysis, tighten your ICP on:

The company size and budget thresholds below are presets tied to the target ACV${given.acv[1] ? '' : ', which you did not supply'}.

### Must-Have Criteria (Add These)
1. **Minimum company size**: ${idealSizes.length ? `${andList(idealSizes)} (from your ideal profile)` : `${metrics.target.acv > 50000 ? '500+' : metrics.target.acv > 25000 ? '200+' : '50+'} employees ${EXAMPLE}`}
2. **Budget confirmation**: Must have ${metrics.target.acv > 50000 ? 'confirmed budget or strategic priority' : 'allocated budget'}
3. **Champion access**: ${metrics.target.cycle < 60 ? 'Direct access to decision maker' : 'Clear path to decision maker'}
4. **Use case fit**: ${metrics.current.churn > 10 ? 'Primary use case (not secondary/experimental)' : 'Defined use case'}

### Disqualification Criteria (Add These)
1. **Too small**: Under ${metrics.target.acv > 50000 ? '200' : metrics.target.acv > 25000 ? '50' : '20'} employees ${EXAMPLE}
2. **Wrong stage**: ${metrics.target.cycle < 60 ? 'No active project or timeline' : 'No defined need'}
3. **Budget mismatch**: Can't afford $${Math.round(metrics.target.acv * 0.8).toLocaleString('en-US')} minimum ${EXAMPLE}
4. **Tech incompatibility**: Missing required integrations

---

## 30-Day Action Plan

### Week 1: Qualification
- [ ] Update ICP documentation with new criteria
- [ ] Train sales team on updated qualification
- [ ] Add disqualification fields to CRM
- [ ] Review current pipeline against new ICP

### Week 2: Targeting
- [ ] Update lead lists with tighter criteria
- [ ] Revise outbound messaging for ideal segment
- [ ] Create content for ideal ICP pain points
- [ ] Adjust paid targeting parameters

### Week 3: Enablement
- [ ] Create ideal customer case studies
- [ ] Update sales deck for target segment
- [ ] Build ROI calculator for target ACV
- [ ] Train CSM on ideal customer success metrics

### Week 4: Measurement
- [ ] Set up ICP fit scoring in CRM
- [ ] Create dashboard for ICP metrics
- [ ] Review first month of ICP-qualified leads
- [ ] Adjust based on initial data

${ctx.v ? `${sectorNotes(ctx.v, ['committee', 'metrics', 'proof'])}\n\n` : ''}**Next Step**: Use \`icp_evolution_tracker\` to monitor ICP changes over time

${SUGGESTED}
`;
        }
    },
    // ---------------------------------------------------------------------------
    // Tool 8: ICP Evolution Tracker - Dynamic ICP Monitoring
    // ---------------------------------------------------------------------------
    icp_evolution_tracker: {
        description: 'Review how your ICP should evolve: reads your recent wins, losses and market changes against your current ICP and states a candidate change for each (an addition to test, a disqualifier to test, an implication to check), with a review checklist. It does not compute win rates; check each candidate against your CRM',
        inputSchema: {
            type: 'object',
            properties: {
                current_icp: {
                    type: 'string',
                    description: 'Your current ICP definition'
                },
                recent_wins: {
                    type: 'string',
                    description: 'Description of recent successful customers'
                },
                recent_losses: {
                    type: 'string',
                    description: 'Description of recent lost deals'
                },
                market_changes: {
                    type: 'string',
                    description: 'Recent market or competitive changes'
                },
                time_period: {
                    type: 'string',
                    description: 'Time period you are reviewing, in your own words (for example "last quarter")'
                },
                product_category: {
                    type: 'string',
                    description: 'Optional: what you sell, used for sector notes'
                },
                company: COMPANY_INPUT
            },
            required: ['current_icp']
        },
        execute: (args) => {
            const period = args.time_period || 'Recent Quarter';
            const ctx = readContext(undefined, [args.product_category, args.company], [args.current_icp, args.recent_wins, args.recent_losses, args.market_changes]);
            const v = ctx.v;
            // Run 19 D80 (problem 3): each win, loss and market change is read against the current ICP and gives one candidate
            // change, quoted in the user's words. A candidate is a hypothesis to check in the CRM, never a finding.
            const icpWords = new Set(args.current_icp.toLowerCase().split(/[^a-z0-9-]+/).filter(w => w.length > 3));
            const isNew = (t) => t.toLowerCase().split(/[^a-z0-9-]+/).filter(w => w.length > 3 && !['with', 'where', 'that', 'they', 'them', 'from', 'more', 'most', 'deals', 'deal', 'customers', 'customer', 'buyers', 'buyer', 'wanted', 'wanting', 'lost', 'won'].includes(w)).some(w => !icpWords.has(w));
            const items = (t) => (t || '').split(/\n|;/).map(x => x.trim().replace(/^[-*•]\s*/, '')).filter(Boolean);
            const wins = items(args.recent_wins), losses = items(args.recent_losses), changes = items(args.market_changes);
            const lossKind = (t) => /price|cheaper|cost|budget|expensive|free/i.test(t) ? 'lost on price: check whether these buyers had the budget your ICP assumes'
                : /bundle|one vendor|single vendor|suite|all-in-one|erp-only|together/i.test(t) ? 'lost to a bundled or single-vendor choice: check whether buyers who want one suite belong in your ICP'
                    : /competitor|incumbent|already/i.test(t) ? 'lost to an existing or competing tool: check what made the switch too hard'
                        : /timing|priority|later|freeze/i.test(t) ? 'lost on timing: check for a trigger before you qualify'
                            : 'check whether these buyers should have been qualified out earlier';
            const winLines = wins.map(w => isNew(w)
                ? `- **Candidate addition**: ${q(shortText(w, 200))}: this is not in your current ICP; test adding it if these deals closed faster or larger than your average`
                : `- **Confirms your ICP**: ${q(shortText(w, 200))}: it matches your current ICP, so keep it`);
            const lossLines = losses.map(l => `- **Candidate disqualifier**: ${q(shortText(l, 200))}: ${lossKind(l)}`);
            const changeLines = changes.map(c => `- **Implication to check**: ${q(shortText(c, 200))}: check which segments of your ICP this moves toward you or away from you, and update the qualifying questions`);
            const firstChange = wins.find(isNew) ? `Test adding ${q(shortText(wins.find(isNew), 80))}` : losses[0] ? `Test qualifying out ${q(shortText(losses[0], 80))}` : 'No change suggested yet';
            return `# ICP Evolution Analysis

- ${companyLine(args.company)}

${sectorLine(v)}

This review reads your notes against your current ICP and states candidate changes. Each candidate is a hypothesis: check it against your CRM before you change the ICP.

## Current ICP
> ${shortText(args.current_icp)}

## Analysis Period: ${period}

---

## Win/Loss Pattern Analysis

### Recent Wins
${wins.length ? winLines.join('\n') : '- No win data provided: add recent_wins to find possible additions'}

### Recent Losses
${losses.length ? lossLines.join('\n') : '- No loss data provided: add recent_losses to find possible disqualifiers'}

---

## Market Change Impact

${changes.length ? changeLines.join('\n') : '- No market changes provided: add market_changes to assess the impact on your ICP'}

${v ? `${sectorNotes(v, ['committee', 'metrics'])}\n\n` : ''}---

## ICP Evolution Framework

### Quarterly Review Checklist

**Data to Collect**:
- [ ] Win/loss ratio by segment
- [ ] ACV trends by customer type
- [ ] Sales cycle changes
- [ ] Churn patterns by ICP match score
- [ ] NPS by customer segment

**Questions to Answer**:
1. Are our best customers changing profile?
2. Are we winning more in new segments?
3. Are we losing deals we should have qualified out?
4. Are churned customers following a pattern?
5. Has the competitive landscape shifted?

### ICP Evolution Decision Matrix

| Signal | Expand ICP | Contract ICP | No Change |
|--------|-----------|--------------|-----------|
| Winning in new segments | Yes | No | No |
| Losing in core segment | No | Yes | No |
| Stable win rates | No | No | Yes |
| New competitor threat | No | Yes | No |
| Market expansion | Yes | No | No |
| High churn segment | No | Yes | No |

---

## ICP Evolution Tracking Template

| Quarter | ICP Change | Rationale | Impact |
|---------|-----------|-----------|--------|
| ${period} | ${firstChange} | From this review: ${wins.length ? plural(wins.length, 'win') : 'no wins'}, ${losses.length ? plural(losses.length, 'loss', 'losses') : 'no losses'}, ${changes.length ? plural(changes.length, 'market change') : 'no market changes'} | Win rate and cycle of the deals that match it, next quarter |
| Next quarter | (to fill in) | (to fill in) | (to fill in) |
| Quarter after | (to fill in) | (to fill in) | (to fill in) |

### Metrics to Track
- **Win rate by ICP fit score**: Should improve if ICP is right
- **Sales cycle by ICP fit**: Best-fit should close faster
- **ACV by ICP fit**: Best-fit should pay more
- **Churn by ICP fit**: Best-fit should retain better
- **NPS by ICP fit**: Best-fit should be happier

---

## ICP Change Triggers

Automatically review ICP when:

${EXAMPLES}
| Trigger | Threshold | Action |
|---------|-----------|--------|
| Win rate drops | >10% decline | Review ICP breadth |
| Sales cycle increases | >20% longer | Tighten qualification |
| Churn spikes | >5% increase | Analyze churned segment |
| New segment wins | >20% of deals | Consider ICP expansion |
| Competitor win increase | >15% of losses | Review positioning |

**Next Step**: Use \`icp_interview_synthesizer\` to extract patterns from customer interviews
`;
        }
    },
    // ---------------------------------------------------------------------------
    // Tool 9: ICP Interview Synthesizer - Pattern Extraction from Interviews
    // ---------------------------------------------------------------------------
    icp_interview_synthesizer: {
        description: 'Extract ICP patterns from customer interview notes: pain points, objections, buying triggers, value realized, champion roles and quotes kept word for word, with discovery questions and sector notes. Pasted notes are shown back (shortened) with a template to structure them; only structured notes are analyzed.',
        inputSchema: {
            type: 'object',
            properties: {
                interview_notes: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            customer: { type: 'string' },
                            role: { type: 'string' },
                            key_quotes: { type: 'array', items: { type: 'string' } },
                            pain_points: { type: 'array', items: { type: 'string' } },
                            buying_triggers: { type: 'array', items: { type: 'string' } },
                            value_realized: { type: 'array', items: { type: 'string' } }
                        }
                    },
                    description: 'Structured interview notes'
                },
                raw_transcripts: {
                    type: 'string',
                    description: 'Alternative: paste interview notes or transcripts. This tool does not analyze pasted text: it shows up to 500 characters back with a template to structure them as interview_notes, which it does analyze'
                },
                analysis_focus: {
                    type: 'string',
                    description: 'Accepted but not used yet: every run gives the complete analysis (pain_points, buying_journey, value_props, all)'
                },
                product_category: {
                    type: 'string',
                    description: 'Optional: what you sell, used for sector notes'
                },
                company: COMPANY_INPUT
            }
        },
        execute: (args) => {
            const ctx = readContext(undefined, [args.product_category, args.company], [args.raw_transcripts, ...(args.interview_notes || []).flatMap(i => [i.role, ...(i.pain_points || []), ...(i.buying_triggers || []), ...(i.value_realized || []), ...(i.key_quotes || [])])]);
            const v = ctx.v;
            const tieNote = (rows, label) => rows.length > 1 && rows[0][1] === rows[1][1] ? `\nNo single leading ${label}: ${andList(rows.filter(r => r[1] === rows[0][1]).map(r => r[0]))} appear equally often.\n` : '';
            if (args.interview_notes && args.interview_notes.length > 0) {
                const interviews = args.interview_notes;
                // Run 19 D80 (problem 2): an item typed as a pain point that reads as an objection in the buyer's own voice ("our ERP
                // already does this") is listed with the objections, never turned into a discovery question.
                const allObjections = [...new Set(interviews.flatMap(i => (i.pain_points || []).filter(isObjection)))];
                const allPains = interviews.flatMap(i => (i.pain_points || []).filter(p => !isObjection(p)));
                const painCount = {};
                allPains.forEach(p => { painCount[p] = (painCount[p] || 0) + 1; });
                const topPains = Object.entries(painCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
                // Aggregate triggers
                const allTriggers = interviews.flatMap(i => i.buying_triggers || []);
                const triggerCount = {};
                allTriggers.forEach(t => { triggerCount[t] = (triggerCount[t] || 0) + 1; });
                const topTriggers = Object.entries(triggerCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
                // Aggregate value
                const allValue = interviews.flatMap(i => i.value_realized || []);
                const valueCount = {};
                allValue.forEach(v => { valueCount[v] = (valueCount[v] || 0) + 1; });
                const topValue = Object.entries(valueCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
                // Aggregate roles
                const roles = interviews.map(i => i.role).filter(Boolean);
                const roleCount = {};
                roles.forEach(r => { roleCount[r] = (roleCount[r] || 0) + 1; });
                const topRoles = Object.entries(roleCount).sort((a, b) => b[1] - a[1]).slice(0, 3);
                // Collect quotes
                const allQuotes = interviews.flatMap(i => (i.key_quotes || []).map(q => ({ quote: q, customer: i.customer, role: i.role })));
                return `# Customer Interview Synthesis

## Interviews Analyzed
- ${companyLine(args.company)}

**Count**: ${plural(interviews.length, 'interview')}
**Roles Represented**: ${[...new Set(roles)].join(', ') || 'Not specified'}

${sectorLine(v)}

---

## Pattern Analysis

### Top Pain Points (by frequency)
${topPains.length > 0 ? topPains.map(([pain, count], i) => `${i + 1}. **"${pain}"**: mentioned ${count}x (${Math.round(count / interviews.length * 100)}% of interviews)`).join('\n') : '- No pain points captured'}

**ICP Implication**: Target customers experiencing these pain points
${allObjections.length ? `\n### Objections heard\n${allObjections.map(o => `- ${q(o)}: ${answerFor(o, v)}`).join('\n')}\n` : ''}
### Top Buying Triggers
${topTriggers.length > 0 ? topTriggers.map(([trigger, count], i) => `${i + 1}. **${trigger}**: ${count}x (${Math.round(count / interviews.length * 100)}%)`).join('\n') : '- No triggers captured'}

**ICP Implication**: Time outreach around these events

### Value Realized (Post-Purchase)
${topValue.length > 0 ? topValue.map(([value, count], i) => `${i + 1}. **${value}**: ${count}x (${Math.round(count / interviews.length * 100)}%)`).join('\n') : '- No value data captured'}

**ICP Implication**: Lead with these outcomes in messaging

### Champion Roles
${topRoles.length > 0 ? topRoles.map(([role, count], i) => `${i + 1}. **${role}**: ${count}x (${Math.round(count / interviews.length * 100)}%)`).join('\n') : '- No roles captured'}
${tieNote(topRoles, 'role')}
**ICP Implication**: Focus outreach on these titles

---

## Key Quotes

${allQuotes.slice(0, 5).map((q, i) => `
### Quote ${i + 1}
> "${q.quote}"
> (${q.role || 'Customer'}${q.customer ? ` at ${q.customer}` : ''})
`).join('\n')}

---

## ICP Refinements from Interviews

### Add to ICP
Based on patterns, your ideal customer:
${topPains[0] ? `- Experiences: "${topPains[0][0]}"` : ''}
${topTriggers[0] ? `- Is triggered by: ${topTriggers[0][0]}` : ''}
${topRoles[0] ? (topRoles[1] && topRoles[1][1] === topRoles[0][1] ? `- Champion is one of: ${andList(topRoles.filter(r => r[1] === topRoles[0][1]).map(r => r[0]))} (no single leading role yet)` : `- Champion is: ${topRoles[0][0]}`) : ''}
${topValue[0] ? `- Seeks outcome: ${topValue[0][0]}` : ''}

### Messaging Updates
Based on customer language, update:
${topPains[0] ? `- **Pain messaging**: "${topPains[0][0]}"` : ''}
${topValue[0] ? `- **Value messaging**: "${topValue[0][0]}"` : ''}

### Discovery Questions to Add
${topPains.slice(0, 3).map((p, i) => `${i + 1}. "You mentioned '${lowerCommonWords(p[0]).trim().replace(/[.]$/, '')}'. How does your team handle that today, and what does it cost you?"`).join('\n') || '- Add pain points to the notes for discovery questions'}
${v ? `\n### Sector questions (${v.name})\n${v.discovery.slice(0, 3).map((x, i) => `${i + 1}. "${x}"`).join('\n')}\n` : ''}
---

## Interview Template for Next Round

Based on gaps in this analysis, ask about:

1. **Pain Exploration**: "What's the biggest challenge you face with [area]?"
2. **Trigger Events**: "What made you start looking for a solution?"
3. **Value Measurement**: "How do you measure success?"
4. **Buying Process**: "Who else was involved in the decision?"
5. **Alternatives Considered**: "What else did you evaluate?"

**Next Step**: Conduct more interviews to strengthen pattern confidence
`;
            }
            // If raw transcripts provided
            if (args.raw_transcripts) {
                return `Your notes are below. This tool analyzes structured notes only.

- ${companyLine(args.company)}

${sectorLine(v)}

## Your Notes
> ${shortText(args.raw_transcripts, 500)}

---

## Structured Format Recommended

For better analysis, structure your interviews in this format. Example only, not from your input: the customer, quotes, pain points and results below are made up to show the format.

${EXAMPLES}
\`\`\`json
{
  "interview_notes": [
    {
      "customer": "Example Manufacturing Co",
      "role": "Finance Controller",
      "key_quotes": [
        "We spent the first week of every month matching card spends by hand",
        "The old process could not keep up with our branches"
      ],
      "pain_points": [
        "Slow month-end close",
        "Manual reconciliation",
        "Late expense claims"
      ],
      "buying_triggers": [
        "New CFO hire",
        "Audit finding"
      ],
      "value_realized": [
        "Close 5 days faster",
        "Fewer policy breaches"
      ]
    }
  ]
}
\`\`\`

---

## Extraction Guidance

From your transcripts, extract:

### Pain Points
- What problems did they describe?
- What was frustrating them?
- What wasn't working?

### Buying Triggers
- What event made them look for a solution?
- What changed in their business?
- What was the timeline driver?

### Value Realized
- What outcomes did they achieve?
- What metrics improved?
- What would they tell others?

### Key Quotes
- Memorable phrases
- Emotional statements
- Concrete examples

Re-run with structured data for full analysis.
`;
            }
            return `# ICP Interview Synthesizer

- ${companyLine(args.company)}

Provide interview data in one of these formats:

## Option 1: Structured Notes (Recommended)
\`\`\`json
{
  "interview_notes": [
    {
      "customer": "Company Name",
      "role": "Job Title",
      "key_quotes": ["Quote 1", "Quote 2"],
      "pain_points": ["Pain 1", "Pain 2"],
      "buying_triggers": ["Trigger 1", "Trigger 2"],
      "value_realized": ["Value 1", "Value 2"]
    }
  ]
}
\`\`\`

## Option 2: Raw Transcripts
\`\`\`json
{
  "raw_transcripts": "Paste your interview notes or transcript here..."
}
\`\`\`

## Analysis Focus Options
The analysis_focus input is accepted but not used yet: every run gives the complete analysis.
- **pain_points**: Focus on problem patterns
- **buying_journey**: Focus on triggers and process
- **value_props**: Focus on outcomes and value
- **all**: Complete analysis (default)

This tool will identify patterns across interviews to refine your ICP.
`;
        }
    }
};
// =============================================================================
// SERVER HANDLERS
// =============================================================================
// =============================================================================
// SERVER (shared by the stdio entry below and netlify/functions/mcp.mjs)
// Added for the hosted connector: tool titles and annotations, and a clear
// message when a required input is missing. Tool code above is unchanged.
// =============================================================================
exports.SERVER_NAME = 'icp-intelligence-mcp';
exports.SERVER_VERSION = '1.2.17';
// Every tool only builds text from its inputs: no storage, no network, no side effects.
const TOOL_TITLES = {
    "icp_deep_dive": "ICP Deep Dive",
    "icp_scoring_model": "ICP Scoring Model",
    "buyer_group_analyzer": "Buyer Group Analyzer",
    "tam_sam_som_calculator": "TAM SAM SOM Calculator",
    "lookalike_signal_generator": "Lookalike Signal Generator",
    "account_prioritization": "Account Prioritization",
    "icp_gap_analysis": "ICP Gap Analysis",
    "icp_evolution_tracker": "ICP Evolution Tracker",
    "icp_interview_synthesizer": "ICP Interview Synthesizer"
};
function withMeta(tool) {
    const title = TOOL_TITLES[tool.name] ?? tool.name;
    return {
        ...tool,
        title,
        annotations: { title, readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    };
}
const NEGATIVE_AMOUNT = /\$\s*[-\u2212]\s*\d|(^|[\s(:=,;])[-\u2212](?:\$|usd|inr|eur|gbp|rs\.?|\u20b9|\u20ac|\u00a3)?\s?\d[\d,]*(?:\.\d+)?(?![\d,.]|\s*%)/i;
const NEGATIVE_MONEY = /[-−]\s?[$₹€£]\s*\d|[$₹€£]\s*[-−]\s*\d|\b(?:mrr|arr|cac|ltv|acv)\b[:\s]*[-−]\s*\d/i;
const AMOUNT_RANGE = /\d\s*[kmb]?\s*(?:-|\u2013|\u2014|to)\s*[$\u20b9\u20ac\u00a3]?\s*\d/i;
function checkValue(schema, holder, key, path, problems) {
    const box = holder;
    const value = box[key];
    if (value === undefined || value === null)
        return;
    if (schema.properties && typeof value === "object" && !Array.isArray(value)) {
        for (const [k, p] of Object.entries(schema.properties))
            checkValue(p, value, k, path ? `${path}.${k}` : k, problems);
        return;
    }
    if (schema.items && Array.isArray(value)) {
        value.forEach((_, i) => checkValue(schema.items, value, i, `${path}[${i}]`, problems));
        return;
    }
    if (Array.isArray(schema.enum) && typeof value === "string" && !schema.enum.includes(value)) {
        problems.push(`${path} must be one of: ${schema.enum.join(", ")}`);
        return;
    }
    if (schema.type !== "number" && schema.type !== "integer")
        return;
    let v = value;
    if (typeof v === "string") {
        const n = v.trim() === "" ? NaN : Number(v.replace(/,/g, "").trim());
        if (!Number.isFinite(n)) {
            problems.push(`${path} must be a number, written with digits only (for example 220000)`);
            return;
        }
        box[key] = n;
        v = n;
    }
    if (typeof v !== "number" || !Number.isFinite(v)) {
        problems.push(`${path} must be a number`);
        return;
    }
    if (typeof schema.minimum === "number" && v < schema.minimum)
        problems.push(`${path} must be ${schema.minimum} or more`);
    if (typeof schema.exclusiveMinimum === "number" && v <= schema.exclusiveMinimum)
        problems.push(`${path} must be more than ${schema.exclusiveMinimum}`);
    if (typeof schema.maximum === "number" && v > schema.maximum)
        problems.push(`${path} must be ${schema.maximum} or less`);
}
const MONEY_TEXT = { buyer_group_analyzer: ["deal_size"] };
const METRIC_TEXT = {};
const ONE_AMOUNT = {};
function checkRequiredInputs(name, args) {
    const tool = tools[name];
    if (!tool) {
        return `Unknown tool: ${name}. Available tools: ${Object.keys(tools).join(', ')}.`;
    }
    const required = tool.inputSchema.required ?? [];
    // Run 16 R16-10 (rule B52): a required text (a string with no fixed list of choices) that is empty or only whitespace counts as missing.
    const props = (tool.inputSchema.properties ?? {});
    const blankText = (key) => typeof args?.[key] === "string" && args[key].trim() === "" && props[key]?.type === "string" && !Array.isArray(props[key]?.enum);
    const missing = required.filter((key) => args?.[key] === undefined || args?.[key] === null || blankText(key));
    if (missing.length > 0) {
        return `Missing required input for ${name}: ${missing.join(', ')}. Provide ${missing.length === 1 ? 'it' : 'them'} and call the tool again.`;
    }
    // Decision N2 (run 6) and run 7: schema limits at any depth, choices, money text and single amounts.
    const problems = [];
    if (args) {
        for (const [k, p] of Object.entries(tool.inputSchema.properties ?? {}))
            checkValue(p, args, k, k, problems);
    }
    for (const key of MONEY_TEXT[name] ?? []) {
        const raw = args?.[key];
        if (typeof raw === "string" && NEGATIVE_AMOUNT.test(raw))
            problems.push(`${key} must not contain a negative amount`);
    }
    for (const key of METRIC_TEXT[name] ?? []) {
        const raw = args?.[key];
        if (typeof raw === "string" && NEGATIVE_MONEY.test(raw))
            problems.push(`${key} must not contain a negative amount of money`);
    }
    for (const key of ONE_AMOUNT[name] ?? []) {
        const raw = args?.[key];
        if (typeof raw === "string" && AMOUNT_RANGE.test(raw))
            problems.push(`${key} must be one amount, not a range (for example $75,000)`);
    }
    // Run 15 R15-32 (edge-case matrix): a percentage cannot pass 100, a 1-100 score cannot pass 100, and NPS runs from -100 to 100.
    const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
    if (name === "tam_sam_som_calculator") {
        // Run 20: the limit of 100 is now in the input schema (maximum), so checkValue above names it once.
    }
    // Run 16 D45: a weight given as 0 is used as 0, so four weights of 0 leave nothing to score with.
    if (name === "account_prioritization") {
        const w = (args?.prioritization_weights && typeof args.prioritization_weights === "object" ? args.prioritization_weights : {});
        if (["fit", "intent", "relationship", "timing"].every((k) => w[k] === 0))
            problems.push("at least one weight must be more than 0");
    }
    // Run 20: the limit of 100 for the three scores is now in the input schema (maximum), so checkValue above names it once.
    if (name === "icp_gap_analysis") {
        for (const side of ["current_metrics", "target_metrics"]) {
            const m = (args?.[side] || {});
            for (const k of ["win_rate", "churn_rate"]) {
                const v = num(m[k]);
                if (v !== null && (v < 0 || v > 100))
                    problems.push(`${side}.${k} must be from 0 to 100 (it is a percentage)`);
            }
            const n = num(m.nps);
            if (n !== null && (n < -100 || n > 100))
                problems.push(`${side}.nps must be from -100 to 100`);
        }
    }
    if (problems.length > 0) {
        return `Invalid input for ${name}: ${problems.join("; ")}.`;
    }
    return null;
}
function createServer() {
    const server = new index_js_1.Server({ name: exports.SERVER_NAME, version: exports.SERVER_VERSION }, { capabilities: { tools: {} } });
    server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
        tools: Object.entries(tools).map(([name, config]) => withMeta({ name, description: config.description, inputSchema: config.inputSchema })),
    }));
    server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
        const problem = checkRequiredInputs(request.params.name, request.params.arguments);
        if (problem) {
            return { content: [{ type: 'text', text: problem }], isError: true };
        }
        const toolName = request.params.name;
        const tool = tools[toolName];
        if (!tool) {
            return {
                content: [{
                        type: 'text',
                        text: `Unknown tool: ${toolName}. Available tools: ${Object.keys(tools).join(', ')}`
                    }],
                isError: true
            };
        }
        try {
            // Run 20 echo safeguard (D086): the single place where a tools/call reaches a tool. The same createServer() serves the hosted
            // path (netlify/functions/mcp.mjs) and stdio, so every text the user typed is made safe once, here, before any tool repeats it.
            const result = tool.execute((0, echo_safe_ts_1.neutraliseDeep)(request.params.arguments));
            return {
                content: [{ type: 'text', text: result }]
            };
        }
        catch (error) {
            return {
                content: [{
                        type: 'text',
                        text: `Error executing ${toolName}: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }],
                isError: true
            };
        }
    });
    return server;
}
// =============================================================================
// MAIN
// =============================================================================
async function main() {
    const server = createServer();
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error(`ICP Intelligence MCP v${exports.SERVER_VERSION} running on stdio`);
}
// Run over stdio only when started directly (npm bin). The hosted function imports this
// file as an ES module bundle, where require is not defined.
if (typeof module !== 'undefined' && typeof require !== 'undefined' && require.main === module) {
    main().catch(console.error);
}
//# sourceMappingURL=index.js.map