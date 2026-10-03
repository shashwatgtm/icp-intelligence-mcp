"use strict";
// Sector knowledge for the nine verticals Shashwat Ghosh serves (run 19, owner decision D80; rule B82).
// One data file, shared by every tool in this server, so the owner can read and correct it in one place.
// The verticals and their order come from work/market.json in the owner's project (logistics tech, fintech, SaaS,
// vertical SaaS, AI native, ITeS, telecom, software, cybersecurity).
// Rule B82: this file holds vocabulary, buyer roles, buying committees, typical objections, business models, sales
// motions, the metrics each sector watches and what a good proof point looks like. It holds NO statistic, market size,
// benchmark figure or named-company fact. Where a tool needs a number, it uses the user's own figure or a labelled example.
//
// How the sector is read (run 20, owner decision D92): the SELLER's own words decide (what it sells, its category, its
// product description); the BUYER's words (target customer, industry, role) are used only when the seller's words name no
// sector. One unmistakable word is enough ("match" below); broad words ("weak" below) only help a sector that already has a
// strong word. A security tool sold to banks is cybersecurity; software sold to telecom operators is not telecom.
//
// Run 20 round 2: the AI native entry is neutral about what the AI does (its roles, measures, objections and proof shape fit
// any function). The support-automation notes live in AI_SUPPORT_PROFILE and are used only when the seller's own text names
// support, tickets, a help desk, a contact centre or a service desk (aiUseCase). A seller that manages money gets
// INVESTMENT_PROFILE through profileFor(vertical, model, ...texts), whatever sector it was read in.
Object.defineProperty(exports, "__esModule", { value: true });
exports.SAAS_ONLY = exports.MODEL_TRADES = exports.SECTOR_MODEL = exports.MODEL_NAME = exports.BUSINESS_MODELS = exports.INVESTMENT_PROFILE = exports.AI_SUPPORT_PROFILE = exports.VERTICALS = void 0;
exports.aiUseCase = aiUseCase;
exports.profileFor = profileFor;
exports.explainSector = explainSector;
exports.detectVertical = detectVertical;
exports.detectModel = detectModel;
exports.VERTICALS = [
    {
        id: 'logistics-tech', name: 'logistics tech',
        match: /\b(logistics?|(?:first|mid|last)[- ]mile|[34]pls?|fleets?|dispatch\w*|routing|route (?:planning|optimi[sz]ation|optimi[sz]er)|freight|shipping|shipments?|couriers?|(?<!software )supply chain|(?<!data )(?<!cloud )warehous\w*\b(?!-native)|fulfil\w*|transportation|trucking|truckers?|trucks?|truckload|haulage|tms|wms|telematics|cold chain|proof of delivery|delivery (?:management|tracking|orchestration|software|app)|load boards?|freight forwarders?)\b/i,
        weak: /\b(routes?|deliver(?:y|ies)|carriers?|transport|drivers?|vehicles?)\b/i,
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
        match: /\b(fintech|spend management|expense (?:modules?|management|claims?|reports?|polic(?:y|ies)|approvals?|tools?)|month-end|close the books|reimburse\w*|payments?|payouts?|corporate cards?|prepaid cards?|card issuing|lending|lenders?|loans?|banking|banks?|neobanks?|treasury|reconcil\w*|payroll|invoic\w*|accounts (?:payable|receivable)|wealth|asset (?:managers?|management|allocators?)|assets under management|portfolio (?:analytics|management|risk|monitoring|construction)|investment (?:management|banking|research|advisory|managers?|strateg\w*)|mutual funds?|hedge funds?|family offices?|insur\w*|nbfc|kyc|aml|fraud|upi|remittances?|bnpl|buy now pay later|stock (?:broking|brokerage|trading)|trading platform)\b/i,
        weak: /\b(credit|funds?|erp|expenses?|invest\w*|portfolios?|financ\w*|ledgers?|audit\w*|tax(?:es)?)\b/i,
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
        match: /\b(fmcg|cpg|consumer goods|consumer brands?|retail execution|field sales|field reps?|general trade|sales force automation|sfa|dms|distribution management|distributor management|beat plans?|beat planning|secondary sales|route-to-market|kirana|order capture|trade promotions?|trade schemes?|vertical saas)\b/i,
        weak: /\b(distributors?|outlets?|retailers?)\b/i,
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
        match: /\b(ai agents?|agents? that|agentic|autonomous agents?|voice agents?|ai assistants?|ai copilots?|copilots?|llms?|genai|gen ai|generative ai|ai[- ]native|ai[- ]first|foundation models?|large language models?|conversational ai|ai platform|ai models?|adaptive ai|ai sdr|ai workforce|ai (?:company|startup)|ai(?![- ]?(?:powered|led|driven|based|enabled|enhanced|assisted)))\b/i,
        weak: /\b(ai[- ]powered|ai[- ]led|ai[- ]driven|machine learning|forecasts?|predictions?|voice|automation|chatbots?)\b/i,
        vocabulary: ['case review', 'accuracy on your own data', 'human in the loop', 'guardrails', 'explainability', 'data privacy', 'pilot', 'cost per case', 'inference cost'],
        buyerRoles: ['Business owner of the process the AI changes', 'Head of Data and AI', 'Chief Technology Officer', 'CISO', 'Head of Risk and Compliance', 'Legal Counsel'],
        committee: 'The owner of the process the AI changes signs; the business lead who feels the problem champions it and the data or AI lead evaluates the model on the buyer\'s own data; security, risk and compliance review where data goes and how decisions are explained; the team that works with the AI output uses it.',
        objections: [
            { objection: 'AI gets answers wrong', response: 'Agree a pilot on the buyer\'s own data before go-live, score it against the way the work is judged today, and keep a person approving any action that moves money or changes a record.' },
            { objection: 'Where does our data go?', response: 'State exactly where data is processed and stored, what is used for training (if anything), who can see it and how it can be deleted.' },
            { objection: 'It will not fit our existing systems', response: 'Name the systems it must read from and write to, the few data fields needed, and who on the buyer side owns each connection.' },
            { objection: 'We cannot explain its decisions', response: 'Show, for each result, the inputs it used and the reason in words a reviewer or auditor can read, and agree what is logged.' },
            { objection: 'Is the vendor stable enough?', response: 'Say plainly who runs the product, how the buyer can export its data and settings, and what happens to a running pilot if the model or its provider changes.' },
        ],
        salesMotion: 'A pilot on the buyer\'s own data with the success measures agreed first, then a production rollout with a person reviewing the cases the AI is unsure about.',
        metrics: ['cost per case or per decision', 'accuracy on the buyer\'s own data', 'how often a person has to step in', 'time to a working pilot', 'turnaround time per case'],
        proofShape: 'A pilot on the buyer\'s own data, scored against the way the work is judged today, with how often a person had to step in.',
        discovery: [
            'Which cases or decisions would you trust the AI to handle first, and which never?',
            'How do you judge that a result is right today: who reviews it, and against what?',
            'Where does the data the AI needs live, and what may leave your environment?',
            'What must a person approve, or be able to explain, before the AI acts?',
            'What does a case or a decision cost you today, and how long does it take?',
        ],
    },
    {
        id: 'ites', name: 'ITeS',
        match: /\b(it services|it outsourcing|managed (?:it |network |cloud )?services?|managed service desk|service desk|help ?desk|bpo|bpm|bpaas|kpo|business process (?:management|outsourcing|services)|outsourc\w*|itsm|systems? integrators?|systems? integration|digital engineering|application (?:development|maintenance|management|support)|infrastructure (?:management|support)|contact cent(?:re|er)s?|call cent(?:re|er)s?|back[- ]office|ites|it-enabled|staff augmentation|it staffing|statements? of work|per fte|global capability cent(?:re|er)s?|shared services|digital operations|business services|customer experience (?:management|services|outsourcing))\b/i,
        weak: /\b(consulting|consultancy|transition|moderni[sz]ation|offshore|nearshore|per employee|per ticket|slas?|staffing|operations)\b/i,
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
        match: /\b(telecom\w*|telcos?|sd-?wan|mpls|leased lines?|connectivity|network services?|managed network|bandwidth|5g|isps?|internet access|business internet|broadband|cpaas|colocation|sip trunk\w*|voip|ucaas|ccaas|unified communications|mvno|mobile network|wi-?fi|wan (?:optimi[sz]ation|services?)|sms (?:gateway|api)|bulk sms|a2p)\b/i,
        weak: /\b(operators?|voice|iot|branches|sites?|carriers?|roaming|sim|mobile|links?|data cent(?:re|er)s?)\b/i,
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
        match: /\b(cyber\w*|infosec|cisos?|soc(?! ?2)|siem|soar|edr|xdr|mdr|cnapp|cspm|cwpp|ciem|sase|zero trust|iam|identity and access management|managed detection|vulnerab\w*|penetration test\w*|pentest\w*|phishing|ransomware|malware|misconfig\w*|attack surface|threat (?:detection|intelligence|hunting)|dark web|dlp|firewalls?|(?:cloud|network|endpoint|application|email|identity|data|api|information|supply chain) security|security (?:operations|posture)|(?<!social )(?<!job )(?<!food )(?<!energy )security)\b/i,
        weak: /\b(posture|exposures?|breach\w*|threats?|encryption|compliance)\b/i,
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
        match: /\b(developers?|api (?:testing|tests?|platform|management|gateway|monitoring|design|development)|devops|devsecops|dev tools|ci\/cd|ci pipelines?|observability|databases?|open[- ]source|engineering teams?|qa|test(?:ing|s)? (?:platform|automation|tools?)|test automation|software testing|unit tests?|source code|version control|git|kubernetes|microservices|sdlc|feature flags?|low-code|infrastructure as code|apm|backend)\b/i,
        weak: /\b(apis?|sdks?|code|release|releases|deploy\w*|testing|tests?|debug\w*|logging)\b/i,
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
        match: /\b(saas|software as a service|subscriptions?|b2b software|crm|billing|dunning|prorat\w*|revenue recognition|product analytics|product-led|plg|customer success|revenue operations|revops|sales enablement|marketing automation|churn|net revenue retention)\b/i,
        weak: /\b(software|platform)\b/i,
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
// The order in which the sectors are tried: the specific ones first, SaaS last (most text mentions software). It breaks a
// tie only after the score and the position of the first strong word.
const ORDER = ['vertical-saas', 'logistics-tech', 'telecom', 'cybersecurity', 'ites', 'ai-native', 'fintech', 'software', 'saas'];
// Words that start the buyer part inside one text ("... platform for banks", "... sold to telecom operators", "customers are banks").
// Everything before the first of them is the seller's part; the rest is the buyer's part.
const BUYER_MARK = /\b(?:for|serving|serves|sold to|sells? to|selling to|used by|aimed at|targeting|targeted at|built for|designed for|(?:whose|its|our|their)\s+(?:customers?|clients?|users?)\s+(?:are|include|such as)|(?:customers?|clients?)\s+(?:are|include|such as)|popular with|adopted by|deployed (?:at|by))\b/i;
function isReaderInput(x) {
    return !!x && typeof x === 'object' && !Array.isArray(x) && ['seller', 'buyer', 'context', 'role'].some((k) => k in x);
}
function texts(list) {
    return (Array.isArray(list) ? list : []).filter((x) => typeof x === 'string' && x.trim().length > 0);
}
/** Splits what was given into the seller's words, the buyer's words and the context. Each seller text is cut at its first buyer marker. */
function sides(args) {
    const input = args.length === 1 && isReaderInput(args[0]) ? args[0] : { seller: args };
    const seller = [];
    const buyer = texts(input.buyer);
    for (const t of texts(input.seller)) {
        const m = BUYER_MARK.exec(t);
        if (m && /[a-z]{2}/i.test(t.slice(0, m.index))) {
            seller.push(t.slice(0, m.index));
            buyer.push(t.slice(m.index));
        }
        else
            seller.push(t);
    }
    return { seller: seller.join(' \n '), buyer: buyer.join(' \n '), context: texts(input.context).join(' \n '), role: texts(input.role).join(' \n ') };
}
/** The distinct words a pattern finds. Matches may overlap ("AI agents that" gives "ai agents" and "agents that"). */
function scan(re, text) {
    const g = new RegExp(re.source, 'gi');
    const found = new Map();
    let m;
    while ((m = g.exec(text))) {
        const w = m[0].toLowerCase().replace(/\s+/g, ' ');
        if (!found.has(w))
            found.set(w, m.index);
        g.lastIndex = m.index + 1;
    }
    return [...found.keys()];
}
function candidates(text, minWords) {
    const out = [];
    for (const id of ORDER) {
        const v = exports.VERTICALS.find((x) => x.id === id);
        const strong = scan(v.match, text);
        if (!strong.length)
            continue; // broad words alone never name a sector
        const weak = scan(v.weak, text).filter((w) => !strong.some((s) => s.split(' ').includes(w)));
        if (strong.length + weak.length < minWords)
            continue; // free text: a strong word needs a second sector word beside it
        // AI native is a way of building, not a trade: its own words (AI agents, LLM, generative AI) outweigh the trade words beside them.
        const score = strong.length + Math.min(weak.length, 3) * 0.25 + (id === 'ai-native' && strong.some((w) => w !== 'ai') ? 1 : 0);
        const first = Math.min(...strong.map((w) => text.toLowerCase().indexOf(w)).filter((i) => i >= 0), text.length);
        out.push({ v, strong, weak, score, first });
    }
    return out;
}
/** The sector one text names, or null. A named trade beats the general SaaS words; then the higher score, the earlier first
 * strong word, and the order above decide. */
function pick(text, minWords = 1) {
    if (!text.trim())
        return null;
    const c = candidates(text, minWords);
    // A named trade beats the general SaaS words, and a bare "AI" (a CRM "with AI features") ranks with them: it only names AI native when nothing else is named.
    const bareAi = (x) => x.v.id === 'ai-native' && x.strong.every((w) => w === 'ai');
    const trades = c.filter((x) => x.v.id !== 'saas' && !bareAi(x));
    const generic = c.filter((x) => x.v.id === 'saas');
    const pool = trades.length ? trades : generic.length ? generic : c;
    if (!pool.length)
        return null;
    const best = pool.slice().sort((a, b) => b.score - a.score || a.first - b.first || ORDER.indexOf(a.v.id) - ORDER.indexOf(b.v.id))[0];
    return adjust(text, best, c);
}
// Run 20 round 2. Two readings that word counts get wrong.
// (a) A network and security provider (connectivity, managed network, cloud and security services sold together) is telecom. It is
//     cybersecurity only when the seller calls itself a security platform or vendor, or names a specialist security product (SIEM,
//     vulnerability scanning...). "network" does not count when it is part of "network security" or "network detection".
const CONNECTIVITY_WORDS = /\b(?:connectivity|mpls|sd-?wan|leased lines?|bandwidth|carriers?|telecom\w*|networks?(?!\s+(?:security|detection|traffic|monitoring|access|firewalls?|forensics|intrusion)))\b/i;
const SECURITY_SELF = /\b(?:cyber|information )?security (?:platform|software|vendor|company|product|tool|startup|firm)s?\b|\bcyber\w* (?:platform|software|vendor|company|product|tool|startup|firm)s?\b|\bsecurity operations (?:platform|centre|center)\b/i;
const SECURITY_GENERIC = /^(?:security|firewalls?|zero trust|sase|cyber\w*|(?:cloud|network|endpoint|application|email|identity|data|api|information|supply chain) security)$/;
// (b) "AI-native" is a way of building, not a trade. A service delivered by people who use AI (business services, BPO, managed
//     services, customer experience services, outsourcing) is ITeS. AI agents, an AI platform or an AI product stay AI native, and
//     so does anything the seller calls software, a platform, an app, a tool or automation.
const SERVICES_WORDS = /\b(?:business (?:process )?(?:services|management|outsourcing)|bpo|bpm|bpaas|kpo|managed (?:it |network |cloud )?services?|customer experience (?:management |services|outsourcing)|outsourc\w*|contact cent(?:re|er)s?|call cent(?:re|er)s?|back[- ]office|digital operations|shared services)\b/i;
const PRODUCT_WORDS = /\b(?:software|saas|platforms?|apps?|apis?|tools?|subscriptions?|copilots?|assistants?|automat\w*|engines?)\b/i;
const PEOPLE_WORDS = /\b(?:people|humans?|staff|fte|analysts|specialists|experts|teams?)\b/i;
const AI_LABELS = /^(?:ai|ai[- ]native|ai[- ]first|ai (?:company|startup)|ai workforce)$/;
function adjust(text, best, all) {
    if (best.v.id === 'cybersecurity') {
        const tel = all.find((x) => x.v.id === 'telecom');
        const connectivity = scan(CONNECTIVITY_WORDS, text);
        const specialist = best.strong.filter((w) => !SECURITY_GENERIC.test(w));
        if (connectivity.length && !SECURITY_SELF.test(text) && !specialist.length) {
            const v = exports.VERTICALS.find((x) => x.id === 'telecom');
            return tel ? { ...tel, strong: [...new Set([...tel.strong, ...connectivity])] } : { v, strong: connectivity, weak: [], score: connectivity.length, first: best.first };
        }
    }
    if (best.v.id === 'ai-native') {
        const ites = all.find((x) => x.v.id === 'ites');
        if (ites && SERVICES_WORDS.test(text) && !PRODUCT_WORDS.test(text) && (best.strong.every((w) => AI_LABELS.test(w)) || PEOPLE_WORDS.test(text)))
            return ites;
    }
    return best;
}
/** AI native, support automation: used only when the seller's own text names support, tickets, a help desk, a contact centre or a service desk. */
exports.AI_SUPPORT_PROFILE = {
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
};
/** The notes for a seller that manages money (investment strategies, funds, portfolios) for allocators, whatever sector it was read in:
 * they replace the sector's notes, so an AI native investment manager never gets support-automation or corporate-finance notes. */
exports.INVESTMENT_PROFILE = {
    buyerRoles: ['Chief Investment Officer', 'Head of Manager Research', 'Portfolio Manager', 'Investment Consultant', 'Head of Risk', 'Compliance Officer', 'Investment Committee Chair'],
    committee: 'The CIO or the investment committee decides; the head of manager research or the portfolio manager sponsors the strategy, often with an investment consultant advising; risk and compliance review limits, explainability and reporting; legal and operations handle the mandate, custody and reporting set-up.',
    objections: [
        { objection: 'A black box cannot be explained to our committee', response: 'Show how each position or signal is explained in words the committee can use, and agree the reporting before the mandate starts.' },
        { objection: 'The track record is too short', response: 'State the period, the method and the benchmark of every result you show, label back-tested results as back-tested, and offer a small phased first allocation instead of arguing the record.' },
        { objection: 'It does not fit our investment process', response: 'Map where the strategy sits in the buyer\'s process (idea, sizing, risk limits, review) and what stays under the buyer\'s control.' },
        { objection: 'Fees and minimums', response: 'Set out the full fee schedule, including any performance fee and minimum, next to what the buyer pays today, on the same basis.' },
    ],
    metrics: ['return and risk against the benchmark the buyer uses', 'drawdown in a bad month', 'tracking error', 'turnover and costs', 'explainability of positions and signals', 'reporting timeliness'],
    proofShape: 'Results shown with their period, method and benchmark (back-tested results labelled as back-tested), plus how a bad month was explained to a committee.',
    discovery: [
        'How does an idea reach a decision in your investment process today, and who signs it off?',
        'What must you be able to explain to your committee, and in what form?',
        'Which risk limits and constraints must any strategy respect?',
        'What reporting do you expect each month, and after a bad month?',
        'What would a first allocation look like, and how would you judge it?',
    ],
    salesMotion: 'A long, committee-led process: manager research, due diligence and a small first allocation before a larger mandate.',
    vocabulary: ['mandate', 'allocation', 'benchmark', 'tracking error', 'drawdown', 'investment committee', 'due diligence', 'explainability', 'reporting'],
};
const AI_NATIVE = exports.VERTICALS.find((v) => v.id === 'ai-native');
const AI_SUPPORT = { ...AI_NATIVE, ...exports.AI_SUPPORT_PROFILE };
// The seller's own words, whole (not cut at "for ..."): "Voice AI for contact centres" names the contact centre.
function sellerWhole(args) {
    const input = args.length === 1 && isReaderInput(args[0]) ? args[0] : { seller: args };
    return texts(input.seller).join(' \n ');
}
const SUPPORT_WORDS = /\b(?:(?:customer|technical|tech|it|client|user|product|employee|helpdesk) support|support (?:tickets?|teams?|agents?|queues?|requests?|inbox(?:es)?|desks?|automation|conversations?|chat|calls?|operations|centre|center)|tickets?|ticketing|help ?desks?|contact cent(?:re|er)s?|call cent(?:re|er)s?|service desks?|customer service|customer care)\b/i;
/** What an AI native seller's product is for, read from the seller's own words only: 'support' when they name support, tickets, a
 * help desk, a contact centre or a service desk; 'investment' when the seller manages money (the investment business model);
 * else 'other'. Investment comes first. Accepts the same inputs as detectVertical. */
function aiUseCase(...args) {
    if (modelFromSeller(sides(args).seller) === 'investment')
        return 'investment';
    return SUPPORT_WORDS.test(sellerWhole(args)) ? 'support' : 'other';
}
function forUseCase(v, args) { return v === AI_NATIVE && aiUseCase(...args) === 'support' ? AI_SUPPORT : v; }
/** The sector notes that fit the business model: a seller that manages money (model 'investment') gets INVESTMENT_PROFILE in place of
 * the sector's roles, committee, objections, metrics, proof shape, discovery questions and vocabulary (the name says so); an AI native
 * seller of support automation gets the support notes. Every other case returns the vertical unchanged. Safe to call twice. */
function profileFor(v, model, ...args) {
    if (!v)
        return v;
    if (model === 'investment')
        return /, investment management$/.test(v.name) ? v : { ...v, ...exports.INVESTMENT_PROFILE, name: `${v.name}, investment management` };
    return forUseCase(v, args);
}
/** The sector read, with the words that decided it and where they came from ('seller' or 'buyer'). */
function explainSector(...args) {
    const { seller, buyer, context, role } = sides(args);
    const s = pick(seller);
    if (s)
        return { vertical: forUseCase(s.v, args), source: 'seller', strong: s.strong, weak: s.weak };
    const c = pick(context, 2);
    if (c)
        return { vertical: forUseCase(c.v, args), source: 'context', strong: c.strong, weak: c.weak };
    const r = pick(role);
    if (r)
        return { vertical: forUseCase(r.v, args), source: 'role', strong: r.strong, weak: r.weak };
    const b = pick(buyer);
    if (b)
        return { vertical: forUseCase(b.v, args), source: 'buyer', strong: b.strong, weak: b.weak };
    return { vertical: null, source: null, strong: [], weak: [] };
}
/** The sector read from what the user typed, or null when the words do not name one. Give plain texts (each is split at its
 * buyer marker such as "for banks") or { seller, context, role, buyer } (see ReaderInput) to say which words are the seller's,
 * which are free text about the deal, which are job titles and which say who the buyer is. The seller's words come first; the
 * later groups are used only when the earlier ones name no sector. Broad words alone never name a sector. */
function detectVertical(...args) {
    return explainSector(...args).vertical;
}
exports.BUSINESS_MODELS = ['saas', 'services', 'connectivity', 'transactions', 'marketplace', 'hardware_software', 'investment'];
exports.MODEL_NAME = {
    saas: 'software subscription', services: 'services (people-delivered, per FTE, per ticket or fixed price)', connectivity: 'connectivity (per site, per link or bandwidth, on a term contract)',
    transactions: 'per-transaction (payments or volume based)', marketplace: 'marketplace (a take rate on transactions)', hardware_software: 'hardware plus software',
    investment: 'investment management (fees on assets or performance)',
};
// Read from the SELLER's words only. A seller that sells software (software, SaaS, platform, app, analytics, tools) is a
// subscription however its buyers earn money, so the other models ask that these words are absent (`not`).
const DEVICE = '(?:devices?|sensors?|terminals?|scanners?|trackers?|readers?|cameras?)';
const MODEL_MATCH = [
    // the seller manages money: it runs funds or portfolios, or is an asset or wealth manager. Software for asset managers is not this.
    { model: 'investment', re: /\b(?:investment strateg\w*|systematic strateg\w*|hedge funds?|mutual funds?|venture (?:fund|capital)|private equity|family offices?|aum|assets under management|(?:manages?|managing|runs|invests?|investing|allocates?)\b[^.;,]{0,40}\b(?:funds?|portfolios?|client money|capital|wealth|investments?))\b/i, not: /\b(?:software|saas)\b/i },
    { model: 'investment', re: /\b(?:asset|wealth|fund|portfolio|investment) (?:management|managers?|advisory|advisors?)\b/i, not: /\b(?:software|saas|platform|apps?|apis?|analytics|tools?|dashboards?|systems?)\b/i },
    { model: 'connectivity', re: /\b(?:sd-?wan|mpls|leased lines?|connectivity|bandwidth|per site|per link|5g|business internet|internet access|broadband|isps?|voip|sip trunk\w*|managed network|wi-?fi|colocation|mobile network|(?:telecom\w*|network|mobile|wireless|fib(?:re|er)) (?:operator|provider|carrier|services?))\b/i, not: /\b(?:software|saas|subscriptions?|analytics|dashboards?|tools?|(?:cyber)?security (?:platform|software|vendor|company|product|tool)s?)\b/i },
    { model: 'services', re: /\b(?:managed (?:(?:it|network|cloud|security) )?services?|managed (?:detection|security)|mdr|service desk|help ?desk|outsourc\w*|bpo|bpm|kpo|consulting|consultancy|per fte|per ticket|staff augmentation|it staffing|systems? integrators?|it services|statements? of work|contact cent(?:re|er)s?|call cent(?:re|er)s?|application maintenance|business (?:process )?services?|customer experience services?|cx services|dedicated (?:\w+ ){0,2}teams?)\b/i, not: /\b(?:software|saas|subscriptions?|platform|apps?|apis?|analytics|dashboards?|tools?)\b/i },
    { model: 'marketplace', re: /\b(?:marketplace|take rate|gmv|two-sided|takes? an? (?:commission|cut|percentage))\b/i, not: /\b(?:software|saas|analytics|tools?)\b/i },
    // payments sellers are paid per transaction or by volume
    { model: 'transactions', re: /(?:\b(?:per[- ]transaction|transaction fees?|payments? (?:apis?|gateways?|processing|processors?|platforms?|infrastructure|orchestration|rails|acquiring|providers?|companies|stack)|payouts?|checkout|interchange|remittances?|merchant acquiring|card issuing|upi)\b|(?:^|\n)\s*payments?\b)/i, not: /\b(?:software|saas|subscriptions?|analytics|dashboards?|tools?|reconcil\w*|security|fraud|risk|compliance|expense\w*|spend|travel|invoic\w*|billing|payroll)\b/i },
    // hardware only when the seller makes, sells or ships devices, or names devices it sells; "test on real devices" is not that
    { model: 'hardware_software', re: new RegExp(`\\b(?:hardware|(?:sells?|makes?|makers? of|manufactur\\w*|ships?|produces?)\\b[^.;]{0,40}\\b${DEVICE}\\b|${DEVICE}\\b[^.;]{0,20}(?:\\bplus\\b|\\bwith\\b|\\+)[^.;]{0,20}\\b(?:software|apps?|dashboard)\\b|(?:smart|iot|connected|handheld|rugged|gps|pos|wearable|embedded) (?:\\w+ )?${DEVICE})\\b`, 'i') },
    { model: 'saas', re: /\b(?:saas|subscriptions?|software|platform|apps?|per seat|per user|licen[cs]es?|cloud|apis?|sdks?|tools?|analytics)\b/i },
];
// The model most companies in a sector use, assumed only when the text names none (the answer says it was assumed).
exports.SECTOR_MODEL = {
    'logistics-tech': 'saas', fintech: 'saas', saas: 'saas', 'vertical-saas': 'saas', 'ai-native': 'saas', ites: 'services', telecom: 'connectivity', software: 'saas', cybersecurity: 'saas',
};
/** The business model: the explicit input when given, else read from the SELLER's words, else the sector's usual model, else
 * null. Give plain texts or { seller: [...], buyer: [...] } as for detectVertical. */
function modelFromSeller(seller) {
    for (const { model, re, not } of MODEL_MATCH)
        if (re.test(seller) && !(not && not.test(seller)))
            return model;
    return null;
}
function detectModel(explicit, ...args) {
    if (typeof explicit === 'string' && exports.BUSINESS_MODELS.includes(explicit))
        return { model: explicit, how: 'input' };
    const { seller } = sides(args); // the seller's words only: what the buyer's side says about its own money is not the seller's model
    const read = modelFromSeller(seller);
    if (read)
        return { model: read, how: 'read' };
    const v = detectVertical(...args);
    if (v)
        return { model: exports.SECTOR_MODEL[v.id], how: 'sector' };
    return { model: null, how: 'unknown' };
}
/** Commercial trades a seller can ask for in return for a concession, by business model (no figures). */
exports.MODEL_TRADES = {
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
exports.SAAS_ONLY = /\b(MRR|free trial|freemium|self-serve sign-?up|per seat|seats?|aha moment)\b/i;
//# sourceMappingURL=verticals.js.map