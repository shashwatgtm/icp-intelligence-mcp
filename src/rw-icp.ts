// Run 22 rewrite helpers for icp_gap_analysis and icp_scoring_model (text only: no network, no files, no environment, no logging).
//
// Why this file exists: the old gap analysis split a profile into pieces and compared the pieces word for word, so a segment the ideal profile
// names in other words was called missing, a country became a segment, and the answer pasted the inputs back. Here a profile is read in parts
// (segments, teams, size, place, buyer, problem, page claims, exclusions), every comparison is made against the WHOLE other text with
// a stem and alias check, and a thing is called "not named" only when none of its main words is in the other text.
// The old scoring model gave points by the order the user listed the values, so named targets listed last scored 0. Here a list of named
// targets scores the full weight for each, and only a list that is ordered by nature (ranges, yes or no, timelines) keeps the preset steps.
// Sector facts come only from src/verticals.ts (rule B82); this file holds cue words (places, size words, aliases), no statistic or company.
// Hostile or odd text is only ever quoted in the user's own words; it is never followed (the echo safeguard has already run).

import { VERTICALS, SUBTYPES } from './verticals.ts';
import type { Vertical } from './verticals.ts';

// ---------------------------------------------------------------------------
// small text helpers
// ---------------------------------------------------------------------------
const squash = (t: string) => String(t ?? '').replace(/\s+/g, ' ').trim();
const noDot = (t: string) => t.replace(/[.\s]+$/, '').trim();
const ucFirst = (t: string) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);
// a title typed in lower case starts a sentence with a capital; a brand style word such as eCommerce is left as typed
const sentenceCase = (t: string) => (/^[a-z][A-Z]/.test(t) ? t : ucFirst(t));

// A list in plain English. When an item holds "and" or a comma the items are separated by semicolons so the list stays readable.
export function listText(items: string[]): string {
  if (items.length > 2 && items.some((x) => /(?<!\d),(?!\d)| and /.test(x))) return `${items.slice(0, -1).join('; ')}; and ${items[items.length - 1]}`;
  if (items.length === 2 && items.some((x) => / and /.test(x))) return `${items[0]}, and ${items[1]}`;
  return items.length <= 1 ? (items[0] || '') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}
const quote = (t: string) => `“${noDot(squash(t)).replace(/[“”]/g, '')}”`;

// Marks that are not an end (a number with a comma, Sr. Dr. Inc., e.g.) are hidden before a split and restored after.
function protect(t: string): string {
  return String(t)
    .replace(/(\d),(?=\d{3}(?!\d))/g, '$1\u0004')
    .replace(/\b(Sr|Jr|Mr|Mrs|Ms|Dr|Rs|Inc|Ltd|Co|Corp|Pvt|vs|St|No|approx|etc)\.(?=\s|,|$)/gi, '$1\u0003')
    .replace(/\b(e)\.(g)\./gi, '$1\u0003$2\u0003').replace(/\b(i)\.(e)\./gi, '$1\u0003$2\u0003');
}
const restore = (t: string) => String(t).replace(/\u0003/g, '.').replace(/\u0004/g, ',').replace(/\u0001/g, ';').replace(/\u0002/g, ',');
// Split on a separator that is not inside a bracket.
function splitTop(t: string, sep: RegExp): string[] {
  let depth = 0; let cur = ''; const out: string[] = [];
  const s = protect(t);
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '(') depth++;
    if (ch === ')') depth = Math.max(0, depth - 1);
    if (depth === 0 && sep.test(ch)) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur);
  return out.map((x) => squash(restore(x))).filter(Boolean);
}
const sentenceSplit = (t: string) => protect(t).split(/(?<=[a-z0-9)"'%”])\.\s+(?=[A-Z“])/).map((x) => squash(restore(x)).replace(/\.$/, '')).filter(Boolean);

// ---------------------------------------------------------------------------
// cue words (no statistic, no company): size words, places, aliases, generic nouns
// ---------------------------------------------------------------------------
const SIZE_WORD = /\b(?:mid-?size[d]?|mid-?market|medium(?:-sized)?|large(?:r)?|small(?:er)?|smbs?|msmes?|smes?|startups?|start-ups?|scale-ups?|enterprises?(?!\s+(?:software|solutions?|saas|tools?|platforms?|apps?|applications?|systems?|technology|it|security|sales|data|resource|content|search|storage|mobility|ai|architecture|grade|class|edition|plan|licen[cs]es?))|multi[- ]location|multi[- ]site|solo|boutique|fortune \d+|forbes global \d+|hyper-growth|growth stage|growth-stage)\b/gi;
const SIZE_ONLY = /\b(?:mid-?size[d]?|mid-?market|medium(?:-sized)?|large(?:r)?|small(?:er)?|smbs?|msmes?|smes?|startups?|start-ups?|scale-ups?|enterprises?(?!\s+(?:software|solutions?|saas|tools?|platforms?|apps?|applications?|systems?|technology|it|security|sales|data|resource|content|search|storage|mobility|ai|architecture|grade|class|edition|plan|licen[cs]es?))|solo|fortune \d+|forbes global \d+|hyper-growth|growth stage|growth-stage)\b/i;
const EMPLOYEE_RANGE = /\b\d[\d,]*\s*(?:to|-|–)\s*\d[\d,]*\s+(?:employees|sites|branches|locations|stores|outlets|seats|users|properties|parcels|shipments)\b(?:\s+a\s+(?:month|year|day))?|\b(?:under|over|more than|fewer than|up to|at least)\s+\d[\d,]*\s+(?:employees|sites|branches|locations|stores|outlets)\b|\b\d[\d,]*\+\s+(?:employees|sites|branches|locations|stores|outlets)\b/gi;
const PLACES = ['India', 'China', 'Japan', 'Singapore', 'Indonesia', 'Malaysia', 'Vietnam', 'Thailand', 'Philippines', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal', 'Australia', 'New Zealand', 'Canada', 'Mexico', 'Brazil', 'Argentina', 'Chile', 'Colombia', 'United States', 'USA', 'US', 'U.S.', 'United Kingdom', 'UK', 'Ireland', 'France', 'Germany', 'Spain', 'Italy', 'Netherlands', 'Belgium', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Poland', 'Switzerland', 'Austria', 'Portugal', 'Turkey', 'Israel', 'Saudi Arabia', 'UAE', 'United Arab Emirates', 'Egypt', 'Nigeria', 'Kenya', 'South Africa', 'Europe', 'EMEA', 'MENA', 'APAC', 'LATAM', 'Latin America', 'North America', 'South Asia', 'Southeast Asia', 'Middle East', 'Africa', 'Asia', 'Asia Pacific', 'the Middle East', 'the Midwest', 'the Nordics', 'Midwest', 'Nordics', 'Gulf', 'the Gulf', 'Northeast', 'Southeast', 'Southwest', 'West Coast', 'East Coast', 'Texas', 'California', 'Ontario', 'Maharashtra', 'Karnataka'];
const PLACE_RE = new RegExp(`\\b(?:in|across|throughout|within|from)\\s+(?:the\\s+)?(${PLACES.filter((p) => !/^the /.test(p)).sort((a, b) => b.length - a.length).map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi');
const WITH_THE = new Set(['midwest', 'nordics', 'middle east', 'gulf', 'northeast', 'southeast', 'southwest', 'west coast', 'east coast', 'netherlands', 'united states', 'united kingdom', 'uae', 'philippines', 'us', 'usa', 'uk', 'u.s.']);
const placeText = (p: string) => (WITH_THE.has(p.toLowerCase()) ? `the ${p}` : p);
const GENERIC_ORG = /\b(?:compan(?:y|ies)|businesses|business|firms?|organi[sz]ations?|enterprises?|customers?|clients?|accounts?|players?|institutions?|entities|operators?)\b/gi;
const STOP = new Set(['and', 'the', 'for', 'with', 'from', 'that', 'this', 'of', 'in', 'on', 'at', 'to', 'a', 'an', 'or', 'by', 'as', 'its', 'their', 'our', 'your', 'who', 'which', 'all', 'any', 'every', 'other', 'others', 'more', 'than', 'some', 'many', 'most', 'several', 'various', 'across', 'about', 'into', 'over', 'under', 'are', 'is', 'be', 'have', 'has', 'need', 'needs', 'serv', 'service', 'services', 'compan', 'busin', 'firm', 'firms', 'organ', 'customer', 'client', 'player', 'provid', 'industr', 'sector', 'segment', 'market', 'based', 'led', 'type', 'types', 'kind', 'kinds', 'also', 'both', 'national', 'international', 'global', 'regional', 'local', 'leading', 'major', 'top', 'large', 'small', 'big', 'brand', 'brands']);
// alias groups: words that mean the same customer type in practice (a word in a group is found when any word of the group is in the text)
const ALIASES: string[][] = [
  ['bfsi', 'bank', 'banking', 'banks', 'financial', 'finance', 'lending', 'lender', 'lenders', 'nbfc', 'neobank', 'neobanks', 'credit'],
  ['fintech', 'fintechs', 'paytech', 'payments'],
  ['bfsi', 'insurance', 'insurer', 'insurers', 'insurtech'],
  ['telecom', 'telecoms', 'telecommunication', 'telecommunications', 'telco', 'telcos', 'communications', 'isp', 'isps', 'carrier', 'carriers'],
  ['software', 'saas', 'tech', 'technology'],
  ['ecommerce', 'e-commerce', 'ecom', 'online', 'webstore', 'webshop', 'dtc', 'd2c'],
  ['retail', 'retailer', 'retailers', 'store', 'stores', 'shop', 'shops', 'merchant', 'merchants', 'supermarket', 'supermarkets'],
  ['auto', 'automotive', 'automobile', 'automobiles', 'vehicle', 'vehicles', 'oem', 'oems'],
  ['food', 'beverage', 'beverages', 'spirits', 'wine', 'wines', 'drinks', 'brewery', 'distillery', 'grower', 'growers', 'farm', 'farms', 'agricultural', 'agriculture', 'dairy', 'snack', 'snacks', 'cooperative'],
  ['cpg', 'fmcg', 'packaged', 'grocery', 'groceries', 'beverage', 'beverages', 'food'],
  ['education', 'edtech', 'edu', 'learning', 'school', 'schools', 'university', 'universities'],
  ['gaming', 'games', 'game', 'gamer'],
  ['media', 'entertainment', 'streaming', 'publishing', 'broadcast'],
  ['government', 'governments', 'public', 'ministries', 'ministry', 'agency', 'agencies'],
  ['manufacturing', 'manufacturer', 'manufacturers', 'industrial', 'factory', 'factories', 'plant', 'plants'],
  ['logistics', 'shipping', 'freight', 'transport', 'transportation', 'supply', 'distribution', 'distributor', 'distributors', 'wholesale'],
  ['energy', 'utilities', 'utility', 'power'],
  ['restaurant', 'restaurants', 'qsr', 'food', 'foodservice', 'dining', 'cafe', 'cafes', 'bakery', 'bakeries', 'diner'],
  ['hospitality', 'hotel', 'hotels', 'hostel', 'hostels', 'travel', 'accommodation', 'resort', 'resorts'],
];
const stemOf = (w: string) => { const x = w.toLowerCase().replace(/[^a-z0-9]/g, ''); return x.length > 5 ? x.slice(0, 5) : x; };
const STOP_STEMS = new Set([...STOP].map(stemOf));
const ALIAS_OF: Map<string, Set<string>> = (() => {
  const m = new Map<string, Set<string>>();
  for (const g of ALIASES) { const stems = new Set(g.map(stemOf)); for (const s of stems) { const cur = m.get(s) || new Set<string>(); stems.forEach((x) => cur.add(x)); m.set(s, cur); } }
  return m;
})();
// omnichannel means online and offline
const EXTRA_WORDS: Record<string, string[]> = { omnichannel: ['online', 'offline'], 'multichannel': ['online', 'offline'] };

function tokensOf(t: string, dropSizes = true): string[] {
  let s = String(t).toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/e-commerce/g, 'ecommerce').replace(/\bstart-ups?\b/g, 'startup').replace(/\bscale-ups?\b/g, 'scaleup');
  if (dropSizes) s = s.replace(SIZE_WORD, ' ');
  const raw = s.split(/[^a-z0-9]+/).filter(Boolean);
  const out: string[] = [];
  for (const w of raw) { if (EXTRA_WORDS[w]) out.push(...EXTRA_WORDS[w].map(stemOf)); else out.push(stemOf(w)); }
  return out.filter((w) => w.length >= 2 && !STOP_STEMS.has(w));
}
// The words that say WHICH kind of customer an item is: what is left after size words, generic nouns and what follows "on", "with", "that".
function itemKey(item: string): string {
  let k = String(item).replace(/\([^)]*\)/g, ' ');
  k = k.split(/:\s/)[0];
  k = k.split(/\s+(?:on|with|that|who|which|using|across|via|through)\s+/i)[0];
  return squash(k);
}
// 1 when every main word of the item is in the text, 0 when none is.
export function coverage(item: string, text: string): number {
  const toks = [...new Set(tokensOf(itemKey(item)))];
  if (!toks.length) return 1;
  const hay = new Set(tokensOf(text, false));
  const hit = toks.filter((w) => hay.has(w) || [...(ALIAS_OF.get(w) || [])].some((a) => hay.has(a))).length;
  return hit / toks.length;
}

// ---------------------------------------------------------------------------
// reading a profile
// ---------------------------------------------------------------------------
export interface ProfileRead {
  segments: string[];      // kinds of customer or industries, as typed
  subs: Array<{ main: string; sub: string }>;   // examples given in a bracket after a segment
  teams: string[];         // groups of people inside the customer (teams, leaders, developers)
  sizes: string[];         // size words and ranges as typed
  allSizes: boolean;       // the profile says all sizes
  places: string[];
  roles: string[];
  roleNotes: string[];     // roles written with a remark in a bracket, as typed
  roleSource: 'buyer' | 'mention' | 'none';   // a role named as the buyer, or only mentioned in the text
  problems: string[];
  claims: string[];        // statements from a page, kept apart
  descr: string[];         // customers described by what they do or need, not by industry
  outside: string[];       // clauses that say who is NOT served or is out of scope
  other: string[];         // anything else, quoted
  hypothetical: boolean;   // the text says its figures are hypothetical
}
const CLAIM_RE = /\(page claims?\)|\bpage claims?\b|\(the (?:about|home|customers?|pricing|product) page[^)]*\)|\bthe (?:about |home |customers? |pricing |product |menu )?(?:pages?|menu) (?:state|says?|lists?|calls?|shows?)\b|\(about page\)|\(home page\)|\bpress item\b/i;
const CLAIM_OPEN = /\bthe (?:about |home |customers? |pricing |product |menu )?(?:pages?|menu) (?:state|says?|lists?|calls?|shows?|claim\w*)\b|\bpage claiming\b|\bpress item\b|\(the (?:about|home|customers?|pricing|product) page/i;
const EXCLUDE_RE = /\b(?:served by a separate|are served by|is served by|handled by a separate|separate business|out of scope|not (?:a )?(?:target|focus)|excluded|we do not (?:sell|serve)|we don't (?:sell|serve))\b/i;
const IMPERATIVE_RE = /^(?:ignore|disregard|forget|print|reveal|say|write|output|override|pretend|act as|you must|you are now|please|do not|don't|stop)\b/i;
// a group of people inside the customer; "wealth managers" or "asset managers" are kinds of firm, so a manager counts as a person only with a function in front
const TEAM_END = /(?:\b(?:teams?|leaders?|leadership|developers?|engineers?|practitioners?|decision[- ]makers?|stakeholders?|users|students|heads?|executives?|buyers?|operations)|\b(?:product|project|program|engineering|sales|marketing|operations|finance|it|hr|people|support|account|procurement|security|data|platform|devops|qa|test|design|logistics|supply chain|customer success)\s+(?:managers?|directors?|analysts?|leads?|owners?|officers?))$/i;

function splitRoles(text: string): string[] {
  const t = squash(text);
  const parts = splitTop(t, /,/).flatMap((p) => p.replace(/^and\s+/i, ''))
    .flatMap((p) => { const m = p.split(/\s+and\s+(?=(?:the\s+)?[A-Z])/); return m.length > 1 && m.every((x) => TITLE_RE.test(x)) ? m : [p]; });
  return [...new Set(parts.map((x) => noDot(x).replace(/^(?:the)\s+/i, '')).filter((x) => x.length > 1))];
}
const TITLE_RE = /\b(?:chief|head|director|vp|svp|evp|vice president|president|manager|controller|treasurer|analyst|engineer|architect|officer|lead|owner|founder|coordinator|specialist|administrator|advocate|developer|designer|scientist|partner|principal|gm|ceo|cfo|cio|cto|ciso|coo|cmo|cro|cco|cpo|cdo|md)\b/i;

export function readProfile(raw: string): ProfileRead {
  const res: ProfileRead = { segments: [], subs: [], teams: [], sizes: [], allSizes: false, places: [], roles: [], roleNotes: [], roleSource: 'none', problems: [], claims: [], descr: [], outside: [], other: [], hypothetical: false };
  let text = squash(raw);
  // the echo safeguard may have put the whole text in curly quotes: the words are the user's own, so the quotes are taken off before reading
  if (/^[“"][\s\S]*[”"]$/.test(text)) text = text.slice(1, -1).trim();
  // sentences: a sentence that only says the figures are hypothetical is a label, not a profile
  const sentences = sentenceSplit(text).filter((s) => { if (/\bhypothetical\b/i.test(s)) { res.hypothetical = true; return false; } return true; });
  const kept: string[] = [];
  for (const s of sentences) {
    if (IMPERATIVE_RE.test(s)) { res.other.push(s); continue; }
    kept.push(s);
  }
  let t = kept.join('. ');
  // a leading label such as "Acme customers:" or "segments:"
  let labelled = false;
  const lab = /^(?:[A-Z][\w&.'\- ]{0,40}?\s+)?(?:customers?|clients?|accounts?|segments?|industries|icp|profile|ideal customers?)\s*:\s*/i.exec(t);
  if (lab) { t = t.slice(lab[0].length); labelled = true; }
  // page claims and exclusions are clauses (split at semicolons outside brackets)
  const clauses = splitTop(t, /;/);
  const rest: string[] = [];
  for (const c of clauses) {
    // a page statement is set aside piece by piece: a piece with a page marker, and the pieces that follow it up to the buyer or problem clause
    const pieces = splitTop(c, /,/);
    const keep: string[] = []; let claim: string[] = []; let inClaim = false; let hadClaim = false;
    const flush = () => { if (claim.length) { res.claims.push(noDot(claim.join(', '))); hadClaim = true; } claim = []; };
    for (const pc of pieces) {
      if (/^(?:with|who|that|which)\b/i.test(pc)) { inClaim = false; flush(); }
      const outside = pc.replace(/\([^)]*\)/g, ' ');
      if (CLAIM_OPEN.test(outside)) inClaim = true;
      const br = /\(([^()]*)\)\s*$/.exec(pc);
      if (!inClaim && br && !CLAIM_RE.test(outside) && !CLAIM_OPEN.test(outside) && CLAIM_RE.test(pc) && !/^\s*(?:page claims?|about page|home page)\s*$/i.test(br[1]) && outside.trim().length > 12) {
        // the marker sits in a longer bracket after a description: the bracket is the page statement, the description stays
        flush(); keep.push(squash(outside)); claim.push(`(${br[1]})`); flush();
        continue;
      }
      if (inClaim || CLAIM_RE.test(pc)) claim.push(pc); else { flush(); keep.push(pc); }
    }
    flush();
    if (hadClaim) { if (keep.length) rest.push(keep.join(', ')); continue; }
    if (EXCLUDE_RE.test(c)) {
      const m = /^(.*?)(,\s*(?:with|who)\b.*)$/i.exec(c);
      if (m) { res.outside.push(noDot(m[1])); rest.push(m[2].replace(/^,\s*/, '')); } else res.outside.push(noDot(c));
      continue;
    }
    rest.push(c);
  }
  // the clauses that follow the first one were split at ";", but a buyer or problem clause may be in any of them: join them back for those two
  let body = rest.join('; ');
  // the buyer clause
  for (const m of [...body.matchAll(/(?:,\s*)?\bwith\s+((?:(?!\bwith\b).){2,200}?)\s+as\s+(?:the\s+)?(?:buyers?|champions?|sponsors?|decision[- ]makers?|economic buyers?)\b/gi)]) res.roles.push(...splitRoles(m[1]));
  body = body.replace(/(?:,\s*)?\bwith\s+(?:(?!\bwith\b).){2,200}?\s+as\s+(?:the\s+)?(?:buyers?|champions?|sponsors?|decision[- ]makers?|economic buyers?)\b/gi, '');
  for (const m of [...body.matchAll(/\b(?:buyers?|champions?|economic buyers?|sponsors?)\s*:\s*(.+?)(?=;|\.\s+[A-Z]|$)/gi)]) res.roles.push(...splitRoles(m[1]));
  body = body.replace(/\b(?:buyers?|champions?|economic buyers?|sponsors?)\s*:\s*.+?(?=;|\.\s+[A-Z]|$)/gi, '');
  if (res.roles.length) { res.roleSource = 'buyer'; res.roleNotes = res.roles.filter((r) => /\([^)]+\)\s*$/.test(r)); }
  else {
    // no buyer clause: a job title mentioned in the text ("with a finance controller") is read as a role mentioned
    const found = titlesIn(body);
    if (found.length) { res.roles.push(...found); res.roleSource = 'mention'; body = body.replace(new RegExp(`\\s*(?:and\\s+)?(?:an?\\s+|the\\s+)?(?:${found.map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi'), ' '); }
  }
  // the problem clause runs to the end
  const pm = /(?:,\s*)?\b(?:who|that|which)\s+(?:currently\s+)?(?:face|facing|faces|struggle|struggling|struggles|suffer|suffering|suffers|lose|lack|lacks)\b\s*(?:with |from |:)?\s*(.+)$/i.exec(body)
    ?? /(?:,\s*)?\b(?:problems?|pain points?|challenges?)\s*:\s*(.+)$/i.exec(body);
  if (pm) {
    res.problems.push(...splitTop(pm[1], /;/).map((x) => noDot(x)).filter(Boolean));
    body = body.slice(0, pm.index).trim();
  }
  body = body.replace(/[,;\s]+$/, '');
  if (!body) return finish(res);

  // the target phrase
  const tgtClauses = splitTop(body, /;/);
  // in a labelled list that holds both commas and semicolons the comma separates the items and a semicolon is inside an item
  const listForm = labelled && /,/.test(body) && /;/.test(body);
  const targets = (listForm ? [body] : tgtClauses).flatMap((t) => sentenceSplit(t));
  for (const tc of targets) readTarget(tc, res, listForm || labelled);
  return finish(res);
}

function finish(res: ProfileRead): ProfileRead {
  const dedupe = (a: string[]) => a.filter((x, i) => a.findIndex((y) => y.toLowerCase() === x.toLowerCase()) === i);
  res.segments = dedupe(res.segments); res.teams = dedupe(res.teams); res.sizes = res.sizes.filter((x, i, a) => a.findIndex((y) => y.toLowerCase().replace(/s$/, '') === x.toLowerCase().replace(/s$/, '')) === i); res.places = dedupe(res.places);
  res.roles = dedupe(res.roles); res.problems = dedupe(res.problems); res.claims = dedupe(res.claims); res.descr = dedupe(res.descr); res.outside = dedupe(res.outside); res.other = dedupe(res.other);
  return res;
}

// Job titles in a text: acronyms, "Chief X", "Head of X", and a title written in lower case ("a finance controller").
function titlesIn(text: string): string[] {
  const t = String(text);
  const out: string[] = [];
  for (const m of t.matchAll(/(?<![-\w])(?:CEO|CFO|CIO|CTO|CISO|COO|CMO|CRO|CCO|CPO|CDO)(?![-\w])/g)) out.push(m[0]);
  for (const m of t.matchAll(/\bGM-[A-Za-z]+\b/g)) out.push(m[0]);
  for (const m of t.matchAll(/\b(?:Chief [A-Z][A-Za-z]+(?: [A-Z][A-Za-z]+){0,2}|(?:Head|Director|VP|Vice President|Manager|Lead) of [A-Z][A-Za-z-]+(?: [A-Z][A-Za-z-]*){0,3})\b/g)) out.push(m[0]);
  for (const m of t.matchAll(/\b(?:finance|financial|operations|sales|marketing|security|network|procurement|engineering|supply chain|it|hr|data|platform|revenue|product|customer success) (?:controller|director|manager|head|lead|officer|analyst)\b/gi)) out.push(m[0]);
  return [...new Set(out)].filter((r) => !out.some((o) => o !== r && o.includes(r) && o.length > r.length));
}

function readTarget(clause: string, res: ProfileRead, listForm: boolean): void {
  let c = squash(clause);
  c = c.replace(/^(?:plus|and|also)\s+/i, '');
  // all sizes: "of all sizes", "of every size", "from startups to large enterprises" (both ends are size words)
  const AS1 = /\b(?:of\s+)?(?:all|every|any)\s+sizes?\b(?:,?\s*from\s+[^,;]+?\s+to\s+[^,;]+)?/i;
  const AS2 = /\bfrom\s+(?:startups?|start-ups?|solo [a-z ]+?|small [a-z ]+?|smbs?)\s+to\s+(?:large\s+|global\s+)?(?:enterprises?|corporations?|large [a-z ]+)\b/i;
  for (const re of [AS1, AS2]) { const m = re.exec(c); if (m) { res.allSizes = true; res.sizes.push(squash(m[0]).replace(/^of\s+/i, '')); c = c.replace(m[0], ' '); } }
  // a range of unlike things ("from boutique hotels to hostels") is a list
  c = c.replace(/\bfrom\s+(.+?)\s+to\s+(.+?)(?=,|$)/i, '$1, $2');
  // employee ranges and counts
  for (const m of c.matchAll(EMPLOYEE_RANGE)) res.sizes.push(squash(m[0]));
  c = c.replace(EMPLOYEE_RANGE, ' ');
  c = c.replace(/(?:with|of|shipping|having)?\s*(?:an?\s+)?\b\d[\d,]*\s*(?:to|-|–)\s*\d[\d,]*\+?\s+[a-z]+(?:\s+a\s+(?:month|year|day))?(?:\s+(?:with|through|using)\s+[^,;]*)?/gi, ' ').replace(/\s+/g, ' ');
  // places
  for (const m of [...c.matchAll(PLACE_RE)]) res.places.push(m[1]);
  c = c.replace(PLACE_RE, ' ');
  c = squash(c).replace(/^[,\s]+|[,\s]+$/g, '');
  if (!c) return;
  // "teams at companies ...": who they are, and where they work
  const items: string[] = [];
  let pieces = splitTop(c, /[,]/).map((x) => x.replace(/^and\s+/i, ''));
  // "sales, marketing and customer service teams that manage leads": single words before a team noun belong to the team phrase
  const teamAt = pieces.findIndex((p, i) => i > 0 && TEAM_END.test(noDot(p.split(/\s+(?:that|who|which|at|within)\s/i)[0])) && pieces.slice(0, i).every((q) => q.split(/\s+/).length <= 2));
  if (teamAt > 0) pieces = [pieces.slice(0, teamAt + 1).join(', '), ...pieces.slice(teamAt + 1)];
  pieces.forEach((p, idx) => {
    // the last piece of a short comma list "A, B and C": split the last "and" when both sides are short
    const andSplit = (idx === pieces.length - 1 && pieces.length > 1 && !listForm) ? p.split(/\s+and\s+/i) : [p];
    if (andSplit.length === 2 && andSplit.every((x) => x.split(/\s+/).length <= 3 && !/\b(?:online|offline)$/i.test(x) && !TEAM_END.test(x.trim()))) items.push(...andSplit); else items.push(p);
  });
  const expanded: string[] = [];
  for (const it of items) {
    // "X and large Y" starts a new item
    const parts = it.split(/\s+and\s+(?=(?:large|small|mid-?size[d]?|enterprise|global|regional|national|local|smb|multi|other)\b)/i);
    for (const p of parts) {
      const inc = p.split(/\s+(?:including|such as|especially(?: in)?|in particular|particularly|plus)\s+/i);
      expanded.push(...inc);
    }
  }
  for (let it of expanded) {
    it = squash(restore(it)).replace(/^(?:and|plus|also|mostly|mainly|some|many|like|including|such as)\s+/i, '').replace(/[.\s]+$/, '');
    it = it.replace(/^(?:the\s+)?(?:world'?s|worlds)\s+(?:leading|largest|top|biggest)\s+/i, '').replace(/^trusted by\s+/i, '').replace(/^(?:in particular|particularly|especially(?: in)?)\s+/i, '');
    if (!it || it.length < 2) continue;
    if (IMPERATIVE_RE.test(it) || /^(?:whether|if|when|how|while)\b/i.test(it)) { res.other.push(it); continue; }
    // "<who> at <where>"
    const at = /^(.+?)\s+(?:at|within)\s+(.+)$/i.exec(it);
    if (at && TEAM_END.test(noDot(at[1])) ) { addTeam(res, at[1]); readTarget(at[2], res, listForm); continue; }
    // "other project stakeholders in the construction industry": the industry is the segment, the people are a team
    const ind = /^(.*?)\s+(?:in|across)\s+the\s+([A-Za-z&' -]{3,40}?)\s+(?:industry|sector|space|market)$/i.exec(it);
    if (ind && ind[1].split(/\s+/).length <= 8) {
      res.segments.push(`${ind[2].trim()} industry`);
      const left = squash(ind[1].replace(/^other\s+/i, ''));
      if (left && TEAM_END.test(left)) addTeam(res, ind[1]);
      else if (left && !res.segments.some((x) => x.toLowerCase() === left.toLowerCase())) res.segments.push(ind[1]);
      continue;
    }
    // "<org words> in <industry list item>"
    const inn = /^(.*?\b(?:compan(?:y|ies)|enterprises?|businesses|firms|organi[sz]ations|customers|brands|teams|institutions)\b)\s+(?:in|across)\s+([A-Za-z][A-Za-z&'\- ]{2,50})$/i.exec(it);
    if (inn && !/\d/.test(inn[2]) && inn[2].split(/\s+/).length <= 6) {
      for (const sw of inn[1].match(SIZE_WORD) || []) res.sizes.push(sw);
      if (!/^(?:all |any |other |various |many |different |every )?(?:industr(?:y|ies)|sectors?|markets?|verticals?|segments?)$/i.test(inn[2].trim())) res.segments.push(inn[2].trim());
      continue;
    }
    if (TEAM_END.test(noDot(it.split(/\s+(?:that|who|which)\b/i)[0]).replace(/\s*\([^)]*\)$/, '')) && !/\b(?:founders?|owners?)$/i.test(it) && it.split(/\s+/).length <= 14) { addTeam(res, it); continue; }
    // size or generic organisation words only
    const left = squash(it.replace(/\([^)]*\)/g, ' ').replace(SIZE_WORD, ' ').replace(GENERIC_ORG, ' ').replace(/\b(?:of|all|sizes|from|to|and|with|the|a|an|worldwide|globally)\b/gi, ' '));
    const sw = it.match(SIZE_WORD) || [];
    if (!left || left.split(/\s+/).every((w) => STOP_STEMS.has(stemOf(w)))) { for (const s of sw) res.sizes.push(s); continue; }
    // "Mid-size companies with a finance controller and an ERP": the head says only a size, the tail describes the customer
    const wt = /^(.*?)\s+(?:with|having|using|running)\s+(.+)$/i.exec(it);
    if (wt) {
      const head = squash(wt[1].replace(/\([^)]*\)/g, ' ').replace(SIZE_WORD, ' ').replace(GENERIC_ORG, ' ').replace(/\b(?:of|all|sizes|from|to|and|the|a|an)\b/gi, ' '));
      if (!head) { for (const sz of wt[1].match(SIZE_WORD) || []) res.sizes.push(sz); res.descr.push(`${wt[1]} with ${wt[2]}`); continue; }
    }
    // other numbers (volumes, counts) are qualifiers, not segments
    if (/\d/.test(it.replace(/fortune \d+|forbes global \d+|\bd2c\b|\b3pls?\b|\b[234]pl\b|b2[bc]/gi, ''))) { res.other.push(it); continue; }
    if (it.split(/\s+/).length > 12) { res.other.push(it); continue; }
    // a customer described by what it does or needs ("organizations that need to secure identities") is not an industry
    if (/\b(?:that|who|which|whose)\s+[a-z]+/i.test(it) && !/\(/.test(it)) { res.descr.push(it); continue; }
    // a bracket of examples after a segment
    const br = /^(.*?)\s*\(([^()]*)\)\s*$/.exec(it);
    if (br && br[2].length <= 90 && /,| and /.test(br[2])) {
      const subs = br[2].split(/,\s*|\s+and\s+/).map((x) => squash(x)).filter(Boolean);
      res.segments.push(br[1]); subs.forEach((s) => res.subs.push({ main: br[1], sub: s }));
      for (const s of sw) if (SIZE_ONLY.test(s)) res.sizes.push(s);
      continue;
    }
    const cleaned = it.replace(/\u0001/g, ',');
    if (br && br[2].length > 90) { res.segments.push(br[1]); res.other.push(`${br[1]} (${br[2]})`); continue; }
    res.segments.push(cleaned.replace(/^the\s+/i, ''));
    for (const s of sw) if (SIZE_ONLY.test(s)) res.sizes.push(s);
  }
}
function addTeam(res: ProfileRead, t: string) { const x = noDot(squash(t)); if (x) res.teams.push(x); }

// ---------------------------------------------------------------------------
// roles
// ---------------------------------------------------------------------------
// The roles of a sector list with "A or B" written out as separate roles ("Founder or Owner" holds Founder and Owner).
export function roleAlternatives(list: string[]): string[] {
  const out: string[] = [];
  for (const r of list) {
    out.push(r);
    const parts = r.split(/\s+or\s+/i);
    if (parts.length > 1) {
      const tail = parts[parts.length - 1].split(/\s+/);
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        out.push(p);
        if (i < parts.length - 1 && p.split(/\s+/).length === 1 && tail.length > 1) out.push(`${p} ${tail.slice(1).join(' ')}`);
      }
    }
  }
  return [...new Set(out)];
}

// ---------------------------------------------------------------------------
// the gap analysis text
// ---------------------------------------------------------------------------
export interface MetricRow { label: string; cur: string; tar: string; gap: string; priority: string; both: boolean; behind: boolean; met: boolean; key: string }
export interface GapDeps {
  company: string;
  companyLine: string;
  contextLine: string;
  sectorName: string;                 // the sector name used in role checks ('' when none)
  sectorRoles: string[];              // the sector's buyer roles ([] when none)
  sectorNotes: string;                // sector notes block ('' when none)
  sectorObjections: string[];
  sectorProof: string;
  sectorMetrics: string[];
  modelKnown: boolean;
  pricingAction: string;
  acvNoun: string;
  money: (n: number) => string;
  targetAcv: number | undefined;
  metricTable: string;                // the table of metrics, already formatted ('' when none were given)
  metricRows: MetricRow[];
  anyMetric: boolean;
  anyPair: boolean;
  onlyOneSide: string[];              // labels of metrics given on one side only
  notGivenAtAll: string[];            // labels of metrics given on neither side
  productGiven: boolean;
  modelGiven: boolean;
  bestRole: (a: string, list: string[]) => string | undefined;
  aliasRole: (r: string) => string;
  sameRole: (a: string, b: string) => boolean;
  planNote: string;                   // text for the plan about the business model ('' when none)
}

const NOT_ASKED = '';
const ROLE_STOP = new Set(['head', 'of', 'chief', 'officer', 'director', 'vp', 'vice', 'president', 'manager', 'lead', 'leader', 'senior', 'sr', 'the', 'and', 'for', 'general', 'gm', 'or']);

export function gapAnalysis(curText: string, idlText: string, d: GapDeps): string {
  const cur = readProfile(curText);
  const idl = readProfile(idlText);
  const hyp = cur.hypothetical || idl.hypothetical;
  const curAll = `${curText}`;
  const idlAll = `${idlText}`;

  // ---------- segments: each side against the whole text of the other ----------
  const curSeg = cur.segments;
  const idlSeg = idl.segments;
  // an ideal profile that names no industry cannot name one of the current industries: nothing is called named, partly named or missing then
  const curNamed = idlSeg.length ? curSeg.filter((s) => coverage(s, idlAll) >= 0.5) : [];
  const curPartly = idlSeg.length ? curSeg.filter((s) => { const c = coverage(s, idlAll); return c > 0 && c < 0.5; }) : [];
  const idlNotInBase = idlSeg.filter((s) => coverage(s, curAll) < 0.5);
  const idlSubsNotInBase = idl.subs.filter((x) => coverage(x.sub, curAll) === 0 && !idlSeg.some((s) => coverage(x.sub, s) >= 1 && s !== x.main));
  const idealNamesIndustries = idlSeg.length > 0;
  // when the ideal profile names no industry, no industry of the base can be called missing from it
  const openEndedIdeal = /\b(?:other|all|any) (?:industries|sectors|segments|verticals)\b|\bacross (?:all )?industries\b|\bevery (?:industry|sector)\b/i.test(idlAll);
  const missingList = idealNamesIndustries && !openEndedIdeal ? curSeg.filter((s) => coverage(s, idlAll) === 0) : [];
  // when no current item shares a word with the ideal profile, the two lists may describe different things (kinds of project against kinds of company)
  const noSharedWording = missingList.length > 0 && missingList.length === curSeg.length;
  const curMissing = noSharedWording ? [] : missingList;
  // the ideal profile can be compared by segment only when it names kinds of customer
  const comparable = idealNamesIndustries && curSeg.length > 0 && !openEndedIdeal;
  const openEnded = idealNamesIndustries && !comparable && curSeg.length > 0;

  // ---------- roles ----------
  const roleAlt = roleAlternatives(d.sectorRoles);
  const roleCheck = (r: string) => {
    if (!d.sectorName || !d.sectorRoles.length) return '';
    const alts = r.split(/\s+or\s+/i).map((x) => x.trim()).filter(Boolean);
    let m: string | undefined;
    for (const a of [r, ...alts]) { m = d.bestRole(d.aliasRole(a), roleAlt); if (m) break; }
    // "Head of IT" is the family of "Head of IT Infrastructure": every main word of the title is in a sector role (never for C level titles)
    if (!m && !/^\s*(?:chief|c[a-z]o)\b/i.test(r) && !/\bchief\b/i.test(r)) {
      const main = (x: string) => x.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter((w) => w.length >= 2 && !ROLE_STOP.has(w));
      const mine = main(r);
      if (mine.length) m = roleAlt.find((a) => { const t = main(a); return mine.every((w) => t.includes(w)) && !/\bchief\b/i.test(a); });
      else {
        // a bare title such as "President" is in a longer sector title ("President of the contractor")
        const raw = (x: string) => x.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter((w) => w && !['of', 'the', 'and', 'or'].includes(w));
        const mineRaw = raw(r);
        if (mineRaw.length) m = roleAlt.find((a) => { const t = raw(a); return mineRaw.every((w) => t.includes(w)) && !/\bchief\b/i.test(a); });
      }
    }
    if (m) {
      const whole = d.sectorRoles.find((s) => s === m || roleAlternatives([s]).includes(m as string)) || m;
      return whole.toLowerCase() === r.toLowerCase() ? `${r} is one of the roles usual in ${d.sectorName}` : `${r} is one of the roles usual in ${d.sectorName} (${whole})`;
    }
    return `${r} is not one of the roles usually listed for ${d.sectorName} (${d.sectorRoles.slice(0, 4).join(', ')}), so confirm in your won deals that this title signs`;
  };
  const namedRoles = [...cur.roles, ...idl.roles].map((r) => d.aliasRole(r));
  const roleGaps = d.sectorRoles.filter((r) => !namedRoles.some((n) => roleAlternatives([r]).some((a) => d.sameRole(n, a)))).slice(0, 4);

  const L: string[] = [];
  const push = (...x: string[]) => L.push(...x);

  push(`# ICP Gap Analysis${d.company ? ` for ${d.company}` : ''}`, '', `- ${d.companyLine}`, '', d.contextLine, '');

  // ---------- bottom line ----------
  const behindRows = d.metricRows.filter((m) => m.both && m.behind);
  const bottom: string[] = [];
  if (curSeg.length && idealNamesIndustries) {
    const baseText = curSeg.length <= 3 ? `lists ${listText(curSeg.map(cleanSeg))}` : `lists ${curSeg.length} kinds of customer`;
    const newText = listText(groupSubs(idlNotInBase, idlSubsNotInBase));
    if (noSharedWording) bottom.push(`Your current base ${baseText}, and your ideal profile uses other words for the customers it wants, so the two lists may describe different things.`);
    else bottom.push(`Your current base ${baseText}. Your ideal profile ${curNamed.length === curSeg.length ? (curSeg.length > 1 ? 'names all of them' : 'names it too') : curNamed.length ? (curNamed.length <= 2 ? `names ${listText(curNamed.map(cleanSeg))}` : `names ${curNamed.length} of them`) : 'uses other words, so the two lists may describe different things'}${newText ? `, and also names ${newText}, which your current base does not list` : ''}.`);
  } else if (curSeg.length) {
    const how = idl.descr.length ? `; it describes the customers by what they do or need (${listText(idl.descr.map(quote))})` : idl.teams.length ? `; it describes the people you sell to (${listText(idl.teams.map((x) => clip(x)))})` : '';
    bottom.push(`Your current base lists ${listText(curSeg.map(cleanSeg))}. Your ideal profile names no industry${how}, so it does not yet say which of these industries to put first.`);
  } else if (idealNamesIndustries) {
    bottom.push(`Your ideal profile names ${listText(idlSeg.map(cleanSeg))}; your current base text names no industry, so there is nothing to compare them with yet.`);
  } else {
    bottom.push('Neither text names an industry or kind of customer, so the comparison below rests on size, buyer and problem.');
  }
  if (idl.roles.length) bottom.push(`Your ideal buyer is ${listText(idl.roles.map(cleanRole))}${cur.roles.length ? `; your current base names ${listText(cur.roles.map(cleanRole))}` : '; your current base does not say who bought, so that is the first thing to check in your CRM'}.`);
  if (behindRows.length) {
    const worst = [...behindRows].sort((a, b) => num(b.gap) - num(a.gap))[0];
    bottom.push(`On the figures you gave, the largest gap is ${LABEL_TEXT[worst.key] || worst.label} (${worst.gap}).`);
  } else if (d.anyPair) bottom.push('On the figures you gave, you are at or ahead of your targets on every metric that has both a current and a target value.');
  push('## The short version', '', bottom.join(' '), '');

  // ---------- who you sell to ----------
  push('## Who you sell to today and who you want', '');
  const seg: string[] = [];
  if (curNamed.length) seg.push(`- **Named in both**: ${curNamed.length === curSeg.length && curSeg.length > 3 ? `all ${curSeg.length} kinds of customer in your current base` : listText(curNamed.map(cleanSeg))}. ${curNamed.length === 1 ? 'It is' : 'They are'} already inside your ideal profile and the place to look first for proof.`);
  if (curPartly.length) seg.push(`- **Partly named in your ideal profile**: ${listText(curPartly.map(cleanSeg))}. Only some of the words are in your ideal profile, so decide whether it covers them.`);
  if (noSharedWording) seg.push(`- **No shared wording**: your current base lists ${listText(missingList.map(cleanSeg))}, and your ideal profile names ${listText(idlSeg.map(cleanSeg))}. The two lists may describe different things (for example kinds of project against kinds of company), so look up in your CRM which of your current customers are the kinds your ideal profile names before you compare them.`);
  if (curMissing.length && idealNamesIndustries) {
    seg.push(`- **In your current base but not named in your ideal profile**: ${listText(curMissing.map(cleanSeg))}. ${comparable || openEnded || !idealNamesIndustries ? 'Check their win rate, ACV and churn. If they are weaker than the named segments, keep serving them but stop prospecting there; if they are as strong, add them to your ideal profile.' : 'Check their win rate, ACV and churn before you decide to keep prospecting there.'}`);
  }
  if (idlNotInBase.length || idlSubsNotInBase.length) {
    if (!noSharedWording) seg.push(`- **Named in your ideal profile but not in your current base**: ${listText(groupSubs(idlNotInBase, idlSubsNotInBase))}. Check whether you have won, lost or never pursued deals there.`);
  }
  if (openEndedIdeal && curSeg.length) seg.push('- **Open ended**: your ideal profile also covers other industries, so no industry in your current base is outside it. Use win rate, ACV and churn by industry to decide where to focus first.');
  if (!idealNamesIndustries && curSeg.length) seg.push(`- **Carried forward**: because your ideal profile names no industry, treat ${listText(curSeg.map(cleanSeg))} as the segments to prove first; they are where you already have customers.`);
  if (idl.descr.length && (idealNamesIndustries || !curSeg.length)) seg.push(`- **How your ideal profile describes the customers**: ${listText(idl.descr.map(quote))}.`);
  if (idl.teams.length) seg.push(`- **The people you sell to**: ${listText(idl.teams.map((x) => quote(x)))}, as your ideal profile puts it.`);
  if (cur.descr.length) seg.push(`- **How your current base describes its customers**: ${listText(cur.descr.map(quote))}.`);
  if (cur.teams.length) seg.push(`- **The people in your current base**: ${listText(cur.teams.map((x) => quote(x)))}.`);
  if (idl.places.length || cur.places.length) {
    const ip = listText(idl.places.map(placeText)), cp = listText(cur.places.map(placeText));
    seg.push(`- **Place**: ${idl.places.length ? `your ideal profile limits the market to ${ip}` : ''}${idl.places.length && cur.places.length ? '; ' : ''}${cur.places.length ? `your current base is in ${cp}` : idl.places.length ? `; your current base does not say where its customers are` : ''}. Place is a market filter, not a segment.`.replace(/\.\s*Place/, '. Place'));
  }
  if (idl.outside.length) seg.push(`- **Out of scope, in your words**: ${listText(idl.outside.map(quote))}. Treat these as not for this ICP.`);
  const oth = [...idl.other.map((x) => ({ x, w: 'ideal' })), ...cur.other.map((x) => ({ x, w: 'current' }))];
  if (oth.length) seg.push(`- **Other things you wrote, kept as you wrote them**: ${listText(oth.map((o) => quote(o.x)))}.`);
  if (idl.claims.length || cur.claims.length) {
    const all = [...idl.claims, ...cur.claims];
    const conflict = claimConflicts(all);
    seg.push(`- **Statements from a page, kept apart and not used as qualifiers**: ${listText(all.map(quote))}. Use them as messaging, not as proof of fit.${conflict.length ? ` These statements give different figures for the same thing (${listText(conflict)}), so do not quote any of those figures until you know which one is current.` : ''}`);
  }
  if (!seg.length) seg.push('- Neither text could be split into industries, size, buyer or problem. Describe each profile in those four parts to get a comparison.');
  push(...seg, '');

  // ---------- size ----------
  push('### Company size', '');
  push(sizeText(cur, idl), '');

  // ---------- buyer ----------
  push('### Buyer', '');
  const buyer: string[] = [];
  if (idl.roles.length) {
    const checks = idl.roles.map((r) => roleCheck(cleanRole(r))).filter(Boolean);
    buyer.push(`Your ideal profile ${idl.roleSource === 'mention' ? 'mentions' : 'names'} ${listText(idl.roles.map(cleanRole))}${idl.roleSource === 'mention' ? '' : ' as the buyer'}${cur.roles.length ? `, and your current base names ${listText(cur.roles.map(cleanRole))}` : ', and your current base does not say who bought'}.${checks.length ? ` ${checks.map((x) => sentenceCase(x) + '.').join(' ')}` : ''}`);
    if (idl.roleNotes.length) buyer.push(`You wrote ${listText(idl.roleNotes.map(quote))}, so check in your won deals that this title signs rather than only appears on a page.`);
    if (cur.roles.length) {
      const same = idl.roles.filter((r) => cur.roles.some((c) => d.sameRole(c, r)));
      buyer.push(same.length === idl.roles.length ? 'The two profiles agree on the buyer.' : `The two profiles do not name the same buyer, so ask which one signs in your won deals.`);
    }
  } else if (cur.roles.length) {
    buyer.push(`Your current base names ${listText(cur.roles.map(cleanRole))}; your ideal profile names no buyer.`);
  } else buyer.push('Neither profile names a buyer or champion.');
  if (roleGaps.length && d.sectorName) buyer.push(`Roles usual in ${d.sectorName} that neither profile names: ${listText(roleGaps)}. Ask which of them evaluate or sign in your won deals.`);
  push(buyer.join(' '), '');

  // ---------- problem ----------
  push('### Problem', '');
  if (idl.problems.length) {
    push(`Your ideal profile says the customers you want face ${idl.problems.length === 1 ? 'this' : `${idl.problems.length} problems`}:`, ...idl.problems.map((p, i) => idl.problems.length === 1 ? `- ${quote(p)}` : `${i + 1}. ${quote(p)}`), '');
    push(cur.problems.length ? `Your current base says its customers face ${listText(cur.problems.map(quote))}.` : 'Your current base does not say why its customers bought. Tag each won deal with the problem it solved and see which of these problems your current customers actually had.', '');
  } else if (cur.problems.length) {
    push(`Your current base says its customers face ${listText(cur.problems.map(quote))}; your ideal profile names no problem.`, '');
  } else push('Neither profile names the problem that makes a customer buy.', '');

  // ---------- metrics ----------
  push('---', '', '## Metric gaps', '');
  if (!d.anyMetric) push('You gave no metrics, so there is no metric gap to show.', '');
  else {
    push(d.metricTable, '');
    const metRows = d.metricRows.filter((m) => m.both && !m.behind);
    if (metRows.length) push(`No gap on ${listText(metRows.map((m) => LABEL_TEXT[m.key] || m.label))}: you are at or better than your target there, so there is nothing to fix on ${metRows.length === 1 ? 'it' : 'them'}.`, '');
    if (hyp) push('You labelled the figures you gave as hypothetical, and they are treated that way here.', '');
  }

  // ---------- causes to check ----------
  const causes = causeText(d, cur, idl, curNamed, curMissing);
  if (causes) push('---', '', '## Causes to check', '', causes, '');

  // ---------- refinements ----------
  push('---', '', '## Recommended ICP Refinements', '', 'Every line below comes from your two texts or your figures.', '', '### Must-Have Criteria (Add These)');
  const must: string[] = [];
  must.push(`**Segments**: ${idealNamesIndustries ? listText(idlSeg.map(cleanSeg)) + ' (from your ideal profile)' : curSeg.length ? `${listText(curSeg.map(cleanSeg))} (carried forward from your current base, because your ideal profile names none)` : 'not named in either text'}`);
  must.push(`**Company size**: ${sizeCriterion(cur, idl)}`);
  must.push(`**Buyer or champion**: ${idl.roles.length ? `${listText(idl.roles.map(cleanRole))} (from your ideal profile)` : 'not named in your ideal profile'}`);
  must.push(`**Problem**: ${idl.problems.length ? `the problem${idl.problems.length > 1 ? 's' : ''} listed above, confirmed in the first call` : 'not named in your ideal profile'}`);
  if (idl.places.length) must.push(`**Place**: ${listText(idl.places.map(placeText))}`);
  if (d.targetAcv != null) must.push(`**Budget**: a deal value near your target of ${d.money(d.targetAcv)}, read as ${d.acvNoun}`);
  push(...must.map((x, i) => `${i + 1}. ${x}`), '');

  push('### Disqualification Criteria (Add These)');
  const dq: string[] = [];
  if (idl.outside.length) dq.push(`**Out of scope**: ${listText(idl.outside.map(quote))}`);
  const rangeSizes = idl.sizes.filter((s) => /\d/.test(s));
  if (!idl.allSizes && rangeSizes.length) dq.push(`**Size**: companies outside ${listText(rangeSizes)}`);
  else if (!idl.allSizes && idl.sizes.length && !curSeg.length) dq.push(`**Size**: a prospect that is clearly not ${listText(idl.sizes.map((s) => s.toLowerCase()))}`);
  if (idl.places.length) dq.push(`**Place**: prospects outside ${listText(idl.places.map(placeText))}`);
  if (idl.roles.length) dq.push(`**No path to the buyer**: no access to ${listText(idl.roles.map(cleanRole))} or an equivalent after the first two meetings`);
  if (idl.problems.length) dq.push(`**No sign of the problem**: ${idl.problems.length === 1 ? 'the problem listed above does not show up' : `none of the ${idl.problems.length} problems listed above shows up`} in discovery`);
  if (d.targetAcv != null) dq.push(`**Budget below your target**: a buyer whose budget is well under ${d.money(d.targetAcv)}`);
  if (!dq.length) dq.push('Your inputs give no stated size, place, buyer, problem or target value to disqualify on.');
  push(...(dq.length === 1 && /^Your inputs give no/.test(dq[0]) ? [dq[0]] : dq.map((x, i) => `${i + 1}. ${x}`)), '');
  if (idl.allSizes) push('Size is left out of the disqualifiers because your ideal profile covers all sizes. If one size band wins more or churns less in your figures, add it then.', '');
  if (curMissing.length) push(`${ucFirst(listText(curMissing.map(cleanSeg)))} ${curMissing.length === 1 ? 'is not a disqualifier' : 'are not disqualifiers'} on their own: only move ${curMissing.length === 1 ? 'it' : 'them'} out once win rate, ACV and churn show ${curMissing.length === 1 ? 'it is' : 'they are'} weaker.`, '');

  // ---------- plan ----------
  push('---', '', '## 30-Day Action Plan', '', plan(d, cur, idl, curSeg, curNamed, curMissing, idlNotInBase, idealNamesIndustries), '');

  if (d.sectorNotes) push(d.sectorNotes, '');

  // ---------- missing inputs, once, at the end ----------
  const ask: string[] = [];
  if (d.onlyOneSide.length) ask.push(`the missing side of ${listText(d.onlyOneSide)} (it would change which metrics get a gap and a priority; today they are not compared)`);
  if (d.notGivenAtAll.length && d.anyMetric) ask.push(`${listText(d.notGivenAtAll)}, current and target (it would change the gap table and the causes to check)`);
  if (!d.anyMetric) ask.push('current_metrics and target_metrics with avg_acv, avg_sales_cycle, win_rate, churn_rate and nps (it would change the whole metric section, which is empty now)');
  if (!cur.roles.length && idl.roles.length) ask.push('the title that signed in your last won deals, in current_customers (it would change the buyer check from a question to a comparison)');
  if (!cur.problems.length && idl.problems.length) ask.push('why your current customers bought, in current_customers (it would change the problem check from a question to a comparison)');
  const wordSizes = idl.sizes.filter((s) => !/\d/.test(s) && !idl.allSizes);
  if (wordSizes.length) ask.push(`a number behind ${listText(wordSizes.map((s) => quote(s)))}, such as the smallest employee count among your best customers (it would change the size criterion from a word to a number you can disqualify on)`);
  if (!idl.roles.length) ask.push('the role that signs and the role that champions, in ideal_icp (it would change the buyer check and the disqualifiers)');
  if (!idl.problems.length) ask.push('the problem your best customers had before they bought, in ideal_icp (it would change the problem criterion)');
  if (!d.productGiven && !d.sectorName) ask.push('product_category, saying what you sell (it would change the sector notes and the role check, which are empty now)');
  if (!d.modelGiven) ask.push('business_model (it would change the wording of the pricing action and the unit of the deal value)');
  if (!d.company) ask.push('company (it would put your company name on this analysis)');
  if (ask.length) push(`To sharpen this, give:`, ...ask.slice(0, 7).map((x) => `- ${x}`), '');
  push('**Next Step**: Use `icp_evolution_tracker` to monitor ICP changes over time', '', 'Suggested timings, lengths and counts: adjust them to your own.');
  void NOT_ASKED;
  return L.join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
}

// page statements that give two different numbers for the same kind of thing ("2,000 enterprises" and "2,500 enterprises")
function claimConflicts(claims: string[]): string[] {
  const seen = new Map<string, string[]>();
  for (const c of claims) for (const m of c.matchAll(/(\d[\d,]*)\+?\s+(enterprises|customers|companies|businesses|users|brands|clients|organi[sz]ations|properties|developers|merchants|teams)\b/gi)) {
    const k = m[2].toLowerCase(); const list = seen.get(k) || [];
    if (!list.includes(m[1])) list.push(m[1]);
    seen.set(k, list);
  }
  return [...seen].filter(([, nums]) => nums.length > 1).map(([noun, nums]) => `${listText(nums)} ${noun}`);
}
// ideal segments missing from the base, with the bracket examples grouped under the segment they were listed in
function groupSubs(segs: string[], subs: Array<{ main: string; sub: string }>): string[] {
  const out = segs.map(cleanSeg);
  const byMain = new Map<string, string[]>();
  for (const x of subs) byMain.set(x.main, [...(byMain.get(x.main) || []), x.sub]);
  for (const [main, list] of byMain) out.push(`${listText(list)} (listed under ${cleanSeg(main)})`);
  return out;
}
// metric names in a sentence
const LABEL_TEXT: Record<string, string> = { acv: 'average ACV', cycle: 'sales cycle', winRate: 'win rate', churn: 'churn', nps: 'NPS' };
const num = (g: string) => { const m = /(-?\d+(?:\.\d+)?)/.exec(g); return m ? parseFloat(m[1]) : 0; };
// a segment as typed, with the semicolon of a list restored to a comma and a leading size word kept
const cleanSeg = (s: string) => squash(s).replace(/\u0001/g, ',').split(/(\([^)]*\))/).map((part) => (part.startsWith('(') ? part : part.replace(/;\s*/g, ', '))).join('').replace(/\s*\([^)]*\)$/, (m) => (m.length <= 60 ? m : ''));
const cleanRole = (r: string) => squash(r).replace(/\s*\([^)]*\)\s*$/, '');
const clip = (x: string) => (x.length > 120 ? `${x.slice(0, 120).replace(/\s+\S*$/, '')}` : x);

function sizeText(cur: ProfileRead, idl: ProfileRead): string {
  if (idl.allSizes) return `Your ideal profile covers businesses of all sizes (${listText(idl.sizes.filter((s) => !SIZE_ONLY.test(s) || /\bfrom\b|\ball\b|every|any/i.test(s)).map(quote) || [])}), so size does not separate a good fit from a poor one. Use the buyer, the problem and the segment to qualify instead.${cur.sizes.length ? ` Your current base mentions ${listText(cur.sizes)}.` : ''}`.replace('(), so', ', so').replace(/\(\)/, '');
  if (idl.sizes.length && cur.sizes.length) {
    const sk = (x: string) => x.toLowerCase().replace(/[^a-z0-9 ]+/g, '').replace(/s$/, '').trim();
    const same = idl.sizes.filter((s) => cur.sizes.some((c) => sk(c) === sk(s)));
    return `Your ideal profile says ${listText(idl.sizes)}; your current base says ${listText(cur.sizes)}.${same.length ? ` Both use ${listText(same.map(quote))}.` : ' They do not use the same size words, so compare them in your CRM by employee count.'}`;
  }
  if (idl.sizes.length) return `Your ideal profile says ${listText(idl.sizes)}; your current base does not say how large its customers are, so compare them in your CRM.`;
  if (cur.sizes.length) return `Your current base says ${listText(cur.sizes)}; your ideal profile states no size.`;
  return 'Neither profile states a company size.';
}
function sizeCriterion(cur: ProfileRead, idl: ProfileRead): string {
  if (idl.allSizes) return 'all sizes are accepted, so do not qualify on size';
  if (idl.sizes.length) return `${listText(idl.sizes)} (from your ideal profile)`;
  return 'not stated in your ideal profile';
}

function causeText(d: GapDeps, cur: ProfileRead, idl: ProfileRead, curNamed: string[], curMissing: string[]): string {
  const out: string[] = [];
  const rows = d.metricRows.filter((m) => m.both && m.behind);
  const seg = curNamed.length ? 'the segments named in both profiles' : '';
  const buyer = idl.roles.length ? listText(idl.roles.map(cleanRole)) : 'the buyer';
  const prob = idl.problems.length ? (idl.problems.length === 1 ? 'the problem you listed' : 'the problems you listed') : 'the problem you sell against';
  for (const r of rows) {
    const b: string[] = [];
    if (r.key === 'acv') {
      b.push(`Split ACV by segment${seg ? ` and compare ${seg} with the rest` : ''}: if the segments your ideal profile names have the higher ACV, the gap is a mix problem; if not, it is a price or scope problem.`);
      b.push(`Check whether the deals reach ${buyer} or a smaller budget holder below them.`);
      b.push(d.pricingAction + '.');
    } else if (r.key === 'cycle') {
      b.push(`Count the meetings before ${buyer} joins a deal, and the stakeholders added after that; a long cycle usually means the buyer arrived late.`);
      b.push(`Check whether the first call tests ${prob}; deals without it tend to stall.`);
      if (d.sectorObjections.length) b.push(`Check which of these objections slow your deals: ${d.sectorObjections.slice(0, 3).join('; ')}.`);
    } else if (r.key === 'winRate') {
      b.push(`Compare win rate by segment${curMissing.length ? `, starting with ${listText(curMissing.map(cleanSeg))}, which your ideal profile does not name` : ''}.`);
      b.push(`Read your last lost deals for ${prob}: was it absent, or present and not solved?`);
    } else if (r.key === 'churn') {
      b.push(`Compare churn by segment${seg ? ` (${seg} against the rest)` : ''} and by whether the customer had ${prob} before they bought.`);
      b.push('Look at the first 90 days of the customers who left: what they used, who sponsored them, what they said when they left.');
    } else if (r.key === 'nps') {
      b.push(`Split NPS by segment, and by whether the person who answered is ${buyer} or another user; a low score from one group points at the fit, not at the product.`);
    }
    if (b.length) out.push(`### ${r.label} (${r.gap})`, ...b.map((x) => `- ${x}`), '');
  }
  if (!out.length) return '';
  return out.join('\n').trim();
}

function plan(d: GapDeps, cur: ProfileRead, idl: ProfileRead, curSeg: string[], curNamed: string[], curMissing: string[], idlNotInBase: string[], idealNamesIndustries: boolean): string {
  const segs = idealNamesIndustries ? idl.segments : curSeg;
  const segText = segs.length ? listText(segs.slice(0, 6).map(cleanSeg)) : 'your target segments';
  const buyer = idl.roles.length ? listText(idl.roles.map(cleanRole)) : 'the buyer';
  const prob = idl.problems.length ? (idl.problems.length === 1 ? 'the problem you listed' : 'the problems you listed') : 'the problem you sell against';
  const gaps = d.metricRows.filter((m) => m.both && m.behind).map((m) => LABEL_TEXT[m.key] || m.label);
  const w1 = [`**Week 1, find out what is true.** Pull win rate, ACV and churn for ${curSeg.length ? listText(curSeg.slice(0, 6).map(cleanSeg)) : 'each segment you sell to'}.${curMissing.length ? ` Look first at ${listText(curMissing.map(cleanSeg))}, which your ideal profile does not name.` : ''} From your last won deals, write down the title that signed${idl.roles.length ? ` and compare it with ${buyer}` : ''}, and tag each deal with the problem it solved. Done when each segment has its three numbers and each won deal has a signer and a problem.`];
  const w2 = [`**Week 2, build the list.** Make a target list for ${segText}${idl.places.length ? ` in ${listText(idl.places.map(placeText))}` : ''}${idlNotInBase.length && idlNotInBase.length < segs.length ? `, with ${listText(idlNotInBase.map(cleanSeg))} as the new ground` : ''}, with a named ${idl.roles.length ? `contact (${buyer})` : 'contact'} for each account. Write one opening message per segment that starts from ${prob}. Done when every account on the list has a contact and a first message.`];
  const w3: string[] = [`**Week 3, get ready to be asked.** Collect proof for each target segment from your won deals${d.sectorProof ? `; in your sector a strong proof point is: ${noDot(d.sectorProof)}` : ''}.${d.sectorObjections.length ? ` Write short answers to the objections your buyers raise: ${d.sectorObjections.slice(0, 3).join('; ')}.` : ''} ${d.targetAcv != null ? `Check the price and scope against your target of ${d.money(d.targetAcv)}. ` : ''}${d.metricRows.some((m) => m.key === 'acv' && m.both && m.behind) ? 'Run the pricing step listed under the ACV gap. ' : ''}Done when each segment has one proof point${d.sectorObjections.length ? ' and each objection has an answer' : ''}.`.trim()];
  const w4 = [`**Week 4, check and decide.** Re-score the open pipeline against the criteria above${gaps.length ? ` and look again at ${listText(gaps)}` : ''}.${curMissing.length ? ` Decide for ${listText(curMissing.map(cleanSeg))}: keep serving, stop prospecting, or add to the ideal profile.` : ''} Done when you have a one page ICP with the segments you will pursue, the buyer, the problem and the disqualifiers.`];
  return [...w1, '', ...w2, '', ...w3, '', ...w4].join('\n');
}

// ---------------------------------------------------------------------------
// the scoring model: points per value
// ---------------------------------------------------------------------------
const GRADED_NAME = /\b(?:size|employees?|headcount|revenue|budget|timeline|timing|urgency|stage|tier|volume|spend|score|maturity|authority|readiness|priority|level|number|count|sites?|branches|locations?|stores?|outlets?|age|years?|months?|days?|quarter|deal value|acv|arr|growth)\b/i;
// A value is ordered by nature when it holds a standalone number or range, or is one of the plain grading words as a whole value
// ("D2C", "B2B" and "3PL" are names, not numbers; "Large omnichannel brands" is a customer type, not a grade).
const GRADED_NUMBER = /(?<![A-Za-z0-9])\d[\d,.]*\+?(?![A-Za-z])/;
const GRADED_WORD = /^(?:yes|no|partly|partial|none|high|medium|low|large|small|mid|midsize|mid-size|active|active project|planned|planning|exploring|confirmed|unknown|this (?:quarter|year|month)|next (?:quarter|year)|immediate|urgent|soon|later|always|sometimes|never|strong|weak|good|poor|full|some|high fit|medium fit|low fit|budget planned|no budget|confirmed budget)$/i;
const NONE_VALUE = /^(?:none|no|other|others|none of (?:these|the above)|not applicable|n\/a|unknown|not (?:sure|known|listed))\b/i;

export type PointKind = 'single' | 'graded' | 'named';
// The example points for the values of one criterion. A list that is ordered by nature keeps the preset steps (first value full weight, last 0,
// even steps between). A list of named targets scores the full weight for each name, and a closing "none" or "other" scores 0.
export function pointsFor(criterion: string, values: string[], weight: number, userGiven: boolean): { kind: PointKind; points: number[]; closing: boolean } {
  if (!userGiven) return { kind: 'graded', points: [], closing: false };
  if (values.length === 1) return { kind: 'single', points: [weight], closing: false };
  const graded = GRADED_NAME.test(criterion) || values.filter((v) => GRADED_NUMBER.test(v) || GRADED_WORD.test(v.trim())).length * 2 >= values.length;
  if (graded) return { kind: 'graded', points: values.map((_v, i) => Math.round(weight * (values.length - 1 - i) / (values.length - 1))), closing: false };
  const last = values.length - 1;
  const closing = NONE_VALUE.test(values[last].trim());
  return { kind: 'named', points: values.map((_v, i) => (closing && i === last ? 0 : weight)), closing };
}

// ---------------------------------------------------------------------------
// statements: a list typed in one field ("A; B; C" or one per line). A semicolon, a full stop or a new line inside quotes or brackets
// does not end a statement ("... less than a week; previously a task that took months" quoted from a customer stays whole).
// ---------------------------------------------------------------------------
export function splitStatements(text: string): string[] {
  const t = protect(String(text || ''));
  const out: string[] = [];
  let cur = ''; let depth = 0; let dq = false; let sq = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i]; const prev = i > 0 ? t[i - 1] : ' '; const next = i + 1 < t.length ? t[i + 1] : ' ';
    if (ch === '(') depth++;
    if (ch === ')') depth = Math.max(0, depth - 1);
    if (ch === '"' || ch === '\u201c' || ch === '\u201d') dq = !dq;
    if (ch === "'") {
      if (!sq && /[\s:(\[]/.test(prev) && /[A-Za-z0-9]/.test(next)) sq = true;
      else if (sq && /[A-Za-z0-9.,!?)]/.test(prev) && /[\s.,;:)\]]|$/.test(next)) sq = false;
    }
    const open = depth > 0 || dq || sq;
    if (!open && ch === ';' && /\s/.test(next)) { out.push(cur); cur = ''; i++; continue; }
    if (!open && ch === '\n') { out.push(cur); cur = ''; continue; }
    if (!open && ch === '.' && /\s/.test(next) && /[a-z0-9)"'%\u201d]/.test(prev) && /[A-Z\u201c]/.test(t[i + 2] || '')) { out.push(cur); cur = ''; i++; continue; }
    cur += ch;
  }
  out.push(cur);
  return out.map((x) => squash(restore(x)).replace(/\.$/, '')).filter(Boolean);
}

// ---------------------------------------------------------------------------
// run 22 round 2 helpers
// ---------------------------------------------------------------------------
// The sector entry to print notes from. A sub-type entry is used only when the user's own product words name what the sub-type is about; the
// email security sub-type also matches "security awareness training", so a training product that never says mail, phishing or a gateway gets the
// notes of the vertical itself (no gateway proof points or objections).
export function clearVertical(v: Vertical | null, sellerText: string): Vertical | null {
  if (!v || !v.subtype) return v;
  if (v.subtype === 'email-security' && !/\b(?:e-?mail|mailbox|inbox|phishing|spoof\w*|gateway|BEC)\b/i.test(sellerText)) return VERTICALS.find((x) => x.id === v.id) || v;
  return v;
}
// A value named in a statement by another word for the same kind of thing ("Food and beverage" in a statement about a spirits company).
// Only an alias counts here; a plain shared word is left to the strict word match of the scoring model.
export function aliasNamed(value: string, statement: string): boolean {
  const toks = [...new Set(tokensOf(itemKey(value)))];
  if (!toks.length) return false;
  const hay = new Set(tokensOf(statement, false));
  let viaAlias = 0;
  for (const t of toks) {
    if (hay.has(t)) continue;
    if ([...(ALIAS_OF.get(t) || [])].some((a) => hay.has(a))) { viaAlias++; continue; }
    return false;
  }
  return viaAlias > 0;
}
// The discovery questions to print as fit signals: the first four, but when the product text says voice or calls and none of the four is about
// calls, the first question of the sector that is about calls takes the fourth place.
export function fitQuestions(v: Vertical, productText: string): string[] {
  const four = v.discovery.slice(0, 4);
  if (!/\b(?:voice|calls?|calling|telephony|sip|pstn|dialler|dialer)\b/i.test(productText)) return four;
  const callQ = /\b(?:voice|calls?|calling|telephony|sip|caller|answer rate|latency)\b/i;
  if (four.some((q) => callQ.test(q))) return four;
  // the question may sit further down this sector's list, or in the voice sub-type of the same vertical (shared sector file only)
  const pool = [...v.discovery.slice(4), ...SUBTYPES.filter((t) => t.vertical === v.id && t.id !== v.subtype).flatMap((t) => t.notes.discovery || [])].filter((q) => callQ.test(q));
  const extra = pool.find((q) => /\b(?:quality|latency|answer rate|caller)/i.test(q)) || pool[0];
  return extra ? [...four.slice(0, 3), extra] : four;
}
