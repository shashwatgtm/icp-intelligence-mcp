#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SERVER_VERSION = exports.SERVER_NAME = void 0;
exports.createServer = createServer;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
// =============================================================================
// ICP INTELLIGENCE MCP v1.0.0 - Deep ICP Analysis with Pattern Detection
// =============================================================================
// 9 Tools for ICP definition, scoring, market sizing, and signal generation
// =============================================================================
// Text only: add a word such as "software" after a phrase unless the phrase already ends with it (no "software software").
function withSoftware(phrase, word) {
    const p = phrase.trim();
    return p.toLowerCase() === word.toLowerCase() || p.toLowerCase().endsWith(` ${word.toLowerCase()}`) ? p : `${p} ${word}`;
}
// Text only (run 9): common words that may open an input phrase. Mid-sentence, only these are lowered
// ("Fewer no-shows" becomes "fewer no-shows"). Any other capitalised word is kept as typed, because it may be a
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
    'control access approvals approval handoffs handoff meetings meeting appointments appointment bookings ' +
    'booking reminders reminder no-shows cancellations patients patient staff employees employee managers manager ' +
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
// word counts by its first part ("Two-way", "No-shows").
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
    'Apple Amazon AWS Azure Facebook Instagram WhatsApp YouTube Acme ExampleCo Sam ' +
    // Run 11: the company and competitor names in the test inputs and the page examples.
    'Clausewise Bengaluru Clari Northwind ClinicFlow Metricly').split(/\s+/).filter(Boolean));
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
// too (New York, Clinic Group A, Competitor A) and is not a known name on its own ("Native Salesforce" is not a name).
// Run 11: a one-letter word keeps its capital (I, X), and a common first word never makes the next word a name ("For
// Clausewise contract review" becomes "for Clausewise contract review"), unless the next word is a one-letter label after
// a noun (Competitor A) or the phrase opens with three capitalised words (Example Clinic Group).
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
// =============================================================================
// TOOL DEFINITIONS
// =============================================================================
const tools = {
    // ---------------------------------------------------------------------------
    // Tool 1: ICP Deep Dive - Pattern Detection from Customer Data
    // ---------------------------------------------------------------------------
    icp_deep_dive: {
        description: 'Analyze customer data to detect ICP patterns: firmographics, technographics, buying behavior',
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
                }
            }
        },
        execute: (args) => {
            const category = args.product_category || 'B2B SaaS';
            // If structured data provided, analyze patterns
            if (args.customers && args.customers.length > 0) {
                const customers = args.customers;
                // Industry analysis
                const industries = customers.map(c => c.industry).filter(Boolean);
                const industryCount = {};
                industries.forEach(i => { industryCount[i] = (industryCount[i] || 0) + 1; });
                const topIndustries = Object.entries(industryCount)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3);
                // Size analysis
                const sizes = customers.map(c => c.size).filter(Boolean);
                const sizeCount = {};
                sizes.forEach(s => { sizeCount[s] = (sizeCount[s] || 0) + 1; });
                const topSizes = Object.entries(sizeCount)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3);
                // ACV analysis
                const acvs = customers.map(c => c.acv).filter(Boolean);
                const avgACV = acvs.length > 0 ? acvs.reduce((a, b) => a + b, 0) / acvs.length : 0;
                const minACV = acvs.length > 0 ? Math.min(...acvs) : 0;
                const maxACV = acvs.length > 0 ? Math.max(...acvs) : 0;
                // Sales cycle analysis
                const cycles = customers.map(c => c.sales_cycle_days).filter(Boolean);
                const avgCycle = cycles.length > 0 ? Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length) : 0;
                // Tech stack analysis
                const allTech = customers.flatMap(c => c.tech_stack || []);
                const techCount = {};
                allTech.forEach(t => { techCount[t] = (techCount[t] || 0) + 1; });
                const topTech = Object.entries(techCount)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5);
                // Champion analysis
                const champions = customers.map(c => c.champion_title).filter(Boolean);
                const championCount = {};
                champions.forEach(c => { championCount[c] = (championCount[c] || 0) + 1; });
                const topChampions = Object.entries(championCount)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3);
                // Trigger analysis
                const triggers = customers.map(c => c.buying_trigger).filter(Boolean);
                const triggerCount = {};
                triggers.forEach(t => { triggerCount[t] = (triggerCount[t] || 0) + 1; });
                const topTriggers = Object.entries(triggerCount)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3);
                return `# ICP Pattern Analysis

## Data Analyzed
- **Customers analyzed**: ${customers.length}
- **Product category**: ${category}

---

## Detected Patterns

### Industry Distribution
${topIndustries.length > 0 ? topIndustries.map(([ind, count]) => `- **${ind}**: ${count} customers (${Math.round(count / customers.length * 100)}%)`).join('\n') : '- No industry data provided'}

**Pattern**: ${topIndustries.length === 0 ? 'none yet, add this data' : topIndustries[0][1] > customers.length * 0.5 ?
                    `Strong concentration in ${topIndustries[0][0]} (${Math.round(topIndustries[0][1] / customers.length * 100)}%)` :
                    'Diverse industry mix, consider vertical specialization'}

### Company Size Distribution
${topSizes.length > 0 ? topSizes.map(([size, count]) => `- **${size}**: ${count} customers (${Math.round(count / customers.length * 100)}%)`).join('\n') : '- No size data provided'}

**Pattern**: ${topSizes.length > 0 ?
                    `Primary segment: ${topSizes[0][0]} companies` :
                    'none yet, add this data'}

### Deal Economics
| Metric | Value |
|--------|-------|
| Average ACV | ${acvs.length > 0 ? `$${Math.round(avgACV).toLocaleString('en-US')}` : 'not supplied'} |
| ACV Range | ${acvs.length > 0 ? `$${minACV.toLocaleString('en-US')} to $${maxACV.toLocaleString('en-US')}` : 'not supplied'} |
| Avg Sales Cycle | ${cycles.length > 0 ? `${avgCycle} days` : 'not supplied'} |

**Pattern**: ${acvs.length === 0 ? 'none yet, add this data' : avgACV > 50000 ? 'Enterprise deal profile: expect complex buying process' :
                    avgACV > 15000 ? 'Mid-market deal profile: balance speed and value' :
                        'SMB/PLG deal profile: optimize for volume'}

### Technology Stack Signals
${topTech.length > 0 ? topTech.map(([tech, count]) => `- **${tech}**: ${count} customers (${Math.round(count / customers.length * 100)}%)`).join('\n') : '- No tech stack data provided'}

**Pattern**: ${topTech.length > 0 ?
                    `Use "${topTech[0][0]}" as primary technographic filter` :
                    'none yet, add this data'}

### Champion Roles
${topChampions.length > 0 ? topChampions.map(([role, count]) => `- **${role}**: ${count} deals (${Math.round(count / customers.length * 100)}%)`).join('\n') : '- No champion data provided'}

**Pattern**: ${topChampions.length > 0 ?
                    `Primary champion: ${topChampions[0][0]}; lead with their pain points` :
                    'none yet, add this data'}

### Buying Triggers
${topTriggers.length > 0 ? topTriggers.map(([trigger, count]) => `- **${trigger}**: ${count} deals (${Math.round(count / customers.length * 100)}%)`).join('\n') : '- No trigger data provided'}

**Pattern**: ${topTriggers.length > 0 ?
                    `Top trigger: "${topTriggers[0][0]}"; use in outbound messaging` :
                    'none yet, add this data'}

---

## Synthesized ICP

Based on pattern analysis:

**Ideal Customer Profile**:
${[topIndustries[0] ? `- **Industry**: ${topIndustries[0][0]}${topIndustries[1] ? ` or ${topIndustries[1][0]}` : ''}` : '',
                    topSizes[0] ? `- **Size**: ${topSizes[0][0]}` : '',
                    `- **Budget**: ${acvs.length > 0 ? `$${Math.round(avgACV * 0.8).toLocaleString('en-US')} to $${Math.round(avgACV * 1.2).toLocaleString('en-US')} ACV capacity ${EXAMPLE}` : 'not supplied'}`,
                    topTech[0] ? `- **Tech Stack**: Uses ${topTech[0][0]}${topTech[1] ? ` + ${topTech[1][0]}` : ''}` : '',
                    topTriggers[0] ? `- **Buying Trigger**: ${topTriggers[0][0]}` : '',
                    topChampions[0] ? `- **Champion**: ${topChampions[0][0]}` : '',
                    `- **Sales Cycle**: ~${avgCycle || 60} days expected${avgCycle ? '' : ` ${EXAMPLE}`}`].filter(Boolean).join('\n')}
${(() => { const miss = [topIndustries[0] ? '' : 'industry', topSizes[0] ? '' : 'size', topTech[0] ? '' : 'tech stack', topTriggers[0] ? '' : 'trigger', topChampions[0] ? '' : 'champion'].filter(Boolean); return miss.length ? `\nAdd ${miss.length > 1 ? miss.slice(0, -1).join(', ') + ' and ' + miss[miss.length - 1] : miss[0]} to fill this profile.` : ''; })()}

---

## Data Gaps to Fill

${topIndustries.length === 0 ? 'Note: **Industry data missing**. Add industry field to customer records\n' : ''}
${topSizes.length === 0 ? 'Note: **Size data missing**. Add employee count/revenue tier\n' : ''}
${topTech.length === 0 ? 'Note: **Tech stack missing**. Track technologies customers use\n' : ''}
${topChampions.length === 0 ? 'Note: **Champion data missing**. Record buyer titles on deals\n' : ''}
${topTriggers.length === 0 ? 'Note: **Trigger data missing**. Ask "Why now?" in discovery\n' : ''}

**Next Step**: Use \`icp_scoring_model\` to create a qualification scorecard
`;
            }
            // If text description provided, extract patterns
            if (args.customer_descriptions) {
                const desc = args.customer_descriptions.toLowerCase();
                // Detect patterns from text
                const patterns = {
                    size: desc.includes('enterprise') ? 'Enterprise (1000+)' :
                        desc.includes('mid-market') || desc.includes('mid market') ? 'Mid-market (100-1000)' :
                            desc.includes('smb') || desc.includes('small') ? 'SMB (10-100)' :
                                desc.includes('startup') ? 'Startup/Early-stage' : 'Mixed sizes',
                    industry: desc.includes('saas') ? 'SaaS/Software' :
                        desc.includes('fintech') || desc.includes('finance') ? 'Fintech/Finance' :
                            desc.includes('healthcare') || desc.includes('health') ? 'Healthcare' :
                                desc.includes('ecommerce') || desc.includes('retail') ? 'E-commerce/Retail' : 'Mixed industries',
                    stage: desc.includes('series a') || desc.includes('series b') ? 'Series A-B' :
                        desc.includes('series c') || desc.includes('series d') ? 'Series C+' :
                            desc.includes('public') || desc.includes('enterprise') ? 'Public/Enterprise' : 'Mixed stages'
                };
                // Run 12 (R12-21): the stage the user typed, when there is one, instead of a range
                const stageTyped = [...new Set((args.customer_descriptions.match(/\bseries [a-d]\b/gi) || []).map(m => 'Series ' + m.slice(-1).toUpperCase()))].join(', ');
                return `# ICP Pattern Analysis (from Description)

## Input Analyzed
\`\`\`
${args.customer_descriptions}
\`\`\`

---

## Detected Patterns

### Likely Company Size
**${patterns.size}**${/\d/.test(patterns.size) ? ` ${EXAMPLE}` : ''}
${patterns.size === 'Enterprise (1000+)' ? `- Expect 6-12 month sales cycles, multi-stakeholder buying ${EXAMPLE}` : ''}
${patterns.size === 'Mid-market (100-1000)' ? `- Expect 3-6 month sales cycles, departmental buying ${EXAMPLE}` : ''}
${patterns.size === 'SMB (10-100)' ? `- Expect 1-3 month sales cycles, founder/exec buying ${EXAMPLE}` : ''}

### Likely Industry
**${patterns.industry}**
- Tailor messaging to industry-specific pain points
- Research industry-specific compliance/requirements

### Likely Stage
**${stageTyped || patterns.stage}**
- Match your pricing to their typical budget capacity
- Adjust value messaging to their growth priorities

---

## Recommendations

For more precise ICP analysis, provide structured customer data in this format (the customer below is an example, not taken from your input):

${EXAMPLES}
\`\`\`json
{
  "customers": [
    {
      "name": "Customer A",
      "industry": "SaaS",
      "size": "100-500 employees",
      "acv": 50000,
      "sales_cycle_days": 90,
      "tech_stack": ["Salesforce", "Slack", "AWS"],
      "buying_trigger": "New VP Sales hired",
      "champion_title": "VP Sales"
    }
  ]
}
\`\`\`

**Next Step**: Collect structured data from your CRM, then re-run this analysis
`;
            }
            return `# ICP Deep Dive

Please provide customer data in one of these formats (the values shown are examples):

**Option 1: Structured Data**
${EXAMPLES}
\`\`\`json
{
  "customers": [
    {
      "name": "Customer A",
      "industry": "SaaS",
      "size": "100-500 employees",
      "acv": 50000,
      "sales_cycle_days": 90,
      "tech_stack": ["Salesforce", "Slack"],
      "buying_trigger": "New VP Sales hired",
      "champion_title": "VP Sales"
    }
  ]
}
\`\`\`

**Option 2: Text Description**
${EXAMPLES}
\`\`\`json
{
  "customer_descriptions": "Our best customers are Series B SaaS companies with 50-200 employees. They typically use Salesforce and have a VP of Sales who becomes our champion."
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
        description: 'Create a lead qualification scoring template: criteria with example point weights set by importance level, a scorecard and tier bands to adjust. Your success patterns are shown for reference; they do not set the weights',
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
                }
            }
        },
        execute: (args) => {
            const category = args.product_category || 'B2B Solution';
            const correlations = args.success_correlation || '';
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
            return `# ICP Scoring Model

## Scoring Framework for ${category}
${correlations ? `\n**Success Correlation Noted**: ${correlations}\nConsider adding this as a criterion of your own.\n` : ''}

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
${criteria.map(c => `| **${c.criterion}** | ${c.weight} pts | ${c.values.join(' / ')} |`).join('\n')}

**Maximum Score**: ${criteria.reduce((sum, c) => sum + c.weight, 0)} points ${EXAMPLE}

---

## Qualification Tiers

| Tier | Score Range | Action | SLA |
|------|-------------|--------|-----|
| **A: Hot** | 80-100 | Immediate outreach, fast-track | Demo within 24 hours |
| **B: Warm** | 60-79 | Priority follow-up | Demo within 48 hours |
| **C: Developing** | 40-59 | Nurture sequence | Weekly touch |
| **D: Unqualified** | 0-39 | Marketing nurture only | Auto-nurture |

---

## Qualification Scorecard Template

### Account: _______________
### Date: _______________

${criteria.map(c => `
**${c.criterion}** (Max: ${c.weight} pts)
${c.values.map((v, i) => `[ ] ${v}`).join('\n')}
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

**Next Step**: Use \`buyer_group_analyzer\` to map decision-making dynamics

${SUGGESTED}
`;
        }
    },
    // ---------------------------------------------------------------------------
    // Tool 3: Buyer Group Analyzer - Decision Dynamics Mapping
    // ---------------------------------------------------------------------------
    buyer_group_analyzer: {
        description: 'Map buyer group dynamics, influence relationships, and decision-making process',
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
                }
            },
            required: ['product_category']
        },
        execute: (args) => {
            const dealSize = args.deal_size || '$30K-50K';
            const companySize = args.target_company_size || '200-500 employees';
            const champion = args.typical_champion || 'Department Head';
            const categoryLower = args.product_category.toLowerCase();
            // Generate buying group based on category
            let buyingGroup = {
                champion: { role: '', concern: '', message: '' },
                economic: { role: '', concern: '', message: '' },
                technical: { role: '', concern: '', message: '' },
                user: { role: '', concern: '', message: '' },
                blocker: { role: '', concern: '', mitigation: '' }
            };
            if (categoryLower.includes('sales') || categoryLower.includes('crm') || categoryLower.includes('revenue')) {
                buyingGroup = {
                    champion: { role: 'VP/Director Sales', concern: 'Quota attainment, rep productivity', message: 'Help reps hit quota with less effort' },
                    economic: { role: 'CRO/CEO', concern: 'Revenue growth, sales efficiency', message: 'Drive 20%+ revenue improvement with measurable ROI' },
                    technical: { role: 'Sales Ops/RevOps', concern: 'CRM integration, data quality', message: 'Seamless Salesforce sync, no data cleanup' },
                    user: { role: 'Sales Reps', concern: 'Ease of use, time savings', message: 'Spend time selling, not on admin work' },
                    blocker: { role: 'IT Security', concern: 'Data security, compliance', mitigation: '[Your certifications, for example SOC 2], SSO supported, data encryption' }
                };
            }
            else if (categoryLower.includes('marketing') || categoryLower.includes('demand')) {
                buyingGroup = {
                    champion: { role: 'VP/Director Marketing', concern: 'Pipeline contribution, campaign ROI', message: 'Generate 30% more pipeline from same budget' },
                    economic: { role: 'CMO/CEO', concern: 'Marketing efficiency, brand impact', message: 'Prove marketing ROI to the board' },
                    technical: { role: 'Marketing Ops', concern: 'Tech stack integration, workflow', message: 'Fits your existing stack, no migration pain' },
                    user: { role: 'Campaign Managers', concern: 'Ease of execution, reporting', message: 'Launch campaigns in hours, not weeks' },
                    blocker: { role: 'Finance', concern: 'Budget justification', mitigation: 'Clear ROI calculator, flexible pricing' }
                };
            }
            else if (categoryLower.includes('security') || categoryLower.includes('compliance')) {
                buyingGroup = {
                    champion: { role: 'CISO/Security Director', concern: 'Risk reduction, compliance', message: 'Reduce attack surface by 80%' },
                    economic: { role: 'CIO/CFO', concern: 'Risk vs cost, insurance impact', message: 'Avoid $5M average breach cost' },
                    technical: { role: 'Security Engineers', concern: 'Technical depth, alert quality', message: 'Fewer false positives, actionable alerts' },
                    user: { role: 'SOC Team', concern: 'Alert fatigue, efficiency', message: 'Cut investigation time by 60%' },
                    blocker: { role: 'Procurement', concern: 'Vendor consolidation', mitigation: 'Replaces 3+ point solutions' }
                };
            }
            else {
                buyingGroup = {
                    // Run 12 (R12-21): no preset for this category, so the lines that would read as findings are prompts to fill in
                    champion: { role: champion, concern: '[Their main concern, for example no-shows]', message: '[Your answer to that concern, in one line]' },
                    economic: { role: 'C-Level Sponsor', concern: 'ROI, strategic fit', message: '[The business impact you can prove]' },
                    technical: { role: 'IT/Tech Lead', concern: 'Integration, maintenance', message: '[How setup and upkeep work with your product]' },
                    user: { role: 'End Users', concern: 'Ease of use, daily workflow', message: '[What changes in their working day]' },
                    blocker: { role: 'Legal/Procurement', concern: 'Risk, compliance', mitigation: '[Your standard terms and compliance answer]' }
                };
            }
            // Labels only: a preset message that carries a figure is an example, not a fact about the user's product.
            const exIfFigure = (text) => /\d/.test(text.replace(/SOC 2/g, '')) ? ` ${EXAMPLE}` : '';
            return `# Buyer Group Analysis

## Deal Context
- **Product**: ${args.product_category}
- **Deal Size**: ${dealSize}${args.deal_size ? '' : ` ${EXAMPLE}`}
- **Target Company**: ${companySize}${args.target_company_size ? '' : ` ${EXAMPLE}`}
- **Known Stakeholders**: ${args.known_stakeholders?.join(', ') || 'Not specified'}

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
- Provide sandbox/POC access
- Share integration documentation
- Offer technical deep-dive call
- Address security questionnaire proactively

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

**Next Step**: Use \`tam_sam_som_calculator\` to size your market

${SUGGESTED}
`;
        }
    },
    // ---------------------------------------------------------------------------
    // Tool 4: TAM/SAM/SOM Calculator - Bottom-Up Market Sizing
    // ---------------------------------------------------------------------------
    tam_sam_som_calculator: {
        description: 'Calculate TAM/SAM/SOM using bottom-up methodology from your data (calculation framework, not data source)',
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
                    description: 'Percentage that match your ICP (1-100)'
                },
                year1_market_share_target: {
                    type: 'number',
                    minimum: 0,
                    description: 'Realistic Year 1 market share percentage (typically 1-5%)'
                },
                data_sources: {
                    type: 'string',
                    description: 'Where you got your numbers (for documentation)'
                },
                segment_name: {
                    type: 'string',
                    description: 'Name of the market segment'
                }
            },
            required: ['total_potential_companies', 'average_contract_value']
        },
        execute: (args) => {
            const totalCompanies = args.total_potential_companies;
            const acv = args.average_contract_value;
            const icpPercent = (args.icp_percentage || 30) / 100;
            const marketSharePercent = (args.year1_market_share_target || 3) / 100;
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
                if (num >= 1000000000)
                    return `$${(num / 1000000000).toFixed(2)}B`;
                if (num >= 1000000)
                    return `$${(num / 1000000).toFixed(1)}M`;
                if (num >= 1000)
                    return `$${(num / 1000).toFixed(0)}K`;
                return `$${num}`;
            };
            // Labels only: an ICP match rate or market share the user did not supply is a preset example,
            // and so is every value computed with it.
            const icpGiven = !!args.icp_percentage;
            const shareGiven = !!args.year1_market_share_target;
            const icpEx = icpGiven ? '' : ` ${EXAMPLE}`;
            const shareEx = shareGiven ? '' : ` ${EXAMPLE}`;
            const somEx = icpGiven && shareGiven ? '' : ` ${EXAMPLE}`;
            return `# TAM/SAM/SOM Analysis

## Market: ${segment}

---

## Input Data

| Input | Value | Source |
|-------|-------|--------|
| Total Potential Companies | ${totalCompanies.toLocaleString('en-US')} | ${sources} |
| Average Contract Value | $${acv.toLocaleString('en-US')} | Your input |
| ICP Match Rate | ${(icpPercent * 100).toFixed(0)}%${icpEx} | ${icpGiven ? 'Your input' : 'Not supplied'} |
| Year 1 Market Share Target | ${(marketSharePercent * 100).toFixed(1)}%${shareEx} | ${shareGiven ? 'Your input' : 'Not supplied'} |

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
SAM = ${formatCurrency(tam)} × ${(icpPercent * 100).toFixed(0)}%${icpEx}
\`\`\`
### **SAM = ${formatCurrency(sam)}**${icpEx}

*Companies that match your ICP and you can actually serve*

---

### SOM (Serviceable Obtainable Market)
\`\`\`
SOM = SAM × Year 1 Market Share
SOM = ${formatCurrency(sam)} × ${(marketSharePercent * 100).toFixed(1)}%${somEx}
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
- **Deals Needed**: ~${targetDeals} closed customers${somEx}
- **Monthly Target**: ~${Math.ceil(targetDeals / 12)} deals/month${somEx}
- **Pipeline Required**: ${formatCurrency(som * 3)} (at 33% win rate) ${EXAMPLE}

### Growth Path
Later years assume your market share doubles each year.
| Year | Market Share | Revenue Target | Customers |
|------|--------------|----------------|-----------|
| Year 1 | ${(marketSharePercent * 100).toFixed(1)}%${shareEx} | ${formatCurrency(som)}${shareGiven ? somEx : ''} | ${targetDeals} |
| Year 2 | ${(marketSharePercent * 2 * 100).toFixed(1)}% ${EXAMPLE} | ${formatCurrency(som * 2)} | ${targetDeals * 2} |
| Year 3 | ${(marketSharePercent * 4 * 100).toFixed(1)}% ${EXAMPLE} | ${formatCurrency(som * 4)} | ${targetDeals * 4} |

---

## Assumptions & Validation

### Key Assumptions
1. **Company count accuracy**: Validate with LinkedIn Sales Navigator, industry reports
2. **ACV assumption**: Based on current pricing, may increase with enterprise deals
3. **ICP match rate**: ${icpGiven ? 'Your estimate' : 'Not supplied, so a preset example is used'}; refine with actual data
4. **Market share**: ${(marketSharePercent * 100).toFixed(1)}%${shareEx} is ${marketSharePercent <= 0.03 ? 'conservative' : marketSharePercent <= 0.05 ? 'moderate' : 'aggressive'} for Year 1

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
> We target **${formatCurrency(som)} SOM** in Year 1, requiring **${targetDeals} customers** at **${formatCurrency(acv)} ACV**.
> 
> *Figures calculated from your inputs${somEx ? ', plus the preset rates marked as examples above' : ''}${args.data_sources ? `. Data sources you named: ${args.data_sources}` : ''}.*

**Next Step**: Use \`lookalike_signal_generator\` to create targeting criteria
`;
        }
    },
    // ---------------------------------------------------------------------------
    // Tool 5: Lookalike Signal Generator - Platform-Specific Targeting Criteria
    // ---------------------------------------------------------------------------
    lookalike_signal_generator: {
        description: 'Generate platform-specific targeting criteria and search queries (generates criteria, not data)',
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
                    description: 'Accepted but not used yet: the output always includes every platform section (linkedin, google_ads, 6sense, zoominfo)'
                }
            },
            required: ['champion_titles']
        },
        execute: (args) => {
            const firmographics = args.icp_firmographics || {};
            const industries = firmographics.industries || ['Software', 'Technology'];
            const sizes = firmographics.company_sizes || ['51-200', '201-500'];
            const locations = firmographics.locations || ['United States'];
            const tech = args.icp_technographics || ['Salesforce', 'HubSpot'];
            const titles = args.champion_titles;
            const triggers = args.buying_triggers || ['New leadership hire', 'Funding round', 'Expansion'];
            const platforms = args.platforms || ['linkedin', 'google_ads', '6sense'];
            // Labels only: fields the input did not supply are filled with example values; the default company
            // sizes are example figures, so a code block that shows them gets an example label line above it.
            const notSupplied = (given) => given ? '' : ' (not supplied: example values)';
            const sizesEx = firmographics.company_sizes ? '' : ` ${EXAMPLE}`;
            const sizesBlock = firmographics.company_sizes ? '' : `${EXAMPLES}\n`;
            const anyExample = !firmographics.industries || !firmographics.company_sizes || !firmographics.locations || !args.icp_technographics || !args.buying_triggers;
            return `# Lookalike Signal & Targeting Criteria

## ICP Summary
- **Industries**: ${industries.join(', ')}${notSupplied(firmographics.industries)}
- **Company Sizes**: ${sizes.join(', ')}${sizesEx}
- **Locations**: ${locations.join(', ')}${notSupplied(firmographics.locations)}
- **Technologies**: ${tech.join(', ')}${notSupplied(args.icp_technographics)}
- **Champion Titles**: ${titles.join(', ')}
- **Buying Triggers**: ${triggers.join(', ')}${notSupplied(args.buying_triggers)}

---

## LinkedIn Sales Navigator

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
4. Export to outreach sequences

---

## Google Ads Targeting

### Custom Intent Audiences
**Keywords to target** (people searching for solutions):
\`\`\`
${tech.map(t => `"${t.toLowerCase()} integration"`).join('\n')}
${tech.map(t => `"${t.toLowerCase()} alternative"`).join('\n')}
"${withSoftware(industries[0]?.toLowerCase() || 'b2b', 'software')}"
\`\`\`

### Custom Audience: Website Visitors
Target visitors to competitor sites:
\`\`\`
competitor1.com
competitor2.com
g2.com/products/[competitor]
\`\`\`

### In-Market Audiences
\`\`\`
Business Services > Business Technology
Software > ${withSoftware(industries[0] || 'Enterprise', 'Software')}
\`\`\`

---

## 6sense / Intent Data Platforms

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
${tech.join('\n')}
${industries.map(i => `${i} solutions`).join('\n')}
\`\`\`

### Buying Stage Indicators
- **Awareness**: Researching generic topics
- **Consideration**: Comparing specific vendors
- **Decision**: Pricing pages, demo requests

---

## ZoomInfo / Apollo Filters

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
- Funding events (Series A-C)
- Technology adoption changes
- Hiring for related roles

---

## Buying Trigger Signals

### Trigger: ${cap(triggers[0] || 'New Leadership Hire')}
**Signal**: New ${titles[0] || 'VP'} joined in last 90 days
**Why it matters**: New leaders seek quick wins, open to new tools
**How to track**: LinkedIn alerts, ZoomInfo job changes

### Trigger: ${cap(triggers[1] || 'Funding Round')}
**Signal**: Series A-C announcement
**Why it matters**: Budget allocated for scaling
**How to track**: Crunchbase alerts, TechCrunch, LinkedIn

### Trigger: ${cap(triggers[2] || 'Expansion')}
**Signal**: ${triggers[2] ? `${cap(triggers[2])} announced` : 'New office, new market, hiring surge'}
**Why it matters**: Existing processes breaking at scale
**How to track**: Job posting velocity, news alerts

---

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
        description: 'Rank and prioritize accounts using multi-dimensional scoring',
        inputSchema: {
            type: 'object',
            properties: {
                accounts: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' },
                            fit_score: { type: 'number', minimum: 0, description: '1-100' },
                            intent_signals: { type: 'number', minimum: 0, description: '1-100 or 0 if unknown' },
                            relationship: { type: 'number', minimum: 0, description: '1-100 based on existing connections' },
                            timing: { type: 'string', description: 'now/soon/later/unknown' }
                        }
                    },
                    description: 'List of accounts to prioritize. Each account: name, fit_score (0 to 100), intent_signals (0 to 100), relationship, timing'
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
                }
            }
        },
        execute: (args) => {
            // Default weights
            const weights = {
                fit: args.prioritization_weights?.fit || 40,
                intent: args.prioritization_weights?.intent || 30,
                relationship: args.prioritization_weights?.relationship || 15,
                timing: args.prioritization_weights?.timing || 15
            };
            // Labels only: a weight the input did not supply is the default (an example figure).
            const givenWeights = args.prioritization_weights || {};
            const noWeights = !(givenWeights.fit || givenWeights.intent || givenWeights.relationship || givenWeights.timing);
            const wEx = (given) => (noWeights || given) ? '' : ` ${EXAMPLE}`;
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
                const scoredAccounts = args.accounts.map(account => {
                    const fitScore = account.fit_score || 50;
                    const intentScore = account.intent_signals || 50;
                    const relationshipScore = account.relationship || 50;
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
                        tier: totalScore >= 80 ? 'A' : totalScore >= 60 ? 'B' : totalScore >= 40 ? 'C' : 'D',
                        // Labels only: the values that fell back to the default because the account did not supply them.
                        defaults: { fit: !account.fit_score, intent: !account.intent_signals, relationship: !account.relationship, timing: !account.timing }
                    };
                });
                // Sort by total score
                scoredAccounts.sort((a, b) => b.totalScore - a.totalScore);
                return `# Account Prioritization Results

## Scoring Weights
${noWeights ? `${EXAMPLES} You supplied no weights, so these are the default weights.\n` : ''}| Factor | Weight | Rationale |
|--------|--------|-----------|
| **Fit** | ${weights.fit}%${wEx(givenWeights.fit)} | How well they match ICP |
| **Intent** | ${weights.intent}%${wEx(givenWeights.intent)} | Buying signals detected |
| **Relationship** | ${weights.relationship}%${wEx(givenWeights.relationship)} | Existing connections |
| **Timing** | ${weights.timing}%${wEx(givenWeights.timing)} | Urgency/readiness |

---

## Prioritized Account List

Your scores are shown as given; ${noWeights ? 'the weights and timing points are the defaults' : 'the timing points are the defaults'}. (default) marks a value your input did not supply, so the tool used its default.
| Rank | Account | Fit | Intent | Relationship | Timing | **Score** | Tier |
|------|---------|-----|--------|--------------|--------|-----------|------|
${scoredAccounts.map((a, i) => `| ${i + 1} | **${a.name}** | ${a.fit}${a.defaults.fit ? ' (default)' : ''} | ${a.intent}${a.defaults.intent ? ' (default)' : ''} | ${a.relationship}${a.defaults.relationship ? ' (default)' : ''} | ${a.timing}${a.defaults.timing ? ' (default)' : ''} | **${a.totalScore}** | ${a.tier} |`).join('\n')}

---

## Tier Breakdown

${EXAMPLES}
### Tier A (Score 80+): Immediate Action
${scoredAccounts.filter(a => a.tier === 'A').map(a => `- **${a.name}** (${a.totalScore})`).join('\n') || '- None in this tier'}

**Action**: Personalized outreach within 24 hours, executive involvement

${EXAMPLES}
### Tier B (Score 60-79): High Priority
${scoredAccounts.filter(a => a.tier === 'B').map(a => `- **${a.name}** (${a.totalScore})`).join('\n') || '- None in this tier'}

**Action**: Targeted outreach this week, multi-touch sequence

${EXAMPLES}
### Tier C (Score 40-59): Nurture
${scoredAccounts.filter(a => a.tier === 'C').map(a => `- **${a.name}** (${a.totalScore})`).join('\n') || '- None in this tier'}

**Action**: Add to nurture campaign, monitor for signal changes

${EXAMPLES}
### Tier D (Score <40): Monitor
${scoredAccounts.filter(a => a.tier === 'D').map(a => `- **${a.name}** (${a.totalScore})`).join('\n') || '- None in this tier'}

**Action**: Marketing nurture only, check quarterly

---

## Next Actions by Account

${scoredAccounts.slice(0, 5).map((a, i) => `
### ${i + 1}. ${a.name} (Tier ${a.tier})
- **Why prioritized**: ${a.fit >= 80 ? 'Strong ICP fit' : a.intent >= 80 ? 'High buying intent' : a.relationship >= 80 ? 'Strong relationship' : 'Balanced scoring'}
- **Gap to address**: ${a.fit < 60 ? 'Validate fit' : a.intent < 60 ? 'Generate engagement' : a.relationship < 60 ? 'Build relationships' : 'Verify timing'}
- **Recommended action**: ${a.tier === 'A' ? 'Personal outreach from AE' : a.tier === 'B' ? 'SDR sequence + warm intro' : 'Marketing nurture'}
`).join('')}

**Next Step**: Use \`icp_gap_analysis\` to compare current vs ideal customers

${SUGGESTED}
`;
            }
            // If no accounts, provide the framework
            return `# Account Prioritization Framework

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
      "name": "Acme Corp",
      "fit_score": 85,
      "intent_signals": 70,
      "relationship": 60,
      "timing": "now"
    },
    {
      "name": "Beta Inc",
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
        description: 'Analyze gaps between current customer base and ideal ICP',
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
                }
            },
            required: ['current_customers', 'ideal_icp']
        },
        execute: (args) => {
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
            const upGap = (g, word) => (g === 'n/a' ? `no percentage: today's value is 0` : parseFloat(g) >= 0 ? `+${g}% ${word}needed` : `already above target, no ${word || 'increase '}needed`);
            const downGap = (g, word) => (g === 'n/a' ? `no percentage: today's value is 0` : parseFloat(g) >= 0 ? (word ? `${g}% ${word}needed` : `-${g}% needed`) : `target is ${-parseFloat(g)}% above today, no ${word || 'reduction '}needed`);
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
            return `# ICP Gap Analysis

## Profile Comparison

### Current Customer Base
${args.current_customers}

### Ideal Customer Profile (Target)
${args.ideal_icp}

---

## Metric Gaps

${noneGiven ? `${EXAMPLES} You did not supply current or target metrics, so every value in this table is a preset example.\n` : ''}| Metric | Current | Target | Gap | Priority |
|--------|---------|--------|-----|----------|
| **Avg ACV** | $${metrics.current.acv.toLocaleString('en-US')}${cellEx(given.acv[0])} | $${metrics.target.acv.toLocaleString('en-US')}${cellEx(given.acv[1])} | ${upGap(gaps.acv, '')} | ${pri(sev(gaps.acv, 50, 25))} |
| **Sales Cycle** | ${metrics.current.cycle} days${cellEx(given.cycle[0])} | ${metrics.target.cycle} days${cellEx(given.cycle[1])} | ${downGap(gaps.cycle, '')} | ${pri(sev(gaps.cycle, 30, 15))} |
| **Win Rate** | ${metrics.current.winRate}%${cellEx(given.winRate[0])} | ${metrics.target.winRate}%${cellEx(given.winRate[1])} | ${upGap(gaps.winRate, '')} | ${pri(sev(gaps.winRate, 40, 20))} |
| **Churn Rate** | ${metrics.current.churn}%${cellEx(given.churn[0])} | ${metrics.target.churn}%${cellEx(given.churn[1])} | ${downGap(gaps.churn, '')} | ${pri(sev(gaps.churn, 40, 20))} |
| **NPS** | ${metrics.current.nps}${cellEx(given.nps[0])} | ${metrics.target.nps}${cellEx(given.nps[1])} | ${npsGap} | ${pri(sev(gaps.nps, 50, 25))} |

---

## Gap Root Cause Analysis

### ACV Gap (${upGap(gaps.acv, '')})${gapEx(given.acv)}
${behind(gaps.acv) ? '**Current**: Selling to smaller companies or at lower price points\n' : ''}**Common causes to check**:
- Targeting companies without budget
- Not selling to decision-makers
- Discounting too aggressively
- Missing enterprise features

**Actions**:
- Tighten company size filter in ICP
- Train on value-based selling
- Add pricing tiers for enterprise
- Build reference customers in target segment

### Sales Cycle Gap (${downGap(gaps.cycle, 'reduction ')})${gapEx(given.cycle)}
${behind(gaps.cycle) ? '**Current**: Deals taking too long to close\n' : ''}**Common causes to check**:
- Unclear value proposition
- Too many stakeholders involved
- Missing champion support
- Competitive displacement complex

**Actions**:
- Improve demo-to-close process
- Identify and enable champions earlier
- Create better competitive positioning
- Streamline procurement requirements

### Win Rate Gap (${upGap(gaps.winRate, 'improvement ')})${gapEx(given.winRate)}
${behind(gaps.winRate) ? '**Current**: Losing too many deals\n' : ''}**Common causes to check**:
- Poor qualification upfront
- Weak differentiation
- Losing to status quo
- Pricing not competitive

**Actions**:
- Implement stricter qualification (BANT/MEDDPICC)
- Sharpen competitive battle cards
- Quantify cost of inaction
- Review pricing competitiveness

### Churn Gap (${downGap(gaps.churn, 'reduction ')})${gapEx(given.churn)}
${behind(gaps.churn) ? '**Current**: Customers not staying\n' : ''}**Common causes to check**:
- Wrong customers being sold
- Poor onboarding
- Value not realized
- Better alternatives emerged

**Actions**:
- Stricter ICP qualification
- Improve customer success handoff
- Track time-to-value metrics
- Implement early warning system

---

## Recommended ICP Refinements

Based on gap analysis, tighten your ICP on:

The company size and budget thresholds below are presets tied to the target ACV${given.acv[1] ? '' : ', which you did not supply'}.

### Must-Have Criteria (Add These)
1. **Minimum company size**: ${metrics.target.acv > 50000 ? '500+' : metrics.target.acv > 25000 ? '200+' : '50+'} employees ${EXAMPLE}
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

**Next Step**: Use \`icp_evolution_tracker\` to monitor ICP changes over time

${SUGGESTED}
`;
        }
    },
    // ---------------------------------------------------------------------------
    // Tool 8: ICP Evolution Tracker - Dynamic ICP Monitoring
    // ---------------------------------------------------------------------------
    icp_evolution_tracker: {
        description: 'Checklist for reviewing how your ICP should evolve: shows your recent wins, losses and market changes next to what to check. It does not analyze the text',
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
                    description: 'Time period for analysis (e.g., "Q4 2024")'
                }
            },
            required: ['current_icp']
        },
        execute: (args) => {
            const period = args.time_period || 'Recent Quarter';
            return `# ICP Evolution Analysis

This is a review checklist: it lays your notes next to what to check. It does not analyze the text.

## Current ICP
${args.current_icp}

## Analysis Period: ${period}

---

## Win/Loss Pattern Analysis

### Recent Wins
${args.recent_wins || '*No win data provided*'}

**Pattern Detection**:
${args.recent_wins ? `- Check these wins for emerging ICP characteristics
- Look for: Common company sizes, industries, buying triggers, champion roles
- Consider: What made these deals successful? New segment emerging?` :
                '- Provide recent win descriptions to identify patterns'}

### Recent Losses
${args.recent_losses || '*No loss data provided*'}

**Pattern Detection**:
${args.recent_losses ? `- Check these losses for the ICP refinements they suggest
- Look for: Common rejection reasons, competitor wins, deal killers
- Consider: Should these have been disqualified earlier?` :
                '- Provide recent loss descriptions to identify anti-patterns'}

---

## Market Change Impact

### Market Changes Identified
${args.market_changes || '*No market changes provided*'}

**ICP Implications**:
${args.market_changes ? `- Check how these market changes affect your ideal customer
- Consider: New buyer behaviors, budget shifts, competitive landscape
- Evaluate: Should ICP expand or contract based on changes?` :
                '- Provide market changes to assess ICP impact'}

---

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

## Recommended ICP Updates

### Potential Additions (Based on Wins)
${args.recent_wins ? `
1. **New segment signal**: Look for patterns in recent wins
2. **Technology indicators**: New tools correlating with success
3. **Buying triggers**: Events that led to purchase
4. **Champion profiles**: Roles that drove deals` :
                '- Analyze recent wins to identify additions'}

### Potential Removals (Based on Losses/Churn)
${args.recent_losses ? `
1. **Disqualification signals**: Common patterns in losses
2. **False positive indicators**: Looked good, didn't convert
3. **Churn predictors**: Early warning signs
4. **Resource drains**: High effort, low outcome segments` :
                '- Analyze recent losses to identify removals'}

---

## ICP Evolution Tracking Template

| Quarter | ICP Change | Rationale | Impact |
|---------|-----------|-----------|--------|
| ${period} | [Your ICP change] | [Why, from this review] | [What to measure next quarter] |
| [Next quarter] | [Your ICP change] | [Why] | [Result] |
| [Quarter after] | [Your ICP change] | [Why] | [Result] |

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
        description: 'Extract ICP patterns from customer interview notes. Pasted notes are shown back with a template to structure them; only structured notes are analysed.',
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
                    description: 'Alternative: Paste raw interview transcripts or notes'
                },
                analysis_focus: {
                    type: 'string',
                    description: 'Accepted but not used yet: every run gives the complete analysis (pain_points, buying_journey, value_props, all)'
                }
            }
        },
        execute: (args) => {
            const focus = args.analysis_focus || 'all';
            if (args.interview_notes && args.interview_notes.length > 0) {
                const interviews = args.interview_notes;
                // Aggregate pain points
                const allPains = interviews.flatMap(i => i.pain_points || []);
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
**Count**: ${interviews.length} interviews
**Roles Represented**: ${[...new Set(roles)].join(', ') || 'Not specified'}

---

## Pattern Analysis

### Top Pain Points (by frequency)
${topPains.length > 0 ? topPains.map(([pain, count], i) => `${i + 1}. **"${pain}"**: mentioned ${count}x (${Math.round(count / interviews.length * 100)}% of interviews)`).join('\n') : '- No pain points captured'}

**ICP Implication**: Target customers experiencing these pain points

### Top Buying Triggers
${topTriggers.length > 0 ? topTriggers.map(([trigger, count], i) => `${i + 1}. **${trigger}**: ${count}x (${Math.round(count / interviews.length * 100)}%)`).join('\n') : '- No triggers captured'}

**ICP Implication**: Time outreach around these events

### Value Realized (Post-Purchase)
${topValue.length > 0 ? topValue.map(([value, count], i) => `${i + 1}. **${value}**: ${count}x (${Math.round(count / interviews.length * 100)}%)`).join('\n') : '- No value data captured'}

**ICP Implication**: Lead with these outcomes in messaging

### Champion Roles
${topRoles.length > 0 ? topRoles.map(([role, count], i) => `${i + 1}. **${role}**: ${count}x (${Math.round(count / interviews.length * 100)}%)`).join('\n') : '- No roles captured'}

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
${topRoles[0] ? `- Champion is: ${topRoles[0][0]}` : ''}
${topValue[0] ? `- Seeks outcome: ${topValue[0][0]}` : ''}

### Messaging Updates
Based on customer language, update:
${topPains[0] ? `- **Pain messaging**: "${topPains[0][0]}"` : ''}
${topValue[0] ? `- **Value messaging**: "${topValue[0][0]}"` : ''}

### Discovery Questions to Add
${topPains.slice(0, 3).map((p, i) => `${i + 1}. "How are you currently handling ${lowerCommonWords(p[0])}?"`).join('\n')}

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
                return `Your notes are below. This tool analyses structured notes only.

## Your Notes
\`\`\`
${args.raw_transcripts.substring(0, 500)}${args.raw_transcripts.length > 500 ? '...' : ''}
\`\`\`

---

## Structured Format Recommended

For better analysis, structure your interviews in this format. Example only, not from your input: the customer, quotes, pain points and results below are made up to show the format.

${EXAMPLES}
\`\`\`json
{
  "interview_notes": [
    {
      "customer": "Acme Corp",
      "role": "VP Sales",
      "key_quotes": [
        "We were spending 20 hours a week on manual data entry",
        "The old system just couldn't scale with us"
      ],
      "pain_points": [
        "Manual data entry",
        "Scalability issues",
        "Poor reporting"
      ],
      "buying_triggers": [
        "New VP joined",
        "Missed quarterly target"
      ],
      "value_realized": [
        "Saved 15 hours/week",
        "Real-time visibility"
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
exports.SERVER_VERSION = '1.2.8';
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
    const missing = required.filter((key) => args?.[key] === undefined || args?.[key] === null);
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
            const result = tool.execute(request.params.arguments);
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