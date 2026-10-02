// Sector knowledge for the nine verticals Shashwat Ghosh serves (run 19, owner decision D80; rule B82).
// One data file, shared by every tool in this server, so the owner can read and correct it in one place.
// The verticals and their order come from work/market.json in the owner's project (logistics tech, fintech, SaaS,
// vertical SaaS, AI native, ITeS, telecom, software, cybersecurity).
// Rule B82: this file holds vocabulary, buyer roles, buying committees, typical objections, business models, sales
// motions, the metrics each sector watches and what a good proof point looks like. It holds NO statistic, market size,
// benchmark figure or named-company fact. Where a tool needs a number, it uses the user's own figure or a labelled example.

export type VerticalId =
  | 'logistics-tech' | 'fintech' | 'saas' | 'vertical-saas' | 'ai-native' | 'ites' | 'telecom' | 'software' | 'cybersecurity';

export interface Objection { objection: string; response: string; }

export interface Vertical {
  id: VerticalId;
  name: string;
  match: RegExp;              // words that identify the sector in what the user typed
  vocabulary: string[];       // the words this sector's buyers use
  buyerRoles: string[];       // who buys and uses
  committee: string;          // the usual buying committee, in one sentence
  objections: Objection[];    // objections this sector raises, with the pattern of a good answer
  salesMotion: string;        // how deals usually run
  metrics: string[];          // what the sector watches (names only, no figures)
  proofShape: string;         // what a good proof point looks like
  discovery: string[];        // discovery questions in the sector's own language
}

export const VERTICALS: Vertical[] = [
  {
    id: 'logistics-tech', name: 'logistics tech',
    match: /\b(logistics?|last[- ]mile|3pls?|fleets?|dispatch\w*|route|routes|routing|freight|shipping|shipments?|couriers?|supply chain|warehous\w*|fulfil\w*|deliver(?:y|ies)|transport\w*|tms|carriers?)\b/i,
    vocabulary: ['dispatch', 'fleet', 'last-mile', 'route plan', 'first-attempt delivery', 'proof of delivery', '3PL', 'cost per delivery', 'delivery SLA', 'TMS'],
    buyerRoles: ['Chief Operating Officer', 'Head of Supply Chain', 'Head of Last-Mile Operations', 'Fleet Manager', 'Transport Manager', 'Head of IT'],
    committee: 'The COO or Head of Supply Chain signs; the Head of Logistics or Last-Mile Operations champions; fleet and dispatch managers use it daily; IT checks the fit with the TMS, WMS and order systems; finance checks the cost per delivery case.',
    objections: [
      { objection: 'We already have a TMS', response: 'Ask which daily decisions the TMS does not make today (re-planning when orders change, address cleaning, driver allocation) and position the product as working with the TMS, not replacing it.' },
      { objection: 'Drivers will not use a new app', response: 'Offer a pilot at one hub with an offline-first driver app and agree how adoption is measured before the pilot starts.' },
      { objection: 'Integration effort', response: 'Name the systems involved (TMS, WMS, ERP, order management) and the few data fields needed, and agree who on the buyer side owns each.' },
      { objection: 'Our margins are too thin for this', response: 'Tie the price to cost per delivery and failed deliveries measured in the buyer\'s own data, not to a general claim.' },
    ],
    salesMotion: 'Enterprise sales with a pilot at one hub or city, often timed around peak-season planning.',
    metrics: ['cost per delivery', 'first-attempt delivery rate', 'on-time delivery', 'deliveries per vehicle per day', 'vehicle utilisation', 'failed delivery and return rate', 'dispatch planning time'],
    proofShape: 'A before and after of cost per delivery or first-attempt delivery at one hub, measured over a full cycle of busy and quiet weeks.',
    discovery: [
      'How do you plan routes today, and how often does a dispatcher re-plan during the day?',
      'What happens when an order, a driver or a road changes after the vehicles have left?',
      'How do you measure cost per delivery and first-attempt delivery today, and who owns those numbers?',
      'Which systems hold the orders and the addresses (TMS, WMS, ERP, order management)?',
      'Where do failed deliveries come from: addresses, time windows, driver allocation or something else?',
    ],
  },
  {
    id: 'fintech', name: 'fintech',
    match: /\b(fintech|spend management|expenses?|erp|month-end|close the books|reimburse\w*|payments?|payouts?|corporate cards?|prepaid cards?|lending|loans?|credit|banking|banks?|treasury|reconcil\w*|payroll|invoic\w*|accounts payable|wealth|invest\w*|asset (?:managers?|allocators?)|insur\w*|portfolios?|funds?|nbfc)\b/i,
    vocabulary: ['reconciliation', 'month-end close', 'policy controls', 'audit trail', 'accounts payable', 'ERP posting', 'compliance review', 'approval workflow', 'data residency'],
    buyerRoles: ['Chief Financial Officer', 'Finance Controller', 'Head of Accounts Payable', 'Head of Treasury', 'Internal Audit Lead', 'Compliance Officer', 'Head of IT'],
    committee: 'The CFO signs; the Finance Controller or the head of the affected finance team champions; internal audit and compliance review controls; IT checks ERP integration and security; HR joins when employees are affected.',
    objections: [
      { objection: 'Our ERP already does this', response: 'Show the gap between the ERP module and the daily workflow (approvals, receipts, cards, posting) using one month of the buyer\'s own transactions.' },
      { objection: 'Security and compliance review', response: 'Prepare the answers before they are asked: data residency, access controls, audit logs, certifications you actually hold.' },
      { objection: 'Migration will disrupt the close', response: 'Plan the cut-over just after a month-end close and run old and new in parallel for one cycle.' },
      { objection: 'Regulatory caution', response: 'Map each requirement the buyer names to the control or report that meets it; never claim a compliance status you cannot show.' },
    ],
    salesMotion: 'CFO-led with a security and compliance review inside the cycle; proof through a pilot on one entity or department.',
    metrics: ['days to close the books', 'reconciliation effort', 'policy breach rate', 'approval cycle time', 'audit findings', 'cost per transaction', 'payment success rate'],
    proofShape: 'Close time or reconciliation effort before and after for one entity, signed off by the finance controller.',
    discovery: [
      'How many days does the month-end close take today, and which step takes longest?',
      'How are card spends, claims and invoices matched to the ledger today, and by whom?',
      'What did the last audit say about spend controls or approvals?',
      'Which ERP or ledger must every transaction post into, and who owns that integration?',
      'Which reviews (security, compliance, internal audit) must a new finance tool pass, and how long do they take?',
    ],
  },
  {
    id: 'vertical-saas', name: 'vertical SaaS',
    match: /\b(fmcg|cpg|consumer goods|consumer brands?|distributors?|retail execution|field sales|field reps?|outlets?|general trade|sales force automation|sfa|dms|distribution management|beat plans?|secondary sales|route-to-market|kirana)\b/i,
    vocabulary: ['distributor', 'outlet', 'beat plan', 'secondary sales', 'general trade', 'SKU', 'order capture', 'retail execution', 'DMS', 'trade scheme'],
    buyerRoles: ['National Sales Head', 'Head of Sales Operations', 'Head of Distribution', 'Regional Sales Manager', 'Managing Director', 'CIO'],
    committee: 'The National Sales Head or Managing Director signs; the Head of Sales Operations champions; regional managers and field reps use it; distributors hold the stock and order data; IT checks the ERP and DMS integration.',
    objections: [
      { objection: 'Reps will not use another app', response: 'Propose an adoption plan: one region first, an app that works offline on low-end phones, and incentives tied to orders captured in the app.' },
      { objection: 'Our DMS vendor bundles a sales app', response: 'Compare what reps can do in the outlet with each app (order suggestions, schemes, stock visibility), not the feature list.' },
      { objection: 'Distributor data is not in sync', response: 'Name the distributor systems involved and agree how stock and orders flow back before the rollout.' },
      { objection: 'A national rollout takes too long', response: 'Plan region by region with a dated wave plan and a measured pilot region first.' },
    ],
    salesMotion: 'Enterprise sales led by the sales function, with a pilot in one region or with a set of distributors before a national rollout.',
    metrics: ['secondary sales', 'productive calls', 'lines per call', 'outlet coverage', 'strike rate', 'order fill rate', 'distributor claim settlement time'],
    proofShape: 'Secondary sales or productive calls in the pilot region against a comparable region without the product.',
    discovery: [
      'How do your reps capture orders in the outlet today, and how does that reach the distributor?',
      'How do you see secondary sales by outlet and by SKU today, and how late is that view?',
      'What share of your outlets does a rep cover in a typical beat, and who plans the beats?',
      'How are trade schemes communicated to reps and checked at the outlet?',
      'Which distributor systems (DMS) and ERP must the sales app work with?',
    ],
  },
  {
    id: 'ai-native', name: 'AI native',
    match: /\b(ai agents?|agents? that|llms?|genai|gen ai|generative ai|ai-native|ai native|copilots?|machine learning|conversational ai|ai platform|ai models?|adaptive ai|ai-led|ai-powered|forecasts?)\b/i,
    vocabulary: ['resolution rate', 'evaluation set', 'human in the loop', 'guardrails', 'accuracy', 'hallucination', 'data privacy', 'inference cost', 'automation rate'],
    buyerRoles: ['Head of Customer Experience', 'Chief Technology Officer', 'Head of Data and AI', 'CISO', 'Chief Operating Officer', 'Legal Counsel'],
    committee: 'The owner of the workflow being automated signs; the data or AI lead evaluates the model; security and legal review data use and privacy; the operations team that hands work to the AI uses it.',
    objections: [
      { objection: 'AI gets answers wrong', response: 'Agree an evaluation on the buyer\'s own history before go-live, with a person approving any action that moves money or changes a record.' },
      { objection: 'Data privacy', response: 'State exactly where data is processed and stored, what is used for training (if anything) and how it can be deleted.' },
      { objection: 'We can build this on a model API ourselves', response: 'Compare the full cost of building and maintaining evaluation, guardrails and integrations, not the model price.' },
      { objection: 'Cost grows with volume', response: 'Show the cost per resolved case against the cost of handling it today, using the buyer\'s own volumes.' },
    ],
    salesMotion: 'A proof of concept on the buyer\'s own data, then a production pilot with guardrails and human review.',
    metrics: ['automated resolution rate', 'accuracy on an evaluation set', 'escalation rate', 'handling time', 'cost per resolution', 'customer satisfaction on automated cases'],
    proofShape: 'Results on an evaluation set built from the buyer\'s own history, then live results with human review switched on.',
    discovery: [
      'Which cases or decisions would you trust an AI to handle first, and which never?',
      'How would you judge that an answer is right: who reviews it today and against what?',
      'Where does the data the AI needs live, and what may leave your environment?',
      'What must a person approve before the AI acts?',
      'How do you measure handling time and quality today?',
    ],
  },
  {
    id: 'ites', name: 'ITeS',
    match: /\b(it services|managed services?|managed service desk|service desk|bpo|bpm|outsourc\w*|itsm|consulting|systems integrators?|digital engineering|moderni[sz]ation|contact cent(?:re|er)s?|back office|ites|it-enabled|offshore|transition|statements? of work|per employee|per fte)\b/i,
    vocabulary: ['SLA', 'statement of work', 'transition', 'steady state', 'service credits', 'governance', 'ticket backlog', 'knowledge transfer', 'managed service'],
    buyerRoles: ['Chief Information Officer', 'VP IT Operations', 'Head of Procurement', 'Vendor Management Lead', 'Chief Financial Officer', 'Business Unit Head'],
    committee: 'The CIO or business unit head signs; the IT operations or service owner champions; procurement and vendor management run the commercial process; finance checks rates; security checks access and compliance.',
    objections: [
      { objection: 'Transition risk from the incumbent', response: 'Show a staged transition plan with knowledge transfer, a parallel run and exit criteria for each stage.' },
      { objection: 'Your rates are higher than an offshore-only firm', response: 'Compare the total cost of the outcome (SLA attainment, rework, management time), not the hourly rate.' },
      { objection: 'Attrition and key people', response: 'Name the team model, the backup for key roles and how knowledge is documented.' },
      { objection: 'Lock-in', response: 'Offer clear exit terms and documentation the client owns.' },
    ],
    salesMotion: 'RFP-led or relationship-led; proposals carry a transition plan, a governance model and references from similar clients.',
    metrics: ['SLA attainment', 'mean time to resolve', 'first-contact resolution', 'backlog age', 'cost per ticket or per FTE', 'customer satisfaction', 'transition milestones met'],
    proofShape: 'SLA and cost outcomes at a similar client, with the transition timeline that was actually met.',
    discovery: [
      'Which services are in scope, and what does the current SLA say?',
      'What went wrong with the current provider, in the client\'s own words?',
      'How will the transition be governed, and who signs off each stage?',
      'How is the service priced today (per FTE, per ticket, fixed price or outcome based)?',
      'Which reports does the client\'s leadership read every month?',
    ],
  },
  {
    id: 'telecom', name: 'telecom',
    match: /\b(telecom\w*|telco|sd-wan|mpls|leased lines?|connectivity|network services?|bandwidth|5g|operators?|isps?|internet access|business internet|voice|cpaas|colocation|iot|branches|sites?)\b/i,
    vocabulary: ['SD-WAN', 'MPLS', 'internet leased line', 'uptime', 'SLA', 'latency', 'branch sites', 'last-mile link', 'network operations centre', 'site survey'],
    buyerRoles: ['Chief Information Officer', 'Head of IT Infrastructure', 'Network Manager', 'CISO', 'Head of Procurement', 'Chief Financial Officer'],
    committee: 'The CIO signs; the network or infrastructure head champions; the CISO reviews the security overlay; procurement compares rate cards; finance checks the cost per site.',
    objections: [
      { objection: 'Price per site is higher than the national operator', response: 'Compare the total cost per site, including outages, repair time and the IT team\'s time spent managing links.' },
      { objection: 'Migration risk across many sites', response: 'Propose a wave plan by region with fallback links and a rollback rule for each wave.' },
      { objection: 'We have a long relationship with our current operator', response: 'Start with the sites where service is worst and let the results make the case.' },
      { objection: 'Security overlay', response: 'Show how the network and the security controls are managed together and who responds to an incident.' },
    ],
    salesMotion: 'Account-based enterprise sales, often an RFP or rate-card comparison, with a site survey and pilot sites before the rollout.',
    metrics: ['uptime per site', 'mean time to repair', 'latency', 'sites live per wave', 'cost per site', 'incidents per month', 'service credits paid'],
    proofShape: 'Uptime and repair time across the pilot sites, compared with the incumbent\'s record for the same sites.',
    discovery: [
      'How many sites do you run, and which ones suffer the most outages?',
      'What does an outage cost a branch in a day: lost sales, idle staff, or something else?',
      'Who manages the links today, and how long does a repair take?',
      'Which contracts end when, and which operator holds each site?',
      'What does your security team need from the network (segmentation, firewalls, monitoring)?',
    ],
  },
  {
    id: 'cybersecurity', name: 'cybersecurity',
    match: /\b(security|cyber\w*|cisos?|soc|threats?|vulnerab\w*|attack surface|posture|cnapp|cspm|siem|edr|xdr|iam|zero trust|phishing|misconfig\w*|dark web|ransomware|exposures?|breach\w*)\b/i,
    vocabulary: ['attack surface', 'exposure', 'misconfiguration', 'alert fatigue', 'mean time to detect', 'mean time to respond', 'SOC', 'compliance audit', 'risk register', 'threat intelligence'],
    buyerRoles: ['CISO', 'Head of Security Operations', 'Cloud Security Lead', 'Security Architect', 'Chief Information Officer', 'Head of Risk and Compliance'],
    committee: 'The CISO signs; the SOC or cloud security lead champions; security engineers use it; risk, compliance and audit review the evidence it produces; the CIO or CTO checks integration.',
    objections: [
      { objection: 'We already have a tool for this', response: 'Map the overlap honestly and show what the current tool misses, on the buyer\'s own environment.' },
      { objection: 'We have too many alerts already', response: 'Show how findings are ranked by real exposure so the team works on fewer, more important items.' },
      { objection: 'Integration with our SIEM and ticketing', response: 'Name the integrations available today and test them in the proof of value.' },
      { objection: 'We need proof before budget', response: 'Offer a time-boxed proof of value with success criteria agreed in writing first.' },
    ],
    salesMotion: 'CISO-led, with a proof of value on the buyer\'s own environment; budget often follows an audit finding or an incident.',
    metrics: ['mean time to detect', 'mean time to respond', 'critical exposures open', 'alerts per analyst', 'audit findings', 'time to prepare an audit', 'asset coverage'],
    proofShape: 'Exposures found and closed during the proof of value, with the time it took to fix them.',
    discovery: [
      'Which assets, clouds or environments are in scope, and which are you least sure about?',
      'How many alerts does the team handle in a week, and how are they ranked today?',
      'What did the last audit or incident show?',
      'Which tools must this work with (SIEM, ticketing, cloud accounts)?',
      'How would you judge a proof of value a success?',
    ],
  },
  {
    id: 'software', name: 'software',
    match: /\b(developers?|apis?|sdks?|devops|qa|test(?:ing|s)? (?:platform|automation)|code|ci\/cd|ci pipelines?|observability|databases?|open[- ]source|dev tools|engineering teams?|release)\b/i,
    vocabulary: ['CI pipeline', 'developer experience', 'test coverage', 'release frequency', 'API', 'SDK', 'technical debt', 'open-source alternative', 'mean time to recovery'],
    buyerRoles: ['VP Engineering', 'Chief Technology Officer', 'Head of QA', 'Platform Engineering Lead', 'Engineering Manager', 'Security Lead'],
    committee: 'The VP Engineering or CTO signs; a team or platform lead champions; developers use it daily; security reviews code and data access; procurement handles seats or usage.',
    objections: [
      { objection: 'Our developers use open-source tools', response: 'Compare the time spent maintaining the open-source setup with what the product removes, on one team.' },
      { objection: 'Per-user cost at our scale', response: 'Tie the price to the teams that use it and the time saved, measured in a trial.' },
      { objection: 'Migrating our existing scripts and tests', response: 'Show the import path and migrate one real project during the trial.' },
      { objection: 'Security review of code access', response: 'State what the product reads and stores and offer the security documentation up front.' },
    ],
    salesMotion: 'Developers adopt first (trial or free tier where offered), then a team or enterprise deal led by engineering leadership.',
    metrics: ['release frequency', 'lead time for changes', 'escaped defects', 'test coverage', 'build time', 'mean time to recovery', 'developer time saved'],
    proofShape: 'Release frequency or escaped defects on one team before and after, from the team\'s own pipeline data.',
    discovery: [
      'How often do you release, and what slows a release down?',
      'How are tests written and maintained today, and by whom?',
      'Which tools are in the pipeline today, and which would this replace or join?',
      'How do you measure escaped defects or incidents after a release?',
      'Who must approve a new developer tool (security, procurement, platform team)?',
    ],
  },
  {
    id: 'saas', name: 'SaaS',
    match: /\b(saas|subscriptions?|software as a service|b2b software|crm|billing|product analytics|platform for)\b/i,
    vocabulary: ['activation', 'time to value', 'net revenue retention', 'renewal', 'expansion', 'onboarding', 'usage', 'churn', 'customer success'],
    buyerRoles: ['VP Product', 'Head of Growth', 'Chief Revenue Officer', 'Head of Customer Success', 'Chief Financial Officer'],
    committee: 'The budget owner of the function signs; the team lead who feels the problem champions; end users adopt it; finance and IT review cost, security and integrations.',
    objections: [
      { objection: 'We built this in-house', response: 'Compare the cost of maintaining the in-house build with the product, including the people who keep it running.' },
      { objection: 'The price grows as we grow', response: 'Align the pricing metric with the value the buyer gets and show the price at the next stage of growth.' },
      { objection: 'Switching cost', response: 'Show the migration plan and the time to first value.' },
      { objection: 'Another tool to log into', response: 'Show where it sits in the tools they already use.' },
    ],
    salesMotion: 'Product-led or sales-assisted; trials and self-serve where buyers expect them; expansion through usage and renewals.',
    metrics: ['activation rate', 'time to value', 'net revenue retention', 'logo churn', 'expansion revenue', 'payback on acquisition cost', 'usage depth'],
    proofShape: 'A cohort of customers before and after, on activation, retention or expansion.',
    discovery: [
      'What does a customer have to do before they get value, and how long does it take today?',
      'Which accounts expanded last year, and what did they have in common?',
      'Where do customers drop off: onboarding, adoption or renewal?',
      'Which tools would this replace or connect to?',
      'Who owns the number this would move?',
    ],
  },
];

// The order in which the sectors are tried: the specific ones first, SaaS last (most text mentions software).
const ORDER: VerticalId[] = ['vertical-saas', 'logistics-tech', 'telecom', 'cybersecurity', 'ites', 'ai-native', 'fintech', 'software', 'saas'];

/** The sector read from what the user typed, or null when the text does not name one clearly. Counts the DIFFERENT sector
 * words found per sector; a sector is chosen only with at least 2 different words and more than any other sector, so a
 * single shared word (for example "security" or "delivery") never puts a company in the wrong sector. */
export function detectVertical(...texts: unknown[]): Vertical | null {
  const t = texts.filter((x) => typeof x === 'string' && x.trim()).join(' \n ');
  if (!t) return null;
  const scored = ORDER.map((id) => {
    const v = VERTICALS.find((x) => x.id === id)!;
    const n = new Set((t.match(new RegExp(v.match.source, 'gi')) || []).map((w) => w.toLowerCase())).size;
    return { v, n };
  }).sort((a, b) => b.n - a.n);
  const [first, second] = scored;
  return first.n >= 2 && first.n > second.n ? first.v : null;
}

export type BusinessModel = 'saas' | 'services' | 'connectivity' | 'transactions' | 'marketplace' | 'hardware_software' | 'investment';
export const BUSINESS_MODELS: BusinessModel[] = ['saas', 'services', 'connectivity', 'transactions', 'marketplace', 'hardware_software', 'investment'];
export const MODEL_NAME: Record<BusinessModel, string> = {
  saas: 'software subscription', services: 'services (people-delivered, per FTE, per ticket or fixed price)', connectivity: 'connectivity (per site, per link or bandwidth, on a term contract)',
  transactions: 'per-transaction (payments or volume based)', marketplace: 'marketplace (a take rate on transactions)', hardware_software: 'hardware plus software',
  investment: 'investment management (fees on assets or performance)',
};

const MODEL_MATCH: [BusinessModel, RegExp][] = [
  ['investment', /\b(funds?|portfolios?|asset (?:managers?|management|allocators?)|wealth|investment (?:strateg\w*|managers?|management)|aum|family offices?)\b/i],
  ['connectivity', /\b(sd-wan|mpls|leased lines?|connectivity|bandwidth|per site|operators?|telecom\w*|5g|business internet)\b/i],
  ['services', /\b(managed services?|service desk|outsourc\w*|bpo|bpm|consulting|per fte|per employee|staff augmentation|systems integrators?|it services|statements? of work|contact cent(?:re|er) services)\b/i],
  ['marketplace', /\b(marketplace|take rate|gmv)\b/i],
  ['transactions', /\b(per transaction|payment gateway|payouts?|payments? platform|interchange|transaction fees?)\b/i],
  ['hardware_software', /\b(hardware|devices?|sensors?|iot devices?|terminals?|scanners?)\b/i],
  ['saas', /\b(saas|subscription|software|platform|app|per seat|per user|licen[cs]es?)\b/i],
];

// The model most companies in a sector use, assumed only when the text names none (the answer says it was assumed).
export const SECTOR_MODEL: Record<VerticalId, BusinessModel> = {
  'logistics-tech': 'saas', fintech: 'saas', saas: 'saas', 'vertical-saas': 'saas', 'ai-native': 'saas', ites: 'services', telecom: 'connectivity', software: 'saas', cybersecurity: 'saas',
};

/** The business model: the explicit input when given, else read from the text, else the sector's usual model, else null. */
export function detectModel(explicit: unknown, ...texts: unknown[]): { model: BusinessModel | null; how: 'input' | 'read' | 'sector' | 'unknown' } {
  if (typeof explicit === 'string' && (BUSINESS_MODELS as string[]).includes(explicit)) return { model: explicit as BusinessModel, how: 'input' };
  const t = texts.filter((x) => typeof x === 'string' && x.trim()).join(' \n ');
  for (const [m, re] of MODEL_MATCH) if (re.test(t)) return { model: m, how: 'read' };
  const v = detectVertical(...texts);
  if (v) return { model: SECTOR_MODEL[v.id], how: 'sector' };
  return { model: null, how: 'unknown' };
}

/** Commercial trades a seller can ask for in return for a concession, by business model (no figures). */
export const MODEL_TRADES: Record<BusinessModel | 'unknown', string[]> = {
  saas: ['a longer term (multi-year)', 'payment upfront', 'more users or a wider rollout', 'a case study and reference rights'],
  services: ['a longer contract term', 'a wider scope (more services or locations)', 'volume commitments (tickets, FTEs or hours)', 'a reference call after go-live'],
  connectivity: ['a longer contract term', 'more sites or links in the same contract', 'a faster cut-over plan agreed by both sides', 'a reference visit after go-live'],
  transactions: ['committed monthly volume', 'a longer term', 'exclusivity for a product line or region', 'a case study after go-live'],
  marketplace: ['committed volume through the marketplace', 'a longer term', 'co-marketing', 'a case study'],
  hardware_software: ['a larger order of devices', 'a longer software term', 'payment upfront', 'a reference site'],
  investment: ['a larger or longer mandate', 'a phased allocation', 'agreed reporting instead of a fee cut', 'a reference with consent'],
  unknown: ['a longer term', 'payment upfront', 'a wider scope', 'a case study and reference rights'],
};

/** Words that only fit a software subscription; tools never print them for another model unless the user typed them. */
export const SAAS_ONLY = /\b(MRR|free trial|freemium|self-serve sign-?up|per seat|seats?|aha moment)\b/i;
