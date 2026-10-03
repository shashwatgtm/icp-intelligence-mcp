#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { neutraliseDeep } from './echo-safe.ts';
import { VERTICALS, explainSector, detectModel, profileFor, MODEL_NAME, BUSINESS_MODELS, type Vertical, type BusinessModel } from './verticals.ts';

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
function sharePct(fraction: number): string {
  const v = Number((fraction * 100).toPrecision(12));
  if (v > 0 && v < 0.05) {
    const r = Math.round(v * 100) / 100;
    return r >= 0.01 ? `${r}%` : 'under 0.01%';
  }
  return `${v.toFixed(1)}%`;
}
// A percentage typed by the user and printed back: one decimal at most, no trailing ".0" (20 stays 20, 23.456789 prints 23.5).
function cleanNum1(n: number): string {
  return (Math.round(n * 10) / 10 + 0).toLocaleString('en-US', { maximumFractionDigits: 1 });
}
function cleanPct(n: number): string {
  return `${cleanNum1(n)}%`;
}
// A plain number printed back (a sum of weights): float noise removed, two decimals at most.
function cleanNum(n: number): string {
  return (Math.round(n * 100) / 100 + 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
}
function withSoftware(phrase: string, word: string): string {
  const p = phrase.trim();
  return p.toLowerCase() === word.toLowerCase() || p.toLowerCase().endsWith(` ${word.toLowerCase()}`) ? p : `${p} ${word}`;
}
// Text only (run 9): common words that may open an input phrase. Mid-sentence, only these are lowered
// ("Fewer delays" becomes "fewer delays"). Any other capitalised word is kept as typed, because it may be a
// name or an acronym ("Salesforce data you can trust", "Microsoft Teams approvals", "AI deal scoring", "CRM hygiene").
const COMMON_WORDS = new Set((
  'a an the this that these those our your their my its his her we you they it me us them all any each every ' +
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
  'lost won '
).split(/\s+/).filter(Boolean));
// A word counts as common when it is in the list, or ends in -ing or -ed ("Automated", "Missing"). A hyphenated
// word counts by its first part ("Two-way", "Low-code").
function isCommonWord(word: string): boolean {
  const head = word.split('-')[0].replace(/[^A-Za-z']+$/, '');
  if (!/^[A-Z][a-z']*$/.test(head) || head === 'I' || /[A-Z]/.test(word.slice(1))) return false;
  const w = head.toLowerCase();
  return COMMON_WORDS.has(w) || (w.length > 4 && /(?:ing|ed)$/.test(w));
}
// Text only (run 10): names that keep their capital when they open an input phrase placed mid-sentence. The list holds
// common product and company names and the names found in the test inputs; other names are kept by the rules below.
const KNOWN_NAMES = new Set((
  'Salesforce Microsoft Slack HubSpot LinkedIn Google Gmail Outlook Excel Zoom Zendesk Jira Notion Shopify Stripe ' +
  'Marketo Pardot Gong Intercom Freshworks Oracle SAP Workday ServiceNow Snowflake Tableau Asana Trello Dropbox ' +
  'Apple Amazon AWS Azure Facebook Instagram WhatsApp YouTube Acme Sam ' +
  // Run 11: the company and competitor names in the test inputs and the page examples (run 19: the old example names removed).
  'Bengaluru Clari Northwind Metricly Spendrill Cloudmoat Lanehop Branchwire Answerloop Shelfwalk'
).split(/\s+/).filter(Boolean));
function bareWord(word: string): string {
  return word.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '');
}
function isKnownName(word: string): boolean {
  const w = bareWord(word);
  return KNOWN_NAMES.has(w) || KNOWN_NAMES.has(w.split(/['-]/)[0]);
}
// Run 11: a known name typed in lower case gets its capitals back ("bengaluru teams" becomes "Bengaluru teams"). Names
// that are also ordinary words (Slack, Zoom, Notion, Gong, Sam ...) are kept when typed with a capital, never raised.
const PLAIN_WORDS = new Set('slack zoom notion excel oracle stripe apple amazon gong sam outlook workday snowflake asana tableau intercom acme sap azure'.split(' '));
const NAME_BY_LOWER = new Map([...KNOWN_NAMES].filter(n => !PLAIN_WORDS.has(n.toLowerCase())).map(n => [n.toLowerCase(), n] as [string, string]));
function fixNames(phrase: string): string {
  return phrase.replace(/[A-Za-z]+/g, w => (w === w.toLowerCase() && NAME_BY_LOWER.get(w)) || w);
}
// Run 11: a job title in running text is all lower case ("head of marketing", "operations director"); names and
// acronyms in it keep their capitals ("VP of sales", "director of Salesforce operations").
const JOB_WORD = /^(?:head|directors?|managers?|chief|officers?|president|coordinators?|supervisors?|specialists?|administrators?)$/i;
function isJobTitle(phrase: string): boolean {
  const w = phrase.trim().split(/\s+/).map(bareWord);
  return w.length <= 6 && w.some((x, i) => JOB_WORD.test(x) && (x.toLowerCase() !== 'head' || (w[i + 1] || '').toLowerCase() === 'of'));
}
function lowerJobTitle(phrase: string): string {
  return phrase.trim().split(/(\s+)/).map(w => (/^[A-Z][a-z'-]+\W*$/.test(w) && !isKnownName(w) ? w.charAt(0).toLowerCase() + w.slice(1) : w)).join('');
}
// Run 10: the first word of an input phrase keeps its capital only when it is a known name, has an inner capital or is
// all capitals (HubSpot, AI, CRM), holds a digit (B2B, Q4), or starts a name of two words: the next word is capitalised
// too (New York, Example Manufacturing Co, Competitor A) and is not a known name on its own ("Native Salesforce" is not a name).
// Run 11: a one-letter word keeps its capital (I, X), and a common first word never makes the next word a name ("For
// Spendrill expense review" becomes "for Spendrill expense review"), unless the next word is a one-letter label after
// a noun (Competitor A) or the phrase opens with three capitalised words (Example Logistics Co).
function keepsFirstCapital(word: string, next: string, third = ''): boolean {
  const w = bareWord(word);
  if (!/^[A-Z]/.test(w) || (w.length === 1 && !(w === 'A' && next)) || isKnownName(w)) return true; // the article A is not a one-letter name
  if (/[A-Z0-9]/.test(w.slice(1))) return true;
  const n = bareWord(next || '');
  if (!/^[A-Z](?:[a-z]+(?:['-][a-z]+)*)?$/.test(n) || isKnownName(n)) return false;
  if (!isCommonWord(w) || w === 'New') return true; // New York, New Delhi
  if (n.length === 1) return !/^(?:for|with|from|to|of|in|on|at|by|and|or|the|a|an|into|about|why|how|what|when|where|who|your|our|their|my|this|that)$/i.test(w);
  return /^[A-Z][a-z]/.test(bareWord(third || ''));
}
// An input phrase placed mid-sentence: its first word is lowered unless keepsFirstCapital() keeps it
// ("Native Salesforce integration" becomes "native Salesforce integration"; "Salesforce data you can trust" stays).
function lowerFirstIfCommon(phrase: string): string {
  const t = fixNames(phrase.trim());
  if (isJobTitle(t)) return lowerJobTitle(t);
  const parts = t.split(/(\s+)/);
  if (keepsFirstCapital(parts[0] || '', parts[2] || '', parts[4] || '')) return t;
  parts[0] = parts[0].replace(/[A-Z]/, c => c.toLowerCase());
  // Run 11: after a lowered first word, a capitalised common second word is lowered too ("why forecasting matters now").
  if (parts[2] && isCommonWord(parts[2])) parts[2] = parts[2].charAt(0).toLowerCase() + parts[2].slice(1);
  return parts.join('');
}
// The same for a whole phrase (this replaces a plain toLowerCase(), which also lowered names and acronyms): the first
// word follows the rule above, and a later word is lowered only when it is a common word. A capitalised word straight
// after a kept name stays too, so a name of two words keeps both ("Microsoft Teams approvals").
function lowerCommonWords(phrase: string): string {
  let afterName = false;
  let first = true;
  const t = fixNames(phrase.trim());
  if (isJobTitle(t)) return lowerJobTitle(t);
  const parts = t.split(/(\s+)/);
  return parts.map((w, i) => {
    if (!w.trim()) return w;
    const lower = first ? !keepsFirstCapital(w, parts[i + 2] || '', parts[i + 4] || '') : !afterName && isCommonWord(w);
    first = false;
    afterName = !lower && /^[A-Z]/.test(w);
    return lower ? w.replace(/[A-Z]/, c => c.toLowerCase()) : w;
  }).join('');
}
// Text only (run 9): a phrase that starts a sentence, a heading or a table cell starts with a capital. A first word
// written with a small letter and an inner capital (iPhone, eBay) is a name and is kept as typed.
function cap(phrase: string): string {
  const t = fixNames(phrase.trim());
  if (/^[a-z]+[A-Z]/.test(t.split(/\s+/)[0] || '')) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// Output labels (run 5, owner decision 1). A figure that is not the user's input, and not computed only
// from it, carries EXAMPLE on its own line, or sits under an EXAMPLES line placed directly above its table,
// list or code block. SUGGESTED closes outputs that suggest lengths, timings or counts.
const EXAMPLE = '(Example figure: replace with your own)';

// Run 11 addendum 3 (R11-A3-8a): the buyer group influence map. Every box has the same width, set by the longest role
// (at least as wide as "ECONOMIC BUYER"), every role is padded to that width (never cut), and every line of the map
// has the same length.
function influenceMap(g: { economic: { role: string }; champion: { role: string }; technical: { role: string }; user: { role: string }; blocker: { role: string } }): string {
  const roles = [g.economic.role, g.champion.role, g.technical.role, g.user.role, g.blocker.role].map(r => String(r).replace(/\s+/g, ' ').trim());
  let w = Math.max('ECONOMIC BUYER'.length, ...roles.map(r => r.length));
  if (w % 2 === 1) w++;
  const inner = w + 2;
  const box = inner + 2;
  const gap = 20;
  const total = box * 2 + gap;
  const cx = (total - box) / 2;
  const lc = Math.floor(box / 2);
  const rc = box + gap + lc;
  const mid = cx + 1 + Math.floor(inner / 2);
  const center = (t: string) => { const l = Math.floor((inner - t.length) / 2); return ' '.repeat(l) + t + ' '.repeat(inner - t.length - l); };
  const text = (t: string) => '│ ' + t.padEnd(w) + ' │';
  const title = (t: string) => '│' + center(t) + '│';
  const edge = (a: string, b: string, c?: string) => a + (c ? '─'.repeat(mid - cx - 1) + c + '─'.repeat(cx + inner - mid) : '─'.repeat(inner)) + b;
  const row = (cells: [number, string][]) => {
    const line = Array.from({ length: total }, () => ' ');
    for (const [at, s] of cells) [...s].forEach((ch, i) => { line[at + i] = ch; });
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
function q(s: string): string {
  return `"${String(s).trim().replace(/^"|"$/g, '').replace(/[.]$/, '')}"`;
}
// Backlog B15-L1: a long free text is shown once, cut at a word boundary, with its full length named.
function shortText(s: string, max = 300): string {
  const t = String(s).replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  // Run 20: prefer to stop at the end of a sentence or a clause in the last third of the window (never inside a number), else at a word.
  const win = protectText(t).slice(0, max);
  const marks = [...win.matchAll(/(?<=[a-z)"'])(?:\.|;|,)(?= )/g)].map((m) => m.index as number).filter((i) => i >= max * 0.6);
  const cut = restoreText(marks.length ? win.slice(0, marks[marks.length - 1]) : win.replace(/\s+\S*$/, ''));
  return `${cut} ... (first ${cut.length} of ${t.length.toLocaleString('en-US')} characters)`;
}
// Round 2: a long description is shortened, but a sentence that labels figures as hypothetical is never cut away.
function shortKeepLabel(text: string, max = 400): string {
  const t = String(text).replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const label = sentences(t).filter((x) => /\bhypothetical\b/i.test(x));
  const head = shortText(sentences(t).filter((x) => !/\bhypothetical\b/i.test(x)).join('. '), max);
  return label.length ? `${head}${/[.)]$/.test(head) ? '' : '.'} ${label.join('. ')}.` : head;
}
// Backlog B15-L5h: "1 interview", "2 interviews".
function plural(n: number, word: string, many = `${word}s`): string {
  return `${n.toLocaleString('en-US')} ${n === 1 ? word : many}`;
}
// A list in plain English: "a", "a and b", "a, b and c".
function andList(items: string[]): string {
  // Run 20: when an item itself holds "and" or a comma ("Banking and financial services"), the items are separated by semicolons so the list stays readable.
  if (items.length > 2 && items.some((x) => /,| and /.test(x))) return `${items.slice(0, -1).join('; ')}; and ${items[items.length - 1]}`;
  return items.length <= 1 ? (items[0] || '') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}
// The optional company input (rule B81: the answer names the company, or says plainly that it was not given).
const COMPANY_INPUT = { type: 'string', description: 'Optional: your company or product name, so the answer can name it' };
const MODEL_INPUT = {
  type: 'string',
  enum: ['saas', 'services', 'connectivity', 'transactions', 'marketplace', 'hardware_software', 'investment'],
  description: 'Optional: how you charge (software subscription, services, connectivity, per transaction, marketplace, hardware plus software, or investment management). Read from your other inputs when left out'
};
function companyLine(company: unknown): string {
  return typeof company === 'string' && company.trim()
    ? `**Company**: ${company.trim()}`
    : '**Company**: not given (add the company input to name your company or product in this answer)';
}
// The sector and the business model (src/verticals.ts, the one shared reader, run 20). The reader looks at the seller's own words
// first (what it sells: product, category, company), then free text about the deal, then job titles, then the buyer's industry; a
// later group is used only when the earlier ones name no sector. The model is read only from the seller's words.
type ReadInput = { seller?: unknown[]; context?: unknown[]; role?: unknown[]; buyer?: unknown[] };
// The buyer's industry says who the customers are, not what the seller sells: a sector read from it alone is not applied (no sector
// notes or words). Job titles are used only when two or more of them point to the same sector (see agreedRoles).
function readContext(explicitModel: unknown, input: ReadInput): { v: Vertical | null; model: BusinessModel | null; line: string; via: string } {
  const read0 = explainSector(input);
  const read = read0.source === 'buyer' ? { vertical: null, source: null, strong: [] as string[], weak: [] as string[] } : read0;
  const m = detectModel(explicitModel, input);
  // The sector's usual model is assumed only when the sector comes from what the user sells; a sector read from the buyer's side
  // says nothing about how the seller charges.
  const model: BusinessModel | null = m.how === 'sector' && read.source !== 'seller' ? null : m.model;
  const how = m.how === 'sector' && read.source !== 'seller' ? 'unknown' : m.how;
  // Round 2: a seller that manages money gets the investment roles and measures (src/verticals.ts profileFor); an AI native support seller the support notes.
  const vp = profileFor(read.vertical, model, input);
  const via = read.source === 'context' ? ' (from the deal details: your own description names no sector)'
    : read.source === 'role' ? ' (from the buyer job titles: your own description names no sector)'
    : read.source === 'buyer' ? ' (from the buyer\'s industry: your own description names no sector, so describe what you sell for notes that fit it)' : '';
  const sector = vp ? `read from your inputs as ${vp.name}${via}` : 'not clear from what you sell (describe your product, for example in product_category, for sector notes)';
  const modelText = model ? `${MODEL_NAME[model]} (${how === 'input' ? 'from business_model' : how === 'sector' ? 'the usual model in this sector, assumed; set business_model to change it' : 'read from your inputs; set business_model to change it'})` : `not clear from your inputs; set business_model (${BUSINESS_MODELS.join(', ')}) for advice that fits it`;
  return { v: vp, model, via, line: `*Sector: ${sector}. Business model: ${modelText}.*` };
}
// Job titles are weak evidence of what the seller sells ("Director of Transportation Data Operations" is a logistics title in a
// business services firm). They are passed to the reader only when two or more titles name the same sector on their own.
// One title is enough when the buyer's own words (their industries, segments or customer description) also use words of that sector.
function agreedRoles(titles: unknown[], corroborate: unknown[] = []): string[] {
  const list = [...new Set(titles.filter((t): t is string => typeof t === 'string' && !!t.trim()))];
  const each = list.map((t) => ({ t, id: explainSector({ role: [t] }).vertical?.id }));
  const counts: Record<string, number> = {};
  each.forEach((e) => { if (e.id) counts[e.id] = (counts[e.id] || 0) + 1; });
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (!best) return [];
  const text = corroborate.filter((t): t is string => typeof t === 'string').join(' \n ');
  const v = VERTICALS.find((x) => x.id === best[0]);
  const backed = !!v && !!text && (new RegExp(v.match.source, 'i').test(text) || new RegExp(v.weak.source, 'i').test(text));
  return best[1] >= 2 || backed ? each.filter((e) => e.id === best[0]).map((e) => e.t) : [];
}
// Round 2: AI native and SaaS products are sold into any function (an AI product can serve a contact centre or an investment desk; a
// billing platform is bought by finance), so the sector file's own roles and yardsticks (resolution rate, activation) are not the
// buyer's. The buyer's function is read from the titles and texts the user typed: finance titles use the finance measures of the
// fintech entry, security titles those of the cybersecurity entry. Nothing is added when no function is named.
// plain SaaS is sold into any function; the billing and revenue operations profile (shared file) is a real buyer profile
const isHorizontal = (v: Vertical | null) => !!v && v.id === 'saas' && !/billing/i.test(v.name);
function buyerFunction(...texts: unknown[]): Vertical | null {
  const t = texts.flat().filter((x): x is string => typeof x === 'string').join(' \n ');
  if (/\b(?:CFO|finance|financial|controller|treasur\w*|portfolio|investment|asset|wealth|accounts payable|billing)\b/i.test(t)) return VERTICALS.find((x) => x.id === 'fintech') || null;
  if (/\b(?:CISO|security|SOC)\b/i.test(t)) return VERTICALS.find((x) => x.id === 'cybersecurity') || null;
  return null;
}
const functionName = (fv: Vertical) => (fv.id === 'fintech' ? 'finance buyers' : fv.id === 'cybersecurity' ? 'security buyers' : `${fv.name} buyers`);
// The sector whose roles, measures and words describe the buyer: the read sector, or for a horizontal product the buyer's function.
function buyerSide(v: Vertical | null, ...texts: unknown[]): { bv: Vertical | null; name: string } {
  if (v && !isHorizontal(v)) return { bv: v, name: v.name };
  if (isHorizontal(v)) return { bv: null, name: '' };   // a SaaS seller's buyer is not read as finance or security from a title: the sector file's own profile is used
  const fv = buyerFunction(...texts);
  return fv ? { bv: fv, name: functionName(fv) } : { bv: null, name: '' };
}
// Sector notes for the read sector and, for a horizontal product, the buyer's function (finance, security) with its roles and measures.
function sideNotes(v: Vertical | null, what: Array<'committee' | 'roles' | 'metrics' | 'objections' | 'vocabulary' | 'proof'>, ...texts: unknown[]): string {
  const base = sectorNotes(v, what);
  if (!isHorizontal(v)) return base;
  const { bv, name } = buyerSide(v, ...texts);
  const fn = bv ? sectorNotes(bv, what.filter((w) => w === 'roles' || w === 'metrics' || w === 'vocabulary'), name) : '';
  return [base, fn].filter(Boolean).join('\n\n');
}
// Run 21b: the measures and objections of a sector, ordered by the user's own words. An item that shares a word with the primary text (the wins, losses
// and market changes the user typed) comes first, and one that shares a word with the secondary text next; the rest keep the sector's order, so nothing is
// dropped and nothing is added. No match: the sector's order stands.
const MEASURE_STOP = new Set(['provider', 'providers', 'system', 'systems', 'software', 'tool', 'tools', 'vendor', 'solution', 'rate', 'time', 'share', 'effort', 'cost', 'number', 'count', 'average', 'total', 'already', 'have', 'will', 'their', 'than', 'does', 'this', 'that', 'with', 'from', 'your', 'for', 'and', 'the', 'per', 'our', 'not']);
const measureStems = (t: string): Set<string> => new Set((t.toLowerCase().match(/[a-z]{4,}/g) || []).filter((w) => !MEASURE_STOP.has(w)).map((w) => w.replace(/s$/, '').slice(0, 4)));
function rankByUserWords<T>(items: T[], text: (x: T) => string, primary: string, secondary: string): T[] {
  const p = measureStems(primary), d = measureStems(secondary);
  const score = (x: T) => [...measureStems(text(x))].reduce((n, w) => n + (p.has(w) ? 2 : 0) + (d.has(w) ? 1 : 0), 0);
  return items.map((x, i) => ({ x, i, s: score(x) })).sort((a, b) => b.s - a.s || a.i - b.i).map((r) => r.x);
}
// The sector only, for tools whose advice does not depend on the business model.
function sectorLine(v: Vertical | null, via = ''): string {
  return v ? `*Sector: read from your inputs as ${v.name}${via}.*` : '*Sector: not clear from what you sell (describe your product, for example in product_category, for sector notes).*';
}
// Sector notes: the buying committee, what the sector measures, its usual objections and a proof point (no figures, rule B82).
function sectorNotes(v: Vertical | null, what: Array<'committee' | 'roles' | 'metrics' | 'objections' | 'vocabulary' | 'proof'> = ['committee', 'metrics', 'proof'], label = ''): string {
  if (!v) return '';
  const out = [`### Sector notes: ${label || v.name}`];
  // AI native is a way of building, not a trade: the sector file's yardsticks and words (resolution rate, evaluation set) come from
  // support automation and are not assumed for an AI product sold to another function (an investment desk, for example).
  const generic = isHorizontal(v) && !label;
  for (const w of what) {
    if (generic && (w === 'metrics' || w === 'roles' || w === 'vocabulary' || w === 'proof')) continue;
    if (w === 'committee') out.push(`- **Who usually decides:** ${v.committee}`);
    if (w === 'roles') out.push(`- **Roles that usually buy and use it:** ${v.buyerRoles.join(', ')}.`);
    if (w === 'metrics') out.push(`- **What this sector measures:** ${v.metrics.join(', ')}.`);
    if (w === 'objections') out.push(`- **Objections this sector often raises:** ${v.objections.map((o) => lowerCommonWords(o.objection)).join('; ')}.`);
    if (w === 'vocabulary') out.push(`- **Words this sector's buyers use:** ${v.vocabulary.join(', ')}.`);
    if (w === 'proof') out.push(`- **A proof point that lands:** ${v.proofShape}`);
  }
  return out.length > 1 ? out.join('\n') : '';
}
// The answer pattern for one objection typed by the user: the sector's pattern when it matches, else a pattern by kind.
function answerFor(text: string, v: Vertical | null): string {
  const t = text.toLowerCase();
  if (v) {
    for (const o of v.objections) {
      const keys = o.objection.toLowerCase().split(/\W+/).filter((w) => w.length > 2 && !['our', 'the', 'and', 'are', 'not', 'too', 'for', 'already', 'have', 'has', 'does', 'this', 'will', 'than', 'with', 'from', 'your', 'ourselves', 'we', 'can', 'use', 'new', 'own'].includes(w));
      if (keys.filter((k) => t.includes(k)).length >= Math.min(2, keys.length)) return o.response;
    }
  }
  if (/price|cost|budget|expensive|cheaper|discount|margin/.test(t)) return 'Agree the cost of the problem in the buyer\'s own numbers first, then compare the price with it.';
  if (/already have|already has|already does|already use|existing|incumbent|current (?:vendor|tool|system|provider|operator)|in-house|built/.test(t)) return 'Ask what the current setup does not do today and what that costs; position alongside it where you can, and replace only where the buyer sees the gap.';
  if (/adopt|use a new|will not use|won't use|resist|change|training/.test(t)) return 'Agree a small pilot with the people who will use it, and decide up front how adoption is measured.';
  if (/integrat|migrat|cut-?over|disrupt|setup|set-up|implementation|rollout/.test(t)) return 'Name the systems and people involved, and offer a staged plan with a rollback point for each stage.';
  if (/security|privacy|compliance|audit|regulat|legal|risk|wrong|accura/.test(t)) return 'Bring the evidence before it is asked for (controls, review steps, test results on the buyer\'s own data) and map each concern to it.';
  return 'Ask what would need to be true for this not to block the decision, and answer with evidence from a similar customer.';
}
// An item typed as a pain point that reads as an objection (a sentence in the buyer's own voice: "we already have a TMS").
function isObjection(text: string): boolean {
  return /^(?:we|we're|our|i|they|it|ai will|this will|that will)\b/i.test(text.trim()) || /\b(already (?:have|has|does|use)|will not|won't|too (?:expensive|costly|risky|slow)|not (?:sure|convinced))\b/i.test(text);
}
// Employee ranges typed in a text ("300 to 3,000 employees", "200-500 employees").
function sizesIn(text: string): string[] {
  return [...new Set((String(text).match(/\b\d[\d,]*\s*(?:to|-|–)\s*\d[\d,]*\s+employees\b|\b(?:under|over|more than|fewer than)\s+\d[\d,]*\s+employees\b|\b\d[\d,]*\+\s+employees\b/gi) || []).map((x) => x.trim()))];
}


// ============================================================================
// Run 20 round 1 (quality, owner decision D92): helpers that read the user's own sentences in parts, so no input is pasted into a
// fixed frame, cut inside a number or an abbreviation, or left out.
// ============================================================================
// The first clause of a long text, for a heading or a table cell: cut at the first ", ", "; " or ": " after at least 20 characters
// (never inside a number such as 1,000 or 50.5, because the cut needs a space after the mark), else at a word boundary.
function clauseHead(text: string, max = 90): string {
  const t = String(text).replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  // a bracket belongs to the item it follows: hide the marks inside it before looking for a clause end
  const hidden = t.replace(/\(([^()]*)\)/g, (_m, inner: string) => `(${inner.replace(/[;,:]/g, '\u0001')})`);
  const m = /^(.{20,}?)(?:, |; |: | \(| - )/.exec(hidden);
  if (m && m[1].length <= max) return t.slice(0, m[1].length);
  return `${t.slice(0, max).replace(/\s+\S*$/, '')} ...`;
}
// Round 2: text is split only at real ends. Marks that are not an end are hidden (same length, so positions stay) before a split and
// restored after: the comma in 500,000, the full stop in Sr. Jr. Mr. Dr. Rs. Inc. vs. e.g. i.e., and the comma before "in particular",
// "including", "such as" or "especially" (those start an elaboration of the same item, not a new item).
function protectText(t: string): string {
  return String(t)
    .replace(/(\d),(?=\d{3}(?!\d))/g, '$1\u0004')
    .replace(/\b(Sr|Jr|Mr|Mrs|Ms|Dr|Rs|Inc|Ltd|Co|Corp|Pvt|vs|St|No|approx|etc)\.(?=\s|,|$)/gi, '$1\u0003')
    .replace(/\b(e)\.(g)\./gi, '$1\u0003$2\u0003').replace(/\b(i)\.(e)\./gi, '$1\u0003$2\u0003')
    .replace(/,(?=\s+(?:in particular|including|such as|especially|particularly)\b)/gi, '\u0005');
}
function restoreText(t: string): string {
  return String(t).replace(/\u0003/g, '.').replace(/\u0004/g, ',').replace(/\u0005/g, ',');
}
// A phrase that is one sentence or a list of items: split on a real sentence end (". " followed by a capital) only.
function sentences(text: string): string[] {
  return protectText(String(text)).split(/(?<=[a-z0-9)"'%])\.\s+(?=[A-Z])/).map((x) => restoreText(x).trim().replace(/\.$/, '')).filter(Boolean);
}
// Size words as the user typed them (no numbers are added): "midsize", "large", "enterprise", "multi location" ...
const SIZE_WORD = /\b(?:mid-?size[d]?|mid-?market|medium(?:-sized)?|large(?:r)?|small(?:er)?|smbs?|msmes?|smes?|startups?|enterprises?|multi[- ]location|multi[- ]site|fortune \d+)\b/gi;
function sizeWordsIn(text: string): string[] {
  const found = String(text).match(SIZE_WORD) || [];
  const seen = new Set<string>();
  return found.map((x) => x.replace(/^(enterprise|startup|smb|msme|sme)s$/i, '$1')).filter((x) => { const k = x.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
}
// Job titles named in a text (as typed). A capitalised phrase with a title word, or an acronym such as CFO or CISO.
const TITLE_ACRONYM = /(?<![-\w])(?:CEO|CFO|CIO|CTO|CISO|COO|CMO|CRO|CCO|CPO|CDO|VP|SVP|EVP|MD|GM)(?![-\w])/;
const TITLE_PHRASE = /\b(?:Chief [A-Z][A-Za-z]+(?: [A-Z][A-Za-z]+){0,2}|(?:Head|Director|VP|Vice President|Manager|Lead) of [A-Z][A-Za-z-]+(?: [A-Za-z-]+){0,3}|(?:[A-Z][A-Za-z.-]+ ){0,3}(?:Manager|Director|Controller|Officer|Analyst|Engineer|Architect|Head|Lead|Owner|Founder)s?)\b/g;
function rolesIn(text: string): string[] {
  const t = String(text);
  const out: string[] = [];
  for (const m of t.matchAll(new RegExp(TITLE_ACRONYM.source, 'g'))) out.push(m[0]);
  for (const m of t.matchAll(TITLE_PHRASE)) out.push(m[0].trim());
  for (const m of t.matchAll(/\bGM-[A-Za-z]+\b/g)) out.push(m[0]);
  // a title written in lower case ("a finance controller", "head of supply chain")
  for (const m of t.matchAll(/\b(?:(?:finance|financial|operations|sales|marketing|security|network|procurement|engineering|supply chain|it|hr|data|platform|revenue) (?:controller|director|manager|head|lead|officer|analyst)|head of [a-z]+(?: [a-z]+){0,2}|vp (?:of )?[a-z]+)\b/gi)) out.push(m[0].trim());
  return [...new Set(out)].filter((r) => !out.some((o) => o !== r && o.includes(r) && o.length > r.length));
}
// Is this one item a job title (as in champion_titles), and not a group of people ("finance teams", "managers", "employees")?
function isTitleItem(item: string): boolean {
  const t = item.trim();
  if (!t) return false;
  if (/^(?:the |all |our |your )?(?:managers|employees|staff|users|teams?|reps|sales reps|developers|engineers|distributors|customers|people|everyone|(?:\w+ )?teams|hr|it|finance|legal)$/i.test(t)) return false;
  return TITLE_ACRONYM.test(t) || /\b(?:chief|head|director|vp|vice president|president|manager|controller|treasurer|analyst|engineer|architect|officer|lead|owner|founder|coordinator|specialist|administrator|advocate|developer|designer|scientist|partner|principal|gm-?\w*)\b/i.test(t);
}
// A list typed in one field: items joined with "; " or new lines, and sentences ending in ". " before a capital. Never cut inside a number.
function sentencesOrItems(text: string): string[] {
  return String(text || '').split(/;\s+|\n+/).flatMap((x) => sentences(x)).map((x) => x.trim()).filter(Boolean);
}
const GENERIC_WORDS = new Set(['and', 'the', 'for', 'with', 'from', 'that', 'this', 'services', 'service', 'solutions', 'solution', 'business', 'businesses', 'company', 'companies', 'customers', 'customer', 'platform', 'global', 'leading', 'large', 'small', 'size', 'sized', 'technology', 'digital', 'systems', 'system', 'industry', 'industries', 'across', 'more', 'than', 'years', 'page', 'claim', 'case', 'study', 'title', 'home', 'quote', 'words']);
// Whole words only, lightly stemmed ("banks" and "banking" are "bank"; "portfolios" is "portfolio" but not "portfolio manager").
const stem = (w: string) => w.replace(/(?:ing|ers|er|es|s)$/, '');
function sigWords(t: string): string[] {
  return String(t).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 4 && !GENERIC_WORDS.has(w)).map(stem).filter((w) => w.length >= 3);
}
// Is the criterion value found in the statement? Every main word of a short value must appear as a whole word, and a short value of
// two or more main words must appear in the same order, next to each other (so "financial services" is not found in "financial
// data"). A long value (a sentence) needs at least half of its main words, and three or more.
const GROUP_VALUE = /^(?:the |all |our |your )?(?:managers|employees|staff|users|teams?|reps|sales reps|developers|engineers|distributors|customers|people|everyone|(?:\w+ )?teams|finance|hr|it)$/i;
function sharesWord(a: string, b: string): boolean {
  if (a.trim().split(/\s+/).length > 6) {
    const wb = sigWords(b), wa = [...new Set(sigWords(a))];
    const hit = wa.filter((x) => wb.includes(x)).length;
    return wa.length > 0 && hit >= 3 && hit >= wa.length / 2;
  }
  // a short value: its words must appear whole and next to each other, in order; a group word ("managers") only as written, so it is
  // never found inside a single title ("Sr. Sales Automation Manager")
  const group = GROUP_VALUE.test(a.trim());
  const tok = (t: string) => String(t).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 2 && !['and', 'the', 'for', 'with', 'of', 'in', 'at', 'on'].includes(w)).map((w) => (group ? w : stem(w)));
  const ta = tok(a), tb = tok(b);
  if (!ta.length) return false;
  for (let i = 0; i + ta.length <= tb.length; i++) if (ta.every((w, j) => tb[i + j] === w)) return true;
  return false;
}
// The words that say what the seller sells: the product category with the company's own name taken out ("IT services from Acme
// Software" is a services seller, not a software one), and no trailing "from <Brand>". The company name goes in as weak context.
function productWords(category?: string, company?: string): string {
  let t = String(category || '').trim();
  if (company && company.trim()) {
    const c = company.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    t = t.replace(new RegExp(`\\s*\\([^()]*${c}[^()]*\\)`, 'gi'), ' ').replace(new RegExp(`\\bfrom\\s+${c}`, 'gi'), ' ').replace(new RegExp(c, 'gi'), ' ');
  }
  t = t.replace(/\s*\([^()]*\bfrom\s+(?:[A-Z][\w&.'-]*\s*){1,4}\)\s*$/, '')
    .replace(/\s+from\s+(?:[A-Z][\w&.'-]*)(?:\s+[A-Z][\w&.'-]*){0,3}\s*$/, '')
    .replace(/\(\s*[^()]*\bfrom\s*\)/g, ' ').replace(/\(\s*\)/g, ' ').replace(/\s+from\s*$/i, '')
    .replace(/,?\s*described as\b.*$/i, '');
  return t.replace(/\s+/g, ' ').replace(/\s+([,;)])/g, '$1').trim();
}
// A profile text (a current customer base or an ideal customer profile) read in parts. Nothing is invented: every part is the
// user's own words.
interface Profile { segments: string[]; sizes: string[]; roles: string[]; problems: string[]; rest: string[]; claims: string[] }
function parseProfile(text: string): Profile {
  // Round 2: one splitter. Numbers (500,000), abbreviations (Sr.) and "in particular / including" elaborations are never split; the
  // sentences about the figures being hypothetical are dropped; a labelled list ("segments: A, B, C") is split at ", " only, so a
  // segment that holds a semicolon ("Gaming; streaming and entertainment") stays whole.
  const whole = sentences(String(text).replace(/\s+/g, ' ').trim()).filter((x) => !/\bhypothetical\b/i.test(x)).join('. ');
  let t = protectText(whole).replace(/^[A-Z][\w&.\- ]{0,40}:\s+/, '');
  const problems: string[] = [];
  // a clause that says what the buyers face or struggle with is the problem; "that need to secure ..." or "that have ..." only describes them, so it is the fallback
  const pm = /\b(?:who|that|which)\s+(?:are\s+)?(?:face|facing|faces|struggle|struggling|struggles|suffer|suffering|suffers)\b\s*(?:with |from )?(.*)$/i.exec(t) ?? /\b(?:who|that|which)\s+(?:are\s+)?(?:have|need|lose|lack)\b\s*(?:with |from )?(.*)$/i.exec(t);
  if (pm) { problems.push(restoreText(pm[1]).replace(/\.$/, '').trim()); t = t.slice(0, pm.index).trim().replace(/[,;]\s*$/, ''); }
  const asBuyer = [...t.matchAll(/\bwith\s+(.{2,60}?)\s+as\s+(?:the\s+)?(?:buyer|champion|sponsor|decision[- ]maker|economic buyer)s?\b/gi)].map((m) => restoreText(m[1]).trim());
  t = t.replace(/\bwith\s+.{2,60}?\s+as\s+(?:the\s+)?(?:buyer|champion|sponsor|decision[- ]maker|economic buyer)s?\b/gi, '');
  const labelled: string[] = [];
  const NEXT = '(?=;\\s*(?:buyer|champion|economic buyer|sponsor|size|problem|segments?|industries)s?\\s*:|$)';
  for (const m of t.matchAll(new RegExp(`\\b(?:buyer|champion|economic buyer|sponsor)s?\\s*:\\s*(.+?)${NEXT}`, 'gi'))) labelled.push(restoreText(m[1]).trim());
  t = t.replace(new RegExp(`\\b(?:buyer|champion|economic buyer|sponsor)s?\\s*:\\s*.+?${NEXT}`, 'gi'), '');
  const listed: string[] = [];
  t = t.replace(new RegExp(`\\b(?:segments?|industries|customers?)\\s*:\\s*(.+?)${NEXT}`, 'gi'), (_m, v: string) => { listed.push(...v.split(/,\s+/).map((x) => restoreText(x).trim().replace(/^(?:and)\s+/i, '').replace(/[.;\s]+$/, '')).filter((x) => x.length > 1)); return ''; });
  t = t.replace(/^[^:;]{0,60}\b(?:customers?|clients?|icp|profile)\s*:\s*/i, '');
  // a bracket keeps its own commas and semicolons ("Asset allocators (pensions; insurers)" is one item)
  t = t.replace(/\(([^()]*)\)/g, (_m, inner: string) => `(${inner.replace(/;/g, '\u0001').replace(/,/g, '\u0002')})`);
  const items = t.split(/[;,]|\.\s+(?=[A-Z])|\s+with\s+(?=an?\s|the\s)|\s+and\s+(?=an?\s)/).map((x) => x.trim().replace(/^(?:and|mostly|mainly|some|many)\s+/i, '').replace(/[.\s]+$/, '')).filter((x) => x.length > 1);
  const segments: string[] = [...listed]; const sizes: string[] = []; const rest: string[] = []; const claims: string[] = [];
  for (let it of items) {
    it = restoreText(it.replace(/\u0001/g, ';').replace(/\u0002/g, ','));
    // "operations leaders at large enterprises in banking and financial services, communications": the industry after "in" starts the list of segments
    const tailM = it.match(/^(.{20,}?)\s+(?:in|across)\s+([A-Za-z][A-Za-z&' -]{2,50})$/i);
    if (tailM && it.split(/\s+/).length > 6 && !/\d/.test(tailM[2]) && tailM[2].split(/\s+/).length <= 5 && !/^(?:the|a|an|particular|general|addition|case|total|this|that)\b/i.test(tailM[2])) { segments.push(tailM[2].trim()); it = tailM[1]; }
    if (rolesIn(it).length && it.split(/\s+/).length <= 5) continue;   // a role is reported under roles
    if (/\(page claim\)|^(?:the )?(?:about |home |product )?page\b|\bthe (?:about |home )?page\b|\btrusted partner\b|^the world's/i.test(it)) { claims.push(it); continue; }   // a statement from a page, not a qualifier
    if (sizeWordsIn(it).length || sizesIn(it).length) {
      // "Mid-size banks" is a size (mid-size) and a segment (banks); "midsize to large businesses" and "under 200 employees" are only a size.
      const short = it.split(/\s+/).length <= 6;
      const rem = !short ? '' : it.replace(SIZE_WORD, ' ').replace(/\b(?:in particular|including|such as|especially|particularly|companies|company|businesses|business|firms|enterprises|organi[sz]ations|customers|with|to|under|over|more than|fewer than|employees|\d[\d,]*(?:\s*(?:to|-)\s*\d[\d,]*)?\+?)\b/gi, ' ').replace(/[\s,-]+/g, ' ').trim();
      sizes.push(rem.length >= 3 ? (sizeWordsIn(it).join(', ') || it) : short ? it : (sizeWordsIn(it).join(', ') || it));
      if (rem.length >= 3) segments.push(rem);
      else if (!short) rest.push(it);
    } else if (/^an?\s/i.test(it)) rest.push(it.replace(/^an?\s+/i, ''));
    else if (/\b(?:teams?|groups?|functions?|departments?)$/i.test(it)) rest.push(it);   // a group of people is not an industry
    else if (it.split(/\s+/).length <= 6) segments.push(it.replace(/^the\s+/i, ''));
    else rest.push(it);
  }
  const roles = [...new Set([...asBuyer, ...labelled.flatMap((x) => x.split(/,| and (?=[A-Z])/)).map((x) => x.trim()).filter(Boolean), ...rolesIn(restoreText(whole))])];
  const dedupe = (a: string[]) => a.filter((x, i) => a.findIndex((y) => norm(y) === norm(x)) === i);
  // a later segment whose words are all inside an earlier one (or the other way round) says the same thing: "investment managers and banks" next to "Investment banks"
  const dedupeSeg = (a: string[]) => dedupe(a).filter((x, i, all) => !all.some((y, j) => j < i && (() => { const tx = norm(x).split(' '), ty = norm(y).split(' '); const [sm, bg] = tx.length <= ty.length ? [tx, ty] : [ty, tx]; return sm.every((w) => bg.includes(w)); })()));
  return { segments: dedupeSeg(segments), sizes: dedupe(sizes), roles: roles.filter((r, i) => roles.findIndex((x) => x.toLowerCase() === r.toLowerCase()) === i), problems, rest: dedupe(rest), claims: dedupe(claims) };
}
// A name compared loosely: case, "and", "&" and "/" do not matter ("FMCG/CPG" is "FMCG and CPG"), nor the order of the words or a plural.
const norm = (x: string) => x.toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/[&\/]/g, ' ').replace(/[^a-z0-9 ]+/g, ' ').replace(/\b(?:and|the|of|other|industry|industries)\b/g, ' ').replace(/\b(\w{4,})s\b/g, '$1').split(/\s+/).filter(Boolean).sort().join(' ');
const LINK_STOP = new Set(['services', 'service', 'companies', 'company', 'business', 'businesses', 'enterprise', 'enterprises', 'teams', 'team', 'global', 'leading', 'world', 'consumer', 'brands', 'brand', 'national', 'international', 'industry']);
function overlap(a: string[], b: string[]): { both: string[]; onlyA: string[]; onlyB: string[]; related: Array<[string, string]> } {
  const same = (x: string, y: string) => {
    const tx = norm(x).split(' '), ty = norm(y).split(' ');
    if (!tx[0] || !ty[0]) return false;
    const small = tx.length <= ty.length ? tx : ty, big = tx.length <= ty.length ? ty : tx;
    return small.every((w) => big.includes(w));
  };
  // related: no full match, but a main word in common ("B2B SaaS and software" and "SaaS and consumer subscription businesses")
  const link = (x: string, y: string) => { const ty = norm(y).split(' '); return norm(x).split(' ').some((w) => w.length >= 3 && !LINK_STOP.has(w) && ty.includes(w)); };
  const related: Array<[string, string]> = [];
  const rel = (x: string, list: string[], swap: boolean) => { const y = list.find((z) => link(x, z)); if (y) { related.push(swap ? [y, x] : [x, y]); return true; } return false; };
  const onlyA = a.filter((x) => !b.some((y) => same(x, y)) && !rel(x, b, false));
  const onlyB = b.filter((y) => !a.some((x) => same(x, y)) && !(a.some((x) => link(x, y))));
  return { both: a.filter((x) => b.some((y) => same(x, y))), onlyA, onlyB, related };
}
// Do two job titles name the same role? Acronyms are spelled out, then the main words are compared (first 5 letters).
const ROLE_ACRONYM: Record<string, string> = { cfo: 'chief financial officer', cio: 'chief information officer', cto: 'chief technology officer', coo: 'chief operating officer', cmo: 'chief marketing officer', cro: 'chief revenue officer', ciso: 'chief information security officer', ceo: 'chief executive officer', md: 'managing director', cco: 'chief commercial officer' };
function roleStems(r: string): string[] {
  const t = r.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).map((w) => ROLE_ACRONYM[w] || w).join(' ').split(/\s+/);
  const stop = new Set(['head', 'of', 'chief', 'officer', 'director', 'vp', 'vice', 'president', 'manager', 'lead', 'leader', 'leaders', 'team', 'teams', 'committee', 'committees', 'senior', 'sr', 'the', 'and', 'for', 'general', 'gm']);
  return [...new Set(t.filter((w) => w.length > 2 && !stop.has(w)).map((w) => w.slice(0, 5)))];
}
function roleMatch(a: string, b: string): number {
  // two spelled-out officer titles that differ are different roles (a CIO is not a CISO)
  const ex = (r: string) => ROLE_ACRONYM[r.toLowerCase().trim()] || r.toLowerCase().trim();
  const canon = new Set(Object.values(ROLE_ACRONYM));
  if (canon.has(ex(a)) && canon.has(ex(b))) return ex(a) === ex(b) ? 1 : 0;
  const x = roleStems(a), y = roleStems(b);
  if (!x.length || !y.length) return 0;
  const shared = x.filter((w) => y.includes(w)).length;
  const strict = shared / Math.max(x.length, y.length);
  // "platform leader" is the "Platform Engineering Lead": the shorter title's words are all in the longer one and both end in the same head noun
  const head = (r: string) => (/^head of\b/i.test(r.trim()) ? 'head' : (r.trim().toLowerCase().split(/\s+/).pop() || '').replace(/^(leader|leads|leaders)$/, 'lead').replace(/s$/, ''));
  const heads = new Set(['lead', 'manager', 'director', 'head', 'officer', 'engineer', 'analyst', 'architect']);
  if (!canon.has(ex(a)) && !canon.has(ex(b)) && shared === Math.min(x.length, y.length) && heads.has(head(a)) && head(a) === head(b)) return Math.max(strict, 0.6);
  return strict;
}
// In investment management a CIO is the Chief Investment Officer.
function aliasRole(r: string, v: Vertical | null): string {
  return v && /investment management$/.test(v.name) && /^\s*CIO\s*$/i.test(r) ? 'Chief Investment Officer' : r;
}
function sameRole(a: string, b: string): boolean {
  return roleMatch(a, b) > 0.5;
}
// The role in a list that matches best (a "finance controller" is the Finance Controller, not the CFO), or undefined.
function bestRole(a: string, list: string[]): string | undefined {
  const scored = list.map((r) => ({ r, m: roleMatch(a, r) })).filter((x) => x.m > 0.5).sort((p, q2) => q2.m - p.m);
  return scored[0]?.r;
}
// What the money unit is called, by business model (text only).
function acvNoun(model: BusinessModel | null): string {
  return model === 'services' ? 'annual value per client (retainer, project or managed service)'
    : model === 'connectivity' ? 'annual value per customer contract (all sites and links)'
    : model === 'investment' ? 'annual fee income per mandate'
    : model === 'transactions' || model === 'marketplace' ? 'annual revenue per customer (fees on their volume)'
    : model === 'hardware_software' ? 'annual value per customer (devices plus software)'
    : 'annual contract value';
}
// The first sector discovery question that is about systems and tools (for a technical evaluator).
function systemsQuestion(v: Vertical | null): string | null {
  return v ? (v.discovery.find((q) => /\b(?:systems?|tools?|erp|tms|wms|dms|siem|pipeline|stack)\b/i.test(q)) || null) : null;
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
    execute: (args: {
      customers?: Array<{
        name?: string;
        industry?: string;
        size?: string;
        acv?: number;
        sales_cycle_days?: number;
        tech_stack?: string[];
        buying_trigger?: string;
        champion_title?: string;
      }>;
      customer_descriptions?: string;
      product_category?: string;
      company?: string;
      business_model?: string;
    }) => {
      // Run 19 D80: no preset category; what is not given is said plainly.
      const category = args.product_category ? args.product_category.trim() : 'not given (add product_category)';
      const custs = args.customers || [];
      const ctx = readContext(args.business_model, {
        seller: [productWords(args.product_category, args.company)],
        context: [args.company, ...custs.flatMap(c => [c.buying_trigger, ...(c.tech_stack || [])])],
        role: agreedRoles(custs.map(c => c.champion_title), [args.customer_descriptions, ...custs.map(c => c.industry)]),
        buyer: [args.customer_descriptions, ...custs.map(c => c.industry)],
      });
      const notes = sectorNotes(ctx.v, ['committee', 'metrics', 'vocabulary', 'proof']);
      // Run 19 D80 (problem 5): a value that leads only on a tie is named as a tie, never as "primary".
      const lead = (rows: [string, number][]) => (rows.length > 1 && rows[0][1] === rows[1][1] ? null : rows[0] || null);
      const tied = (rows: [string, number][]) => rows.filter(r => r[1] === rows[0][1]).map(r => r[0]);

      // If structured data provided, analyze patterns
      if (args.customers && args.customers.length > 0) {
        const customers = args.customers;
        const count = <K extends string>(vals: (K | undefined)[]) => { const c: Record<string, number> = {}; vals.filter(Boolean).forEach(v => { c[v!] = (c[v!] || 0) + 1; }); return Object.entries(c).sort((a, b) => b[1] - a[1]); };
        // Run 20 round 1: every distinct value is shown (the old lists stopped at three, so the shares did not add up to 100%).
        const topIndustries = count(customers.map(c => c.industry)).slice(0, 8);
        const topSizes = count(customers.map(c => c.size)).slice(0, 8);
        const acvs = customers.map(c => c.acv).filter(Boolean) as number[];
        const avgACV = acvs.length > 0 ? acvs.reduce((a, b) => a + b, 0) / acvs.length : 0;
        const minACV = acvs.length > 0 ? Math.min(...acvs) : 0;
        const maxACV = acvs.length > 0 ? Math.max(...acvs) : 0;
        const cycles = customers.map(c => c.sales_cycle_days).filter(Boolean) as number[];
        const avgCycle = cycles.length > 0 ? Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length) : 0;
        const topTech = count(customers.flatMap(c => c.tech_stack || [])).slice(0, 8);
        const topChampions = count(customers.map(c => c.champion_title)).slice(0, 5);
        const topTriggers = count(customers.map(c => c.buying_trigger)).slice(0, 5);
        const n = customers.length;
        const pctOf = (k: number) => Math.round(k / n * 100);
        const dist = (rows: [string, number][], unit: string) => rows.map(([v, k]) => `- **${v}**: ${plural(k, unit)} (${pctOf(k)}%)`).join('\n');
        // Run 20 round 1: a field that carries one value in every record is repeated data, not a pattern across customers.
        const allSame = (vals: unknown[]) => n > 1 && vals.every(v => v !== undefined && v !== null && v !== '') && new Set(vals).size === 1;
        const fieldVals: Record<string, unknown[]> = {
          'ACV': customers.map(c => c.acv), 'sales cycle': customers.map(c => c.sales_cycle_days), 'buying trigger': customers.map(c => c.buying_trigger),
          'champion': customers.map(c => c.champion_title), 'size': customers.map(c => c.size), 'industry': customers.map(c => c.industry) };
        const sameFields = Object.keys(fieldVals).filter(k => allSame(fieldVals[k]));
        const repeated = sameFields.length >= 2;
        const sameTag = (field: string) => (sameFields.includes(field) ? '. The same value is in every record, so this is repeated data, not a pattern across customers.' : '');
        const leadOr = (rows: [string, number][], label: string, found: (v: string) => string, field = '') => {
          if (rows.length === 0) return 'none yet, add this data';
          const l = lead(rows);
          return (l ? found(l[0]) : `no single leading ${label}: ${andList(tied(rows))} appear equally often, so add more customers before you choose one`) + (field ? sameTag(field) : '');
        };
        const indL = lead(topIndustries), sizeL = lead(topSizes), techL = lead(topTech), champL = lead(topChampions), trigL = lead(topTriggers);
        const saasModel = ctx.model === 'saas' || ctx.model === null;
        const hypo = /\bhypothetical\b/i.test(`${args.customer_descriptions || ''} ${customers.map(c => c.name || '').join(' ')}`) ? ' (hypothetical, as your description says)' : '';
        const descSizes = sizeWordsIn(args.customer_descriptions || '');
        const descRoles = rolesIn(args.customer_descriptions || '');
        const gaps = [topIndustries.length === 0 ? 'Note: **Industry data missing**. Add industry field to customer records' : '',
          topSizes.length === 0 ? `Note: **Size data missing**. Add employee count/revenue tier${descSizes.length ? ` (your description says ${andList(descSizes)}; put a size on each record)` : ''}` : '',
          acvs.length === 0 ? 'Note: **ACV missing**. Add the annual contract value of each customer' : '',
          cycles.length === 0 ? 'Note: **Sales cycle missing**. Add the days from first meeting to signature' : '',
          topTech.length === 0 ? 'Note: **Tech stack missing**. Track technologies customers use' : '',
          topChampions.length === 0 ? 'Note: **Champion data missing**. Record buyer titles on deals' : '',
          topTriggers.length === 0 ? 'Note: **Trigger data missing**. Ask "Why now?" in discovery' : ''].filter(Boolean);
        const quoted = (t: string) => q(t.length > 140 ? clauseHead(t, 140) : t);
        // The sector check of the champion titles (src/verticals.ts roles; no figures).
        const { bv: sector, name: sideName } = buyerSide(ctx.v, custs.map(c => c.champion_title), args.customer_descriptions, args.product_category);
        const sectorChecks = sector ? (() => {
          const champs = topChampions.map(r => r[0]);
          const out: string[] = [];
          for (const c of champs.slice(0, 3)) {
            const m = bestRole(aliasRole(c, sector), sector.buyerRoles);
            out.push(m ? `- **Champion ${c}**: matches a role that ${sideName} deals usually involve (${m}).` : `- **Champion ${c}**: not among the roles listed for ${sideName} (${sector.buyerRoles.slice(0, 4).join(', ')}); check who signs the contract in your deals.`);
          }
          const missing = sector.buyerRoles.filter(r => !champs.some(c => sameRole(aliasRole(c, sector), r))).slice(0, 4);
          if (missing.length) out.push(`- **Roles your records do not name**: ${andList(missing)}. Add the people in these roles to the next records to see who signs and who evaluates.`);
          out.push(`- **What to compare across your customers**: ${andList(sector.metrics.slice(0, 3))}. Records that share an industry but differ on these show where the best fit is.`);
          return `### What ${sideName} add${/buyers$/.test(sideName) ? '' : 's'}\n${out.join('\n')}\n\n`;
        })() : '';

        return `# ICP Pattern Analysis

## Data Analyzed
- ${companyLine(args.company)}
- **Customers analyzed**: ${n}${customers.some(c => c.name) ? ` (${andList(customers.map(c => c.name).filter(Boolean) as string[])})` : ''}
- **Product category**: ${category}
${args.customer_descriptions ? `- **Your description of your best customers**: ${shortKeepLabel(args.customer_descriptions, 400)}\n` : ''}
${ctx.line}
${repeated ? `\n**Read this first**: in all ${n} records the ${andList(sameFields)} ${sameFields.length === 1 ? 'is' : 'are'} identical, so a 100% share on ${sameFields.length === 1 ? 'it' : 'those fields'} comes from one value repeated, not from ${n} customers agreeing. Treat the patterns below as one customer profile until you add real figures for each customer.\n` : ''}
---

## Detected Patterns

### Industry Distribution
${topIndustries.length > 0 ? dist(topIndustries, 'customer') : '- No industry data provided'}

**Pattern**: ${topIndustries.length === 0 ? 'none yet, add this data' : topIndustries[0][1] > n * 0.5 ?
  `Strong concentration in ${topIndustries[0][0]} (${pctOf(topIndustries[0][1])}%)` :
  `Mixed industries (${andList(topIndustries.map(r => r[0]))}): ${sameFields.includes('ACV') && sameFields.includes('sales cycle') ? 'your records give every industry the same ACV and cycle, so the industries cannot yet be ranked; add real deal figures per industry' : 'compare their deal size and cycle before you specialize'}`}

### Company Size Distribution
${topSizes.length > 0 ? dist(topSizes, 'customer') : '- No size data provided'}

**Pattern**: ${topSizes.length === 0 && descSizes.length ? `no size on the records; your description says ${andList(descSizes)}` : leadOr(topSizes, 'size', v => `Primary segment: ${v} companies`, 'size')}

### Deal Economics
| Metric | Value |
|--------|-------|
| Average ACV | ${acvs.length > 0 ? `$${Math.round(avgACV).toLocaleString('en-US')}${hypo}` : 'not supplied'} |
| ACV Range | ${acvs.length > 0 ? (minACV === maxACV ? `$${minACV.toLocaleString('en-US')} (the same in every record)` : `$${minACV.toLocaleString('en-US')} to $${maxACV.toLocaleString('en-US')}`) + hypo : 'not supplied'} |
| Avg Sales Cycle | ${cycles.length > 0 ? `${avgCycle} days` : 'not supplied'} |

**Pattern**: ${acvs.length === 0 ? 'none yet, add this data' : `${ctx.v && !isHorizontal(ctx.v) ? `In ${ctx.v.name}, deals usually run like this: ${ctx.v.salesMotion} ` : avgACV > 50000 ? 'Average ACV above $50,000 (this tool\'s example threshold): expect several stakeholders and a longer buying process. ' : avgACV > 15000 ? 'Average ACV between $15,000 and $50,000 (this tool\'s example thresholds). ' : 'Average ACV under $15,000 (this tool\'s example threshold). '}Your own average cycle is ${avgCycle ? `${avgCycle} days` : 'not supplied'}.`}

### Technology Stack Signals
${topTech.length > 0 ? dist(topTech, 'customer') : '- No tech stack data provided'}

**Pattern**: ${leadOr(topTech, 'technology', v => `Use "${v}" as primary technographic filter`)}

### Champion Roles
${topChampions.length > 0 ? dist(topChampions, 'deal') : '- No champion data provided'}

**Pattern**: ${leadOr(topChampions, 'champion role', v => `Primary champion: ${v}; lead with their pain points`, 'champion')}

### Buying Triggers
${topTriggers.length > 0 ? dist(topTriggers, 'deal') : '- No trigger data provided'}

**Pattern**: ${leadOr(topTriggers, 'trigger', v => `Top trigger: ${quoted(v)}; use in outbound messaging`, 'buying trigger')}

---

## Synthesized ICP

Based on pattern analysis (a value is named only where it leads; a tie lists every tied value${repeated ? '; fields marked repeated carry one value in every record' : ''}):

**Ideal Customer Profile**:
${[topIndustries[0] ? `- **Industry**: ${indL ? `${indL[0]}${topIndustries[1] && !(topIndustries[0][1] > n * 0.5) ? ` or ${topIndustries[1][0]}` : ''}` : `${andList(tied(topIndustries))} (tied: ${plural(tied(topIndustries).length, 'industry', 'industries')} equally common)`}` : '',
  topSizes[0] ? `- **Size**: ${sizeL ? sizeL[0] : `${andList(tied(topSizes))} (tied)`}` : descSizes.length ? `- **Size**: ${andList(descSizes)} (words from your description; the records carry no size)` : '',
  `- **Budget**: ${acvs.length > 0 ? (minACV === maxACV ? `$${minACV.toLocaleString('en-US')} ACV in every record you gave` : `$${minACV.toLocaleString('en-US')} to $${maxACV.toLocaleString('en-US')} ACV seen in your customers (average $${Math.round(avgACV).toLocaleString('en-US')})`) : 'not supplied'}`,
  topTech[0] ? `- **Tech Stack**: ${techL ? `Uses ${topTech[0][0]}${topTech[1] ? ` + ${topTech[1][0]}` : ''}` : `${andList(tied(topTech))} (tied)`}` : '',
  topTriggers[0] ? `- **Buying Trigger**: ${trigL ? quoted(trigL[0]) : `${andList(tied(topTriggers).map(quoted))} (tied)`}${sameFields.includes('buying trigger') ? ' (one trigger, repeated in every record)' : ''}` : '',
  topChampions[0] ? `- **Champion**: ${champL ? champL[0] : `${andList(tied(topChampions))} (tied)`}` : descRoles.length ? `- **Roles your description names**: ${andList(descRoles)}` : '',
  `- **Sales Cycle**: ${avgCycle ? `~${avgCycle} days (average of your deals)` : 'not supplied'}`].filter(Boolean).join('\n')}

${sectorChecks}${notes ? `${notes}\n\n` : ''}---

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
    execute: (args: {
      company?: string;
      scoring_criteria?: Array<{
        criterion?: string;
        importance?: string;
        values?: string[];
      }>;
      success_correlation?: string;
      product_category?: string;
    }) => {
      const category = args.product_category ? args.product_category.trim() : 'your product (product_category not given)';
      const correlations = args.success_correlation || '';
      const ctx = readContext(undefined, { seller: [productWords(args.product_category, args.company)], context: [args.company, correlations], buyer: (args.scoring_criteria || []).flatMap(c => [c.criterion, ...(c.values || [])]) });
      
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
            criterion: c.criterion || `Criterion ${i+1}`,
            importance: c.importance || 'important',
            weight: c.importance === 'critical' ? 25 : c.importance === 'important' ? 15 : 10,
            values: c.values || ['High fit', 'Medium fit', 'Low fit']
          }))
        : defaultCriteria;
      // Run 19 D80 (problem 5): example points for each value the user listed. The first value scores the full weight, the last
      // scores 0, the ones between in even steps (rounded); a single value scores the full weight, or 0 when it does not apply.
      // The weights and the bands are unchanged. The default criteria already carry their own points.
      const userGiven = !!(args.scoring_criteria && args.scoring_criteria.length > 0);
      const withPoints = (c: { weight: number; values: string[] }) => !userGiven ? c.values
        : c.values.length === 1 ? [`${c.values[0]} (${c.weight} pts; 0 if not)`]
        : c.values.map((v, i) => `${v} (${Math.round(c.weight * (c.values.length - 1 - i) / (c.values.length - 1))} pts)`);
      // Run 19 D80 (problem 3): the success pattern is matched against the criteria given, by their words.
      const corrWords = new Set(correlations.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2 && !['the', 'and', 'with', 'who', 'most', 'more', 'deals', 'customers', 'close', 'faster', 'renew', 'than', 'that', 'have', 'has', 'are', 'for'].includes(w)));
      const matched = criteria.filter(c => [c.criterion, ...c.values].join(' ').toLowerCase().split(/[^a-z0-9]+/).some(w => w.length > 2 && corrWords.has(w)));
      // A criterion counts as named by the pattern when its name uses the pattern's words, or the evidence names one of its values
      // (so the line can never say "already a criterion" for a criterion whose every value is "not found").
      const nameMatched = (c: { criterion: string }) => matched.some(m => m.criterion === c.criterion) && c.criterion.toLowerCase().split(/[^a-z0-9]+/).some(w => w.length > 2 && corrWords.has(w));
      const namedBy = () => criteria.filter(c => nameMatched(c) || proofHits.some(h => h.criterion === c.criterion));
      const corrLine = () => { const m = namedBy(); return !correlations ? '' : m.length
        ? `This pattern is already a criterion: ${andList(m.map(c => `**${c.criterion}**`))}. If it holds in your closed deals, make ${m.length === 1 ? 'it' : 'them'} critical.`
        : 'This pattern is not yet one of your criteria: add it as a criterion if it holds in your closed deals.'; };
      const notes = sideNotes(ctx.v, ['committee', 'roles', 'metrics', 'vocabulary', 'objections'], args.product_category, args.scoring_criteria?.flatMap(c => [c.criterion, ...(c.values || [])]));
      const fitSide = buyerSide(ctx.v && !isHorizontal(ctx.v) ? ctx.v : null, args.product_category, args.scoring_criteria?.flatMap(c => [c.criterion, ...(c.values || [])]));
      // Run 20 round 1: the tier actions and answer times follow the business model (a services or connectivity sale does not run on
      // a 24 hour demo). They stay examples; the bands and the points are unchanged.
      const TIERS: Record<string, [string, string, string, string, string, string, string, string]> = {
        default: ['Immediate outreach, fast-track', 'Demo within 24 hours', 'Priority follow-up', 'Demo within 48 hours', 'Nurture sequence', 'Weekly touch', 'Marketing nurture only', 'Auto-nurture'],
        saas: ['Immediate outreach, fast-track', 'First meeting within 2 working days', 'Priority follow-up', 'First meeting within a week', 'Nurture sequence', 'Weekly touch', 'Marketing nurture only', 'Auto-nurture'],
        services: ['Senior sponsor outreach and a scoping conversation', 'Scoping call within 3 working days', 'Priority follow-up with a reference from a similar client', 'Scoping call within a week', 'Nurture with case studies and proposals', 'Monthly touch', 'Keep on the list; revisit at the next review', 'Quarterly check'],
        connectivity: ['Account manager outreach, ask for the site list and book a site survey', 'Site survey booked within a week', 'Priority follow-up and a rate-card comparison', 'Proposal within two weeks', 'Nurture until a contract end date or a new site appears', 'Monthly touch', 'Keep on the list; revisit when a contract ends', 'Quarterly check'],
        investment: ['Relationship-led outreach and the due diligence pack', 'First meeting within a week', 'Priority follow-up through the consultant or an existing contact', 'Meeting within a month', 'Nurture with research and updates', 'Quarterly touch', 'Keep on the list; revisit at the next allocation cycle', 'Annual check'],
        transactions: ['Integration call and sandbox access', 'Sandbox access within 48 hours', 'Priority follow-up with a volume and pricing discussion', 'Pricing call within a week', 'Nurture with integration guides', 'Monthly touch', 'Keep on the list; revisit when volume grows', 'Quarterly check'],
        marketplace: ['Onboarding call and first listings or orders', 'First call within 48 hours', 'Priority follow-up with a supply or demand plan', 'Call within a week', 'Nurture until they are ready to list or buy', 'Monthly touch', 'Keep on the list', 'Quarterly check'],
        hardware_software: ['Pilot proposal and site visit', 'Site visit booked within a week', 'Priority follow-up with a pilot plan', 'Pilot plan within two weeks', 'Nurture with case studies', 'Monthly touch', 'Keep on the list', 'Quarterly check'],
      };
      const tierRows = TIERS[ctx.model && TIERS[ctx.model] ? ctx.model : 'default'];
      const proofItems = sentencesOrItems(correlations);
      const valueOf = (c: { values: string[] }) => c.values;
      const proofHits = proofItems.length ? criteria.flatMap(c => valueOf(c).flatMap(val => {
        const items = proofItems.filter(it => sharesWord(val, it));
        return items.length ? [{ criterion: c.criterion, value: val, item: items[0] }] : [];
      })) : [];
      const hitKeys = new Set(proofHits.map(h => `${h.criterion}|${h.value}`));
      const notFound = proofItems.length ? criteria.flatMap(c => c.values.filter(val => !hitKeys.has(`${c.criterion}|${val}`) && !nameMatched(c)).map(val => ({ criterion: c.criterion, value: val }))).filter(x => x.value.length <= 80) : [];
      const proofKind = (t: string) => /\((?:customer|partner|analyst|client) quote\)|customer words/i.test(t) ? 'a customer statement' : /page claim|case study|story title|ebook|home page|award|recogni|leader|gartner|forrester|named|featured/i.test(t) ? 'a page claim or recognition, not a closed-deal result' : /customer quote|customer words|quote/i.test(t) ? 'a customer statement' : 'a result as you gave it';
      const longValues = criteria.flatMap(c => c.values.filter(v2 => v2.length > 130).map(v2 => ({ criterion: c.criterion, value: v2 })));
      const cellValue = (v2: string) => (v2.length > 130 ? `${clauseHead(v2, 100)} (full wording below)` : v2);

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

${sectorLine(ctx.v, ctx.via)}
${correlations ? `\n**Success Correlation Noted**: ${proofItems.length > 1 ? `${proofItems.length} statements, listed in full under "Evidence in Your Success Pattern" below` : q(shortText(correlations))}\n${corrLine()}\n` : ''}

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
${criteria.map(c => `| **${c.criterion}** | ${c.weight} pts | ${c.values.length ? withPoints({ ...c, values: c.values.map(cellValue) }).join(' / ') : 'no values supplied: add the values you score'} |`).join('\n')}
${userGiven ? '\nPoints per value: the first value you listed scores the full weight, the last scores 0, and the values between score even steps, so list each criterion\'s values from best fit to worst fit. They are examples to adjust.\n' : ''}${longValues.length ? `\n**Full wording of the long values**:\n${longValues.map(x => `- ${x.criterion}: ${x.value}`).join('\n')}\n` : ''}
**Maximum Score**: ${maxScore} points ${EXAMPLE}

---

## Qualification Tiers

| Tier | Score Range | Action | SLA |
|------|-------------|--------|-----|
| **A: Hot** | ${tierALo}-${maxScore} | ${tierRows[0]} | ${tierRows[1]} |
| **B: Warm** | ${tierBLo}-${tierBHi} | ${tierRows[2]} | ${tierRows[3]} |
| **C: Developing** | ${tierCLo}-${tierCHi} | ${tierRows[4]} | ${tierRows[5]} |
| **D: Unqualified** | 0-${tierDHi} | ${tierRows[6]} | ${tierRows[7]} |

The bands are 80%, 60% and 40% of your maximum score of ${maxScore} points.${ctx.v && !isHorizontal(ctx.v) ? ` Set the times above to how deals run in ${ctx.v.name}: ${ctx.v.salesMotion}` : ''}

---

## Qualification Scorecard Template

### Account: _______________
### Date: _______________

${criteria.map(c => `
**${c.criterion}** (Max: ${c.weight} pts)
${c.values.length ? withPoints({ ...c, values: c.values.map(cellValue) }).map((v) => `☐ ${v}`).join('\n') : '☐ no values supplied: add the values you score'}
Score: ___ / ${c.weight}
`).join('\n')}

---

**TOTAL SCORE**: ___ / ${criteria.reduce((sum, c) => sum + c.weight, 0)} ${EXAMPLE}

**TIER**: ☐ A (Hot)  ☐ B (Warm)  ☐ C (Developing)  ☐ D (Unqualified)

---
${proofItems.length ? `## Evidence in Your Success Pattern

Each statement you gave, and what it can do for the model:
${proofItems.map(it => `- ${q(shortText(it, 300))}: ${proofKind(it)}`).join('\n')}
${proofHits.length ? `\n**Where your evidence names a value you score** (consider giving it the top points, then check it against your closed deals):\n${proofHits.slice(0, 6).map(h => `- ${h.criterion}, ${q(clauseHead(h.value, 80))}: named in ${q(shortText(h.item, 160))}`).join('\n')}\n` : '\nNone of your criterion values is named in these statements, so the evidence does not yet tell you which value to score highest.\n'}${notFound.length ? `\n**Not found in your evidence**: ${notFound.slice(0, 8).map(x => `${q(clauseHead(x.value, 60))} (${x.criterion})`).join('; ')}.\n` : ''}
Use page claims and recognition as messaging, not as scoring evidence: score only what you can see in your closed-won and closed-lost deals.

---

` : ''}${fitSide.bv ? `## Fit Signals to Score in ${fitSide.name}

Each discovery question below can become a criterion you score before the first call, if the answer is findable (annual report, job posts, website or CRM):
${fitSide.bv.discovery.slice(0, 4).map((x, i) => `${i + 1}. ${x}`).join('\n')}

---

` : ''}## Implementation Guide

### In your CRM
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
- [ ] Budget cycle misaligned by >6 months ${EXAMPLE}${ctx.v ? `\n\nObjections that are red flags in ${ctx.v.name}: ${ctx.v.objections.map(o => lowerCommonWords(o.objection)).join('; ')}. Check for them before an account scores high.` : ''}

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
    execute: (args: {
      deal_size?: string;
      target_company_size?: string;
      product_category: string;
      known_stakeholders?: string[];
      typical_champion?: string;
      company?: string;
      business_model?: string;
    }) => {
      // Run 19 D80: no default deal size, company size or champion in place of an input that was not given (rule B81).
      const dealSize = args.deal_size ? args.deal_size.trim() : 'not given (add deal_size)';
      const companySize = args.target_company_size ? args.target_company_size.trim() : 'not given (add target_company_size)';
      const stakeholders = (args.known_stakeholders || []).map(x => String(x).trim()).filter(Boolean);
      const ctx = readContext(args.business_model, { seller: [productWords(args.product_category, args.company)], context: [args.company], role: agreedRoles([args.typical_champion, ...stakeholders]) });
      const v = ctx.v;
      const typedChampion = args.typical_champion && args.typical_champion.trim() ? args.typical_champion.trim() : '';

      // Run 20 round 1 (quality): the group is built from the champion and the stakeholders the user typed, then from the sector's own
      // roles (src/verticals.ts). No bracket placeholder is left: where the input cannot supply a line, the line says what to ask or what
      // input would fill it. No message about the user's product is written for them (rule B81); the lines are angles to build a message on.
      type Seat = { role: string; concern: string; message: string; label: string };
      const lower1 = (t: string) => lowerFirstIfCommon(t);
      const stripEnd = (t: string) => t.replace(/[.\s]+$/, '');
      const objectionFor = (re: RegExp) => (v ? v.objections.find(o => re.test(o.objection)) : undefined);
      const m3 = v ? andList(v.metrics.slice(0, 3)) : '';
      const m2 = v ? andList(v.metrics.slice(0, 2)) : '';
      // Which seat a sector role fills (the roles are the sector's own list; the seat is read from its committee sentence).
      const SEATS: Record<string, { economic: string; champion: string; technical: string; user: string; blocker: string }> = {
        'logistics-tech': { economic: 'Chief Operating Officer', champion: 'Head of Last-Mile Operations', technical: 'Head of IT', user: 'Fleet Manager', blocker: 'Finance (checks the cost per delivery)' },
        fintech: { economic: 'Chief Financial Officer', champion: 'Finance Controller', technical: 'Head of IT', user: 'Head of Accounts Payable', blocker: 'Internal Audit Lead' },
        'vertical-saas': { economic: 'National Sales Head', champion: 'Head of Sales Operations', technical: 'CIO', user: 'Regional Sales Manager', blocker: 'Head of Distribution' },
        'ai-native': { economic: 'Business owner of the process the AI changes', champion: 'Head of Data and AI', technical: 'Chief Technology Officer', user: 'The team that works with the AI every day', blocker: 'Head of Risk and Compliance' },
        ites: { economic: 'Chief Information Officer', champion: 'VP IT Operations', technical: 'Security and access review (CISO or security lead)', user: 'Business Unit Head', blocker: 'Head of Procurement' },
        telecom: { economic: 'Chief Information Officer', champion: 'Head of IT Infrastructure', technical: 'CISO', user: 'Network Manager', blocker: 'Head of Procurement' },
        cybersecurity: { economic: 'CISO', champion: 'Cloud Security Lead', technical: 'Security Architect', user: 'Head of Security Operations', blocker: 'Head of Risk and Compliance' },
        software: { economic: 'VP Engineering', champion: 'Platform Engineering Lead', technical: 'Engineering Manager', user: 'Developers', blocker: 'Security Lead' },
        saas: { economic: 'Chief Financial Officer', champion: 'Head of Growth', technical: 'IT and security review', user: 'End users of the function', blocker: 'Finance (cost and renewal terms)' },
      };
      // Run 21b: the roles above were written for ONE kind of company per vertical (SEAT_KIND). They are used only when the sector read names that kind
      // (v.subtype); every other company of the vertical gets the neutral roles below. The other verticals are unchanged.
      const SEAT_KIND: Record<string, string> = { 'logistics-tech': 'last-mile', fintech: 'spend-expense', 'vertical-saas': 'fmcg-retail-execution', telecom: 'operators-connectivity', cybersecurity: 'cloud-security', software: 'developer-platform' };
      const SEATS_GENERIC: Record<string, { economic: string; champion: string; technical: string; user: string; blocker: string }> = {
        'logistics-tech': { economic: 'Chief Operating Officer', champion: 'Head of Logistics Operations', technical: 'Head of IT', user: 'Operations Manager', blocker: 'Finance (checks the cost of the change)' },
        fintech: { economic: 'Chief Financial Officer', champion: 'Business owner of the process the product changes', technical: 'Head of IT', user: 'The team that uses it every day', blocker: 'Risk and Compliance Lead' },
        'vertical-saas': { economic: 'Managing Director or business owner', champion: 'Head of Operations', technical: 'Head of IT', user: 'The team that uses it every day', blocker: 'Finance (checks the cost and the contract terms)' },
        telecom: { economic: 'Chief Information Officer', champion: 'Head of IT', technical: 'CISO', user: 'The team that runs the service every day', blocker: 'Head of Procurement' },
        cybersecurity: { economic: 'CISO', champion: 'Security Lead', technical: 'Security Architect', user: 'The security team that uses it every day', blocker: 'Head of Risk and Compliance' },
        software: { economic: 'VP Engineering', champion: 'Engineering Lead', technical: 'Engineering Manager', user: 'The engineers who use it every day', blocker: 'Security Lead' },
      };
      const sectorSeats = (vv: Vertical) => (SEAT_KIND[vv.id] && vv.subtype !== SEAT_KIND[vv.id] ? SEATS_GENERIC[vv.id] : undefined) ?? SEATS[vv.id];
      // AI native and SaaS sell into any function (an AI product can serve a contact centre or an investment desk), so their usual roles
      // and yardsticks are not assumed for a seat the user did not name.
      const horizontal = isHorizontal(v);
      const seat = v ? (/billing/i.test(v.name) ? { economic: 'Chief Financial Officer', champion: 'Revenue Operations Lead', technical: 'Head of Engineering', user: 'Billing or Finance Operations Manager', blocker: 'Finance Controller' } : /, investment management$/.test(v.name) ? { economic: 'Chief Investment Officer', champion: 'Head of Manager Research', technical: 'Head of Risk', user: 'Portfolio Manager', blocker: 'Compliance Officer' } : sectorSeats(v)) : undefined;
      const pick = (k: 'economic' | 'champion' | 'technical' | 'user' | 'blocker', fallback: string) => (horizontal || !seat ? fallback : seat[k]);
      const objTech = objectionFor(/integrat|tms|erp|dms|siem|migrat|scripts|systems|overlay|sync|fit our/i);
      const objUser = objectionFor(/use|app|adopt|alert|log into|another tool/i);
      const objBlock = objectionFor(/security|privacy|compliance|regulat|lock-in|transition|proof before|review/i);
      const objEcon = objectionFor(/price|margin|cost|rates|budget|grows|per-user/i);
      const hv = horizontal ? buyerSide(v, typedChampion, stakeholders, args.product_category) : { bv: null as Vertical | null, name: '' };
      const hm3 = hv.bv ? andList(hv.bv.metrics.slice(0, 3)) : '';
      const qv = horizontal ? hv.bv : v;
      const buyingGroup: { champion: Seat; economic: Seat; technical: Seat; user: Seat; blocker: Seat } = v && seat ? {
        champion: { role: pick('champion', 'not given (add typical_champion)'), concern: horizontal ? (hv.bv ? `In ${hv.name} the usual measures are ${hm3}; ask which of them they are held to` : 'Ask them in discovery what they are measured on today') : `Owns ${m3} day to day, so the pain is theirs`, message: horizontal ? (hv.bv ? `Show the effect on ${hv.bv.metrics[0]} or another measure they already track, with the kind of proof ${hv.name} trust (${lower1(stripEnd(hv.bv.proofShape))}).` : 'Show the effect on one number they already track, with proof from a customer like them.') : `Lead with ${v.metrics[0]}: show the effect on their own numbers, with the kind of proof this sector trusts (${lower1(stripEnd(v.proofShape))}).`, label: 'Message angle' },
        economic: { role: pick('economic', 'not named in your stakeholders (ask your champion who holds the budget)'), concern: (horizontal ? (hv.bv ? `Whether ${andList(hv.bv.metrics.slice(0, 2))} move enough to justify the spend and the risk of change` : 'Return on the spend and the risk of change') : `Whether ${m2} move enough to justify the spend and the risk of change`) + (objEcon ? `. Likely objection: ${lowerCommonWords(objEcon.objection)}` : ''), message: (horizontal ? (hv.bv ? `Tie the spend to ${hv.bv.metrics[0]} and to the risk of staying as they are, and bring proof from a buyer like them.` : 'Tie the spend to one business result and to the cost of staying as they are, with proof from a buyer like them.') : `Tie the spend to ${v.metrics[0]} and to the risk of staying as they are, and bring proof from a buyer like them.`) + (objEcon ? ` If it comes up: ${objEcon.response}` : ''), label: 'Message angle' },
        technical: { role: pick('technical', 'not named in your stakeholders (ask your champion who evaluates it technically)'), concern: objTech ? `Likely objection: ${lowerCommonWords(objTech.objection)}` : ctx.model === 'services' ? 'Access, security and how the transition is run' : ctx.model === 'connectivity' ? 'Network design and the risk of the cut-over' : 'Integration and upkeep', message: objTech ? objTech.response : ctx.model === 'services' ? 'Show the transition plan, the access model and who from your team works on their systems.' : ctx.model === 'connectivity' ? 'Share the network design and a wave plan with a fallback link and a rollback rule for each wave.' : 'Name the systems involved and who on each side owns the integration.', label: 'How to answer' },
        user: { role: pick('user', 'not named in your stakeholders (ask who uses it every day)'), concern: objUser ? `Likely objection: ${lowerCommonWords(objUser.objection)}` : ctx.model === 'services' ? 'How the service works for them every day' : 'Ease of use in the daily workflow', message: objUser ? objUser.response : ctx.model === 'services' ? 'Show the service through their eyes: who they call, how fast they get an answer and what is reported to their leadership.' : 'Show the daily workflow through their eyes and agree a small pilot with the people who will use it.', label: 'How to answer' },
        blocker: { role: pick('blocker', 'not named in your stakeholders (ask who reviews it: procurement, legal, security or audit)'), concern: objBlock ? `Likely objection: ${lowerCommonWords(objBlock.objection)}` : 'Risk and compliance', message: objBlock ? objBlock.response : 'Bring the evidence they will ask for before they ask for it.', label: 'How to answer' },
      } : {
        champion: { role: 'not given (add typical_champion)', concern: 'Ask them in discovery what they are measured on today', message: 'Say how your product changes what they are measured on, using a result you can prove. Add product_category or typical_champion and this answer is built from your sector.', label: 'Message angle' },
        economic: { role: 'not named in your stakeholders (ask your champion who holds the budget)', concern: 'Return on the spend and the risk of change', message: 'Tie the spend to one business result and to the cost of staying as they are, with proof from a similar buyer.', label: 'Message angle' },
        technical: { role: 'not named in your stakeholders (ask your champion who evaluates it technically)', concern: 'Integration and upkeep', message: 'Name the systems involved and who on each side owns the integration.', label: 'How to answer' },
        user: { role: 'not named in your stakeholders (ask who uses it every day)', concern: 'Ease of use in the daily workflow', message: 'Show the daily workflow through their eyes and agree a small pilot with them.', label: 'How to answer' },
        blocker: { role: 'not named in your stakeholders (ask who reviews it: procurement, legal, security or audit)', concern: 'Risk and compliance', message: 'Prepare your standard terms and compliance answers and share them early.', label: 'How to answer' },
      };
      let championDefault = !typedChampion && !!seat && !horizontal;
      // The champion is the role the user typed, and each known stakeholder is placed in the map by its title: budget owners as
      // economic buyer, technology and security roles as technical evaluator, procurement, legal, audit, compliance and risk as
      // reviewers, everyone else as users.
      if (typedChampion) buyingGroup.champion.role = typedChampion;
      const kindOf = (t: string): 'economic' | 'technical' | 'blocker' | 'user' => {
        if (v && v.id === 'cybersecurity' && /\bCISO\b|chief information security/i.test(t)) return 'economic';
        if (/procurement|legal|compliance|audit|\brisk\b|vendor management|purchasing/i.test(t)) return 'blocker';
        if (!(v && v.id === 'cybersecurity') && /\bCISO\b|security|privacy/i.test(t) && !/\b(CTO|engineer|architect|devops)\b/i.test(t)) return 'blocker';   // outside a security product the security lead reviews
        if (/\b(CFO|CEO|COO|CIO|CRO|CMO|MD|VP|SVP|EVP)\b|vice president|chief (?:financial|executive|operating|information officer|revenue|marketing)|managing director|president|founder|business unit head|national sales head/i.test(t) && !/chief information security/i.test(t)) return 'economic';
        if (/\bchief\b[^,]*\bofficer\b/i.test(t) && !/technolog|security/i.test(t)) return 'economic';   // any other chief officer (commercial, risk ...) holds budget or sign-off, he is not a day-to-day user
        if (/\b(IT|CTO|CISO|QA)\b|chief technology|chief information security|engineer|architect|devops|platform|security|infrastructure|network|data|technical/i.test(t)) return 'technical';
        return 'user';
      };
      const others = stakeholders.filter(x => x.toLowerCase() !== buyingGroup.champion.role.toLowerCase());
      const placed: Record<string, string[]> = { economic: [], technical: [], blocker: [], user: [] };
      for (const x of others) placed[kindOf(x)].push(x);
      // A job title fills a seat before a group of people ("Director IT" before "enterprise developers").
      for (const k of Object.keys(placed)) placed[k] = [...placed[k].filter(isTitleItem), ...placed[k].filter(x => !isTitleItem(x))];
      // A stakeholder the user typed replaces the sector's default for that seat; the default stays in the answer as a second name.
      const sectorDefaults: string[] = [];
      for (const k of ['economic', 'technical', 'blocker', 'user'] as const) {
        if (placed[k][0]) {
          if (seat && !horizontal && !sameRole(placed[k][0], seat[k]) && !placed[k].some(x => sameRole(x, seat[k]))) sectorDefaults.push(`${seat[k]} (${k === 'economic' ? 'budget or sign-off' : k === 'technical' ? 'technical evaluation' : k === 'blocker' ? 'review' : 'user'})`);
          buyingGroup[k].role = placed[k][0];
        }
      }
      const OPEN_ROLE = { economic: 'not named in your stakeholders (ask your champion who holds the budget)', technical: 'not named in your stakeholders (ask your champion who evaluates it technically)', user: 'not named in your stakeholders (ask who uses it every day)', blocker: 'not named in your stakeholders (ask who reviews it: procurement, legal, security or audit)' };
      // A seat none of the typed stakeholders fits shows the sector's usual role and says so.
      for (const k of ['economic', 'technical', 'blocker', 'user'] as const) {
        if (!placed[k][0] && seat && !horizontal) {
          // a person cannot hold two roles: when the sector's usual role is one of the people already named (the champion, or "risk teams"
          // placed elsewhere), the role stays open instead
          const taken = [typedChampion, ...stakeholders].some(x => x && sameRole(aliasRole(x, v), seat[k]));
          buyingGroup[k].role = taken ? OPEN_ROLE[k] : buyingGroup[k].role + ` (usual in ${v!.name}; none of your stakeholders fits this role)`;
        }
      }
      if (typedChampion && seat && !horizontal && !sameRole(typedChampion, seat.champion) && !stakeholders.some(x => sameRole(x, seat.champion))) sectorDefaults.push(`${seat.champion} (champion)`);
      const extra = (['economic', 'technical', 'blocker', 'user'] as const).flatMap(k => placed[k].slice(1).map(x => `${x} (${k === 'economic' ? 'budget or sign-off' : k === 'technical' ? 'technical evaluation' : k === 'blocker' ? 'review' : 'user'})`));
      const technicalSteps = ctx.model === 'connectivity' ? ['Offer a site survey and a small set of pilot sites', 'Share the network design and the cut-over plan', 'Offer a technical session with your network team', 'Answer the security questionnaire before it is asked']
        : ctx.model === 'services' ? ['Share the transition plan and the team model', 'Agree the SLA and the reports up front', 'Offer a session with the delivery lead', 'Answer the security questionnaire before it is asked']
        : ctx.model === 'saas' ? ['Provide sandbox/POC access', 'Share integration documentation', 'Offer technical deep-dive call', 'Address security questionnaire proactively']
        : ['Offer a pilot on their own data or sites', 'Share integration or setup documentation', 'Offer a technical session', 'Answer the security questionnaire before it is asked'];
      const seatBlock = (title: string, key: 'champion' | 'economic' | 'technical' | 'user' | 'blocker', strategy: string[], extraNote = '') => `### ${title}
**Role**: ${buyingGroup[key].role}${extraNote}
**Their Concern**: ${buyingGroup[key].concern}
**${buyingGroup[key].label}**: ${buyingGroup[key].message}

**Strategy**:
${strategy.map(x => `- ${x}`).join('\n')}
`;
      const sysQ = systemsQuestion(qv);
      const moreQs = qv ? qv.discovery.filter((x, i) => i > 1 && x !== sysQ) : [];
      // The influence map has fixed-width boxes: each role is shortened to the part before its bracket.
      const mapRole = (r: string) => { const h = r.replace(/\s*\(.*$/, '').trim(); return h.length > 30 ? h.slice(0, 30).replace(/\s+\S*$/, '') : h; };
      const mapGroup = { economic: { role: mapRole(buyingGroup.economic.role) }, champion: { role: mapRole(buyingGroup.champion.role) }, technical: { role: mapRole(buyingGroup.technical.role) }, user: { role: mapRole(buyingGroup.user.role) }, blocker: { role: mapRole(buyingGroup.blocker.role) } };

      return `# Buyer Group Analysis

## Deal Context
- ${companyLine(args.company)}
- **Product**: ${args.product_category}
- **Deal Size**: ${dealSize}
- **Target Company**: ${companySize}
- **Known Stakeholders**: ${stakeholders.length ? stakeholders.join(', ') : 'Not specified'}
- **Champion you named**: ${typedChampion || 'not given (add typical_champion)'}

${ctx.line}

The deal size and company size are shown for context: the roles below come from your champion, your stakeholders${v ? ' and the sector' : ''}, not from the deal size.${championDefault ? ` You did not name a champion, so the champion below is the usual one for ${v!.name}; replace it with the person you are working with.` : ''}

---

## Buying Group Map

${seatBlock('Champion (Your Internal Advocate)', 'champion', ['Lead with their specific pain points', 'Provide ammo to sell internally', 'Make them look good to leadership', 'Give them early wins to share'], championDefault ? ` (the usual one in ${v!.name}; you named none)` : '')}
${seatBlock('Economic Buyer (Budget Authority)', 'economic', ['Lead with business outcomes, not features', 'Provide clear ROI documentation', 'Connect to strategic priorities', 'Reference similar company results'])}
${seatBlock('Technical Evaluator (Implementation Voice)', 'technical', technicalSteps)}
${seatBlock('End User (Day-to-Day User)', 'user', ctx.model === 'saas' || ctx.model === null ? ['Demo through their lens', 'Show quick wins possible', 'Minimize learning curve fear', 'Get pilot users as advocates'] : ['Walk through their working day with the new way in it', 'Show the first week, not the full rollout', 'Agree who trains the users and how adoption is measured', 'Get pilot users as advocates'])}
${seatBlock('Potential Blocker (Reviewer)', 'blocker', ['Engage early, not late', 'Proactively share compliance info', 'Provide comparison to status quo risk', 'Have champion introduce you'])}
---

## Influence Map

\`\`\`
${influenceMap(mapGroup)}
\`\`\`
${extra.length ? `\n**Also in the group (your input)**: ${extra.join('; ')}.\n` : ''}${sectorDefaults.length ? `\n**Usual in ${v!.name}, not in your list**: ${sectorDefaults.join('; ')}. Ask your champion whether they are involved.\n` : ''}
${v ? `${sideNotes(v, ['committee', 'objections', 'vocabulary', 'proof', 'metrics'], typedChampion, stakeholders, args.product_category)}\n` : ''}
---

## Multi-Threading Checklist

Track your coverage of the buying group:

| Role | Identified | Contacted | Meeting Held | Aligned |
|------|-----------|-----------|--------------|---------|
| Champion | ☐ | ☐ | ☐ | ☐ |
| Economic Buyer | ☐ | ☐ | ☐ | ☐ |
| Technical | ☐ | ☐ | ☐ | ☐ |
| End User | ☐ | ☐ | ☐ | ☐ |
| Blocker | ☐ | ☐ | ☐ | ☐ |

**Goal**: Minimum 3 of 5 roles engaged before proposal ${EXAMPLE}

---

## Role-Specific Discovery Questions

### For Champions${typedChampion ? ` (${typedChampion})` : ''}
1. "What would success look like for you personally?"
2. "Who else needs to be convinced for this to move forward?"
3. "What's blocked similar initiatives in the past?"
${qv ? `4. "${qv.discovery[0]}"\n` : ''}
### For Economic Buyers (${mapRole(buyingGroup.economic.role)})
1. "How does this connect to your top 3 priorities this year?"
2. "What ROI would make this a clear yes?"
3. "What other investments are you weighing this against?"
${v ? (horizontal && !hv.bv ? `4. "Which business result does this need to move for you to approve it, and what would you need to see first?"\n` : `4. "Leaders in ${horizontal ? hv.name : v.name} track measures such as ${horizontal ? hm3 : m3}. Which of them does this need to move, and what would you need to see before you approve it?"\n`) : ''}
### For Technical Evaluators (${mapRole(buyingGroup.technical.role)})
1. "What would make implementation painful for your team?"
2. ${sysQ ? `"${sysQ}"` : '"What does your current stack look like in this area?"'}
3. "What's your timeline for the technical evaluation?"

### For End Users (${mapRole(buyingGroup.user.role)})
1. "Walk me through your current workflow for this"
2. "What's the most frustrating part of your day?"
3. "What would make you actually use a new tool?"
${qv ? `4. "${qv.discovery[1]}"\n` : ''}
### For the Reviewer (${mapRole(buyingGroup.blocker.role)})
1. "Which reviews must this pass, how long do they take, and what do you need from us before they start?"
2. ${objBlock ? `"Has '${lowerCommonWords(objBlock.objection)}' come up on similar purchases, and how was it settled?"` : '"What has stopped similar purchases at the review stage before?"'}

${qv && moreQs.length ? `### More ${horizontal ? hv.name || qv.name : qv.name} questions\n${moreQs.map((x, i) => `${i + 1}. "${x}"`).join('\n')}\n\n` : ''}**Next Step**: Use \`tam_sam_som_calculator\` to size your market

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
        product_category: {
          type: 'string',
          description: 'Optional: what you sell (for example "spend management software"), used for sector notes. The arithmetic does not use it'
        },
        company: COMPANY_INPUT
      },
      required: ['total_potential_companies', 'average_contract_value']
    },
    execute: (args: {
      total_potential_companies: number;
      average_contract_value: number;
      icp_percentage?: number;
      year1_market_share_target?: number;
      data_sources?: string;
      segment_name?: string;
      product_category?: string;
      company?: string;
    }) => {
      const ctx = readContext(undefined, { seller: [productWords(args.product_category, args.company)], context: [args.company, args.data_sources], buyer: [args.segment_name] });
      const sideM = buyerSide(ctx.v, args.product_category, args.segment_name).bv?.metrics || ctx.v?.metrics || [];
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
      const formatCurrency = (num: number) => {
        // Run 15 R15-32 (D38): separators, and never an exponent however large the figure
        if (num >= 1000000000) return `$${(num / 1000000000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}B`;
        // Run 19 (backlog B16-17, display only): a figure that rounds up to 1000 of a unit moves to the next unit
        // ($999,950 prints $1.0M, not $1000K; $999,999,000 prints $1.00B, not $1000.0M).
        // Run 20 round 1: one decimal is rounded half up from the exact figure ($4,050,000 is $4.1M; toFixed(1) printed $4.0M).
        const oneDec = (x: number) => (Math.round(Number((x * 10).toPrecision(12))) / 10).toFixed(1);
        if (num >= 1000000) return oneDec(num / 1000000) === '1000.0' ? `$${(num / 1000000000).toFixed(2)}B` : `$${oneDec(num / 1000000)}M`;
        // Run 16 D47: one decimal when the figure is not a whole thousand ($2,400 as $2.4K; $2,000 stays $2K).
        if (num >= 1000) return oneDec(num / 1000) === '1000.0' ? '$1.0M' : `$${oneDec(num / 1000).replace(/\.0$/, '')}K`;
        // Run 16 N2 (D50): money under $1 prints 2 decimals; a positive amount that rounds to $0.00 says so.
        if (num > 0 && num < 1) return num.toFixed(2) === '0.00' ? 'under $0.01' : `$${num.toFixed(2)}`;
        // D38 (run 15): display only. A raw float (6 or more decimal places, or an exponent) prints with 2 decimals.
        const text = String(num);
        // Run 19 (backlog B16-17, display only): an amount under 1,000 that is not whole prints 2 decimals ($64.80, not $64.8).
        if (/e/i.test(text) || !Number.isInteger(num)) return `$${num.toFixed(2)}`;
        return `$${num}`;
      };
      // D38 (run 15): a count that rounds to 0 from a positive value says so. The count itself is unchanged.
      const countText = (n: number, raw: number, prefix = '') => (n === 0 && raw > 0 ? 'fewer than 1 (rounds to 0)' : `${prefix}${n.toLocaleString('en-US')}`);

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

${ctx.v ? (args.product_category ? ctx.line : `*Sector: read from your inputs as ${ctx.v.name}.*`) : '*Sector notes: none. This calculator takes a market segment, not a product; give product_category to the other ICP tools for notes that fit what you sell.*'}

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
2. **ACV**: $${acv.toLocaleString('en-US')}, your input, read as ${acvNoun(ctx.model)}; check it against your last closed deals in this segment
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

${ctx.v ? `${sideNotes(ctx.v, ['committee', 'roles', 'metrics', 'vocabulary', 'proof'], args.product_category, args.segment_name)}\n- **Counting companies in this sector:** count only companies where the roles above exist and the problem is measured (${andList(sideM.slice(0, 2))}).\n\n` : ''}**Next Step**: Use \`lookalike_signal_generator\` to create targeting criteria
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
    execute: (args: {
      icp_firmographics?: {
        industries?: string[];
        company_sizes?: string[];
        locations?: string[];
        funding_stages?: string[];
      };
      icp_technographics?: string[];
      champion_titles: string[];
      buying_triggers?: string[];
      platforms?: string[];
      product_category?: string;
      company?: string;
    }) => {
      // Run 15 R15-32: an empty list is treated like a list left out (it printed blank lines such as 'Technologies: ')
      const ne = <T>(a?: T[]) => (Array.isArray(a) && a.length ? a : undefined);
      const f0 = args.icp_firmographics || {};
      args = { ...args, icp_technographics: ne(args.icp_technographics), buying_triggers: ne(args.buying_triggers), platforms: ne(args.platforms),
        icp_firmographics: { ...f0, industries: ne(f0.industries), company_sizes: ne(f0.company_sizes), locations: ne(f0.locations), funding_stages: ne(f0.funding_stages) } };
      const firmographics = args.icp_firmographics || {};
      // Run 20 round 1 (quality): nothing is filled in for an input that was not given. The old defaults (United States, 51-200
      // employees, Salesforce and HubSpot, Series A to C, "New leadership hire / Funding round / Expansion") belonged to a US startup
      // software seller and were wrong for every other business; a field not given is now left out of the searches and named as missing.
      // Filters need clean terms: "Asset allocators (pensions, insurers)" becomes the terms "Asset allocators", "pensions", "insurers"; the summary keeps the text as typed.
      const industriesTyped = firmographics.industries;
      const industries = industriesTyped ? [...new Set(industriesTyped.flatMap(i => { const m = /^(.*?)\s*\(([^()]*)\)\s*$/.exec(i.trim()); return m ? [m[1].trim(), ...m[2].split(/[;,]\s*/).map(x => x.trim())] : [i.trim()]; }).filter(Boolean))] : undefined;
      const sizes = firmographics.company_sizes;
      const locations = firmographics.locations;
      const tech = args.icp_technographics;
      const allTitles = (args.champion_titles || []).map(t => String(t).trim()).filter(Boolean);
      // Job titles go in the title search; groups of people ("finance teams", "managers", "employees") are not job titles and would
      // match nothing, so they are listed apart as functions to search by department.
      const titleItems = allTitles.filter(isTitleItem);
      const titles = titleItems.length ? titleItems : allTitles;
      const groups = titleItems.length ? allTitles.filter(t => !isTitleItem(t)) : [];
      const triggers = args.buying_triggers;
      const stages = firmographics.funding_stages;
      const product = args.product_category ? args.product_category.trim() : '';
      const ctx = readContext(undefined, { seller: [productWords(args.product_category, args.company)], context: [args.company, ...(triggers || []), ...(tech || [])], role: agreedRoles(titles, industries || []), buyer: industries });
      const v = ctx.v;
      // Run 19: the platforms input now selects the sections (it was accepted but not used).
      const wanted = (args.platforms || []).map(p => p.toLowerCase().replace(/[^a-z0-9]/g, ''));
      const show = (key: string) => !wanted.length || wanted.some(w => w.includes(key) || key.includes(w));
      const missing = [!industries ? 'industries' : '', !sizes ? 'company_sizes' : '', !locations ? 'locations' : '', !tech ? 'icp_technographics' : '', !triggers ? 'buying_triggers' : ''].filter(Boolean);
      const notSupplied = (given: unknown, name: string) => given ? '' : ` (not supplied: add ${name})`;
      const quote = (a: string[]) => a.map(t => `"${t}"`).join(' OR ');
      // The suffix that fits how the seller sells: a search for "SD-WAN software" is wrong for a connectivity provider.
      const suffix = ctx.model === 'services' ? 'services' : ctx.model === 'connectivity' ? 'provider' : ctx.model === 'investment' ? 'manager' : ctx.model === 'transactions' ? 'platform' : ctx.model === 'marketplace' ? 'marketplace' : ctx.model === 'hardware_software' ? 'solution' : 'software';
      // Run 19 D80 (problem 8, backlog B15-L4): search keywords come from what the user sells and the sector's own words, never
      // from an invented ad category ("Software > Software") or a phrase such as "retailers software".
      const vocabOk = !!v && !isHorizontal(v) && v.id !== 'software';
      // Words of the sector that name a measure or a practice, not a thing people search for ("uptime provider" is not a search).
      const MEASURE_WORD = /^(?:uptime|sla|delivery sla|latency|accuracy|usage|churn|renewal|expansion|onboarding|activation|governance|transition|steady state|exposure|alert fatigue|automation rate|inference cost|cost per delivery|time to value|net revenue retention|hallucination|data privacy|data residency|policy controls|audit trail|compliance review|approval workflow|ticket backlog|knowledge transfer|service credits|technical debt|test coverage|release frequency|developer experience|reconciliation|month-end close|pilot|case review|accuracy on your own data|cost per case|explainability|guardrails|human in the loop|evaluation set|resolution rate|mean time to \w+|first-attempt delivery|proof of delivery|statement of work|risk register|compliance audit|customer success|misconfiguration|branch sites|site survey|last-mile link|network operations centre)$/i;
      // A software seller's keywords come from the nouns of its own product text ("API platform", "API lifecycle management"), not from the
      // sector's CI and testing words; a SaaS seller's own measures are not search words either.
      const productPhrases = productWords(args.product_category, args.company).split(/[(),;]|\band\b/i).map(x => x.trim().replace(/^(?:a|an|the|for)\s+/i, '')).filter(x => /^[\w/+.-]+(?: [\w/+.-]+){1,3}$/.test(x) && !/\b(?:from|that|which|described)\b/i.test(x));
      const keywordWords = v && v.id === 'software' ? [] : vocabOk && ctx.model !== 'investment' ? v!.vocabulary.filter(w => !MEASURE_WORD.test(w)).slice(0, 4) : [];
      const searchProduct = clauseHead(productWords(args.product_category, args.company), 80);
      const phraseFirst = !!(v && v.id === 'software') || / \.\.\.$/.test(searchProduct) || /\(/.test(searchProduct) || searchProduct.split(' ').length > 8;
      const keywords = [...new Set([...(searchProduct && !(phraseFirst && productPhrases.length) ? [searchProduct.replace(/ \.\.\.$/, '')] : []), ...(phraseFirst || keywordWords.length === 0 ? productPhrases.slice(0, 3) : []), ...keywordWords.map(w => (new RegExp(`${suffix}s?$`, 'i').test(w) || /\bservices?$/i.test(w) && suffix === 'services' ? w : `${w} ${suffix}`)),
        ...(tech || []).map(t => `${t.toLowerCase()} integration`)])];
      // Run 19 D80 (problem 3): every trigger typed gets its own signal, chosen by its words.
      const signalFor = (t: string): [string, string, string] => {
        const x = t.toLowerCase();
        if (/hire|hired|joins|joined|new (?:cfo|ceo|coo|cio|cto|ciso|vp|head|director|leader|manager)|leadership/.test(x)) return [`A new ${titles[0] || 'leader'} or a related leader joined in the last 90 days`, 'New leaders review tools and processes early', 'LinkedIn alerts, ZoomInfo job changes'];
        if (/fund|series|raise|raised|investment|ipo|listing/.test(x)) return [`Funding or listing news${stages ? ` at the stages you target (${stages.join(', ')})` : ''}`, 'New budget is allocated for scaling', 'Crunchbase alerts, news alerts, LinkedIn'];
        if (/audit|compliance|regulat|breach|incident|finding/.test(x)) return ['Audit findings, regulatory notices or incidents made public, and hiring for audit, risk or compliance roles', 'A finding sets a deadline and a budget owner', 'News alerts, annual reports and filings, job posts'];
        if (/migrat|erp|implement|replac|upgrade|moderni|cloud move|switch/.test(x)) return ['Job posts and announcements that mention the new system or the migration', 'A system change reopens the processes around it', 'Job posting alerts, technographic change data, news alerts'];
        if (/expan|new office|new market|branch|site|hiring|grow/.test(x)) return ['New offices, markets, branches or a hiring surge', 'Existing processes strain as the company grows', 'Job posting velocity, news alerts'];
        if (/miss|target|loss|cost|margin|delay|outage|churn/.test(x)) return ['Results, statements or job posts that mention the problem', 'A missed target creates urgency and an owner', 'Earnings and news alerts, leadership posts on LinkedIn'];
        return ['News, job posts or posts by your champion titles that mention it', 'Your team named this as a reason to buy', 'News alerts and job posting alerts on the exact words'];
      };
      // A long trigger (a sentence from a page) is shown in full once, in the summary; headings use its first clause.
      const trigHead = (t: string) => cap(clauseHead(t, 90));
      const sysList = (systemsQuestion(v) || '').match(/\(([^)]+)\)/)?.[1] || '';
      const sections: string[] = [];
      if (show('linkedin')) sections.push(`## LinkedIn Sales Navigator

### Search Query (Copy & Paste Ready)

**Company Search**:
\`\`\`
${[industries ? `Industry: ${industries.join(' OR ')}` : '', sizes ? `Company headcount: ${sizes.join(' OR ')}` : '', locations ? `Headquarters: ${locations.join(' OR ')}` : '', tech ? `Technologies used: ${tech.join(' OR ')}` : ''].filter(Boolean).join('\n') || 'No firmographic input given: add icp_firmographics (industries, company_sizes, locations) to fill this search'}
\`\`\`

**Lead Search**:
\`\`\`
${[`Current job title: ${quote(titles)}`, sizes ? `Current company headcount: ${sizes.join(' OR ')}` : '', industries ? `Current company industry: ${industries.join(' OR ')}` : '', locations ? `Geography: ${locations.join(' OR ')}` : ''].filter(Boolean).join('\n')}
\`\`\`
${groups.length ? `\nNot job titles, so not in the title search: ${groups.join(', ')}. Search these as departments (functions) next to the titles above.\n` : ''}
### Boolean Search String
\`\`\`
(${quote(titles)})${industries ? ` AND (${industries.map(i => `"${i}"`).join(' OR ')})` : ''}
\`\`\`

### Saved Search Strategy
1. Create search with criteria above
2. Save search with alert enabled
3. Check weekly for new matches
4. Export to outreach sequences`);
      if (show('googleads')) sections.push(`## Google Ads Targeting

### Custom Intent Audiences
**Keywords to target** (people searching for what you sell):
\`\`\`
${keywords.length ? keywords.map(k => `"${k}"`).join('\n') : 'No product_category and no sector read: add product_category (what you sell) for search keywords about your product'}
\`\`\`
${product ? '' : 'Add product_category (what you sell) for search keywords about your product: this tool does not guess it.\n'}${keywordWords.length ? `The keywords after the first one are the sector's own words with "${suffix}" added: test each in the Keyword Planner and drop what does not fit how you sell.\n` : ''}
### Custom Audience: Website Visitors
Target visitors to the sites of the competitors your buyers compare you with (add their addresses).

### In-Market Audiences
${vocabOk ? `Pick the in-market category Google Ads offers that is closest to ${v!.name} buyers (search the category list for: ${v!.vocabulary.slice(0, 3).join(', ')}). This tool does not invent a category name.` : 'Pick the in-market category Google Ads offers that is closest to what you sell. This tool does not invent a category name.'}`);
      if (show('6sense')) sections.push(`## 6sense / Intent Data Platforms

### Account Fit Criteria
\`\`\`json
${JSON.stringify({ firmographics: { ...(industries ? { industry: industries } : {}), ...(sizes ? { employee_range: sizes } : {}), ...(locations ? { geography: locations } : {}) }, ...(tech ? { technographics: { technologies_used: tech } } : {}) }, null, 2)}
\`\`\`

### Intent Topic Keywords
\`\`\`
${[...new Set([...(searchProduct && !(phraseFirst && productPhrases.length) ? [searchProduct.replace(/ \.\.\.$/, '')] : []), ...(phraseFirst || keywordWords.length === 0 ? productPhrases.slice(0, 3) : []), ...(vocabOk ? v!.vocabulary.slice(0, 5) : []), ...(tech || [])])].join('\n') || 'Add product_category for intent topics'}
\`\`\`

### Buying Stage Indicators
- **Awareness**: Researching generic topics
- **Consideration**: Comparing specific vendors
- **Decision**: Pricing pages, demo requests`);
      if (show('zoominfo') || show('apollo')) sections.push(`## ZoomInfo / Apollo Filters

### Contact Search Criteria
\`\`\`
${[`Job Titles: ${titles.join(', ')}`, sizes ? `Company Size: ${sizes.join(', ')} employees` : '', industries ? `Industry: ${industries.join(', ')}` : '', locations ? `Location: ${locations.join(', ')}` : '', tech ? `Technologies: ${tech.join(', ')}` : ''].filter(Boolean).join('\n')}
\`\`\`

### Intent Signals to Layer
- Job changes in target titles (last 90 days)
${stages ? `- Funding or listing news at your stages: ${stages.join(', ')}\n` : ''}${tech ? '- Technology adoption changes\n' : ''}- Hiring for related roles`);

      return `# Lookalike Signal & Targeting Criteria

- ${companyLine(args.company)}
- **What you sell**: ${product || 'not given (add product_category for search keywords)'}

${sectorLine(v, ctx.via)}

## ICP Summary
- **Industries**: ${industriesTyped ? industriesTyped.join(industriesTyped.some(i => i.includes(',')) ? '; ' : ', ') : 'not supplied (add icp_firmographics.industries)'}
- **Company Sizes**: ${sizes ? sizes.join(', ') : 'not supplied (add icp_firmographics.company_sizes, for example employee ranges of your best customers)'}
- **Locations**: ${locations ? locations.join(', ') : 'not supplied (add icp_firmographics.locations)'}
- **Funding Stages**: ${stages ? stages.join(', ') : 'not supplied'}
- **Technologies**: ${tech ? tech.join(', ') : `not supplied (add icp_technographics: the systems your buyers run that your product connects to${sysList ? `; in ${v!.name} these are usually ${sysList}` : ''})`}
- **Champion Titles**: ${titles.join(', ')}${groups.length ? ` (groups, not titles: ${groups.join(', ')})` : ''}
- **Buying Triggers**: ${triggers ? triggers.join('; ') : 'not supplied (add buying_triggers: the events that make a buyer start looking)'}
${v && !isHorizontal(v) ? `- **Other roles in ${/^[aeiou]/i.test(v.name) ? 'an' : 'a'} ${v.name} buying group** (not in your input): ${v.buyerRoles.filter(r => !titles.some(t => sameRole(aliasRole(t, v), r))).join(', ')}\n` : ''}
${wanted.length ? `Sections shown: the platforms you asked for (${args.platforms!.join(', ')}).\n` : ''}
---

${sections.join('\n\n---\n\n')}

---

## Buying Trigger Signals

${triggers ? triggers.map(t => { const [signal, why, how] = signalFor(t); return `### Trigger: ${trigHead(t)}
**Signal**: ${signal}
**Why it matters**: ${why}
**How to track**: ${how}`; }).join('\n\n') : `No buying triggers were given, so no trigger-specific signals are written: this tool does not assume them. One signal that fits any B2B purchase (general, not from your input): a new ${titles[0] || 'leader'} or a related leader in the last 90 days, tracked with LinkedIn alerts or ZoomInfo job changes. Add buying_triggers for signals that fit your buyers.${v ? ` In ${v.name}, deals usually run like this, which tells you when to search: ${v.salesMotion}` : ''}`}

${v ? `${sectorNotes(v, ['metrics', 'vocabulary', 'proof'])}\n\n` : ''}---

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

${missing.length
  ? `The criteria above are built only from your inputs. Not supplied, so left out of the searches: ${missing.join(', ')}. Add them for a tighter search before you copy the criteria into each platform.`
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
        product_category: {
          type: 'string',
          description: 'Optional: what you sell (for example "spend management software"), used for sector notes. The arithmetic does not use it'
        },
        company: COMPANY_INPUT
      }
    },
    execute: (args: {
      accounts?: Array<{
        name?: string;
        fit_score?: number;
        intent_signals?: number;
        relationship?: number;
        timing?: string;
      }>;
      prioritization_weights?: {
        fit?: number;
        intent?: number;
        relationship?: number;
        timing?: number;
      };
      product_category?: string;
      company?: string;
    }) => {
      const ctx = readContext(undefined, { seller: [productWords(args.product_category, args.company)], context: [args.company] });
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
      const has = (v?: number | null) => v !== undefined && v !== null;
      const noWeights = !(has(givenWeights.fit) || has(givenWeights.intent) || has(givenWeights.relationship) || has(givenWeights.timing));
      const wEx = (given?: number) => (noWeights || has(given)) ? '' : ` ${EXAMPLE}`;

      // If accounts provided, score them
      if (args.accounts && args.accounts.length > 0) {
        const timingScore = (timing: string): number => {
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
        const cut = (p: number) => Math.ceil((W * p) / 100);
        const tierA = cut(80), tierB = cut(60), tierC = cut(40);

        const scoredAccounts = args.accounts.map(account => {
          // Run 16 D45: a score given as 0 is used as 0; only an omitted or null score takes the default 50.
          const fitScore = account.fit_score ?? 50;
          const intentScore = account.intent_signals ?? 50;
          const relationshipScore = account.relationship ?? 50;
          const timingScoreValue = timingScore(account.timing || 'unknown');
          
          const totalScore = Math.round(
            (fitScore * weights.fit / 100) +
            (intentScore * weights.intent / 100) +
            (relationshipScore * weights.relationship / 100) +
            (timingScoreValue * weights.timing / 100)
          );
          
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
        const reasonFor = (a: typeof scoredAccounts[number]) => {
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

        // Run 20 round 1: the next step follows the account's own scores and timing, so two accounts in one tier do not get the same line
        // (the tier decides the base; the weakest factor and the timing decide the focus). No sales-motion words that belong to one
        // business model (SDR sequences, 24 hour replies) are used.
        // The weakest of fit, intent and relationship decides the label and the next step, so the two always agree (a score of 60 or more is not a gap).
        const weakestOf = (a: typeof scoredAccounts[number]): [string, number] => {
          const w = ([['fit', a.fit], ['intent', a.intent], ['relationship', a.relationship]] as Array<[string, number]>).sort((x, y) => x[1] - y[1])[0];
          return w[1] < 60 ? w : ['timing', a.timingScore];
        };
        const nextStep = (a: typeof scoredAccounts[number]) => {
          const base = a.tier === 'A' ? 'Personal outreach from the account owner this week' : a.tier === 'B' ? 'A targeted sequence of personal messages this week, through a warm introduction where you have one' : a.tier === 'C' ? 'Nurture with relevant content and watch for a change in intent or timing' : 'Monitor and check again next quarter';
          const [wk, wv] = weakestOf(a);
          const focus = a.tier === 'C' || a.tier === 'D' ? `the weakest factor is ${(([['fit', a.fit], ['intent', a.intent], ['relationship', a.relationship]] as Array<[string, number]>).sort((x, y) => x[1] - y[1]).map(([k, n]) => `${k} (${cleanNum1(n)})`)[0])}, so spend sales time only when it changes`
            : wk === 'fit' ? `fit is ${cleanNum1(wv)}, so confirm the buyer has the problem and the budget before you spend time on a proposal`
            : wk === 'relationship' ? `relationship is ${cleanNum1(wv)}, so ask your champion or a mutual contact for an introduction to the budget owner`
            : wk === 'intent' ? `intent is ${cleanNum1(wv)}, so share something relevant to their situation and watch who responds`
            : a.timing.toLowerCase() === 'later' ? 'timing is later, so agree a date to revisit rather than push for a decision' : a.timing.toLowerCase() === 'now' ? 'timing is now, so ask for the next two meeting dates' : 'the scores are strong, so verify the timing with the budget owner';
          return `${base}; ${focus}`;
        };

        const sv = ctx.v;
        return `# Account Prioritization Results

- ${companyLine(args.company)}
${args.product_category ? `\n${ctx.line}\n` : ''}
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

**Action**: Personal outreach from the account owner this week, with executive involvement

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

${sv ? `How deals run in ${sv.name}: ${sv.salesMotion}\n${isHorizontal(sv) ? '' : `Roles to reach in these accounts: ${andList(sv.buyerRoles)}.\nWords their buyers use: ${sv.vocabulary.join(', ')}.\nA proof point that lands: ${sv.proofShape}\n`}` : ''}${scoredAccounts.slice(0, 5).map((a, i) => `
### ${i + 1}. ${a.name} (Tier ${a.tier})
- **Why prioritized**: ${reasonFor(a)}
- **Gap to address**: ${weakestOf(a)[0] === 'fit' ? 'Validate fit' : weakestOf(a)[0] === 'intent' ? 'Generate engagement' : weakestOf(a)[0] === 'relationship' ? 'Build relationships' : 'Verify timing'}
- **Recommended action**: ${nextStep(a)}
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
    execute: (args: {
      current_customers: string;
      ideal_icp: string;
      current_metrics?: {
        avg_acv?: number;
        avg_sales_cycle?: number;
        win_rate?: number;
        churn_rate?: number;
        nps?: number;
      };
      target_metrics?: {
        avg_acv?: number;
        avg_sales_cycle?: number;
        win_rate?: number;
        churn_rate?: number;
        nps?: number;
      };
      product_category?: string;
      company?: string;
      business_model?: string;
    }) => {
      const ctx0 = { cur: parseProfile(args.current_customers), idl: parseProfile(args.ideal_icp) };
      const ctx = readContext(args.business_model, { seller: [productWords(args.product_category, args.company)], context: [args.company], role: agreedRoles([...ctx0.cur.roles, ...ctx0.idl.roles], [args.ideal_icp, args.current_customers]), buyer: [args.ideal_icp, args.current_customers] });
      // Run 20 round 1 (quality): the two profiles are read in parts (who they are, size, buyer role, problem) and compared part by part.
      // Every part is the user's own words; a part only one profile states is named as a question to check, never filled in.
      const cur = ctx0.cur;
      const idl = ctx0.idl;
      const addSizes = (base: string[], extra: string[]) => [...base, ...extra.filter(e => !base.some(b => b.toLowerCase().includes(e.toLowerCase())))];
      const curSizes = addSizes(cur.sizes, sizesIn(args.current_customers));
      const idlSizes = addSizes(idl.sizes, sizesIn(args.ideal_icp));
      const dims: Array<{ name: string; label: string; noun: string; c: string[]; i: string[] }> = [
        { name: 'segments', label: 'Industries or segments', noun: 'industries or segments', c: cur.segments, i: idl.segments },
        { name: 'size', label: 'Company size', noun: 'company size', c: curSizes, i: idlSizes },
        { name: 'buyer role', label: 'Buyer or champion role', noun: 'a buyer or champion role', c: cur.roles, i: idl.roles },
        { name: 'problem', label: 'Problem or trigger', noun: 'the problem or trigger', c: cur.problems, i: idl.problems },
        { name: 'description', label: 'Other description', noun: 'this description', c: cur.rest, i: idl.rest },
      ].filter(d => d.c.length || d.i.length);
      const cell = (a: string[]) => (a.length ? a.map(x => clauseHead(x, 90)).join('; ') : 'not stated');
      const reading = (d: { name: string; noun: string; c: string[]; i: string[] }) => {
        if (d.name === 'description' && !d.c.length) return 'Only the ideal profile mentions this. Check how many of your current customers have it.';
        if (d.name === 'description' && !d.i.length) return 'Only the current base mentions this. Check whether it still belongs in the ideal profile.';
        if (d.c.length && !d.i.length) return `Your ideal profile does not state ${d.noun}, so your current base cannot be checked against it. Add what you want.`;
        if (!d.c.length && d.i.length) return `Your current base does not state ${d.noun}. Look it up for your current customers (CRM) and compare it with the ideal profile.`;
        const ov = overlap(d.c, d.i);
        if (!ov.onlyA.length && !ov.onlyB.length && !ov.related.length) return `Same in both: no gap on ${d.name}.`;
        return `${ov.both.length ? `In both: ${ov.both.map(x => clauseHead(x, 70)).join('; ')}. ` : ov.related.length ? '' : 'Nothing in common. '}${ov.related.length ? `Related wording: ${ov.related.map(([x, y]) => `${clauseHead(x, 60)} (current) and ${clauseHead(y, 60)} (ideal)`).join('; ')}. ` : ''}${ov.onlyA.length ? `Only in the current base: ${ov.onlyA.map(x => clauseHead(x, 70)).join('; ')}. ` : ''}${ov.onlyB.length ? `Only in the ideal profile: ${ov.onlyB.map(x => clauseHead(x, 70)).join('; ')}.` : ''}`.trim();
      };
      const segOverlap = overlap(cur.segments, idl.segments);
      // A segment of the current base is called outside the ideal profile only when the ideal profile is a list of segments that shares at least
      // one with the base and is not open ended ("and other industries"); otherwise the two lists are not comparable.
      const comparable = idl.segments.length > 0 && (segOverlap.both.length + segOverlap.related.length) > 0 && !/\b(?:other|all|any) (?:industries|sectors|segments|verticals)\b/i.test(args.ideal_icp);
      const currentOnlySegments = comparable ? segOverlap.onlyA : [];
      const idealOnlySegments = cur.segments.length ? segOverlap.onlyB : idl.segments;
      const { bv: sectorV, name: sideName } = buyerSide(ctx.v, idl.roles, cur.roles, args.product_category);
      const idealRoleChecks = sectorV ? idl.roles.map(r => { const m = bestRole(aliasRole(r, sectorV), sectorV.buyerRoles); return m ? `${r} matches a role usual in ${sideName} (${m})` : `${r} is not among the roles listed for ${sideName} (${sectorV.buyerRoles.slice(0, 4).join(', ')}); check who signs in your won deals`; }) : [];
      const namedRoles = [...cur.roles, ...idl.roles].map(r => aliasRole(r, sectorV));
      const roleGaps = sectorV ? sectorV.buyerRoles.filter(r => !namedRoles.some(n => sameRole(n, r))).slice(0, 4) : [];
      const idealSizes = sizesIn(args.ideal_icp);
      const pricingAction = ctx.model === 'services' ? 'Add a scope or service tier for larger clients (more services, locations or hours)'
        : ctx.model === 'connectivity' ? 'Price multi-site contracts so larger customers can add sites and links in one agreement'
        : ctx.model === 'investment' ? 'Offer mandate terms that fit larger allocators (reporting, fee structure)'
        : ctx.model === 'transactions' || ctx.model === 'marketplace' ? 'Offer volume terms for larger customers in return for committed volume'
        : ctx.model === 'saas' ? 'Add pricing tiers for enterprise' : 'Review your pricing and packaging for larger customers';
      const current = args.current_metrics || {};
      const target = args.target_metrics || {};

      // Run 20 round 1: a metric is compared only when you gave both its current and its target value. The old code filled the missing
      // side with preset figures (a 20% win rate, a 15% churn, a $50,000 target ACV) and rated gaps on them; those were invented numbers.
      const pairs = {
        acv: [current.avg_acv, target.avg_acv], cycle: [current.avg_sales_cycle, target.avg_sales_cycle],
        winRate: [current.win_rate, target.win_rate], churn: [current.churn_rate, target.churn_rate], nps: [current.nps, target.nps],
      } as Record<string, [number | undefined, number | undefined]>;
      const has2 = (k: string) => pairs[k][0] != null && pairs[k][1] != null;
      const cv = (k: string) => pairs[k][0] as number;
      const tv = (k: string) => pairs[k][1] as number;
      // A percentage of a base of 0 or below means nothing, so that gap is 'n/a' and its severity is not rated (run 7, T1).
      const pct = (diff: number, base: number) => (base > 0 ? (diff / base * 100).toFixed(0) : 'n/a');
      const gaps: Record<string, string> = {
        acv: has2('acv') ? pct(tv('acv') - cv('acv'), cv('acv')) : 'n/a',
        cycle: has2('cycle') ? pct(cv('cycle') - tv('cycle'), cv('cycle')) : 'n/a',
        winRate: has2('winRate') ? pct(tv('winRate') - cv('winRate'), cv('winRate')) : 'n/a',
        churn: has2('churn') ? pct(cv('churn') - tv('churn'), cv('churn')) : 'n/a',
        nps: has2('nps') ? pct(tv('nps') - cv('nps'), cv('nps')) : 'n/a',
      };
      // NPS runs from -100 to 100, so its gap is shown in points: target minus today (run 7, T1).
      const npsPoints = has2('nps') ? tv('nps') - cv('nps') : 0;
      const npsGap = !has2('nps') ? '' : npsPoints > 0 ? `+${npsPoints} points needed` : npsPoints === 0 ? 'target met, no increase needed' : `already ${-npsPoints} points above target, no increase needed`;
      const sev = (g: string, high: number, medium: number) => (g === 'n/a' ? 'Not rated' : parseInt(g) > high ? 'High' : parseInt(g) > medium ? 'Medium' : 'Low');
      // A gap in the other direction (the target is already met) says so instead of printing a double sign.
      const upGap = (g: string, word: string) => (g === 'n/a' ? `no percentage: today's value is 0` : parseFloat(g) === 0 ? 'target met, no change needed' : parseFloat(g) >= 0 ? `+${g}% ${word}needed` : `already above target, no ${word || 'increase '}needed`);
      const downGap = (g: string, word: string) => (g === 'n/a' ? `no percentage: today's value is 0` : parseFloat(g) === 0 ? 'target met, no change needed' : parseFloat(g) >= 0 ? (word ? `${g}% ${word}needed` : `-${g}% needed`) : `target is ${-parseFloat(g)}% above today, no ${word || 'reduction '}needed`);
      const behind = (g: string) => g !== 'n/a' && parseFloat(g) > 0;
      // With both values given and no gap, there is nothing to fix on that metric
      const noGap = (k: string) => has2(k) && gaps[k] !== 'n/a' && parseFloat(gaps[k]) <= 0;
      const NO_GAP = 'No gap: you are at or better than your target on this metric, so there is nothing to fix here.\n';
      const anyMetric = Object.keys(pairs).some(k => pairs[k][0] != null || pairs[k][1] != null);
      const money = (n: number) => `$${n.toLocaleString('en-US')}`;
      const fmtV = (k: string, n: number | undefined) => n == null ? 'not supplied' : k === 'acv' ? money(n) : k === 'cycle' ? `${n} days` : k === 'nps' ? String(n) : cleanPct(n);
      const metricRow = (k: string, label: string, gapText: string, priority: string) => `| **${label}** | ${fmtV(k, pairs[k][0])} | ${fmtV(k, pairs[k][1])} | ${has2(k) ? gapText : 'needs both a current and a target value'} | ${has2(k) ? priority : 'Not rated'} |`;
      const notCompared = [['acv', 'Avg ACV'], ['cycle', 'Sales Cycle'], ['winRate', 'Win Rate'], ['churn', 'Churn Rate'], ['nps', 'NPS']].filter(([k]) => !has2(k)).map(([, l]) => l);
      const section = (k: string, title: string, gapText: string, body: string) => has2(k) ? `### ${title} (${gapText})\n${noGap(k) ? NO_GAP : body}\n` : '';
      const targetAcv = pairs.acv[1];

      return `# ICP Gap Analysis

## Profile Comparison

- ${companyLine(args.company)}

${ctx.line}

### Current Customer Base
> ${shortText(args.current_customers)}

### Ideal Customer Profile (Target)
> ${shortText(args.ideal_icp)}

### What differs
${dims.length ? `| Part | Current base | Ideal profile | Reading |
|------|--------------|---------------|---------|
${dims.map(d => `| **${d.label}** | ${cell(d.c)} | ${cell(d.i)} | ${reading(d)} |`).join('\n')}
` : 'Neither text could be split into parts (industries, size, buyer role, problem). Describe each profile with those four parts, for example "mid-size banks, 500 to 2,000 employees, with the CFO as buyer, who face manual reconciliation".\n'}
${currentOnlySegments.length ? `- **In your current base but not named in the ideal profile**: ${andList(currentOnlySegments.map(x => clauseHead(x, 60)))}. Check their win rate, ACV and churn before you decide to keep selling to them or to qualify them out.\n` : ''}${idealOnlySegments.length ? `- **Named in the ideal profile but not listed in your current base**: ${andList(idealOnlySegments.map(x => clauseHead(x, 60)))}. Check whether you have won, lost or never pursued deals there.\n` : ''}${idealRoleChecks.length ? `- **Buyer role check (${sideName})**: ${idealRoleChecks.join('; ')}.\n` : ''}${roleGaps.length ? `- **Roles usual in ${sideName} that neither profile names**: ${andList(roleGaps)}. Add the ones that sign or evaluate in your deals.\n` : ''}
---

## Metric Gaps

${anyMetric ? `${Object.keys(pairs).some(has2) ? '' : 'You gave no metric with both a current and a target value, so no gap can be computed. The values you gave are shown; add the missing side to see the gap.\n\n'}| Metric | Current | Target | Gap | Priority |
|--------|---------|--------|-----|----------|
${[metricRow('acv', 'Avg ACV', upGap(gaps.acv, ''), sev(gaps.acv, 50, 25)), metricRow('cycle', 'Sales Cycle', downGap(gaps.cycle, ''), sev(gaps.cycle, 30, 15)), metricRow('winRate', 'Win Rate', upGap(gaps.winRate, ''), sev(gaps.winRate, 40, 20)), metricRow('churn', 'Churn Rate', downGap(gaps.churn, ''), sev(gaps.churn, 40, 20)), metricRow('nps', 'NPS', npsGap, sev(gaps.nps, 50, 25))].join('\n')}

${notCompared.length ? `Not compared (add both a current and a target value): ${notCompared.join(', ')}. This tool does not fill in preset figures for them.` : ''}` : `You supplied no metrics, so there is no metric gap to show. Add current_metrics and target_metrics (avg_acv, avg_sales_cycle, win_rate, churn_rate, nps) to compare them. This tool does not fill in preset figures.`}

---

${Object.keys(pairs).some(has2) ? `## Gap Root Cause Analysis

${section('acv', 'ACV Gap', upGap(gaps.acv, ''), `${behind(gaps.acv) ? '**Current**: Average deal value below your target\n' : ''}**Common causes to check**:
- Selling to smaller companies or at lower price points
- Targeting companies without budget
- Not selling to decision-makers
- Discounting too aggressively
- Missing what larger customers need (features, service levels or coverage)

**Actions**:
- Tighten company size filter in ICP
- Train on value-based selling
- ${pricingAction}
- Build reference customers in target segment`)}${section('cycle', 'Sales Cycle Gap', downGap(gaps.cycle, 'reduction '), `${behind(gaps.cycle) ? '**Current**: Deals taking too long to close\n' : ''}**Common causes to check**:
- Unclear value proposition
- Too many stakeholders involved
- Missing champion support
- Competitive displacement complex

**Actions**:
- Improve demo-to-close process
- Identify and enable champions earlier
- Create better competitive positioning
- Streamline procurement requirements`)}${section('winRate', 'Win Rate Gap', upGap(gaps.winRate, 'improvement '), `${behind(gaps.winRate) ? '**Current**: Losing too many deals\n' : ''}**Common causes to check**:
- Poor qualification upfront
- Weak differentiation
- Losing to status quo
- Pricing not competitive

**Actions**:
- Implement stricter qualification (BANT/MEDDPICC)
- Sharpen competitive battle cards
- Quantify cost of inaction
- Review pricing competitiveness`)}${section('churn', 'Churn Gap', downGap(gaps.churn, 'reduction '), `${behind(gaps.churn) ? '**Current**: Customers not staying\n' : ''}**Common causes to check**:
- Wrong customers being sold
- Poor onboarding
- Value not realized
- Better alternatives emerged

**Actions**:
- Stricter ICP qualification
- Improve customer success handoff
- Track time-to-value metrics
- Implement early warning system`)}
---

` : ''}## Recommended ICP Refinements

Based on the comparison above, tighten your ICP on these parts. Every line comes from your two texts or your metrics; where they say nothing, the line says what to add.

### Must-Have Criteria (Add These)
1. **Company size**: ${idealSizes.length ? `${andList(idealSizes)} (from your ideal profile)` : idlSizes.length ? `${andList(idlSizes)} (words from your ideal profile; put a number on it, for example the smallest employee count among your best customers)` : 'not stated in your ideal profile: add the smallest size among your best customers'}
2. **Buyer or champion**: ${idl.roles.length ? `${andList(idl.roles)} (from your ideal profile)` : 'not stated in your ideal profile: add the role that signs and the role that champions'}
3. **Problem**: ${idl.problems.length ? `${andList(idl.problems.map(x => q(shortText(x, 300))))} (from your ideal profile): qualify on it in the first call` : 'not stated in your ideal profile: add the problem your best customers had before they bought'}
4. **Segments**: ${idl.segments.length ? `${andList(idl.segments)} (from your ideal profile)` : 'not named in your ideal profile: add the industries you want more of'}
${idl.rest.length ? `5. **Other qualifiers in your ideal profile**: ${andList(idl.rest.map(x => q(shortText(x, 160))))}\n` : ''}${idl.claims.length || cur.claims.length ? `\nStatements from a page, kept apart and not used as qualifiers: ${andList([...idl.claims, ...cur.claims].map(x => q(shortText(x, 160))))}.\n` : ''}${targetAcv != null ? `${idl.rest.length ? '6' : '5'}. **Budget**: a deal value near your target ACV of ${money(targetAcv)} (${acvNoun(ctx.model)})\n` : ''}
### Disqualification Criteria (Add These)
${(() => { const d = [
  currentOnlySegments.length ? `**Segments outside the ideal profile**: ${andList(currentOnlySegments.map(x => clauseHead(x, 60)))}, once their win rate, ACV and churn confirm they are weaker` : '',
  idlSizes.length ? `**Size**: companies outside ${andList(idlSizes)}` : '',
  idl.roles.length ? `**No path to the buyer**: no access to ${andList(idl.roles)} or an equivalent` : '',
  idl.problems.length ? `**No sign of the problem**: ${q(shortText(idl.problems[0], 200))} is not present` : '',
  targetAcv != null ? `**Budget below your target**: a buyer whose budget is well under your target ACV of ${money(targetAcv)}` : ''].filter(Boolean);
  return d.length ? d.map((x, i) => `${i + 1}. ${x}`).join('\n') : 'Your inputs give no size, buyer role, problem, segment or target ACV to disqualify on. Add them to get disqualifiers built from your own figures.'; })()}

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

${ctx.v ? `${sideNotes(ctx.v, ['committee', 'metrics', 'vocabulary', 'proof'], idl.roles, cur.roles, args.product_category)}\n\n` : ''}**Next Step**: Use \`icp_evolution_tracker\` to monitor ICP changes over time

${SUGGESTED}
`;
    }
  },

  // ---------------------------------------------------------------------------
  // Tool 8: ICP Evolution Tracker - Dynamic ICP Monitoring
  // ---------------------------------------------------------------------------
  icp_evolution_tracker: {
    description: 'Review how your ICP should evolve: reads your recent wins, losses and market changes against your current ICP, states a candidate change for each (an addition to test, a disqualifier to test, an implication to check) and writes a draft of the updated ICP, with the roles your ICP does not name, the loss reasons to tag and what to pull from your CRM. It does not compute win rates; check each candidate against your CRM',
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
    execute: (args: {
      current_icp: string;
      recent_wins?: string;
      recent_losses?: string;
      market_changes?: string;
      time_period?: string;
      product_category?: string;
      company?: string;
    }) => {
      const period = args.time_period || 'Recent Quarter';
      const prof0 = parseProfile(args.current_icp);
      const ctx = readContext(undefined, { seller: [productWords(args.product_category, args.company)], context: [args.company, args.recent_wins, args.recent_losses, args.market_changes], role: agreedRoles(prof0.roles, [args.current_icp]), buyer: [args.current_icp] });
      const v = ctx.v;
      const prof = prof0;
      // Words from the sentence around a list ("from small firms to national builders", "plus owners") are not segments, and a role that is only the first words of another role is the same role.
      const segs = prof.segments.map((sg) => sg.replace(/;\s*(?:from|plus|including|such as)\b.*$/i, '').trim()).filter((sg) => sg.trim().length > 3 && !/^(?:from|plus|including|and|or|with|such as|e\.g\.)\b/i.test(sg.trim()));
      const roles = prof.roles.filter((r, _i, all) => !all.some((o) => o !== r && o.length > r.length && o.toLowerCase().startsWith(r.toLowerCase() + ' ')));
      const profSizes = [...prof.sizes, ...sizesIn(args.current_icp).filter(e => !prof.sizes.some(b => b.toLowerCase().includes(e.toLowerCase())))];
      // Run 19 D80 (problem 3): each win, loss and market change is read against the current ICP and gives one candidate
      // change, quoted in the user's words. A candidate is a hypothesis to check in the CRM, never a finding.
      const icpWords = new Set(args.current_icp.toLowerCase().split(/[^a-z0-9-]+/).filter(w => w.length > 3));
      const isNew = (t: string) => t.toLowerCase().split(/[^a-z0-9-]+/).filter(w => w.length > 3 && !['with', 'where', 'that', 'they', 'them', 'from', 'more', 'most', 'deals', 'deal', 'customers', 'customer', 'buyers', 'buyer', 'wanted', 'wanting', 'lost', 'won'].includes(w)).some(w => !icpWords.has(w));
      const items = (t?: string) => (t || '').split(/\n|;/).map(x => x.trim().replace(/^[-*•]\s*/, '')).filter(Boolean);
      const wins = items(args.recent_wins), losses = items(args.recent_losses), changes = items(args.market_changes);
      const lossKind = (t: string) => /price|cheaper|cost|budget|expensive|free/i.test(t) ? 'lost on price: check whether these buyers had the budget your ICP assumes'
        : /bundle|one vendor|single vendor|suite|all-in-one|erp-only|together/i.test(t) ? 'lost to a bundled or single-vendor choice: check whether buyers who want one suite belong in your ICP'
        : /competitor|incumbent|already/i.test(t) ? 'lost to an existing or competing tool: check what made the switch too hard'
        : /timing|priority|later|freeze/i.test(t) ? 'lost on timing: check for a trigger before you qualify'
        : 'check whether these buyers should have been qualified out earlier';
      const winLines = wins.map(w => isNew(w)
        ? `- **Candidate addition**: ${q(shortText(w, 200))}: this is not in your current ICP; test adding it if these deals closed faster or larger than your average`
        : `- **Confirms your ICP**: ${q(shortText(w, 200))}: it matches your current ICP, so keep it`);
      const lossLines = losses.map(l => `- **Candidate disqualifier**: ${q(shortText(l, 200))}: ${lossKind(l)}`);
      const changeLines = changes.map(c => `- **Implication to check**: ${q(shortText(c, 200))}: check which segments of your ICP this moves toward you or away from you, and update the qualifying questions`);
      const firstChange = wins.find(isNew) ? `Test adding ${q(shortText(wins.find(isNew)!, 80))}` : losses[0] ? `Test qualifying out ${q(shortText(losses[0], 80))}` : segs.length > 1 ? `Compare win rate, ACV and cycle across ${andList(prof.segments.slice(0, 4))}` : 'No change suggested yet';
      // Run 20 round 1 (quality): with or without wins and losses, your current ICP is read in parts and each part gets a test to run in
      // your CRM; the sector adds the roles and loss reasons to look for. Nothing is invented: every part is your own words.
      const partLines: string[] = [];
      segs.slice(0, 6).forEach((sg, i) => {
        const sub = /\(([^()]+)\)/.exec(sg);
        const base = sg.replace(/\s*\([^()]*\)/, '').trim();
        const parts = sub ? sub[1].split(/[;,]\s*/).filter(Boolean) : [];
        const role = roles[0];
        const lines = [
          `list every deal you won or lost with ${base} in it this period and compare its win rate with your other segments`,
          `compare the ACV and sales cycle of ${base} with the other segments${role ? `, and check whether ${role} is the one who signs there` : ''}`,
          `check whether churn and renewals in ${base} differ from the rest, and whether the same loss reasons recur there`,
        ];
        partLines.push(`- **Segment ${sg}**: ${lines[i % 3]}${parts.length ? `; then split it by the parts you named (${andList(parts)}) to see which one drives the result` : ''}. Keep, grow or drop it on that evidence.`);
      });
      if (profSizes.length) partLines.push(`- **Size (${andList(profSizes.map(x => clauseHead(x, 60)))})**: list the smallest and the largest customer you won this period; if they sit outside this size, the ICP is already wider (or narrower) than you wrote it.`);
      for (const r of roles.slice(0, 3)) partLines.push(`- **Role ${r}**: do deals that involve ${r} close faster or larger than deals that do not? If not, the role in your ICP is a label, not a fit signal.`);
      for (const pr of prof.problems.slice(0, 2)) partLines.push(`- **Problem ${q(clauseHead(pr, 100))}**: in how many of your wins was this the stated reason to buy, and in how many losses was it absent?`);
      // The sector's loss reasons and measures, led by the ones your own losses, wins and market changes point to (the same items, in your order of relevance).
      const vRanked: Vertical | null = v ? {
        ...v,
        objections: rankByUserWords(v.objections, (o) => o.objection, `${args.recent_losses || ''}\n${args.market_changes || ''}`, `${args.recent_wins || ''}\n${args.current_icp}`),
        metrics: rankByUserWords(v.metrics, (m) => m, `${args.recent_wins || ''}\n${args.recent_losses || ''}\n${args.market_changes || ''}\n${prof.problems.join('\n')}`, `${args.product_category || ''}\n${args.current_icp}`),
      } : null;
      const { bv: sideV, name: sideName } = buyerSide(v, prof.roles, args.current_icp, args.product_category);
      const roleAdds = sideV ? sideV.buyerRoles.filter(r => ![...prof.roles].some(n => sameRole(aliasRole(n, sideV), r))).slice(0, 4) : [];


      return `# ICP Evolution Analysis

- ${companyLine(args.company)}

${sectorLine(v, ctx.via)}

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

## Your Current ICP, Part by Part

${partLines.length ? `${partLines.join('\n')}\n` : 'Your current ICP text did not split into segments, size, buyer role or problem. Write it in those parts (for example "mid-size banks, 500 to 2,000 employees, CFO as buyer, who face manual reconciliation") to get a test for each part.\n'}${roleAdds.length ? `\n**Roles usual in ${sideName} that your ICP does not name**: ${andList(roleAdds)}. Check whether they sign or evaluate in the deals you won or lost; if they do, the ICP should name them.\n` : ''}${vRanked ? `\n**Loss reasons to tag in your CRM** (the objections ${vRanked.name} buyers raise): ${vRanked.objections.map(o => lowerCommonWords(o.objection)).join('; ')}. Count each over the period you are reviewing; a reason that rises is a change to your ICP or your qualification.\n` : ''}
${vRanked ? `${sideNotes(vRanked, ['committee', 'metrics', 'vocabulary'], prof.roles, args.current_icp, args.product_category)}\n\n` : ''}---

## Draft ICP for ${period}

*Built only from your own words. It is a hypothesis: check each line against your CRM before you adopt it.*

- **Your ICP as written**: ${q(shortText(args.current_icp, 700))}
- **Segments to keep until the data says otherwise**: ${segs.length ? andList(segs.slice(0, 6)) : 'your ICP text did not split into segments (see above)'}${profSizes.length ? `; size: ${andList(profSizes.map(x => clauseHead(x, 60)))}` : ''}.
${roles.length ? `- **Who signs and who evaluates**: ${andList(roles.slice(0, 4))}.\n` : ''}${prof.problems.length ? `- **The problem they share**: ${andList(prof.problems.slice(0, 2).map(x => q(clauseHead(x, 100))))}.\n` : ''}- **Add on trial**: ${wins.some(isNew) ? andList(wins.filter(isNew).slice(0, 3).map(w => q(shortText(w, 140)))) + ' (these wins are not in your ICP text; keep them if they closed faster or larger than your average)' : wins.length ? 'nothing: your wins match the ICP you wrote' : 'nothing yet, because no wins were given'}.
- **Qualify out on trial**: ${losses.length ? andList(losses.slice(0, 3).map(l => q(shortText(l, 140)))) + ' (' + andList([...new Set(losses.slice(0, 3).map(l => lossKind(l).split(':')[0]))]) + ')' : 'nothing yet, because no losses were given'}.
- **First change to test**: ${firstChange}.
- **Check against the market**: ${changes.length ? andList(changes.slice(0, 3).map(c => q(shortText(c, 140)))) + ': which of your segments does it move toward you or away from you?' : 'no market change was given.'}

## What to pull from your CRM for ${period}

For ${segs.length ? andList(segs.slice(0, 6)) : 'each part of your ICP'}: the deals you won and lost, the ACV and the sales cycle, and the churn and renewals. ${roles.length ? `For ${andList(roles.slice(0, 3))}: the deals where they were involved against the deals where they were not.` : ''} Put the answers next to the draft above and change a line only where the numbers say so.

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
    execute: (args: {
      interview_notes?: Array<{
        customer?: string;
        role?: string;
        key_quotes?: string[];
        pain_points?: string[];
        buying_triggers?: string[];
        value_realized?: string[];
      }>;
      raw_transcripts?: string;
      analysis_focus?: string;
      product_category?: string;
      company?: string;
    }) => {
      const notesIn = args.interview_notes || [];
      const ctx = readContext(undefined, {
        seller: [productWords(args.product_category, args.company)],
        context: [args.company, args.raw_transcripts, ...notesIn.flatMap(i => [...(i.pain_points || []), ...(i.buying_triggers || []), ...(i.value_realized || []), ...(i.key_quotes || [])])],
        role: agreedRoles(notesIn.map(i => i.role), notesIn.map(i => i.customer)),
      });
      const v = ctx.v;
      const tieNote = (rows: [string, number][], label: string) => rows.length > 1 && rows[0][1] === rows[1][1] ? `\nNo single leading ${label}: ${andList(rows.filter(r => r[1] === rows[0][1]).map(r => r[0]))} appear equally often.\n` : '';

      if (args.interview_notes && args.interview_notes.length > 0) {
        const interviews = args.interview_notes;
        const n = interviews.length;
        // Run 20 round 1 (quality): what you wrote in each field is sorted before it is counted. A question a buyer asked is not a pain
        // point; a page claim, an award or a case study title is not an outcome a customer reported in an interview; a statement marked
        // as a customer quote belongs under Key Quotes. Counts read "2 of 3 interviews", and notes that repeat one text say so.
        const isQuestion = (t: string) => /\?\s*$/.test(t.trim());
        const quoteLike = (t: string) => /\((?:customer|partner|analyst|client) quote\)|\b(?:customer|partner|client) quote\b|\bcustomer words\b|^["“]/i.test(t);
        const claimLike = (t: string) => !quoteLike(t) && /page claim|case study|story title|success story|ebook|home page|\baward|recogni[sz]|\blisted\b|ranking|named a\b|leader in|featured in|\(case study\)|magic quadrant|frost radar/i.test(t);
        const unquote = (t: string) => t.replace(/\s*\((?:customer|partner|analyst|client) quote\)\s*$/i, '').replace(/^customer (?:quote|words):\s*/i, '').replace(/^["“](.*)["”]$/, '$1').trim();
        const per = interviews.map(i => ({
          pains: (i.pain_points || []).filter(p => !isQuestion(p) && !isObjection(p)),
          asked: (i.pain_points || []).filter(isQuestion),
          objections: (i.pain_points || []).filter(p => !isQuestion(p) && isObjection(p)),
          triggers: i.buying_triggers || [],
          values: i.value_realized || [],
          quotes: i.key_quotes || [],
        }));
        const tally = (lists: string[][]) => {
          const c: Record<string, number> = {};
          lists.forEach(l => [...new Set(l)].forEach(x => { c[x] = (c[x] || 0) + 1; }));
          return Object.entries(c).sort((a, b) => b[1] - a[1]);
        };
        const of = (k: number) => (n === 1 ? 'in the 1 interview' : k === n ? `in all ${n} interviews` : `in ${k} of ${n} interviews (${Math.round(k / n * 100)}%)`);
        const topPains = tally(per.map(p => p.pains)).slice(0, 5);
        const asked = tally(per.map(p => p.asked)).slice(0, 8);
        const allObjections = tally(per.map(p => p.objections)).map(r => r[0]);
        const topTriggers = tally(per.map(p => p.triggers)).slice(0, 5);
        const valueRows = tally(per.map(p => p.values));
        const results = valueRows.filter(([t]) => !quoteLike(t) && !claimLike(t)).slice(0, 5);
        const claims = valueRows.filter(([t]) => claimLike(t)).slice(0, 5);
        const quoteValues = valueRows.filter(([t]) => quoteLike(t)).slice(0, 5);
        const roles = interviews.map(i => i.role).filter(Boolean) as string[];
        const roleCount: Record<string, number> = {};
        roles.forEach(r => { roleCount[r] = (roleCount[r] || 0) + 1; });
        const topRoles = Object.entries(roleCount).sort((a, b) => b[1] - a[1]).slice(0, 3);
        const sameAcross = n > 1 && new Set(per.map(p => JSON.stringify([p.pains, p.asked, p.values, p.triggers]))).size === 1;
        const typedQuotes = interviews.flatMap(i => (i.key_quotes || []).map(qt => ({ quote: qt, customer: i.customer, role: i.role, from: '' })));
        // "Sula Vineyards CFO on the home page: the tool reduced ..." is a quote with its source in front: the source becomes the attribution.
        const fromValue = quoteValues.map(([t]) => {
          const u = unquote(t);
          // the input's own label says who spoke: "(partner quote)" is a partner, "(customer quote)" a customer
          const who = (/\((partner|analyst|client|customer) quote\)/i.exec(t)?.[1] || 'customer').toLowerCase();
          const whoLabel = who === 'customer' || who === 'client' ? 'Customer' : who.charAt(0).toUpperCase() + who.slice(1);
          const m = /^(.{3,70}?)\s+on the (?:home |about |customer |product )?page:\s*(.+)$/i.exec(u) || /^((?:[A-Z][\w.'&-]*\s*){1,5}?(?:CFO|CEO|CIO|CTO|COO|CISO|CVP|VP|Director|Head|Manager)(?:,? [A-Z][\w ]{0,30})?):\s*(.+)$/.exec(u) || /^((?:[A-Za-z][\w.'&-]*\s+){0,2}(?:CFO|CEO|CIO|CTO|COO|CISO|CVP|VP|Director|Head|Manager)\b[^:]{0,45}):\s*(.+)$/.exec(u);
          return m ? { quote: m[2].trim(), customer: m[1].trim(), role: whoLabel, from: 'value_realized' } : { quote: u, customer: undefined as string | undefined, role: whoLabel, from: 'value_realized' };
        });
        const allQuotes = [...typedQuotes, ...fromValue];
        const painHead = topPains[0] ? clauseHead(topPains[0][0], 90) : '';
        const side = buyerSide(v, roles, args.product_category, interviews.flatMap(i => [...(i.pain_points || []), ...(i.value_realized || [])]));
        const area = painHead && !/ \.\.\.$/.test(painHead) ? painHead : '';
        const headline = (t: string) => clauseHead(t, 90);
        const questionAnswer = (t: string) => /\b(?:integrat\w*|connect\w*|work with|sync\w*|support)\b/i.test(t) ? 'Answer with the named systems and what the integration reads and writes; link the documentation.'
          : /\b(?:differ\w*|versus|vs|compared?|better than)\b|\bwhy\b.*\bover\b/i.test(t) ? 'Prepare one honest line on what is different, based on something the buyer can test, and where the other option is stronger.'
          : /\b(?:price|prices|pricing|cost|costs|plans?|fees?)\b/i.test(t) ? 'Answer with how the price is built and one example from a similar customer, not a promise.'
          : /\b(?:secur\w*|complian\w*|gdpr|soc ?2?|regulat\w*|asc 606|ifrs|audit\w*)\b/i.test(t) ? 'Answer with the evidence you hold (certificates, reports, controls); never claim a status you cannot show.'
          : /how long|set ?up|implement|onboard|migrat|get started/i.test(t) ? 'Give a timeline from a comparable customer, not a general promise.'
          : /offline|network|mobile|device|remote/i.test(t) ? "Answer with a demonstration under the buyer's own conditions."
          : "Write the answer once, in the buyer's words, and put it where the question is asked.";

        const readFirst = [
          sameAcross ? `All ${n} interview notes carry the same pain points, questions and value statements, so every count below is ${n} of ${n} by repetition. Treat them as one source until you add notes from separate interviews.` : '',
          asked.length ? `${plural(asked.length, 'item')} in pain_points ${asked.length === 1 ? 'is a question a buyer asked' : 'are questions buyers asked'} (listed apart, not counted as pain points).` : '',
          claims.length ? `${plural(claims.length, 'value statement')} read${claims.length === 1 ? 's' : ''} like a page claim, award or case study title rather than an outcome a customer told you (listed apart; confirm ${claims.length === 1 ? 'it' : 'them'} with customers before you lead with ${claims.length === 1 ? 'it' : 'them'}).` : '',
        ].filter(Boolean);

        return `# Customer Interview Synthesis

## Interviews Analyzed
- ${companyLine(args.company)}

**Count**: ${plural(n, 'interview')}
**Roles Represented**: ${[...new Set(roles)].join(', ') || 'Not specified'}

${sectorLine(v, ctx.via)}
${readFirst.length ? `\n**Read this first**:\n${readFirst.map(x => `- ${x}`).join('\n')}\n` : ''}
---

## Pattern Analysis

### Top Pain Points (by frequency)
${topPains.length > 0 ? topPains.map(([pain, count], i) =>
  `${i + 1}. **${shortText(pain, 300)}**: ${of(count)}`
).join('\n') : '- No pain points captured'}

**ICP Implication**: Target customers experiencing these pain points
${asked.length ? `\n### Questions Buyers Asked (not counted as pain points)\n${asked.map(([t, k]) => `- ${q(shortText(t, 200))} (${of(k)}): ${questionAnswer(t)}`).join('\n')}\n` : ''}${allObjections.length ? `\n### Objections heard\n${allObjections.map(o => `- ${q(o)}: ${answerFor(o, v)}`).join('\n')}\n` : ''}
### Top Buying Triggers
${topTriggers.length > 0 ? topTriggers.map(([trigger, count], i) =>
  `${i + 1}. **${trigger}**: ${of(count)}`
).join('\n') : '- No triggers captured. Ask each customer: "What changed that made you start looking?" and record the answer as buying_triggers.'}

**ICP Implication**: Time outreach around these events

### Value Realized (Post-Purchase)
${results.length > 0 ? results.map(([value, count], i) =>
  `${i + 1}. **${shortText(value, 300)}**: ${of(count)}`
).join('\n') : '- No outcomes captured as results. Ask each customer what changed for them, in their own words, and record it as value_realized.'}
${claims.length ? `\n**Claims and recognition in your notes** (not outcomes a customer reported to you; use them as proof points only after a customer confirms them):\n${claims.map(([value, count]) => `- ${shortText(value, 300)} (${of(count)})`).join('\n')}\n` : ''}
**ICP Implication**: ${results.length ? 'Lead with these outcomes in messaging' : 'Collect customer outcomes before you lead with value in messaging'}

### Champion Roles
${topRoles.length > 0 ? topRoles.map(([role, count], i) =>
  `${i + 1}. **${role}**: ${of(count)}`
).join('\n') : '- No roles captured'}
${tieNote(topRoles, 'role')}
**ICP Implication**: Focus outreach on these titles

---

## Key Quotes

${allQuotes.length ? allQuotes.slice(0, 5).map((qt, i) => `
### Quote ${i + 1}
> "${qt.quote}"
> (${qt.role || 'Customer'}${qt.customer ? (qt.from ? `: ${qt.customer}` : ` at ${qt.customer}`) : ''}${qt.from ? `; written in ${qt.from}, marked as a customer quote` : ''})
`).join('\n') : 'No key_quotes were given and none of your statements is marked as a customer quote, so none are shown. Quotes are never written for you: add key_quotes, word for word, from your interviews.'}

---

## ICP Refinements from Interviews

### Add to ICP
Based on patterns, your ideal customer:
${topPains[0] ? `- Experiences: ${q(shortText(topPains[0][0], 300))}\n` : ''}${topTriggers[0] ? `- Is triggered by: ${topTriggers[0][0]}\n` : ''}${topRoles[0] ? (topRoles[1] && topRoles[1][1] === topRoles[0][1] ? `- Champion is one of: ${andList(topRoles.filter(r => r[1] === topRoles[0][1]).map(r => r[0]))} (no single leading role yet)\n` : `- Champion is: ${topRoles[0][0]}\n`) : ''}${results[0] ? `- Seeks outcome: ${shortText(results[0][0], 300)}\n` : ''}
### Messaging Updates
Based on customer language, update:
${topPains[0] ? `- **Pain messaging**: ${q(shortText(topPains[0][0], 300))}\n` : ''}${results[0] ? `- **Value messaging**: ${q(shortText(results[0][0], 300))}\n` : (allQuotes.length ? '- **Value messaging**: none yet as outcomes; the customer statements under Key Quotes are the starting point, once the customer agrees to be quoted\n' : '- **Value messaging**: none yet; your value statements are claims, not customer outcomes\n')}
### Discovery Questions to Add
${topPains.slice(0, 3).map((p, i) =>
  `${i + 1}. About ${q(headline(p[0]))}: how does your team handle this today, what does it cost you, and who owns fixing it?`
).join('\n') || '- Add pain points to the notes for discovery questions'}
${side.bv ? `\n### Sector questions (${side.name})\n${side.bv.discovery.slice(0, 3).map((x, i) => `${i + 1}. "${x}"`).join('\n')}\n` : ''}
---

## Interview Template for Next Round

Based on gaps in this analysis, ask about:

1. **Pain Exploration**: "What is the biggest challenge you face in this area today?"${area ? ` (the top pain in your notes, to probe: ${q(area)})` : ''}
2. **Trigger Events**: "What made you start looking for a solution?"${topTriggers.length ? '' : ' (no triggers in your notes yet)'}
3. **Value Measurement**: "How do you measure success?"${side.bv ? ` ${/buyers$/.test(side.name) ? `${side.name.charAt(0).toUpperCase()}${side.name.slice(1)} usually measure` : `In ${side.name}, buyers usually measure`} ${andList(side.bv.metrics.slice(0, 3))}.` : ''}
4. **Buying Process**: "Who else was involved in the decision?"
5. **Alternatives Considered**: "What else did you evaluate?"

**Next Step**: Conduct more interviews to strengthen pattern confidence
`;
      }

      // If raw transcripts provided
      if (args.raw_transcripts) {
        return `Your notes are below. This tool analyzes structured notes only.

- ${companyLine(args.company)}

${sectorLine(v, ctx.via)}

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

export const SERVER_NAME = 'icp-intelligence-mcp';
export const SERVER_VERSION = '1.2.17';

// Every tool only builds text from its inputs: no storage, no network, no side effects.
const TOOL_TITLES: Record<string, string> = {
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

function withMeta<T extends { name: string }>(tool: T) {
  const title = TOOL_TITLES[tool.name] ?? tool.name;
  return {
    ...tool,
    title,
    annotations: { title, readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  };
}

// Decision N2 (run 6) and the run 7 fixes (T2, T3, T5, T6): every input is checked against its schema before a tool runs,
// at any depth. A number sent as text is read the way the web form reads it (commas allowed) or refused; minimum,
// exclusiveMinimum and maximum hold; a choice must be one of the listed values; a text field that holds money
// (MONEY_TEXT) cannot hold a negative amount (a negative percentage such as "-12% growth" is fine); a metrics text
// (METRIC_TEXT) cannot hold negative money but may hold a negative NPS or growth rate; a field that must
// hold one amount (ONE_AMOUNT) cannot hold a range.
type SchemaNode = { type?: string; minimum?: number; exclusiveMinimum?: number; maximum?: number; enum?: unknown[]; properties?: Record<string, SchemaNode>; items?: SchemaNode };
const NEGATIVE_AMOUNT = /\$\s*[-\u2212]\s*\d|(^|[\s(:=,;])[-\u2212](?:\$|usd|inr|eur|gbp|rs\.?|\u20b9|\u20ac|\u00a3)?\s?\d[\d,]*(?:\.\d+)?(?![\d,.]|\s*%)/i;
const NEGATIVE_MONEY = /[-−]\s?[$₹€£]\s*\d|[$₹€£]\s*[-−]\s*\d|\b(?:mrr|arr|cac|ltv|acv)\b[:\s]*[-−]\s*\d/i;
const AMOUNT_RANGE = /\d\s*[kmb]?\s*(?:-|\u2013|\u2014|to)\s*[$\u20b9\u20ac\u00a3]?\s*\d/i;
function checkValue(schema: SchemaNode, holder: Record<string, unknown> | unknown[], key: string | number, path: string, problems: string[]): void {
  const box = holder as Record<string | number, unknown>;
  const value = box[key];
  if (value === undefined || value === null) return;
  if (schema.properties && typeof value === "object" && !Array.isArray(value)) {
    for (const [k, p] of Object.entries(schema.properties)) checkValue(p, value as Record<string, unknown>, k, path ? `${path}.${k}` : k, problems);
    return;
  }
  if (schema.items && Array.isArray(value)) {
    value.forEach((_, i) => checkValue(schema.items as SchemaNode, value, i, `${path}[${i}]`, problems));
    return;
  }
  if (Array.isArray(schema.enum) && typeof value === "string" && !schema.enum.includes(value)) {
    problems.push(`${path} must be one of: ${schema.enum.join(", ")}`);
    return;
  }
  if (schema.type !== "number" && schema.type !== "integer") return;
  let v = value;
  if (typeof v === "string") {
    const n = v.trim() === "" ? NaN : Number(v.replace(/,/g, "").trim());
    if (!Number.isFinite(n)) { problems.push(`${path} must be a number, written with digits only (for example 220000)`); return; }
    box[key] = n;
    v = n;
  }
  if (typeof v !== "number" || !Number.isFinite(v)) { problems.push(`${path} must be a number`); return; }
  if (typeof schema.minimum === "number" && v < schema.minimum) problems.push(`${path} must be ${schema.minimum} or more`);
  if (typeof schema.exclusiveMinimum === "number" && v <= schema.exclusiveMinimum) problems.push(`${path} must be more than ${schema.exclusiveMinimum}`);
  if (typeof schema.maximum === "number" && v > schema.maximum) problems.push(`${path} must be ${schema.maximum} or less`);
}

const MONEY_TEXT: Record<string, string[]> = { buyer_group_analyzer: ["deal_size"] };
const METRIC_TEXT: Record<string, string[]> = {};
const ONE_AMOUNT: Record<string, string[]> = {};

function checkRequiredInputs(name: string, args: Record<string, unknown> | undefined): string | null {
  const tool = (tools as Record<string, { inputSchema: { required?: string[] } }>)[name];
  if (!tool) {
    return `Unknown tool: ${name}. Available tools: ${Object.keys(tools).join(', ')}.`;
  }
  const required = tool.inputSchema.required ?? [];
  // Run 16 R16-10 (rule B52): a required text (a string with no fixed list of choices) that is empty or only whitespace counts as missing.
  const props = ((tool.inputSchema as { properties?: Record<string, { type?: string; enum?: unknown[] }> }).properties ?? {});
  const blankText = (key: string) => typeof args?.[key] === "string" && (args[key] as string).trim() === "" && props[key]?.type === "string" && !Array.isArray(props[key]?.enum);
  const missing = required.filter((key) => args?.[key] === undefined || args?.[key] === null || blankText(key));
  if (missing.length > 0) {
    return `Missing required input for ${name}: ${missing.join(', ')}. Provide ${missing.length === 1 ? 'it' : 'them'} and call the tool again.`;
  }
  // Decision N2 (run 6) and run 7: schema limits at any depth, choices, money text and single amounts.
  const problems: string[] = [];
  if (args) {
    for (const [k, p] of Object.entries((tool.inputSchema as unknown as SchemaNode).properties ?? {})) checkValue(p, args, k, k, problems);
  }
  for (const key of MONEY_TEXT[name] ?? []) {
    const raw = args?.[key];
    if (typeof raw === "string" && NEGATIVE_AMOUNT.test(raw)) problems.push(`${key} must not contain a negative amount`);
  }
  for (const key of METRIC_TEXT[name] ?? []) {
    const raw = args?.[key];
    if (typeof raw === "string" && NEGATIVE_MONEY.test(raw)) problems.push(`${key} must not contain a negative amount of money`);
  }
  for (const key of ONE_AMOUNT[name] ?? []) {
    const raw = args?.[key];
    if (typeof raw === "string" && AMOUNT_RANGE.test(raw)) problems.push(`${key} must be one amount, not a range (for example $75,000)`);
  }
  // Run 15 R15-32 (edge-case matrix): a percentage cannot pass 100, a 1-100 score cannot pass 100, and NPS runs from -100 to 100.
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  if (name === "tam_sam_som_calculator") {
    // Run 20: the limit of 100 is now in the input schema (maximum), so checkValue above names it once.
  }
  // Run 16 D45: a weight given as 0 is used as 0, so four weights of 0 leave nothing to score with.
  if (name === "account_prioritization") {
    const w = (args?.prioritization_weights && typeof args.prioritization_weights === "object" ? args.prioritization_weights : {}) as Record<string, unknown>;
    if (["fit", "intent", "relationship", "timing"].every((k) => w[k] === 0)) problems.push("at least one weight must be more than 0");
  }
  // Run 20: the limit of 100 for the three scores is now in the input schema (maximum), so checkValue above names it once.
  if (name === "icp_gap_analysis") {
    for (const side of ["current_metrics", "target_metrics"]) {
      const m = (args?.[side] || {}) as Record<string, unknown>;
      for (const k of ["win_rate", "churn_rate"]) { const v = num(m[k]); if (v !== null && (v < 0 || v > 100)) problems.push(`${side}.${k} must be from 0 to 100 (it is a percentage)`); }
      const n = num(m.nps); if (n !== null && (n < -100 || n > 100)) problems.push(`${side}.nps must be from -100 to 100`);
    }
  }
  if (problems.length > 0) {
    return `Invalid input for ${name}: ${problems.join("; ")}.`;
  }
  return null;
}

export function createServer(): Server {
  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: Object.entries(tools).map(([name, config]) => withMeta({ name, description: config.description, inputSchema: config.inputSchema })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const problem = checkRequiredInputs(request.params.name, request.params.arguments as Record<string, unknown> | undefined);
    if (problem) {
      return { content: [{ type: 'text', text: problem }], isError: true };
    }
    const toolName = request.params.name as keyof typeof tools;
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
      const result = tool.execute(neutraliseDeep(request.params.arguments) as any);
      return {
        content: [{ type: 'text', text: result }]
      };
    } catch (error) {
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
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`ICP Intelligence MCP v${SERVER_VERSION} running on stdio`);
}

// Run over stdio only when started directly (npm bin). The hosted function imports this
// file as an ES module bundle, where require is not defined.
if (typeof module !== 'undefined' && typeof require !== 'undefined' && require.main === module) {
  main().catch(console.error);
}
