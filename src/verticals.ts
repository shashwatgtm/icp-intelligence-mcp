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

// Run 21b: the entries below are neutral (true for every company in the vertical); the notes of a particular kind of company are in
// SUBTYPES, and the product category (the first category noun in the seller's words) is read before any buzzword.

export type VerticalId =
  | 'logistics-tech' | 'fintech' | 'saas' | 'vertical-saas' | 'ai-native' | 'ites' | 'telecom' | 'software' | 'cybersecurity';

export interface Objection { objection: string; response: string; }

export interface Vertical {
  id: VerticalId;
  name: string;
  match: RegExp;              // strong words: one of them is enough to identify the sector in what the user typed
  weak: RegExp;               // broad words that appear in many sectors: they never decide a sector alone, only add weight to a sector that has a strong word
  vocabulary: string[];       // the words this sector's buyers use
  buyerRoles: string[];       // who buys and uses
  committee: string;          // the usual buying committee, in one sentence
  objections: Objection[];    // objections this sector raises, with the pattern of a good answer
  salesMotion: string;        // how deals usually run
  metrics: string[];          // what the sector watches (names only, no figures)
  proofShape: string;         // what a good proof point looks like
  discovery: string[];        // discovery questions in the sector's own language
  subtype?: string;           // set on a copy of the entry when the seller clearly is one sub-type (see SUBTYPES)
}

/** A kind of company inside a vertical (run 21b). `match` holds category nouns (what the product IS), never buzzwords such as AI, API, platform,
 * security or fraud. The notes replace the vertical's neutral base notes only when the seller's own words clearly name this one sub-type. */
export interface SubType { id: string; vertical: VerticalId; name: string; match: RegExp; model?: BusinessModel; notes: SectorNotes; }

export const VERTICALS: Vertical[] = [
  {
    id: 'logistics-tech', name: 'logistics tech',
    match: /\b(logistics?|(?:first|mid|last)[- ]mile|[34]pls?|fleets?|dispatch\w*|route (?:planning|optimi[sz]ation|optimi[sz]er)|freight|shipping|shipments?|couriers?|(?<!software )supply chain|(?<!data )(?<!cloud )warehous\w*\b(?!-native)|fulfil\w*|transportation|trucking|truckers?|trucks?|truckload|haulage|tms|wms|telematics|cold chain|proof of delivery|delivery (?:management|tracking|orchestration|software|app)|load boards?|freight forwarders?|shipping (?:labels?|rates?)|reverse logistics|returns? (?:management|logistics)|parcels?|delivery (?:promises?|dates?|slots?)|carrier (?:rates?|selection|comparison))\b/i,
    weak: /\b(routes?|deliver(?:y|ies)|carriers?|transport|drivers?|vehicles?)\b/i,
    vocabulary: ['shipment', 'carrier', 'consignment', 'lead time', 'exception', 'service level', 'proof of delivery', 'third party logistics provider', 'transport management system', 'warehouse management system'],
    buyerRoles: ['Chief Operating Officer', 'Head of Supply Chain', 'Head of Logistics', 'Transport or Operations Manager', 'Head of IT', 'Chief Financial Officer'],
    committee: 'The COO or Head of Supply Chain signs; the Head of Logistics or the operations lead champions; planners and operations staff use it daily; IT checks the fit with the order, transport and warehouse systems; finance checks the cost case.',
    objections: [
      { objection: 'We already have a system for this', response: 'Ask which daily decisions or exceptions the current system does not handle today and position the product as working with it where it can, not replacing it.' },
      { objection: 'Integration effort', response: 'Name the systems involved (transport, warehouse, ERP, order management) and the few data fields needed, and agree who on the buyer side owns each.' },
      { objection: 'Our operations team will not change how they work', response: 'Offer a pilot at one site, lane or region and agree how adoption is measured before the pilot starts.' },
      { objection: 'The cost is hard to justify on our margins', response: 'Tie the price to cost per shipment, delays or exceptions measured in the buyer\'s own data, not to a general claim.' },
    ],
    salesMotion: 'Enterprise sales with a pilot at one site, lane or region, often timed around peak season planning.',
    metrics: ['on time delivery', 'cost per shipment or per order', 'order cycle time', 'exception rate', 'delay and damage claims', 'service level attainment', 'manual planning time'],
    proofShape: 'A before and after of on time delivery or cost per shipment on one lane, site or region, measured over a full cycle of busy and quiet weeks.',
    discovery: [
      'Which systems hold your orders, shipments and stock today, and who owns the data in them?',
      'What happens when an order, a carrier or a route changes after the goods have left?',
      'How do you measure on time delivery and cost per shipment today, and who owns those numbers?',
      'Where do delays, damage or disputes come from today?',
      'Who must approve a new logistics tool: operations, IT, finance, or the customers you serve?',
    ],
  },
  {
    id: 'fintech', name: 'fintech',
    match: /\b(fintech|spend management|expense (?:modules?|management|claims?|reports?|polic(?:y|ies)|approvals?|tools?)|month-end|close the books|reimburse\w*|payments?|payouts?|corporate cards?|prepaid cards?|card issuing|lending|lenders?|loans?|banking|banks?|neobanks?|treasury|reconcil\w*|payroll|invoic\w*|accounts (?:payable|receivable)|wealth|(?<!\bit )(?<!digital )(?<!software )(?<!infrastructure )(?<!network )(?<!cloud )(?<!media )(?<!brand )(?<!enterprise )asset (?:managers?|management|allocators?)|assets under management|portfolio (?:analytics|management|risk|monitoring|construction)|investment (?:management|banking|research|advisory|managers?|strateg\w*)|mutual funds?|hedge funds?|family offices?|insur\w*|nbfc|kyc|aml|fraud|upi|remittances?|bnpl|buy now pay later|stock (?:broking|brokerage|trading)|trading platform|crypto\w*|stablecoins?)\b/i,
    weak: /\b(credit|funds?|erp|expenses?|invest\w*|portfolios?|financ\w*|ledgers?|audit\w*|tax(?:es)?)\b/i,
    vocabulary: ['regulatory review', 'audit trail', 'uptime', 'integration', 'access controls', 'data residency', 'compliance review', 'sign off', 'service level', 'customer onboarding'],
    buyerRoles: ['Chief Executive Officer', 'Head of Product', 'Chief Technology Officer', 'Chief Risk Officer', 'Head of Compliance', 'Chief Information Security Officer', 'Head of IT'],
    committee: 'The business owner (a chief executive, a product head or a finance head) signs; the product or operations lead champions; engineering checks the integration with the buyer\'s systems; risk, compliance and security review the controls, data handling and audit trail; procurement and finance check the commercial terms.',
    objections: [
      { objection: 'We already have a provider for this', response: 'Compare on the journeys that fail or cost the most today, using a sample of the buyer\'s own data, and offer to run alongside the current provider on one flow.' },
      { objection: 'Security and compliance review', response: 'Prepare the answers before they are asked: data residency, access controls, audit logs, and the licences and certifications you actually hold.' },
      { objection: 'Reliability and uptime', response: 'Show the uptime record, how incidents are reported and what happens to work in flight during an outage, and agree service levels in writing.' },
      { objection: 'Regulatory caution', response: 'Map each requirement the buyer names to the control or report that meets it; never claim a compliance status you cannot show.' },
    ],
    salesMotion: 'Business led with a security and compliance review inside the cycle; proof through a pilot in a limited scope before wider rollout.',
    metrics: ['time to go live', 'uptime', 'processing time', 'audit findings', 'cost per transaction or per customer served', 'incident count', 'customer onboarding time'],
    proofShape: 'A before and after on one flow, product line or entity, from the buyer\'s own data, with the period named and the owner who signed it off.',
    discovery: [
      'Which part of the journey would this change first, and who owns it today?',
      'Which systems must it connect to, and who owns each integration?',
      'Which reviews (security, compliance, risk, internal audit) must a new provider pass, and how long do they take?',
      'What did the last audit or regulator review say about this area?',
      'How would you judge a pilot a success, and who signs it off?',
    ],
  },
  {
    id: 'vertical-saas', name: 'vertical SaaS',
    match: /\b(fmcg|cpg|consumer goods|consumer brands?|retail execution|field sales|field reps?|general trade|sales force automation|sfa|dms|distribution management|distributor management|beat plans?|beat planning|secondary sales|route-to-market|route to market|kirana|order capture|trade promotions?|trade schemes?|vertical saas|hotel (?:management|software|pms)|hospitality (?:management|software)|property management system|pms|(?:restaurant|retail|supermarket|hotel|hospitality|distribution) (?:erp|pos)|(?:pos|point of sale) (?:software|system)|school management)\b/i,
    weak: /\b(distributors?|outlets?|retailers?)\b/i,
    vocabulary: ['workflow', 'field and office', 'mobile app', 'adoption', 'data migration', 'integration', 'onboarding', 'reporting', 'compliance', 'rollout'],
    buyerRoles: ['Owner or Managing Director', 'Head of Operations', 'Head of Finance', 'Department head who uses it daily', 'Head of IT', 'Implementation Lead'],
    committee: 'The owner, managing director or head of operations signs; the department head who feels the daily problem champions it; the people who work in it every day decide whether it sticks; finance checks cost and payback; IT checks the fit with the systems already in place.',
    objections: [
      { objection: 'We run on spreadsheets and it works', response: 'Map one real week of work in their spreadsheets, show where time and errors go, and let them judge the product against their own process.' },
      { objection: 'Our people will not change how they work', response: 'Offer a rollout with one team first, training in their own words, and an adoption measure agreed before the start.' },
      { objection: 'It will not fit how our industry works', response: 'Walk through the few workflows that are particular to the trade, using their own documents and forms, and say what is configured and what is built.' },
      { objection: 'Moving our data and connecting our other systems is too much effort', response: 'Name the systems and records to bring over, who owns each, and the order of the move, with a dated plan.' },
    ],
    salesMotion: 'Sales led by the function or the owner, with a demo on the buyer\'s own workflow, a pilot with one team or site, then a staged rollout with onboarding and data migration built into the plan.',
    metrics: ['adoption by role', 'time to onboard a new team', 'hours of admin work saved', 'errors and rework', 'data accuracy', 'time to first value', 'customer retention', 'usage depth by module'],
    proofShape: 'One team or site before and after on the work the software changes, measured by the buyer\'s own staff over a full working cycle.',
    discovery: [
      'Walk me through how a typical piece of work goes from start to finish today, and which tools touch it.',
      'Which part of that work takes the most manual effort or goes wrong most often?',
      'Who uses the software every day, and how do they feel about their current tools?',
      'Which systems (accounting, ERP, other tools) must it connect to, and who owns that integration?',
      'What would make a pilot with one team a clear success?',
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
    match: /\b(it services|it outsourcing|(?<!fully )(?<!fully-)(?<!self )managed (?:it |network |cloud )?services?|managed service desk|technology services|engineering services|digital transformation (?:services|partners?|compan(?:y|ies)|firms?)|consultanc(?:y|ies)|consulting (?:firms?|compan(?:y|ies)|services|partners?)|software development (?:compan(?:y|ies)|firms?|services|houses?|partners?)|offshore development (?:centres?|centers?)|delivery (?:centres?|centers?)|human annotators?|data annotators?|data labell?ers?|(?:custom|bespoke) software development|financial services operations|finance and accounting (?:services|outsourcing|operations)|data operations (?:services|teams?)|analytics operations|(?:we|our (?:own )?(?:teams?|analysts|agents|experts)) (?:run|operate|handle|manage|deliver)s?\b[^.;:]{0,60}\boperations?|(?:technology|engineering|consulting|data|analytics|operations|business|knowledge|professional|digital|it|managed) services? (?:compan(?:y|ies)|firms?|providers?)|designs?,? builds?,? and runs?|service desk|help ?desk|bpo|bpm|bpaas|kpo|business process (?:management|outsourcing|services)|outsourc\w*|itsm|systems? integrators?|systems? integration|digital engineering|application (?:development|maintenance|management|support)|infrastructure (?:management|support)|(?<!cloud )contact cent(?:re|er)s?|(?<!cloud )call cent(?:re|er)s?|back[- ]office|ites|it-enabled|staff augmentation|it staffing|statements? of work|per fte|global capability cent(?:re|er)s?|shared services|digital operations|business services|customer experience (?:management|services|outsourcing))\b/i,
    weak: /\b(consulting|consultancy|transition|moderni[sz]ation|offshore|nearshore|per employee|per ticket|slas?|staffing|operations)\b/i,
    vocabulary: ['service levels', 'statement of work', 'transition', 'steady state', 'governance', 'knowledge transfer', 'delivery team', 'change request', 'service credits', 'managed service'],
    buyerRoles: ['Chief Information Officer', 'Chief Operating Officer', 'Head of Procurement', 'Vendor Management Lead', 'Chief Financial Officer', 'Business Unit Head'],
    committee: 'The CIO, COO or business unit head signs; the owner of the service being outsourced champions it; procurement and vendor management run the commercial process; finance checks rates and total cost; security and legal check access, data and contract terms.',
    objections: [
      { objection: 'Transition risk from the current provider or the in house team', response: 'Show a staged transition plan with knowledge transfer, a parallel run and exit criteria for each stage.' },
      { objection: 'A cheaper alternative exists', response: 'Compare the total cost of the outcome (service level attainment, rework, management time), not the unit rate.' },
      { objection: 'Attrition and dependence on key people', response: 'Name the team model, the backup for key roles and how knowledge is documented.' },
      { objection: 'Lock in', response: 'Offer clear exit terms and documentation the client owns.' },
    ],
    salesMotion: 'RFP led or relationship led; proposals carry a transition plan, a governance model and references from similar clients, often after a small pilot or a paid discovery stage.',
    metrics: ['service level attainment', 'quality of delivery', 'milestones met on time', 'cost per unit of work', 'rework', 'team stability', 'client satisfaction', 'transition milestones met'],
    proofShape: 'Service level and cost outcomes at a similar client, with the transition timeline that was actually met.',
    discovery: [
      'Which services are in scope, and what do the current service levels say?',
      'What went wrong with the current provider or setup, in the client\'s own words?',
      'How will the transition be governed, and who signs off each stage?',
      'How is the service priced today (per person, per unit of work, fixed price or outcome based)?',
      'Which reports does the client\'s leadership read every month?',
    ],
  },
  {
    id: 'telecom', name: 'telecom',
    match: /\b(telecom\w*|telcos?|sd-?wan|mpls|leased lines?|connectivity|network services?|managed network|bandwidth|5g|isps?|internet access|business internet|broadband|cpaas|colocation|sip trunk\w*|voip|ucaas|ccaas|unified communications|mvno|mobile network|wi-?fi|wan (?:optimi[sz]ation|services?)|sms (?:gateway|api)|bulk sms|a2p|satellite (?:internet|connectivity|broadband|communications?)|communications? platforms?|cloud communications|programmable (?:voice|sms|messaging|video)|(?:voice|video) apis?|(?:internet service|internet) providers?|fib(?:re|er)(?: optic)? (?:network|internet|broadband)|vsat|telecom towers?)\b/i,
    weak: /\b(operators?|voice|iot|branches|sites?|carriers?|roaming|sim|mobile|links?|data cent(?:re|er)s?)\b/i,
    vocabulary: ['uptime', 'SLA', 'latency', 'service credits', 'coverage', 'interconnect', 'network operations centre', 'regulatory approval', 'capacity'],
    buyerRoles: ['Chief Technology Officer', 'Chief Information Officer', 'Head of IT Infrastructure', 'Network Manager', 'Head of Procurement', 'Chief Financial Officer'],
    committee: 'The CIO, CTO or the head of the business function that uses the service signs; the network, infrastructure or product lead champions; engineers integrate it; the security and compliance teams review it; procurement compares rate cards; finance checks the cost per unit of service.',
    objections: [
      { objection: 'Price compared with the supplier we use today', response: 'Compare the total cost of the outcome the buyer cares about (cost per unit of service, outages, repair time, the buyer\'s own staff time), not only the rate card.' },
      { objection: 'Reliability and the risk of an outage during the switch', response: 'Propose a wave plan with a fallback path and a rollback rule for each wave, and show the service record you can actually evidence.' },
      { objection: 'Integration with the systems we already run', response: 'Name the systems and the interfaces involved, test them in a pilot, and agree who on the buyer side owns each one.' },
      { objection: 'Regulatory and data protection review', response: 'Prepare the answers before they are asked: licences and approvals you hold, where data is processed and stored, retention, and who can see it.' },
    ],
    salesMotion: 'Account based enterprise sales, often an RFP or a rate card comparison, with a pilot on a few sites, routes or flows before the rollout.',
    metrics: ['uptime', 'mean time to repair', 'latency', 'incidents per month', 'service credits paid', 'cost per unit of service', 'time to go live'],
    proofShape: 'Service quality (uptime, speed, repair time) in a pilot, compared with the incumbent\'s record for the same sites or traffic over the same period.',
    discovery: [
      'Which services do you buy today, from whom, and when does each contract end?',
      'What do outages or poor quality cost you in a day, and who feels it first?',
      'Which systems must the service connect to, and who owns each connection?',
      'Which reviews (security, regulatory, procurement) must a new supplier pass, and how long do they take?',
      'How would you judge a pilot a success, and who decides?',
    ],
  },
  {
    id: 'cybersecurity', name: 'cybersecurity',
    match: /\b(cyber\w*|infosec|cisos?|soc(?! ?2)|siem|soar|edr|xdr|mdr|cnapp|cspm|cwpp|ciem|sase|zero trust|iam|identity and access management|managed detection|vulnerab\w*|penetration test\w*|pentest\w*|phishing|ransomware|malware|misconfig\w*|attack surface|threat (?:detection|intelligence|hunting)|dark web|dlp|firewalls?|(?:cloud|network|endpoint|application|email|identity|data|api|information|supply chain) security|security (?:operations|posture)|password managers?|secrets (?:management|vaults?)|bug bounty|grc|deepfakes?|impersonation|account takeover|bot (?:detection|protection|mitigation)|(?<!social )(?<!job )(?<!food )(?<!energy )security)\b/i,
    weak: /\b(posture|exposures?|breach\w*|threats?|encryption|compliance)\b/i,
    vocabulary: ['attack surface', 'exposure', 'alert fatigue', 'mean time to detect', 'mean time to respond', 'least privilege', 'compliance audit', 'risk register', 'threat intelligence'],
    buyerRoles: ['CISO', 'Head of Security Operations', 'Security Architect', 'Chief Information Officer', 'Head of IT', 'Head of Risk and Compliance'],
    committee: 'The CISO signs; the security lead who owns the affected area champions; security engineers or analysts use it; IT operations deploy it; risk, compliance and audit review the evidence it produces; the CIO or CTO checks integration.',
    objections: [
      { objection: 'We already have a tool for this', response: 'Map the overlap honestly and show what the current tool misses, on the buyer\'s own environment.' },
      { objection: 'We have too many alerts already', response: 'Show how findings are ranked by real exposure so the team works on fewer, more important items.' },
      { objection: 'Integration with our existing security and IT tools', response: 'Name the integrations available today and test them in the proof of value.' },
      { objection: 'We need proof before budget', response: 'Offer a fixed length proof of value with success criteria agreed in writing first.' },
    ],
    salesMotion: 'CISO led, with a proof of value on the buyer\'s own environment; budget often follows an audit finding or an incident.',
    metrics: ['mean time to detect', 'mean time to respond', 'critical exposures open', 'alerts per analyst', 'audit findings', 'time to prepare an audit', 'coverage of assets or users'],
    proofShape: 'Real findings from the proof of value on the buyer\'s own environment, and the time it took to act on them.',
    discovery: [
      'What is in scope, and which part are you least sure about?',
      'What did the last audit or incident show?',
      'Which tools must this work with (SIEM, ticketing, directory, IT service desk)?',
      'How many alerts or findings does the team handle in a week, and how are they ranked today?',
      'How would you judge a proof of value a success, and who signs it off?',
    ],
  },
  {
    id: 'software', name: 'software',
    match: /\b(developers?|api (?:testing|tests?|platform|management|gateway|monitoring|design|development)|devops|devsecops|dev tools|ci\/cd|ci pipelines?|software (?:development|delivery) lifecycle|sdlc|merge requests?|observability|databases?|open[- ]source|engineering teams?|qa|test(?:ing|s)? (?:platform|automation|tools?)|test automation|software testing|(?:testing|test|device|browser) clouds?|cloud testing|cross-browser|browser testing|unit tests?|source code|version control|git|kubernetes|microservices|sdlc|feature flags?|low-code|infrastructure as code|apm|backend|docker|self-hosted runners?|hosted runners?|layer caching|flaky tests?|build minutes|pull requests?|nosql|relational databases?|data streaming|message brokers?|search clusters?|key-value stores?|front-?end clouds?|serverless|edge functions|static sites?|deploy(?:ing)? (?:web )?apps)\b/i,
    weak: /\b(apis?|sdks?|code|release|releases|deploy\w*|testing|tests?|debug\w*|logging)\b/i,
    vocabulary: ['developer experience', 'pipeline', 'release frequency', 'technical debt', 'open source alternative', 'integration', 'mean time to recovery', 'seats', 'self serve trial'],
    buyerRoles: ['VP Engineering', 'Chief Technology Officer', 'Platform Engineering Lead', 'Engineering Manager', 'Head of DevOps', 'Security Lead'],
    committee: 'The VP Engineering or CTO signs; a team or platform lead champions; developers use it daily; security reviews code and data access; procurement handles seats or usage.',
    objections: [
      { objection: 'Our developers use open source tools', response: 'Compare the time spent maintaining the open source setup with what the product removes, on one team.' },
      { objection: 'Per seat or per usage cost at our scale', response: 'Tie the price to the teams that use it and the time saved, measured in a trial.' },
      { objection: 'Migrating what we already have', response: 'Show the import path and migrate one real project during the trial.' },
      { objection: 'Security review of code and data access', response: 'State what the product reads and stores, and offer the security documentation up front.' },
    ],
    salesMotion: 'Developers adopt first (a trial or free tier where offered), then a team or enterprise deal led by engineering leadership.',
    metrics: ['release frequency', 'lead time for changes', 'build time', 'mean time to recovery', 'incidents after a release', 'developer time saved', 'adoption by teams'],
    proofShape: 'One team before and after on a measure it already tracks, taken from the team\'s own pipeline or incident data.',
    discovery: [
      'How often do you release, and what slows a release down?',
      'Which tools are in the pipeline today, and which would this replace or join?',
      'Who feels the problem most, and how do they work around it today?',
      'How do you measure the result today, and who owns that number?',
      'Who must approve a new developer tool (security, procurement, platform team)?',
    ],
  },
  {
    id: 'saas', name: 'SaaS',
    match: /\b(saas|software as a service|subscriptions?|b2b software|crm|billing|invoicing|dunning|prorat\w*|revenue recognition|moneti[sz]\w*|usage-based (?:pricing|billing)|metered billing|pricing and packaging|quote-to-cash|product analytics|product-led|plg|customer success|revenue operations|revops|sales enablement|marketing automation|churn|net revenue retention|applicant tracking|recruit(?:ing|ment) (?:platform|software|tools?)|survey (?:platform|tool|software)|form builders?|e-?signatures?|contract management|employee engagement|locali[sz]ation (?:platforms?|management|software|tools?)|(?:software|app|website|content) locali[sz]ation|translation (?:management|platforms?|software|tools?)|i18n)\b/i,
    weak: /\b(software|platform)\b/i,
    vocabulary: ['onboarding', 'time to value', 'renewal', 'integration', 'admin controls', 'single sign on', 'seats', 'trial', 'usage', 'security review'],
    buyerRoles: ['Head of the function that uses it', 'VP Operations', 'Head of IT', 'Chief Financial Officer', 'Head of Procurement'],
    committee: 'The budget owner of the function signs; the team lead who feels the problem champions; end users adopt it; finance, IT and security review cost, access controls and integrations.',
    objections: [
      { objection: 'We already have a tool for this', response: 'Map the overlap honestly and compare what people can do in their daily work in each, using one real team and one real week.' },
      { objection: 'The price grows as we grow', response: 'Align the pricing metric with the value the buyer gets and show the price at the next stage of growth.' },
      { objection: 'Switching cost', response: 'Show the migration plan, what moves automatically and the time to first value.' },
      { objection: 'Security and IT review', response: 'State what the product reads and stores, offer the security documentation up front and name the integrations available today.' },
    ],
    salesMotion: 'Trial or pilot with one team, then a team or company deal; sales assisted where the buyer expects it; expansion through usage and renewals.',
    metrics: ['time to value', 'adoption by the target team', 'renewal rate', 'expansion revenue', 'support load', 'seats in active use', 'time saved per user'],
    proofShape: 'One team or a cohort of customers before and after, on adoption, time saved or retention, with the period and the owner named.',
    discovery: [
      'What does a new user have to do before they get value, and how long does it take today?',
      'Which tools would this replace or connect to?',
      'Who owns the number this would move?',
      'Where do people drop off: setup, adoption or renewal?',
      'Who must approve a new tool (IT, security, finance), and what do they look for?',
    ],
  },
];

// ---------------------------------------------------------------------------------------------------------------------------
// Sub-types (run 21b, owner decision of 3 October 2026). The nine entries above hold only lines true for every company in the vertical.
// A sub-type holds the lines for one kind of company (for example fintech, payments and banking APIs). Its category nouns are matched on
// the seller's own words; the earliest category noun decides the sector (the product category comes before any buzzword), and the
// sub-type's notes are used only when exactly one sub-type of that vertical is named. No figure, statistic or named company (B82).
// ---------------------------------------------------------------------------------------------------------------------------
export const SUBTYPES: SubType[] = [
  {
    id: 'freight-visibility', vertical: 'logistics-tech', name: 'freight visibility',
    match: /\b(?:freight visibility|(?:shipment|inventory|transportation|supply chain|freight|order)(?: and (?:shipment|inventory|freight|order))? visibility|real.?time visibility|predictive etas?|order level tracking|shipment visibility|shipment tracking|supply chain visibility|transportation visibility|cargo tracking|container tracking|track and trace|control tower (?:software|platform)|logistics control tower|load tracking|eta prediction|shipment monitoring)\b/i,
    model: 'saas',
    notes: {
      vocabulary: ['shipment tracking', 'ETA', 'milestone', 'exception alert', 'control tower', 'carrier integration', 'dwell time', 'detention and demurrage', 'port and terminal events', 'tracking link'],
      buyerRoles: ['Chief Supply Chain Officer', 'Head of Logistics', 'Head of Supply Chain Visibility', 'Transport Planning Manager', 'Customer Service Lead', 'Head of Procurement (carriers)', 'Head of IT'],
      committee: 'The Head of Supply Chain or Logistics signs; the visibility or control tower lead champions; planners and customer service teams use it daily; procurement uses the carrier performance data; IT checks the connections to carriers and to the transport and order systems.',
      objections: [
        { objection: 'Our carriers already give us tracking', response: 'Count the carriers, modes and portals the team checks by hand today and show what one view across them changes in the day, tested on the buyer\'s own shipments.' },
        { objection: 'Carrier data is patchy', response: 'Say where each status comes from (carrier feeds, devices, port events, vehicle data), how gaps are flagged, and agree how the accuracy of arrival estimates is measured.' },
        { objection: 'Integration with our transport and order systems', response: 'Name the systems the tracking data must flow into and the few fields needed, and agree who on the buyer side owns each connection.' },
        { objection: 'We get alerts already and nobody acts on them', response: 'Show how exceptions are ranked and sent to the person who can act, and agree which few exceptions the pilot acts on first.' },
      ],
      salesMotion: 'Enterprise sales led by supply chain, with a pilot on a few lanes or carriers and IT in the evaluation.',
      metrics: ['arrival estimate accuracy', 'shipments tracked end to end', 'exceptions caught before the customer calls', 'time spent chasing status', 'dwell and detention cost', 'on time in full', 'carrier performance scores'],
      proofShape: 'Arrival estimate accuracy or exceptions caught early on a set of lanes before and after, with the carriers covered and how the status data was checked.',
      discovery: [
        'How do your planners find out today that a shipment is late, and how long does it take?',
        'Which modes and carriers are in scope, and how does each one send status?',
        'How do customers ask where their goods are, and who answers them?',
        'Which systems must the tracking data flow into (transport, order, ERP, customer portal)?',
        'What do delays and detention cost you today, and who sees that number?',
      ],
    },
  },
  {
    id: 'freight-marketplace', vertical: 'logistics-tech', name: 'freight marketplaces',
    match: /\b(?:freight marketplace|trucking marketplace|transport marketplace|logistics marketplace|load boards?|freight exchange|freight brokerage|digital freight brokerage|freight matching|truck booking (?:platform|app)|freight booking (?:platform|app)|spot freight|online freight|freight (?:rate|quote) (?:platform|comparison)|freight rates|shipping marketplace)\b/i,
    model: 'marketplace',
    notes: {
      vocabulary: ['load', 'capacity', 'lane', 'shipper', 'carrier network', 'rate quote', 'spot and contract rates', 'booking', 'payment terms', 'empty return'],
      buyerRoles: ['Head of Logistics', 'Transport Procurement Manager', 'Chief Operating Officer', 'Fleet or Carrier Owner', 'Dispatcher', 'Head of Finance', 'Head of IT'],
      committee: 'The shipper\'s Head of Logistics or transport procurement lead signs; the transport planning lead champions it and books loads; carrier owners and dispatchers use it daily and decide whether to stay on the platform; finance checks payment terms and invoices; IT checks the links to order and transport systems.',
      objections: [
        { objection: 'We have our own carriers and rate contracts', response: 'Position the marketplace for the loads the contracts do not cover (peaks, new lanes, empty runs) and compare on those loads using the buyer\'s recent bookings.' },
        { objection: 'Quality and reliability of carriers on the platform', response: 'Show how carriers are verified, rated and tracked, and let the buyer set rules on who may take its loads.' },
        { objection: 'Payments and trust', response: 'Explain payment terms, who pays whom and when, and how damage and disputes are handled.' },
        { objection: 'The fees eat the saving', response: 'Compare the delivered cost of a load, including the time spent finding capacity, not the rate alone.' },
      ],
      salesMotion: 'Two sided: win shippers on a few lanes and keep enough carrier capacity on those lanes, then widen as trust grows and volume moves over.',
      metrics: ['load fill rate', 'time to book a load', 'delivered cost per load', 'carrier acceptance', 'repeat booking rate', 'empty return share', 'payment cycle time', 'claims and disputes'],
      proofShape: 'Loads booked on a set of lanes with fill rate, delivered cost and time to book, compared with the buyer\'s usual way of finding capacity.',
      discovery: [
        'How do you find and book capacity today, and what do you do when a carrier drops a load?',
        'Which lanes or loads are hardest to cover, and when in the year?',
        'How do you price loads today, and how often do you re quote?',
        'How are carriers paid, and how long does that take?',
        'Which systems must a booking flow into (order, transport, finance)?',
      ],
    },
  },
  {
    id: 'seller-shipping', vertical: 'logistics-tech', name: 'shipping for online sellers',
    match: /\b(?:shipping aggregators?|courier aggregators?|multi.?courier|courier partners?|e-?commerce (?:shipping|enablement)|shipping (?:solutions?|platforms?|software|tools?) for (?:small |online |indian )?(?:sellers|merchants|d2c|e-?commerce|online (?:stores?|retailers?|businesses)|small (?:businesses|brands))|(?:sellers|merchants|d2c brands|online (?:stores?|retailers?)) (?:to )?(?:manage|ship|send) (?:their )?(?:shipping|orders|shipments|parcels))\b/i,
    model: 'transactions',
    notes: {
      vocabulary: ['courier partner', 'pin code serviceability', 'cash on delivery', 'return to origin', 'non delivery report', 'weight discrepancy', 'pickup', 'shipping label', 'store and marketplace channels', 'remittance'],
      buyerRoles: ['Founder or Owner', 'Operations or Fulfilment Manager', 'Head of E-commerce', 'Finance or Accounts Lead', 'Customer Support Lead'],
      committee: 'In a small online business the founder or owner decides and the operations or e-commerce lead runs shipping day to day; finance checks charges and cash on delivery remittances. There is rarely a formal committee: a trial on live orders decides.',
      objections: [
        { objection: 'Our courier already gives us a rate', response: 'Compare the delivered cost of the last few weeks of orders, including returns to origin and weight charges, not the rate card alone.' },
        { objection: 'Changing shipping tools in a busy season', response: 'Start with one channel or a few orders a day next to the current courier, and move volume over as it proves itself.' },
        { objection: 'Cash on delivery money arrives late or does not match', response: 'Show the remittance timeline and how a mismatch is reported and settled.' },
        { objection: 'Surprise weight and return charges', response: 'Explain how weight is declared and checked, and how a disputed charge is raised.' },
      ],
      salesMotion: 'Self serve start with a trial on live orders, a short onboarding call for larger sellers, then expansion through more channels, warehouses and services.',
      metrics: ['delivered cost per order', 'return to origin rate', 'non delivery report resolution', 'delivery time by pin code', 'cash on delivery remittance time', 'pickup success rate', 'weight discrepancy rate'],
      proofShape: 'A seller\'s own orders over a few weeks: delivered cost per order, return rate and delivery time by pin code, compared with its previous way of shipping.',
      discovery: [
        'Which couriers and channels do you ship with today, and how do you choose one for an order?',
        'What share of orders come back or fail delivery, and what do you do about them?',
        'How long does cash on delivery money take to reach you, and how do you check it?',
        'Where do weight or charge disputes come up, and who handles them?',
        'Which stores or marketplaces must orders flow in from?',
      ],
    },
  },
  {
    id: 'last-mile', vertical: 'logistics-tech', name: 'last mile delivery',
    match: /\b(?:last\W?mile|delivery management (?:software|platform|system)|delivery (?:tracking|orchestration|routing) (?:software|platform|app)|route (?:optimi[sz]ation|planning) (?:software|platform|tool)|courier (?:software|management|dispatch)|dispatch (?:software|platform)|proof of delivery|driver app|same day delivery|hyperlocal delivery|delivery (?:fleets?|drivers?))\b/i,
    model: 'saas',
    notes: {
      vocabulary: ['dispatch', 'fleet', 'last mile', 'route plan', 'first attempt delivery', 'proof of delivery', 'third party logistics provider', 'cost per delivery', 'delivery SLA', 'delivery window'],
      buyerRoles: ['Chief Operating Officer', 'Head of Supply Chain', 'Head of Last Mile Operations', 'Fleet Manager', 'Transport Manager', 'Head of IT'],
      committee: 'The COO or Head of Supply Chain signs; the Head of Logistics or Last Mile Operations champions; fleet and dispatch managers use it daily; IT checks the fit with the transport, warehouse and order systems; finance checks the cost per delivery case.',
      objections: [
        { objection: 'We already have a TMS', response: 'Ask which daily decisions it does not make today (re planning when orders change, address cleaning, driver allocation) and position the product as working with it, not replacing it.' },
        { objection: 'Drivers will not use a new app', response: 'Offer a pilot at one hub with an offline first driver app and agree how adoption is measured before the pilot starts.' },
        { objection: 'Integration effort', response: 'Name the systems involved (transport, warehouse, ERP, order management) and the few data fields needed, and agree who on the buyer side owns each.' },
        { objection: 'Our margins are too thin for this', response: 'Tie the price to cost per delivery and failed deliveries measured in the buyer\'s own data, not to a general claim.' },
      ],
      salesMotion: 'Enterprise sales with a pilot at one hub or city, often timed around peak season planning.',
      metrics: ['cost per delivery', 'first attempt delivery rate', 'on time delivery', 'deliveries per vehicle per day', 'vehicle utilisation', 'failed delivery and return rate', 'dispatch planning time'],
      proofShape: 'A before and after of cost per delivery or first attempt delivery at one hub, measured over a full cycle of busy and quiet weeks.',
      discovery: [
        'How do you plan routes today, and how often does a dispatcher re plan during the day?',
        'What happens when an order, a driver or a road changes after the vehicles have left?',
        'How do you measure cost per delivery and first attempt delivery today, and who owns those numbers?',
        'Which systems hold the orders and the addresses (transport, warehouse, ERP, order management)?',
        'Where do failed deliveries come from: addresses, time windows, driver allocation or something else?',
      ],
    },
  },
  {
    id: 'warehousing', vertical: 'logistics-tech', name: 'warehousing and fulfilment',
    match: /\b(?:warehouse management (?:system|software)|warehouse automation|warehouse robotics|warehouse operations software|inventory management (?:system|software)|order fulfil+ment|ecommerce fulfil+ment|fulfil+ment (?:centre|center|service|network|software|platform)s?|pick and pack|dark store (?:software|operations)|distribution centre software)\b/i,
    notes: {
      vocabulary: ['pick and pack', 'putaway', 'slotting', 'inventory accuracy', 'cycle count', 'wave planning', 'dock to stock', 'order cut off', 'fulfilment centre', 'warehouse management system'],
      buyerRoles: ['Chief Operating Officer', 'Head of Warehouse Operations', 'Fulfilment Centre Manager', 'Inventory Control Manager', 'Head of Supply Chain', 'Head of IT'],
      committee: 'The COO or Head of Supply Chain signs; the head of warehouse or fulfilment operations champions; shift leads and floor staff use it daily; IT checks the links to the order channels, ERP and scanning devices; finance checks the cost per order case.',
      objections: [
        { objection: 'We already have a warehouse system', response: 'Ask what the current system does not do well on the floor (picking paths, returns, stock counts, peak surges) and position the product as covering that gap or running alongside it.' },
        { objection: 'Go live will disrupt our peak season', response: 'Plan the go live outside peak, start at one site or one zone, and agree the rollback rule before the start.' },
        { objection: 'Floor staff and devices', response: 'Show the screens and scanning flow on the devices the floor already uses, and agree a short training plan with the shift leads.' },
        { objection: 'Integration with our order channels and ERP', response: 'Name the order sources and the systems of record, the few fields that move each way, and who on the buyer side owns each connection.' },
      ],
      salesMotion: 'Operations led enterprise sales; a pilot at one site or zone, with the go live planned around peak season.',
      metrics: ['order accuracy', 'orders picked per labour hour', 'inventory accuracy', 'dock to stock time', 'order cycle time', 'cost per order', 'storage space utilisation'],
      proofShape: 'Order accuracy or orders per labour hour at one site before and after, measured across busy and quiet weeks, with the site manager\'s sign off.',
      discovery: [
        'How do orders reach the floor today, and how are they picked, packed and checked?',
        'How do you count stock, and how often do the system and the shelf disagree?',
        'Which sales channels feed the warehouse, and how do returns come back in?',
        'What breaks first in your peak weeks?',
        'Which systems must the warehouse work with (order channels, ERP, carriers, scanning devices)?',
      ],
    },
  },
  {
    id: 'transport-management', vertical: 'logistics-tech', name: 'transport and fleet management',
    match: /\b(?:transport(?:ation)? management (?:system|software)|transportation management|fleet management(?: software| system| platform)?|vehicle telematics|fleet telematics|fleet tracking|freight audit|carrier management|load planning|freight forwarding software|tms)\b/i,
    model: 'saas',
    notes: {
      vocabulary: ['load planning', 'carrier selection', 'freight cost', 'tender', 'telematics', 'fleet utilisation', 'freight audit', 'rate management', 'empty miles', 'transport management system'],
      buyerRoles: ['Head of Transport', 'Head of Supply Chain', 'Fleet Manager', 'Transport Planning Manager', 'Head of Procurement', 'Chief Financial Officer', 'Head of IT'],
      committee: 'The Head of Supply Chain or Transport signs; the transport planning lead champions; planners, dispatchers and fleet staff use it daily; procurement manages the carrier rates; finance checks freight cost and invoices; IT checks the links to ERP and order systems.',
      objections: [
        { objection: 'We plan in spreadsheets and it works', response: 'Time one real planning day, count the manual steps and the decisions that depend on one person, and show what the product does with the same loads.' },
        { objection: 'Our ERP already has a transport module', response: 'Compare the module with the daily work (load building, carrier choice, freight bills) on a month of the buyer\'s own shipments.' },
        { objection: 'Carrier onboarding and data', response: 'Agree how carriers are connected, which can send data electronically, and what the fallback is for the others.' },
        { objection: 'The freight saving must be proven', response: 'Measure freight cost per load on a set of lanes before and after, with the buyer\'s finance team agreeing the method first.' },
      ],
      salesMotion: 'Enterprise sales led by supply chain or transport, with a pilot on a few lanes or a fleet depot, and finance in the evaluation.',
      metrics: ['freight cost per load', 'load utilisation', 'empty miles', 'on time delivery', 'freight invoice accuracy', 'planning time per day', 'fleet utilisation'],
      proofShape: 'Freight cost per load or fleet utilisation on a set of lanes or one depot before and after, with the method agreed with finance.',
      discovery: [
        'How do you plan loads and choose carriers today, and who does it?',
        'How are freight bills checked and paid, and how many are wrong?',
        'Which carriers or vehicles are in scope, and how do they send data today?',
        'Which systems hold orders and rates (ERP, order management, carrier portals)?',
        'What would a good result on freight cost look like for the first lanes?',
      ],
    },
  },
  {
    id: 'payments-banking', vertical: 'fintech', name: 'payments and banking APIs',
    match: /\b(?:payment gateway|payment processing|payments and banking (?:platform|stack|infrastructure)|banking platform|payments? (?:platform|infrastructure)|payment service provider|payment orchestration|card issuing|card processing|banking as a service|bank account (?:data|api|linking|connections?|access|verification)|account (?:and routing number )?verification|ach (?:payments?|transfers?|returns?|debits?)|bank payments?|open banking|core banking|remittance (?:service|platform)|merchant acquiring|(?:connects?|links?) (?:\w+ ){1,3}(?:to )?(?:\w+'?s? )?bank accounts?|financial (?:data )?(?:network|apis?)|payments? apis?|payment links?|card programs?|upi)\b/i,
    model: 'transactions',
    notes: {
      vocabulary: ['payment success rate', 'settlement', 'chargeback', 'authorisation', 'tokenisation', 'sponsor bank', 'sandbox', 'webhook', 'uptime', 'payout'],
      buyerRoles: ['Chief Technology Officer', 'Head of Payments', 'Head of Product', 'Head of Engineering', 'Chief Risk Officer', 'Head of Compliance', 'Chief Financial Officer'],
      committee: 'The CTO or Head of Payments signs; engineering leads evaluate the interfaces and champion; product owns the customer journey; risk and compliance review licensing, data handling and fraud controls; finance checks pricing per transaction and settlement.',
      objections: [
        { objection: 'We already have a payments provider', response: 'Compare on the payment journeys that fail or cost the most today (declines, failed payouts, support tickets) using a sample of the buyer\'s own transactions, and offer to run alongside the current provider on one flow.' },
        { objection: 'Reliability and uptime', response: 'Show the uptime record, the status reporting, the failover design and what happens to a payment in flight during an outage, and agree service levels in writing.' },
        { objection: 'Licensing and regulation', response: 'State which licences and partner banks stand behind the service and which obligations stay with the buyer, and map each requirement the buyer names to a control.' },
        { objection: 'Switching and integration effort', response: 'Show the sandbox, the documentation and a migration path flow by flow, with the engineering effort named.' },
      ],
      salesMotion: 'Developer led evaluation in a sandbox, then a risk, compliance and commercial review; go live flow by flow or on a share of the traffic.',
      metrics: ['payment success rate', 'authorisation rate', 'time to first live payment', 'uptime', 'settlement time', 'cost per transaction', 'chargeback and dispute rate', 'support tickets per payment'],
      proofShape: 'Success rate, uptime or time to go live on one flow before and after, from the buyer\'s own transaction data, with the period named.',
      discovery: [
        'Which payment or account flows do you run today, and where do customers fail or drop out?',
        'How long did the last integration take, and who maintains it?',
        'Which licences, partner banks or regulators matter for the countries you serve?',
        'How do you handle disputes, refunds and reconciliation today?',
        'What would you need to see in a sandbox before you trust it with live money?',
      ],
    },
  },
  {
    id: 'lending', vertical: 'fintech', name: 'lending and credit data',
    match: /\b(?:lending (?:platform|software|as a service)|digital lending|loan origination|loan management (?:system|software)|loan servicing|credit scoring|credit decisioning|credit (?:bureau|risk) data|alternative credit data|consumer lending|buy now pay later|bnpl|credit data|bank statement (?:analysis|analyzer|analytics)|income verification|financial (?:data|document) (?:analytics|analysis)|credit underwriting|account aggregator|loan underwriting|credit risk)\b/i,
    notes: {
      vocabulary: ['origination', 'underwriting', 'credit decision', 'bureau data', 'delinquency', 'collections', 'loan book', 'disbursal', 'risk model', 'regulatory reporting'],
      buyerRoles: ['Chief Risk Officer', 'Head of Credit', 'Head of Lending Operations', 'Chief Product Officer', 'Head of Collections', 'Head of Compliance', 'Head of IT'],
      committee: 'The Chief Risk Officer or Head of Credit signs; the lending operations or product lead champions; credit analysts and collections teams use it; compliance reviews fair lending and data rules; IT checks the links to the loan system and the data providers.',
      objections: [
        { objection: 'Our credit policy and models are our edge', response: 'Show that the product runs the buyer\'s own rules and models, adds data or speed, and leaves final policy with the credit team.' },
        { objection: 'Can it explain a decline?', response: 'Show the reasons attached to each decision in words a customer and a regulator can read, and agree what is logged.' },
        { objection: 'Data sources and consent', response: 'State where each data point comes from, the consent behind it and how long it is held.' },
        { objection: 'Switching the loan system with a live book', response: 'Run it on new applications first, leave the existing book alone, and compare decisions side by side for an agreed period.' },
      ],
      salesMotion: 'Risk led and committee based: a back test on the buyer\'s own past applications, a pilot on a slice of new applications, then wider rollout.',
      metrics: ['approval rate at the same level of risk', 'time to decision', 'delinquency rate', 'cost to originate a loan', 'collections recovery', 'manual review rate', 'early default rate'],
      proofShape: 'A back test or pilot on the buyer\'s own applications showing decisions, losses and time to decision against the current process, with the period and any limits stated.',
      discovery: [
        'How does an application become a decision today, and which steps are manual?',
        'Which data sources and models do your credit rules use now, and which are missing?',
        'How do you track delinquency and recovery, and who reviews them?',
        'Which regulator reports or fair lending checks must the system support?',
        'Which loan or core system must it connect to?',
      ],
    },
  },
  {
    id: 'wealth-investment', vertical: 'fintech', name: 'wealth and investment',
    match: /\b(?:wealth management (?:platform|software)|wealth platform|robo advis[eo]rs?|investment platform|portfolio management (?:software|platform|system)|trading platform|stock brokerage|stock broking|brokerage platform|investment (?:manager|advisory|adviser)|(?:asset|fund|wealth) managers?|hedge funds?|mutual fund (?:platform|distribution))\b/i,
    notes: {
      vocabulary: ['mandate', 'allocation', 'model portfolio', 'rebalancing', 'suitability', 'client reporting', 'fee billing', 'custody', 'benchmark', 'investment committee'],
      buyerRoles: ['Chief Investment Officer', 'Head of Wealth', 'Head of Advisory', 'Head of Operations', 'Chief Compliance Officer', 'Head of Technology'],
      committee: 'The chief investment officer or head of wealth signs; the head of advisory or operations champions; advisers or portfolio staff use it; compliance reviews suitability, records and reporting; technology checks the links to custodians, market data and the client portal.',
      objections: [
        { objection: 'Our advisers like the tools they have', response: 'Pilot with a small group of advisers, show the steps removed from a real client review, and let their time saved be measured.' },
        { objection: 'Suitability and regulatory records', response: 'Show how advice, orders and client communication are recorded and retrieved for a review, and map each rule the buyer names to a control.' },
        { objection: 'Moving client accounts and custody links', response: 'Plan the move in waves by book of clients, name the custodians and data feeds involved and agree a side by side period.' },
        { objection: 'Results must be shown fairly', response: 'Show any performance with its period, method and benchmark, and label back tested results as back tested.' },
      ],
      salesMotion: 'A long, committee led process: due diligence, a pilot with a few advisers or a small first allocation, then wider rollout or a larger mandate.',
      metrics: ['assets served per adviser', 'time to onboard a client', 'return against the buyer\'s benchmark', 'drawdown in a bad month', 'reporting timeliness', 'rebalancing time', 'fee and cost transparency'],
      proofShape: 'Adviser time or onboarding time before and after for a pilot group, or results shown with their period, method and benchmark, signed off by compliance.',
      discovery: [
        'How does a client review or an investment decision get made today, and who signs it off?',
        'What must you be able to explain to a client, a committee or a regulator, and in what form?',
        'Which custodians, market data and reporting tools must it work with?',
        'What reporting do you expect each month, and after a bad month?',
        'What would a first pilot or allocation look like, and how would you judge it?',
      ],
    },
  },
  {
    id: 'spend-expense', vertical: 'fintech', name: 'spend and expense',
    match: /\b(?:spend management|expense management|expense reports?|expense modules?|(?:travel )?expenses? (?:app|claims?|software|tool|platform)|reimbursements?|accounts payable|invoice approvals?|corporate cards?|business cards? (?:programme|program|platform)|travel and expense|accounts payable automation|procure to pay|invoice automation|invoice processing|employee reimbursements?|bill pay(?:ment)? (?:software|platform))\b/i,
    model: 'saas',
    notes: {
      vocabulary: ['reconciliation', 'month end close', 'policy controls', 'audit trail', 'accounts payable', 'ERP posting', 'compliance review', 'approval workflow', 'data residency'],
      buyerRoles: ['Chief Financial Officer', 'Finance Controller', 'Head of Accounts Payable', 'Head of Treasury', 'Internal Audit Lead', 'Compliance Officer', 'Head of IT'],
      committee: 'The CFO signs; the Finance Controller or the head of the affected finance team champions; internal audit and compliance review controls; IT checks ERP integration and security; HR joins when employees are affected.',
      objections: [
        { objection: 'Our ERP already does this', response: 'Show the gap between the ERP module and the daily workflow (approvals, receipts, cards, posting) using one month of the buyer\'s own transactions.' },
        { objection: 'Security and compliance review', response: 'Prepare the answers before they are asked: data residency, access controls, audit logs, certifications you actually hold.' },
        { objection: 'Migration will disrupt the close', response: 'Plan the cut over just after a month end close and run old and new in parallel for one cycle.' },
        { objection: 'Regulatory caution', response: 'Map each requirement the buyer names to the control or report that meets it; never claim a compliance status you cannot show.' },
      ],
      salesMotion: 'CFO led with a security and compliance review inside the cycle; proof through a pilot on one entity or department.',
      metrics: ['days to close the books', 'reconciliation effort', 'policy breach rate', 'approval cycle time', 'audit findings', 'cost per transaction', 'payment success rate'],
      proofShape: 'Close time or reconciliation effort before and after for one entity, signed off by the finance controller.',
      discovery: [
        'How many days does the month end close take today, and which step takes longest?',
        'How are card spends, claims and invoices matched to the ledger today, and by whom?',
        'What did the last audit say about spend controls or approvals?',
        'Which ERP or ledger must every transaction post into, and who owns that integration?',
        'Which reviews (security, compliance, internal audit) must a new finance tool pass, and how long do they take?',
      ],
    },
  },
  {
    id: 'insurance', vertical: 'fintech', name: 'insurance',
    match: /\b(?:insurtech|insurance (?:platform|software|marketplace|distribution|broker(?:age)?|cover)|embedded insurance|policy administration|claims?(?: management| processing)? (?:software|platform|system)|underwriting (?:software|platform|engine)|usage based insurance|insurance claims)\b/i,
    notes: {
      vocabulary: ['policy', 'premium', 'claim', 'underwriting', 'loss ratio', 'broker', 'renewal', 'coverage', 'claims settlement', 'policy administration'],
      buyerRoles: ['Chief Underwriting Officer', 'Head of Claims', 'Chief Operating Officer', 'Head of Distribution', 'Chief Risk Officer', 'Head of Compliance', 'Head of IT'],
      committee: 'The chief operating officer or the head of the product line signs; the head of underwriting, claims or distribution champions; underwriters, adjusters and partner staff use it; compliance and risk review conduct and data rules; IT checks the links to the core policy system.',
      objections: [
        { objection: 'Our core policy system cannot be replaced', response: 'Position the product as a layer around the core system, name the interfaces, and start with one product line.' },
        { objection: 'Regulator and data rules', response: 'State where data is processed and stored, what each decision is based on, and how a regulator can review it.' },
        { objection: 'Claims decisions must stay with our adjusters', response: 'Show how the product prepares and explains a recommendation while the adjuster keeps the final settlement, and what is logged.' },
        { objection: 'Brokers and agents will not change how they work', response: 'Pilot with a few partners, show the steps removed between quote and bind, and measure adoption from the start.' },
      ],
      salesMotion: 'A long, committee led process: a pilot on one product line or partner channel, then rollout line by line with compliance review at each step.',
      metrics: ['quote to bind time', 'claims settlement time', 'loss ratio', 'claims leakage', 'policy retention at renewal', 'straight through processing rate', 'cost per policy served', 'complaint rate'],
      proofShape: 'Quote to bind time or claims settlement time on one product line before and after, from the insurer\'s own records, with the period named.',
      discovery: [
        'Which product line or channel would you start with, and who owns it?',
        'How does a policy get from quote to bind today, and where does it wait?',
        'How are claims reviewed and settled today, and where does cost leak?',
        'Which core systems and partner channels must it connect to?',
        'What would the regulator or your compliance team need to see?',
      ],
    },
  },
  {
    id: 'customer-service', vertical: 'saas', name: 'customer service software',
    match: /\b(?:customer (?:service|support) (?:software|platform|tool|system|automation)|help ?desk(?: software| platform| tool)?|ticketing(?: system| software| platform| tool)?|help cent(?:er|re)|support ticketing|shared inbox|live chat(?: software)?|service desk software|customer support suite)\b/i,
    model: 'saas',
    notes: {
      vocabulary: ['ticket', 'first response time', 'resolution time', 'help center', 'macro', 'shared inbox', 'knowledge base', 'deflection', 'customer satisfaction', 'handoff to a person'],
      buyerRoles: ['Head of Customer Support', 'VP Customer Experience', 'Support Operations Manager', 'Head of Customer Success', 'Chief Operating Officer', 'Head of IT'],
      committee: 'The head of customer support or customer experience signs; the support operations lead champions; agents and team leads use it daily; IT and security review access, data and integrations; finance checks price per seat or per resolution.',
      objections: [
        { objection: 'We already have a helpdesk', response: 'Compare the daily workflow of agents on the same set of real tickets, and show the migration plan for history, macros and integrations.' },
        { objection: 'Will the AI give customers wrong answers?', response: 'Pilot on a few topics, show the source behind each answer, hand over to a person when unsure, and review answers weekly with the support lead.' },
        { objection: 'Migrating tickets and integrations', response: 'Name what moves automatically, what is rebuilt, and who on the buyer side owns each integration.' },
        { objection: 'Pricing per agent seat or per resolution', response: 'Model the price on the buyer\'s own conversation volume in a peak month and a quiet month.' },
      ],
      salesMotion: 'Trial or pilot with one support team or channel, led by the head of support, then a rollout across channels with IT reviewing security and integrations.',
      metrics: ['first response time', 'resolution time', 'share of conversations resolved without a person', 'customer satisfaction', 'tickets per agent', 'backlog age', 'cost per resolution'],
      proofShape: 'One support team or channel before and after on resolution time, share resolved without a person and customer satisfaction, over a full cycle of busy and quiet weeks.',
      discovery: [
        'Which channels do customers use to reach support today, and where do tickets pile up?',
        'How is a ticket routed, answered and closed today, and by whom?',
        'Which questions come up again and again, and where does the answer live?',
        'Which tools must it connect to (customer records, orders, billing, messaging)?',
        'How do you measure a good support day today?',
      ],
    },
  },
  {
    id: 'crm-marketing', vertical: 'saas', name: 'CRM and marketing',
    match: /\b(?:crm (?:software|platform|system|tool|suite)s?|crm for|is (?:a )?crm|customer relationship management|sales crm|marketing automation|email marketing (?:platform|software|tool)|sales engagement|lead management|sales pipeline (?:software|tool)|customer data platform|campaign management|revenue intelligence|customer engagement (?:platform|software|suite)|lifecycle marketing|retention marketing|mobile marketing|push notifications?|omnichannel engagement|marketing cloud)\b/i,
    model: 'saas',
    notes: {
      vocabulary: ['pipeline', 'lead', 'contact', 'campaign', 'lead scoring', 'sales stage', 'forecast', 'attribution', 'nurture', 'handoff from marketing to sales'],
      buyerRoles: ['Chief Revenue Officer', 'VP Sales', 'Head of Marketing', 'Revenue Operations Lead', 'Head of Sales Operations', 'Head of IT'],
      committee: 'The chief revenue officer or head of sales or marketing signs; the revenue operations lead champions; reps and marketers use it daily; IT checks email, calendar, website and billing integrations; finance checks seat cost.',
      objections: [
        { objection: 'Our team lives in the current CRM', response: 'Show what a rep or marketer does in a day in each tool and what moves over automatically, then pilot with one team.' },
        { objection: 'Reps will not keep records up to date', response: 'Show what is captured automatically and what the rep no longer types, and measure it with one team.' },
        { objection: 'Contact data quality and migration', response: 'Agree what is cleaned and mapped before the move, who signs off the data, and run old and new side by side for a period.' },
        { objection: 'Too many tools in the sales and marketing stack', response: 'Name the tools it replaces or connects to and show where it sits in the daily workflow.' },
      ],
      salesMotion: 'Trial or pilot with one sales or marketing team, led by the head of revenue operations, then a company deal; sales assisted for larger teams.',
      metrics: ['pipeline created', 'lead to opportunity conversion', 'sales cycle length', 'forecast accuracy', 'rep adoption', 'cost per qualified lead', 'win rate'],
      proofShape: 'One team before and after on pipeline created, conversion or forecast accuracy, with the period and the revenue operations owner named.',
      discovery: [
        'How does a lead move from first touch to a closed deal today, and where does it stall?',
        'How do marketing and sales agree what a good lead is?',
        'How do you build your forecast today, and how far off is it?',
        'Which tools hold contacts and activity now, and which must it connect to?',
        'Who owns the number this would move?',
      ],
    },
  },
  {
    id: 'collaboration', vertical: 'saas', name: 'collaboration and work management',
    match: /\b(?:project management (?:software|tool|platform|app)|work management|collaboration (?:software|platform|tool|suite)|team collaboration|task management (?:software|tool|app)|workflow management (?:software|tool)|whiteboard (?:software|tool|app)|team messaging|document collaboration|kanban (?:software|tool|board)s?|connected workspaces?|team workspaces?|wikis?|note-?taking|meeting scheduling|scheduling links?)\b/i,
    model: 'saas',
    notes: {
      vocabulary: ['project', 'task', 'board', 'timeline', 'workspace', 'handoff', 'status update', 'dependency', 'template', 'permissions'],
      buyerRoles: ['Head of Operations', 'Head of the Project Management Office', 'VP Product', 'Department Head', 'Chief Operating Officer', 'Head of IT'],
      committee: 'The department head or head of operations signs; a team lead who feels the coordination pain champions; teams use it daily; IT and security review permissions, single sign on and integrations; finance checks seat cost.',
      objections: [
        { objection: 'Teams already use their own tools', response: 'Start with one workflow that crosses teams and show where it replaces status meetings and chasing messages.' },
        { objection: 'Another tool to log into', response: 'Show where it sits in the tools people already use, and what it connects to so work is not entered twice.' },
        { objection: 'Permissions, security and admin controls', response: 'State how access, sharing and guests are controlled, offer the security documentation up front and name the single sign on options.' },
        { objection: 'Moving existing projects and files', response: 'Show the import path and migrate one real project during the trial.' },
      ],
      salesMotion: 'Team level adoption through a free trial or pilot, then a company wide deal led by operations or IT once several teams use it.',
      metrics: ['weekly active teams', 'tasks finished on time', 'time spent in status meetings', 'projects delivered on schedule', 'seats in active use', 'onboarding time for a new team', 'number of tools replaced'],
      proofShape: 'One team or workflow before and after on on time delivery, status meeting time or tools replaced, with the period and the team lead named.',
      discovery: [
        'How do teams plan and track work today, and where does work get lost between teams?',
        'Which tools hold tasks, files and messages now?',
        'How much time goes to status meetings and chasing updates?',
        'Who decides on a new team tool, and what do IT and security look for?',
        'Which workflow would you try first, and how would you know it worked?',
      ],
    },
  },
  {
    id: 'product-growth', vertical: 'saas', name: 'product analytics and customer success',
    match: /\b(?:product analytics|product adoption (?:platform|software)|user onboarding (?:software|platform|tool)|in app messaging|customer success (?:platform|software)|experimentation platform|feature adoption|digital adoption platform|product led growth (?:platform|tools?)|customer feedback (?:software|platform))\b/i,
    model: 'saas',
    notes: {
      vocabulary: ['activation', 'time to value', 'net revenue retention', 'renewal', 'expansion', 'onboarding', 'usage', 'churn', 'customer success'],
      buyerRoles: ['VP Product', 'Head of Growth', 'Chief Revenue Officer', 'Head of Customer Success', 'Chief Financial Officer'],
      committee: 'The budget owner of the function signs; the team lead who feels the problem champions; end users adopt it; finance and IT review cost, security and integrations.',
      objections: [
        { objection: 'We built this in house', response: 'Compare the cost of maintaining the in house build with the product, including the people who keep it running.' },
        { objection: 'The price grows as we grow', response: 'Align the pricing metric with the value the buyer gets and show the price at the next stage of growth.' },
        { objection: 'Switching cost', response: 'Show the migration plan and the time to first value.' },
        { objection: 'Another tool to log into', response: 'Show where it sits in the tools they already use.' },
      ],
      salesMotion: 'Product led or sales assisted; trials and self serve where buyers expect them; expansion through usage and renewals.',
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
  },
  {
    id: 'construction', vertical: 'vertical-saas', name: 'construction management',
    match: /\b(?:change orders|rfis? and submittals|submittals|lien waivers?|(?:real.?time )?costing and budgets|construction (?:management|project management|software|technology|estimating|bidding|accounting|scheduling|document management|erp|platform)|contractor (?:management|software)|general contractor software|builder (?:management )?software|jobsite (?:management|software)|job site management|site management software|bim (?:software|platform|collaboration)|takeoff software|estimating software|rfi and submittal management|preconstruction software)\b/i,
    model: 'saas',
    notes: {
      vocabulary: ['job cost', 'change order', 'RFI', 'submittal', 'bid and estimate', 'takeoff', 'pay application', 'retainage', 'subcontractor', 'daily log', 'punch list'],
      buyerRoles: ['Owner or President of the contractor', 'Chief Financial Officer or Controller', 'Director of Operations', 'Project Executive', 'Project Manager', 'Superintendent', 'Head of Estimating', 'Head of IT'],
      committee: 'The owner or operations director signs; the controller reviews job costing and billing; project managers and superintendents champion it and use it daily; estimators join when bids are involved; IT checks the accounting integration; subcontractors and building owners use shared portals.',
      objections: [
        { objection: 'Our site teams will not use it on site', response: 'Pilot on one live project with a mobile first workflow that works with a weak connection, and agree the adoption measure with the superintendent.' },
        { objection: 'We already have an accounting and job cost system', response: 'Position the product beside accounting, show what flows between them (commitments, change orders, pay applications) and who owns the reconciliation.' },
        { objection: 'Subcontractors and owners will not log in', response: 'Show the simplest access for outside parties (links and email approvals) and what still works when they never log in.' },
        { objection: 'We cannot change tools in the middle of projects', response: 'Start on the next project, bring over only open items from running ones, and switch at a project phase boundary.' },
      ],
      salesMotion: 'Sales to the owner or head of operations, often a demo on a real project, a pilot on one new project, then rollout across projects and offices; the controller\'s sign off on the accounting link is a gate.',
      metrics: ['cost variance against budget', 'change order cycle time', 'RFI response time', 'pay application cycle time', 'rework and punch list items', 'schedule slippage', 'estimating hours per bid', 'adoption on site'],
      proofShape: 'One live project run in the product against a comparable earlier one, on change order cycle time, billing cycle time or cost variance, confirmed by the project manager and the controller.',
      discovery: [
        'How does a change order or an RFI move from the field to a decision today, and who waits on whom?',
        'How do you track job cost against budget while the project is running, and how late is that view?',
        'How do pay applications and subcontractor billing get prepared today?',
        'Which accounting or estimating system must the product work with?',
        'Which project would you pilot on, and what would make you call it a success?',
      ],
    },
  },
  {
    id: 'property-management', vertical: 'vertical-saas', name: 'property management',
    match: /\b(?:property management (?:software|system|platform|app)|lease management (?:software|system)|tenant (?:portal|screening|management)|rent collection (?:software|platform)|rental management (?:software|system)|landlord software|real estate management software|leasing software|hoa management|homeowner association management|residential property management|property operations software|rent roll software|property management|property managers?|rental propert(?:y|ies)|real estate (?:operators?|portfolios?))\b/i,
    model: 'saas',
    notes: {
      vocabulary: ['rent roll', 'lease', 'tenant portal', 'owner statement', 'maintenance request', 'move in and move out', 'vacancy', 'rent collection', 'unit turnover', 'trust account', 'inspection'],
      buyerRoles: ['Owner of the property management company', 'Head of Operations', 'Portfolio Manager', 'Property Manager', 'Head of Accounting', 'Leasing Manager', 'Head of IT'],
      committee: 'The owner or head of operations signs; portfolio and property managers champion it and use it daily; accounting checks owner statements and trust accounts; leasing and maintenance teams use their parts of it; IT checks integrations; property owners and tenants see the portals.',
      objections: [
        { objection: 'We already have a system for rent and accounts', response: 'Show what sits between the accounting and the daily work (leasing, maintenance, tenant requests, owner reports) and offer to connect to the accounting system rather than replace it.' },
        { objection: 'Tenants and owners will not use portals', response: 'Show the simplest routes for tenants and owners (text, email, a payment link) and how many requests still need staff.' },
        { objection: 'Moving ledgers and leases is risky', response: 'Plan the migration portfolio by portfolio, reconcile balances to the last statement before cut over, and have accounting sign it off.' },
        { objection: 'Our owners want reports in their own format', response: 'Show configurable owner statements and reports, built in a real owner\'s format during the demo.' },
      ],
      salesMotion: 'Sales to the owner or head of operations, with a demo on the buyer\'s own portfolio, a migration of one portfolio as the pilot, and rollout across portfolios once balances reconcile.',
      metrics: ['vacancy days', 'rent collected on time', 'maintenance request turnaround', 'unit turnover time', 'units managed per property manager', 'owner statement turnaround', 'lease renewal rate', 'tenant satisfaction'],
      proofShape: 'One portfolio before and after on days vacant, rent collected on time or maintenance turnaround, confirmed by the portfolio manager and accounting.',
      discovery: [
        'How many units does each property manager handle, and where does their time go?',
        'How do maintenance requests come in, get assigned and get closed today?',
        'How are rent collection, late fees and owner statements handled, and how long does month end take?',
        'Which accounting system and listing sites must the product work with?',
        'What would you want to see in a pilot on one portfolio?',
      ],
    },
  },
  {
    id: 'field-services', vertical: 'vertical-saas', name: 'field and home services',
    match: /\b(?:field service(?: management| software| app| platform)?|home services? (?:software|platform|management)|service business software|job management software|service management software|technician (?:scheduling|dispatch|app|software)|work order (?:software|management)|hvac software|plumbing software|electrician software|pest control software|cleaning business software|landscaping software|service scheduling software|(?:home|commercial|residential)(?: and (?:home|commercial|residential))? services? (?:businesses|companies|contractors|software|platform)|service (?:trades|contractors)|trades businesses|service technicians|hvac|plumbing)\b/i,
    model: 'saas',
    notes: {
      vocabulary: ['work order', 'job scheduling', 'technician', 'service agreement', 'quote and estimate', 'on site payment', 'job photos', 'first time fix', 'parts on the van', 'recurring maintenance'],
      buyerRoles: ['Owner of the service business', 'General Manager', 'Operations Manager', 'Dispatcher or Office Manager', 'Head of Service', 'Technician Lead', 'Bookkeeper or Head of Finance'],
      committee: 'The owner or general manager signs; the operations manager or office manager champions it; dispatchers and technicians use it daily; the bookkeeper checks invoicing and the accounting link; the owner weighs payback.',
      objections: [
        { objection: 'Our technicians will not use an app', response: 'Pilot with one crew that includes a sceptic, use an app that works with a weak signal and needs few taps, and agree how use is measured.' },
        { objection: 'We use paper, a calendar and a spreadsheet and it works', response: 'Map one real day of jobs and show where calls, double bookings and lost paperwork cost time and money.' },
        { objection: 'It costs too much per technician', response: 'Tie the price to jobs completed, invoices sent sooner and calls the office no longer has to take.' },
        { objection: 'Customers will not like the change', response: 'Show the customer messages (arrival window, quote approval, online payment) and test them with a few regular customers.' },
      ],
      salesMotion: 'Owner led with a short cycle, often a trial or a demo built on the buyer\'s own jobs and price list, with onboarding help to load customers; growth comes with more technicians on the product.',
      metrics: ['jobs per technician per day', 'first time fix rate', 'time from job done to invoice sent', 'days to get paid', 'repeat visits', 'quote acceptance rate', 'schedule utilisation', 'service agreements renewed'],
      proofShape: 'A few weeks of jobs before and after on jobs per technician, time to invoice and days to get paid, from the business\'s own records.',
      discovery: [
        'How does a job go from a customer call to a scheduled technician today?',
        'How do technicians get job details, take photos and capture payment on site?',
        'How long is it from finishing a job to sending the invoice, and then to getting paid?',
        'How do you handle recurring service agreements and reminders?',
        'Which accounting tool must the jobs and invoices flow into?',
      ],
    },
  },
  {
    id: 'fmcg-retail-execution', vertical: 'vertical-saas', name: 'FMCG retail execution',
    match: /\b(?:retail execution(?: software| platform| app)?|sales force automation|field sales (?:app|software|automation)|field force automation|distributor management (?:system|software)|dms (?:software|platform)|route to market (?:software|platform)|beat planning|order capture (?:app|software)|trade promotion management|trade scheme management|secondary sales (?:software|tracking)|van sales (?:software|app)|perfect store)\b/i,
    model: 'saas',
    notes: {
      vocabulary: ['distributor', 'outlet', 'beat plan', 'secondary sales', 'general trade', 'SKU', 'order capture', 'retail execution', 'DMS', 'trade scheme'],
      buyerRoles: ['National Sales Head', 'Head of Sales Operations', 'Head of Distribution', 'Regional Sales Manager', 'Managing Director', 'CIO'],
      committee: 'The National Sales Head or Managing Director signs; the Head of Sales Operations champions; regional managers and field reps use it; distributors hold the stock and order data; IT checks the ERP and DMS integration.',
      objections: [
        { objection: 'Reps will not use another app', response: 'Propose an adoption plan: one region first, an app that works offline on low end phones, and incentives tied to orders captured in the app.' },
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
  },
  {
    id: 'industry-hr-payroll', vertical: 'vertical-saas', name: 'HR and payroll built for one industry',
    match: /\b(?:payroll software|hr and payroll|hr software|hr platform|hris|human resources? (?:software|information system)|workforce management (?:software|platform)|time and attendance|shift scheduling|employee scheduling|timekeeping|staff scheduling|labou?r management|payroll and compliance|payroll (?:and|with) (?:[a-z-]+ ){1,3}(?:software|platform|app|system)|hrms|payroll (?:platform|suite|system|solution)s?|hr (?:and|&) payroll|human capital management|hcm (?:software|platform)|employee management software)\b/i,
    model: 'saas',
    notes: {
      vocabulary: ['shift scheduling', 'time and attendance', 'pay rules', 'union and wage rules', 'overtime', 'labour compliance', 'pay run', 'timesheet', 'onboarding paperwork', 'tip or incentive pay'],
      buyerRoles: ['Chief Human Resources Officer', 'Head of HR', 'Payroll Manager', 'Chief Financial Officer', 'Operations Head who manages shift workers', 'Compliance Lead', 'Head of IT'],
      committee: 'HR or the CFO signs; the payroll manager champions it and runs the pay cycle in it; operations managers and shift supervisors use scheduling and time capture; finance checks cost and the accounting link; compliance and legal review the wage rules; IT checks integrations.',
      objections: [
        { objection: 'Our pay rules are too particular for a standard product', response: 'Take the hardest pay rules from real timesheets, show the product working them out, and say what is configured and what is custom.' },
        { objection: 'Switching payroll is risky', response: 'Plan the cut over at a pay period boundary, run a parallel pay run first, and have the payroll manager sign off.' },
        { objection: 'We already have HR and payroll from a large suite', response: 'Show the gap between the suite and the daily needs of the industry, and offer to connect to it rather than replace it.' },
        { objection: 'Managers and workers will not use another app for time and shifts', response: 'Pilot at one site with a mobile first flow and measure adoption by role.' },
      ],
      salesMotion: 'HR or finance led, with a demo built on the buyer\'s own pay rules, a parallel pay run as proof, and a cut over at a pay period boundary.',
      metrics: ['payroll errors and corrections', 'pay run turnaround', 'overtime cost', 'schedule coverage', 'manager time spent on scheduling', 'compliance exceptions', 'time and attendance adoption', 'employee turnover'],
      proofShape: 'One site or pay group run in parallel with the current process, on payroll errors and time to complete a pay run, signed off by the payroll manager.',
      discovery: [
        'Which pay rules are particular to your industry, and where do errors come from today?',
        'How are hours captured, approved and sent to payroll?',
        'How do managers build and change shift schedules now?',
        'Which compliance rules or reports (wage rules, union agreements, labour laws) must the system handle?',
        'Which accounting and HR systems must it connect to, and when is a safe time to switch?',
      ],
    },
  },
  {
    id: 'hotel-lodging', vertical: 'vertical-saas', name: 'hotels and lodging operations',
    match: /\b(?:hotel (?:management|operating|software|pms)|hospitality (?:management|software|platform)|operating system (?:built |made |designed )?(?:for|to power) (?:modern |boutique |independent )?(?:hotels|hospitality)|channel managers?|pms)\b/i,
    model: 'saas',
    notes: {
      vocabulary: ['front desk', 'room inventory', 'rate plan', 'channel manager', 'housekeeping', 'night audit', 'guest record', 'folio and payments', 'group and event booking', 'property reporting'],
      buyerRoles: ['General Manager or Owner', 'Revenue Manager', 'Front Office Manager', 'Director of Finance', 'Food and Beverage Manager', 'IT Manager'],
      committee: 'The owner or general manager signs; the revenue manager or front office manager champions it; front desk, housekeeping and food and beverage staff use it all day; finance checks the night audit, tax and payment reconciliation; IT checks the channel, payment and accounting links.',
      objections: [
        { objection: 'We already have a property system that works', response: 'Map one real day at the front desk and the night audit, show where staff re-key or reconcile by hand, and offer to keep the channel and accounting links that already work.' },
        { objection: 'Staff will not learn a new system in the busy season', response: 'Start in a quiet period, train front desk and housekeeping first, and agree how adoption is measured by department.' },
        { objection: 'Our channels, payments and accounting must keep working', response: 'Name the channel managers, payment providers and accounting tools involved and show each working on the buyer\'s own rate plans and guest folios.' },
        { objection: 'Moving our reservations and rates is risky', response: 'Move one property at a time, check future reservations and balances against the old system before the switch, and have the finance lead sign it off.' },
      ],
      salesMotion: 'Owner or general manager led, with a demo on the buyer\'s own rooms, rates and channels, a pilot at one property and a staged rollout across the group; payment processing and add on modules are priced as separate lines.',
      metrics: ['night audit time', 'direct booking share', 'check in time per guest', 'overbookings and rate errors', 'payment reconciliation effort', 'revenue per available room', 'adoption by department'],
      proofShape: 'One property before and after on night audit time, rate and overbooking errors and payment reconciliation, measured by its own staff across a busy and a quiet period.',
      discovery: [
        'Which systems run reservations, rates, housekeeping, point of sale and accounting today, and how do they hand data to each other?',
        'What does the night audit involve, and where do staff re-key or reconcile by hand?',
        'How do card payments reach your accounts, and who reconciles them?',
        'Which channels and booking sources feed the property, and how do rates and availability reach them?',
        'What would make a pilot at one property a clear success?',
      ],
    },
  },
  {
    id: 'retail-restaurant-ops', vertical: 'vertical-saas', name: 'retail, restaurant and distribution operations',
    match: /\b(?:(?:restaurant|retail|supermarket|distribution) (?:erp|pos)|(?:restaurant|retail) management (?:software|system|package)|restaurant (?:management|ordering) (?:software|system|platform)|(?:pos|point of sale) (?:software|system))\b/i,
    model: 'saas',
    notes: {
      vocabulary: ['billing counter', 'item and stock count', 'purchase order', 'supplier invoice', 'stock transfer between outlets', 'loyalty and offers', 'kitchen order', 'day end close', 'tax invoice', 'multi outlet reporting'],
      buyerRoles: ['Business Owner', 'Head of Operations or Outlet Manager', 'Accounts or Finance Head', 'Purchase or Category Manager', 'Billing Counter Lead', 'IT or Systems Lead'],
      committee: 'The owner signs; the operations head or outlet manager champions it; billing counter, store and kitchen staff use it all day; the accounts head checks tax invoices and the accounting link; purchase managers use the stock and supplier parts; IT checks the payment, online ordering and accounting links.',
      objections: [
        { objection: 'We already run billing software that works', response: 'Map one real day at one counter, show where staff re-key bills or count stock by hand, and offer to keep the accounting and payment tools already in place.' },
        { objection: 'Counter staff will not learn a new screen at peak hours', response: 'Start at one outlet in a quiet week, train the counter staff first, and agree how speed at the counter is measured.' },
        { objection: 'Stock and accounts must tie out', response: 'Show stock, purchase and sales posting to the accounts on the buyer\'s own items, and have the accounts head test a day close before signing.' },
        { objection: 'Moving our items, prices and opening stock is risky', response: 'Move one outlet at a time, load the item list and opening stock from the old system, and check the first day end close against the old one.' },
      ],
      salesMotion: 'Owner led with a short cycle, a demo on the buyer\'s own item list and prices, a pilot at one outlet or counter and a staged rollout; add on modules and online ordering are priced as separate lines.',
      metrics: ['billing time per customer', 'stock accuracy', 'stockouts and wastage', 'day end close time', 'purchase and supplier invoice errors', 'adoption by outlet', 'repeat customers through loyalty'],
      proofShape: 'One outlet before and after on billing time, stock accuracy and day end close, measured by its own staff over a full week of trading.',
      discovery: [
        'Which tools run billing, stock, purchase and accounting today, and how does data move between them?',
        'How long does a bill take at the counter at peak hours, and what slows it?',
        'How do you count stock and find mismatches today?',
        'How many outlets or counters are there, and what differs between them?',
        'What would make a pilot at one outlet a clear success?',
      ],
    },
  },
  {
    id: 'agents-copilots', vertical: 'ai-native', name: 'AI agents and copilots for a business function',
    match: /\b(?:ai agents?|ai agent platform|ai copilots?|copilots?|ai (?:workers?|coworkers?|teammates?|employees?|sdrs?)|digital (?:workers?|employees?|coworkers?)|autonomous agents?|agentic (?:ai|platform|workflows?|automation)|ai workforce)\b/i,
    model: 'saas',
    notes: {
      vocabulary: ['agent', 'copilot', 'workflow', 'guardrails', 'human approval', 'tool access', 'handoff', 'audit log', 'evaluation on your own tasks', 'task completion', 'autonomy level'],
      buyerRoles: ['Head of the business function the agent works in', 'Head of Data and AI', 'Chief Technology Officer', 'CISO', 'Head of Risk and Compliance', 'Operations Lead', 'Legal Counsel'],
      committee: 'The head of the function the agent works in signs; the team lead who owns the process champions it and the AI or engineering lead evaluates it; security reviews tool access and data; risk and compliance review what the agent may do alone; the people who work beside it use it.',
      objections: [
        { objection: 'Can we trust an agent to act on its own?', response: 'Agree autonomy levels: begin with suggestions, then actions with approval, then limited actions alone, and let the buyer name the actions that never run unattended.' },
        { objection: 'It needs access to our systems and data', response: 'List each tool and permission, give the least access needed, separate read from write, log every action, and say who can revoke access.' },
        { objection: 'We tried a copilot and people stopped using it', response: 'Pilot with one team on one task and measure use and time saved after the first few weeks, not after the demo.' },
        { objection: 'It will not behave the same way every time', response: 'Show an evaluation on your own tasks built from the buyer\'s own cases, run before every change, and the rule for when a person steps in.' },
      ],
      salesMotion: 'A pilot on one task with one team, with approval steps and success measures agreed first; autonomy is widened step by step as the evaluation results hold.',
      metrics: ['task completion rate', 'how often a person has to step in', 'time saved per task', 'cost per task', 'errors caught by a reviewer', 'adoption by the team', 'actions taken without approval', 'turnaround time per task'],
      proofShape: 'One team and one task: completion and review results on the buyer\'s own cases against the way the task is done today, with the share that needed a person.',
      discovery: [
        'Which task would you hand to an agent first, and which actions must always have a person approve?',
        'Which tools and systems must the agent use, and what can it read versus change?',
        'How is that task done and checked today, and how long does it take?',
        'What happened with earlier automation or copilot attempts?',
        'Who owns the result if the agent gets it wrong?',
      ],
    },
  },
  {
    id: 'voice-language-models', vertical: 'ai-native', name: 'voice and language models',
    match: /\b(?:voice ai|ai voice|speech ai|speech recognition|speech to text|text to speech|voice cloning|voice models?|speech models?|(?:large )?language models?|foundation models?|llm (?:provider|api)|transcription (?:api|models?))\b/i,
    model: 'saas',
    notes: {
      vocabulary: ['latency', 'word error rate', 'accent and language coverage', 'streaming', 'fine tuning', 'context window', 'real time', 'speech to text', 'text to speech', 'model quality', 'API'],
      buyerRoles: ['Chief Technology Officer', 'VP Engineering', 'Head of Product', 'Head of Data and AI', 'Machine Learning Lead', 'Head of Procurement', 'CISO'],
      committee: 'The CTO or head of product signs; the engineering or machine learning lead who builds with it champions it and runs the evaluation; security and legal review data handling and terms; procurement and finance check usage pricing and commitments.',
      objections: [
        { objection: 'Quality on our languages, accents or domain words', response: 'Run an evaluation on the buyer\'s own audio or prompts and report by language, noise condition or task, next to the current provider.' },
        { objection: 'Latency and reliability at our scale', response: 'Share response times measured in a load test close to the buyer\'s traffic, plus the uptime record and the fallback arrangements.' },
        { objection: 'Usage cost will grow with us', response: 'Model the cost for the buyer\'s own volumes, show volume tiers and commitments, and show how the cost per unit changes as volume grows.' },
        { objection: 'Our data cannot be used for training or leave our region', response: 'State processing locations, retention and training use plainly, and offer the options for regional or private deployment.' },
      ],
      salesMotion: 'Developer led: engineers try the API or model first, then an evaluation on the buyer\'s own data, then a usage based or committed contract after security and legal review.',
      metrics: ['word error rate', 'response latency', 'uptime of the service', 'cost per minute of audio or per request', 'quality scores on the buyer\'s own samples', 'language and accent coverage', 'time to integrate', 'requests handled at peak'],
      proofShape: 'A side by side evaluation on the buyer\'s own audio or prompts against the current provider, with quality, latency and cost per unit reported together.',
      discovery: [
        'What will you build with it, and what does the end user do in the first minute?',
        'Which languages, accents, noise conditions or domain words matter most?',
        'What response time does your product need, and what volume at peak?',
        'Which provider or model do you use today, and what do you dislike about it?',
        'Where may the data be processed and stored, and what is kept?',
      ],
    },
  },
  {
    id: 'enterprise-search', vertical: 'ai-native', name: 'enterprise search and work assistants',
    match: /\b(?:enterprise search(?: assistant| platform| tool)?|workplace search|work assistants?|workplace assistants?|knowledge assistants?|search assistants?|internal search|unified search|company search|answer engine|ai search|knowledge search)\b/i,
    model: 'saas',
    notes: {
      vocabulary: ['connectors', 'permissions aware', 'source citations', 'knowledge base', 'indexing', 'answer quality', 'company apps', 'relevance', 'access control', 'freshness'],
      buyerRoles: ['Chief Information Officer', 'Head of Digital Workplace', 'Head of IT', 'CISO', 'Head of Knowledge Management', 'Chief Technology Officer', 'Head of the team that answers employee questions'],
      committee: 'The CIO or head of the digital workplace signs; the knowledge or IT lead champions it; the CISO and the data protection team review how permissions carry across and where content is processed; department heads who feel the cost of lost answers back it; employees use it daily.',
      objections: [
        { objection: 'It might show people documents they should not see', response: 'Show that results follow the permissions of each source app, how that stays in sync, and test with real restricted documents in the pilot.' },
        { objection: 'Our content is messy and scattered', response: 'Start with the few sources people use most, measure answer quality on real questions, and plan cleanup only where it matters.' },
        { objection: 'Each of our apps already has search or an assistant', response: 'Show cross app questions that no single app can answer, using the buyer\'s own examples.' },
        { objection: 'Will people actually use it?', response: 'Pilot with a team that asks many questions, measure weekly use and time saved, and place it where people already work, such as chat or the browser.' },
      ],
      salesMotion: 'IT led pilot connected to a few sources for one or two departments, a security review of permissions and data handling, then a rollout department by department.',
      metrics: ['answer accuracy on real questions', 'answers with source citations', 'searches that end without an answer', 'weekly active use', 'time to find information', 'sources connected', 'permission errors found', 'how to questions sent to the help team'],
      proofShape: 'A pilot team\'s real questions answered and scored by the people who asked, with use over several weeks and time to find information against before.',
      discovery: [
        'Which apps hold the knowledge people look for, and which are hardest to search?',
        'What do employees ask most often, and where do they look first?',
        'How are permissions managed across those apps, and what must never surface?',
        'What do you have today (built in search, a wiki, an assistant in a suite) and where does it fall short?',
        'Which team would you pilot with, and how would you judge the answers?',
      ],
    },
  },
  {
    id: 'it-services', vertical: 'ites', name: 'IT services and application services',
    match: /\b(?:it services|it outsourcing|it support services|it consulting|it infrastructure services|managed (?:it |cloud |network |infrastructure )?services?|managed service desk|service desk|application (?:services|maintenance|management|support|portfolios?)|infrastructure (?:management|support|services)|systems? integrat(?:ors?|ion)|cloud migration services|erp implementation|it operations)\b/i,
    model: 'services',
    notes: {
      vocabulary: ['SLA', 'statement of work', 'transition', 'steady state', 'service credits', 'governance', 'ticket backlog', 'knowledge transfer', 'managed service', 'application portfolio'],
      buyerRoles: ['Chief Information Officer', 'VP IT Operations', 'Head of Applications', 'Head of Infrastructure', 'Head of Procurement', 'Vendor Management Lead', 'Chief Financial Officer'],
      committee: 'The CIO or business unit head signs; the IT operations or service owner champions it; procurement and vendor management run the commercial process; finance checks rates; security checks access and compliance.',
      objections: [
        { objection: 'Transition risk from the current provider', response: 'Show a staged transition plan with knowledge transfer, a parallel run and exit criteria for each stage.' },
        { objection: 'The offshore alternative is cheaper', response: 'Compare the total cost of the outcome (SLA attainment, rework, management time), not the hourly rate.' },
        { objection: 'Attrition and key people', response: 'Name the team model, the backup for key roles and how knowledge is documented.' },
        { objection: 'Lock in', response: 'Offer clear exit terms and documentation the client owns.' },
      ],
      salesMotion: 'RFP led or relationship led; proposals carry a transition plan, a governance model and references from similar clients.',
      metrics: ['SLA attainment', 'mean time to resolve', 'incident and problem trends', 'backlog age', 'cost per ticket or per FTE', 'customer satisfaction', 'transition milestones met'],
      proofShape: 'SLA and cost outcomes at a similar client, with the transition timeline that was actually met.',
      discovery: [
        'Which services are in scope, and what does the current SLA say?',
        'What went wrong with the current provider, in the client\'s own words?',
        'How will the transition be governed, and who signs off each stage?',
        'How is the service priced today (per FTE, per ticket, fixed price or outcome based)?',
        'Which reports does the client\'s leadership read every month?',
      ],
    },
  },
  {
    id: 'bpo-cx', vertical: 'ites', name: 'BPO and customer experience outsourcing',
    match: /\b(?:bpo|bpm|bpaas|kpo|business process (?:outsourcing|management|services)|(?<!cloud )contact cent(?:re|er)s?|(?<!cloud )call cent(?:re|er)s?|customer (?:support|service|care) outsourcing|outsourced (?:customer )?(?:support|service|care)|customer experience (?:outsourcing|services|management)|back office (?:operations|outsourcing|services)|customer support operations|content moderation services|collections (?:outsourcing|services))\b/i,
    model: 'services',
    notes: {
      vocabulary: ['contact volume', 'average handle time', 'first contact resolution', 'quality score', 'workforce planning', 'schedule adherence', 'omnichannel', 'escalation', 'knowledge base', 'peak season', 'ramp'],
      buyerRoles: ['Chief Customer Officer', 'Head of Customer Support', 'Head of Customer Experience', 'Chief Operating Officer', 'Head of Procurement', 'Vendor Management Lead', 'Chief Financial Officer'],
      committee: 'The head of customer experience or the COO signs; the head of support champions it and owns the service levels; procurement runs the commercial process; finance checks the price per seat, hour or contact; legal, security and compliance review data handling and call recording; the brand\'s own quality team audits the work.',
      objections: [
        { objection: 'Our customers will notice a drop in quality', response: 'Agree quality scoring on the brand\'s own scorecard, a staged ramp with calibration sessions, and the right to pull work back.' },
        { objection: 'Other vendors quote less', response: 'Compare the cost per resolved contact together with quality, repeat contacts and management effort, not the rate per seat or hour.' },
        { objection: 'Agent attrition will hurt service', response: 'Describe hiring, training, coaching and retention practices, and the bench kept ready for peaks.' },
        { objection: 'Data security and customer privacy', response: 'State the controls you actually have: secure floor and remote rules, access, call recording, tools and audits.' },
      ],
      salesMotion: 'RFP led or relationship led; proposals carry a transition and ramp plan, a quality and governance model, pricing options (per seat, hour, contact or outcome) and references from similar brands, often starting with a pilot queue.',
      metrics: ['customer satisfaction', 'first contact resolution', 'average handle time', 'quality score', 'service level on answer times', 'schedule adherence', 'agent attrition', 'cost per resolved contact'],
      proofShape: 'A pilot queue or an existing client brand with quality, resolution and cost per contact before and after, and the ramp timeline that was actually met.',
      discovery: [
        'Which channels and contact types are in scope, and how do they split between simple and complex?',
        'How is quality scored today, and what do customers complain about most?',
        'How do volumes swing across the year, and how is the surge handled now?',
        'How is the work priced today (per seat, hour, contact or outcome)?',
        'Which systems, knowledge sources and data rules must the team work within?',
      ],
    },
  },
  {
    id: 'digital-engineering', vertical: 'ites', name: 'digital engineering and product engineering',
    match: /\b(?:digital engineering|product engineering|software engineering services|software development services|custom software development|application modernisation|application modernization|moderni[sz]ation and management of applications|application (?:discovery|migration|transformation)|code transformation|mobile app development|product development services|outsourced (?:software|product) development|cloud native engineering|embedded engineering|engineering as a service|quality engineering services|r&d services)\b/i,
    model: 'services',
    notes: {
      vocabulary: ['product roadmap', 'engineering team', 'sprint', 'dedicated team', 'modernisation', 'cloud native', 'quality engineering', 'release cadence', 'technical debt', 'fixed scope', 'time and materials', 'code ownership'],
      buyerRoles: ['Chief Technology Officer', 'VP Engineering', 'Chief Product Officer', 'Head of Digital', 'Head of Procurement', 'Chief Financial Officer', 'Business Unit Head'],
      committee: 'The CTO, product head or head of digital signs; the product or engineering lead who owns the roadmap champions it; engineering managers judge the quality of the team; procurement and legal handle contract terms, intellectual property and security; finance checks the commercial model.',
      objections: [
        { objection: 'We would rather hire our own engineers', response: 'Compare the time and cost to hire, ramp up and retain against a team that can start soon, and offer a path to move the team or the knowledge in house.' },
        { objection: 'Quality and code ownership', response: 'Show the engineering practices (reviews, tests, release pipeline), put the code in the buyer\'s repositories from day one, and show working software every sprint.' },
        { objection: 'Time zones and communication', response: 'Agree overlap hours, regular rituals and a named lead on each side before the start.' },
        { objection: 'Lock in on a product we depend on', response: 'Offer a clean handover, documentation and exit terms, with the buyer owning everything built.' },
      ],
      salesMotion: 'Relationship and reference led: a discovery stage or a paid pilot sprint, a proposal with the team model and commercial model (dedicated team, fixed scope or time and materials), then a statement of work that grows as trust grows.',
      metrics: ['delivery against the roadmap', 'release frequency', 'escaped defects', 'predictability of delivery', 'time to ramp a new team', 'engineer attrition on the account', 'client satisfaction', 'cost per delivered outcome'],
      proofShape: 'A shipped product or a modernised system at a similar client, with release cadence, quality and the timeline from start to first release.',
      discovery: [
        'What are you building or modernising, and what does done look like?',
        'Which skills do you lack today, and what has hiring them been like?',
        'How do you want the work organised: a dedicated team, fixed scope or time and materials?',
        'Who owns the roadmap on your side, and how often do you want to see working software?',
        'What are your rules for code ownership, security and tools?',
      ],
    },
  },
  {
    id: 'data-services', vertical: 'ites', name: 'data and analytics services',
    match: /\b(?:data (?:and|&) analytics services|data analytics services|analytics services|data engineering services|data (?:annotation|labell?ing) services|data annotation|data labell?ing|data science services|business intelligence services|analytics consulting|data management services|data migration services|data platform implementation|data quality services)\b/i,
    model: 'services',
    notes: {
      vocabulary: ['data pipeline', 'data quality', 'dashboards', 'data platform', 'model build', 'annotation', 'labelling', 'governance', 'single source of truth', 'metric definitions', 'handover'],
      buyerRoles: ['Chief Data Officer', 'Head of Analytics', 'Chief Technology Officer', 'Head of Business Intelligence', 'Chief Financial Officer', 'Business Unit Head', 'Head of Procurement'],
      committee: 'The chief data officer or a business unit head signs; the analytics or data lead champions it; business users who read the reports decide whether the work is useful; IT and security review data access and tools; procurement and finance review the commercial terms.',
      objections: [
        { objection: 'We have an internal analytics team', response: 'Position the work as extra capacity or specialist skills for named projects, working beside the team with a plan to hand over.' },
        { objection: 'Data access and privacy', response: 'Describe how data is accessed, masked and kept in the buyer\'s environment, and which controls and audits you actually hold.' },
        { objection: 'Past projects ended with reports no one used', response: 'Start from a business decision and the person who makes it, and agree how use will be measured after launch.' },
        { objection: 'It is hard to judge quality before we commit', response: 'Offer a small paid sample or pilot on one dataset with agreed quality checks.' },
      ],
      salesMotion: 'Consultative and project led: a scoped pilot on one dataset or one decision, then a larger statement of work or a managed analytics contract; references and sample work carry weight.',
      metrics: ['data quality checks passed', 'pipeline reliability', 'report and dashboard adoption', 'turnaround time per request', 'accuracy of labelled data', 'decisions supported by the work', 'cost per unit of work', 'client satisfaction'],
      proofShape: 'One dataset or decision at a similar client: quality checks passed, how the output was used and what changed, with the timeline from start to first useful output.',
      discovery: [
        'Which decision or product should this data work support, and who makes it?',
        'Where does the data live today, and how clean is it?',
        'What do you have in house in people and tools, and what is missing?',
        'How will you judge the quality of the output?',
        'What are your rules on data access, privacy and where the work may be done?',
      ],
    },
  },
  {
    id: 'operators-connectivity', vertical: 'telecom', name: 'operators and enterprise connectivity',
    match: /\b(?:enterprise connectivity|managed connectivity|managed network(?: services?)?|network services?|internet leased lines?|leased lines?|business internet|broadband (?:services?|provider)|sd.wan|mpls (?:network|links?|services?)|mobile network operator|network operator|connectivity (?:provider|services?)|wan services?)\b/i,
    model: 'connectivity',
    notes: {
      vocabulary: ['SD-WAN', 'MPLS', 'internet leased line', 'uptime', 'SLA', 'latency', 'branch sites', 'last mile link', 'network operations centre', 'site survey'],
      buyerRoles: ['Chief Information Officer', 'Head of IT Infrastructure', 'Network Manager', 'CISO', 'Head of Procurement', 'Chief Financial Officer'],
      committee: 'The CIO signs; the network or infrastructure head champions; the CISO reviews the security overlay; procurement compares rate cards; finance checks the cost per site.',
      objections: [
        { objection: 'Price per site compared with the operator we use today', response: 'Compare the total cost per site, including outages, repair time and the IT team\'s time spent managing links.' },
        { objection: 'Migration risk across many sites', response: 'Propose a wave plan by region with fallback links and a rollback rule for each wave.' },
        { objection: 'We have a long relationship with our current operator', response: 'Agree which sites to compare first and which service measures decide, so the results rather than the relationship make the case.' },
        { objection: 'Security overlay', response: 'Show how the network and the security controls are managed together and who responds to an incident.' },
      ],
      salesMotion: 'Account based enterprise sales, often an RFP or rate card comparison, with a site survey and pilot sites before the rollout.',
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
  },
  {
    id: 'cpaas-messaging', vertical: 'telecom', name: 'CPaaS and messaging',
    match: /\b(?:messaging (?:platform|api|service)|business (?:texts?|messaging)|text messaging (?:platform|api|service)|sms (?:gateway|api|platform|service)|bulk sms|sms (?:messages?|traffic|channels?)|messages? over sms|(?:over|via|through) sms|cpaas|communications platform as a service|voice api|one time passwords?|otp (?:delivery|messages?|service)|whatsapp (?:business )?(?:messaging|api)|rcs messaging|whatsapp business|a2p|business messaging|omnichannel messaging|communications apis?|voice and messaging|(?:cloud )?communications platforms?|programmable (?:voice|sms|messaging|video)|(?:voice|video) apis?)\b/i,
    model: 'transactions',
    notes: {
      vocabulary: ['delivery rate', 'sender registration', 'message routing', 'one time password', 'two way messaging', 'opt in and opt out', 'throughput', 'fraud filtering', 'artificial traffic', 'delivery report'],
      buyerRoles: ['Chief Technology Officer', 'VP Engineering', 'Head of Product', 'Head of Customer Engagement', 'Head of Fraud and Risk', 'Head of Procurement', 'Data Protection Officer'],
      committee: 'The product, engineering or customer engagement owner who depends on the messages signs; the engineering lead who integrates the API champions; fraud and risk look at abuse and artificial traffic; legal and data protection check consent and sender rules; procurement and finance compare the price per message.',
      objections: [
        { objection: 'Price per message compared with other providers', response: 'Compare the cost per delivered message, including messages that fail or are filtered, and the money lost to artificial traffic, not only the list price.' },
        { objection: 'Delivery to some countries or networks is unreliable', response: 'Offer test sends to the buyer\'s own top destinations and show delivery reports by route before any commitment.' },
        { objection: 'We already use a provider and cannot switch everything', response: 'Position it as a second route with automatic failover, agree the traffic split, and move more only when the results justify it.' },
        { objection: 'Consent, sender registration and compliance rules', response: 'State clearly who owns consent, sender registration and opt out handling, and show the tooling that supports each one.' },
      ],
      salesMotion: 'Developer led trial with test credits, then a sales assisted commitment shaped by volume, destination countries and message types.',
      metrics: ['delivery rate', 'time to deliver', 'verification success rate', 'cost per delivered message', 'artificial traffic blocked', 'opt out rate', 'API uptime', 'reply rate'],
      proofShape: 'Test send results across the buyer\'s top destinations, with delivery rate and speed by route compared with the current provider over the same period.',
      discovery: [
        'Which message types do you send (login codes, alerts, reminders, marketing, two way), and to which countries?',
        'How do you measure delivery today, and who sees the delivery reports?',
        'What happens to a user when a code arrives late or not at all?',
        'How do you spot and stop fraud or artificial traffic on your messages today?',
        'Which providers and systems are connected today, and how does failover work?',
      ],
    },
  },
  {
    id: 'telecom-software', vertical: 'telecom', name: 'software and clearing services sold to operators',
    match: /\b(?:roaming (?:clearing|settlement|services?|platform)|clearing (?:house|services?)|signalling (?:security|firewall|services?)|sms firewall|(?:billing|operations) support systems?|(?:oss|bss)(?: software| platform)?|telecom billing|mediation (?:platform|software)|revenue assurance|number portability|interconnect (?:billing|settlement))\b/i,
    notes: {
      vocabulary: ['roaming', 'clearing and settlement', 'signalling', 'interconnect', 'billing support system', 'operations support system', 'mediation', 'revenue assurance', 'partner agreements', 'tariff plans'],
      buyerRoles: ['Chief Technology Officer', 'Chief Financial Officer', 'VP Network Operations', 'Head of Wholesale and Roaming', 'Head of Revenue Assurance', 'Head of Billing', 'Head of Procurement'],
      committee: 'The CTO or CFO signs; the head of wholesale, billing or revenue assurance champions; network and IT teams integrate with the core and billing systems; security and the regulator affairs team review data handling; procurement runs a multi vendor evaluation.',
      objections: [
        { objection: 'Replacing a core system is too risky', response: 'Run alongside the current system in shadow mode first, then move one partner or traffic flow at a time with a rollback rule.' },
        { objection: 'Our current vendor already covers this', response: 'Compare on outcomes the finance and wholesale teams care about (leakage found, disputes closed, new partners onboarded), not on a feature list.' },
        { objection: 'Integration with our core network and billing', response: 'Name the interfaces and data feeds needed, test them in a lab or shadow run, and agree who on the operator side owns each one.' },
        { objection: 'Regulatory approval and where data is stored', response: 'State where records are processed and kept, how long, and who can access them, and map each regulatory requirement the buyer names to a control.' },
      ],
      salesMotion: 'Long enterprise sale to an operator, usually an RFP, then a proof of concept in shadow mode on one partner or network before a phased rollout.',
      metrics: ['revenue leakage found', 'dispute resolution time', 'settlement cycle time', 'fraud losses', 'partner onboarding time', 'billing accuracy', 'system uptime', 'cost per record processed'],
      proofShape: 'A shadow run on the operator\'s own records showing the discrepancies found and the value recovered, signed off by the finance or revenue assurance team.',
      discovery: [
        'Which partner agreements and traffic types are in scope, and how many partners do you settle with?',
        'How long do settlement and disputes take today, and where do they stall?',
        'Where do you suspect revenue leaks or fraud gets through today?',
        'Which core, billing and mediation systems must feed this, and who owns each interface?',
        'How long does a vendor change take here, and who must approve it?',
      ],
    },
  },
  {
    id: 'business-voice-ucaas', vertical: 'telecom', name: 'business voice and unified communications',
    match: /\b(?:cloud phone systems?|business phone (?:systems?|service)|unified communications?|ucaas|ccaas|contact cent(?:re|er) (?:platform|software)|cloud pbx|hosted pbx|sip trunk(?:ing|s)?|voip (?:phone|service|system)s?|softphones?)\b/i,
    model: 'saas',
    notes: {
      vocabulary: ['cloud phone system', 'SIP trunking', 'call quality', 'softphone', 'auto attendant', 'call routing', 'number porting', 'seats', 'desk phone replacement', 'contact centre'],
      buyerRoles: ['Chief Information Officer', 'Head of IT', 'Head of Telephony and Communications', 'Head of Customer Service', 'Head of Procurement', 'Chief Financial Officer'],
      committee: 'The CIO or head of IT signs; the telephony or communications lead champions; the customer service head joins when agents are affected; the network team checks call quality; procurement and finance compare the cost per seat.',
      objections: [
        { objection: 'Call quality over our network', response: 'Run a network readiness check first and pilot with one team, measuring call quality before anything is switched off.' },
        { objection: 'Moving our numbers without a gap in service', response: 'Plan number porting in waves, keep the old lines live in parallel, and name who handles each cut over.' },
        { objection: 'Our current phone contract has years left', response: 'Map contract end dates by site, start with the sites that end first, and show the cost of running both in the overlap.' },
        { objection: 'Our collaboration suite already includes calling', response: 'Compare what users and agents can do on a call (routing, reporting, recording, integrations) rather than the list of features.' },
      ],
      salesMotion: 'Sales assisted, with a network check and a pilot team first, then a phased move site by site as old contracts end.',
      metrics: ['call quality score', 'dropped calls', 'uptime', 'seats live', 'cost per seat', 'numbers ported on time', 'support tickets about calls', 'average handling time'],
      proofShape: 'Call quality and support tickets for the pilot team compared with the old phone system over the same weeks.',
      discovery: [
        'How many users and sites make or take calls today, and on what systems?',
        'When do the current phone contracts end, site by site?',
        'Which tools must calling work with (customer records, collaboration, reporting)?',
        'What do calls cost you today and where do complaints about quality come from?',
        'Which teams are most sensitive to downtime during a move?',
      ],
    },
  },
  {
    id: 'developer-platform', vertical: 'software', name: 'developer platforms and DevOps',
    match: /\b(?:developer platforms?|devops platforms?|devsecops platforms?|source control|source code (?:management|hosting)|code hosting|git hosting|ci.cd (?:platform|tools?|pipelines?)|ci pipelines?|continuous (?:integration|delivery|deployment)|internal developer platforms?|package registry|release automation|devsecops|devops|source code|software delivery)\b/i,
    model: 'saas',
    notes: {
      vocabulary: ['pull request', 'code review', 'pipeline', 'repository', 'build minutes', 'self hosted runner', 'branch protection', 'secrets scanning', 'audit log', 'single sign on', 'toolchain sprawl'],
      buyerRoles: ['VP Engineering', 'Chief Technology Officer', 'Platform Engineering Lead', 'Head of DevOps', 'Engineering Manager', 'Security Lead', 'Head of Procurement'],
      committee: 'The VP Engineering or CTO signs; the platform or DevOps lead champions; developers use it all day; security reviews code access, scanning and audit logs; procurement and finance handle seats and usage.',
      objections: [
        { objection: 'We already stitch several tools together and it works', response: 'Map the current toolchain and show what one place removes (handoffs, admin work, duplicate seats), measured on one team.' },
        { objection: 'Moving repositories and pipelines is a big job', response: 'Show the import path that keeps history, and migrate one real project during the trial.' },
        { objection: 'We need to host it ourselves or keep code in our region', response: 'State the deployment options, where code and build data are stored, and who operates each option.' },
        { objection: 'Other tools offer a free or cheaper tier', response: 'Compare the price per active developer with the time spent maintaining and connecting the cheaper tools.' },
      ],
      salesMotion: 'Developers start on a free or trial tier, one team proves it, then a platform or engineering leadership deal covers the organisation, with a security review before it spreads.',
      metrics: ['lead time for changes', 'deployment frequency', 'build time', 'change failure rate', 'mean time to recovery', 'vulnerabilities caught before release', 'developer time saved', 'active developers per team'],
      proofShape: 'Lead time for changes or build time for one team before and after, from the team\'s own pipeline data.',
      discovery: [
        'Which tools hold your code, builds, reviews and scans today, and how are they connected?',
        'How long does a change take from first commit to running in production, and where does it wait?',
        'Where must code and build data be stored, and who reviews that?',
        'Who maintains the pipelines today, and how much of their time does that take?',
        'Which team would try it first, and what would make them stay?',
      ],
    },
  },
  {
    id: 'observability', vertical: 'software', name: 'observability and application monitoring',
    match: /\b(?:error (?:monitoring|tracking)|crash reporting|performance monitoring|application monitoring|application performance monitoring|infrastructure monitoring|observability (?:platform|tools?|software|stack)|log management|distributed tracing|apm)\b/i,
    model: 'saas',
    notes: {
      vocabulary: ['logs', 'metrics', 'traces', 'alert noise', 'on call', 'root cause', 'service level objective', 'instrumentation', 'sampling', 'retention', 'dashboard'],
      buyerRoles: ['VP Engineering', 'Head of Site Reliability Engineering', 'Platform Engineering Lead', 'Chief Technology Officer', 'Engineering Manager', 'Head of Infrastructure', 'Head of Finance'],
      committee: 'The VP Engineering or head of infrastructure signs; the site reliability or platform lead champions; on call engineers and developers use it; security reviews what data leaves the systems; finance watches the data volume bill.',
      objections: [
        { objection: 'The data volume will make it expensive', response: 'Project the bill from the buyer\'s own data volume, and show the sampling, filtering and retention controls that keep it in budget.' },
        { objection: 'We already run an open source stack', response: 'Compare the time spent running and upgrading that stack with what the product removes, on one service.' },
        { objection: 'Instrumenting every service is a big effort', response: 'Start with one service, show automatic instrumentation where it exists, and measure the time to the first useful view.' },
        { objection: 'We already get too many alerts', response: 'Show how alerts are grouped, tied to releases and sent to the right owner, so on call engineers see fewer, clearer pages.' },
      ],
      salesMotion: 'Engineers try it on one service, an incident proves the value, then a team or enterprise deal is sized on data volume and led by engineering or infrastructure leadership.',
      metrics: ['mean time to detect', 'mean time to resolve', 'incidents per month', 'alerts per on call engineer', 'error rate after releases', 'crash free sessions', 'time spent per incident', 'data cost per service'],
      proofShape: 'Time to find the root cause of real incidents on one team before and after, from the team\'s own incident records.',
      discovery: [
        'How do you find out something is broken today: a customer, an alert or a developer?',
        'What happened in your last serious incident, and how long did it take to find the cause?',
        'Which services, languages and cloud environments must be covered?',
        'How many alerts does an on call engineer get in a week, and how many matter?',
        'Who owns the data volume cost, and what limit do they work to?',
      ],
    },
  },
  {
    id: 'testing', vertical: 'software', name: 'testing and QA tools',
    match: /\b(?:software testing|test automation|test(?:ing)? (?:platforms?|tools?|cloud)|qa (?:tools?|automation|platform)|api testing|browser testing|cross.browser testing|device clouds?|test management|mobile (?:app )?testing|load testing|regression testing|visual testing)\b/i,
    model: 'saas',
    notes: {
      vocabulary: ['test suite', 'test coverage', 'flaky tests', 'regression', 'CI pipeline', 'device and browser coverage', 'release frequency', 'API', 'SDK', 'open source alternative'],
      buyerRoles: ['VP Engineering', 'Chief Technology Officer', 'Head of QA', 'Platform Engineering Lead', 'Engineering Manager', 'Security Lead'],
      committee: 'The VP Engineering or CTO signs; the head of QA or a team lead champions; developers and testers use it daily; security reviews code and data access; procurement handles seats or usage.',
      objections: [
        { objection: 'Our developers use open source tools', response: 'Compare the time spent maintaining the open source setup with what the product removes, on one team.' },
        { objection: 'Per user cost at our scale', response: 'Tie the price to the teams that use it and the time saved, measured in a trial.' },
        { objection: 'Migrating our existing scripts and tests', response: 'Show the import path and migrate one real project during the trial.' },
        { objection: 'Security review of code access', response: 'State what the product reads and stores and offer the security documentation up front.' },
      ],
      salesMotion: 'Developers and testers adopt first (a trial or free tier where offered), then a team or enterprise deal led by engineering leadership.',
      metrics: ['release frequency', 'escaped defects', 'test coverage', 'build time', 'flaky test rate', 'time to run the full suite', 'developer time saved'],
      proofShape: 'Release frequency or escaped defects on one team before and after, from the team\'s own pipeline data.',
      discovery: [
        'How often do you release, and what slows a release down?',
        'How are tests written and maintained today, and by whom?',
        'Which tools are in the pipeline today, and which would this replace or join?',
        'How do you measure escaped defects or incidents after a release?',
        'Who must approve a new testing tool (security, procurement, platform team)?',
      ],
    },
  },
  {
    id: 'dev-tools', vertical: 'software', name: 'containers and developer environments',
    match: /\b(?:container (?:platforms?|tools?|runtimes?|registry|registries)|containers? (?:and|for) developers?|developer environments?|development environments?|dev containers?|cloud (?:development|dev) environments?|remote development|local development tools?|ephemeral environments?|developer workspaces?)\b/i,
    model: 'saas',
    notes: {
      vocabulary: ['container image', 'local development', 'cloud development environment', 'dev container', 'registry', 'reproducible environment', 'image build', 'onboarding time', 'works on my machine', 'resource limits'],
      buyerRoles: ['VP Engineering', 'Head of Developer Experience', 'Platform Engineering Lead', 'Engineering Manager', 'Security Lead', 'Head of IT'],
      committee: 'The VP Engineering or head of developer experience signs; the platform lead champions; developers use it daily; security reviews images, registries and code access; IT checks laptops and licences; procurement handles seats.',
      objections: [
        { objection: 'Developers already set up their own tools', response: 'Measure the time a new hire and a switching developer lose to setup today, and show a shared environment removing it on one team.' },
        { objection: 'Laptop performance and cost', response: 'Show resource use on the buyer\'s own machines, and compare with cloud hosted environments for the heaviest projects.' },
        { objection: 'Security of images and code access', response: 'State where images and code are stored, how images are scanned, and who can pull or push; offer the security documentation up front.' },
        { objection: 'Free or open source options work for us', response: 'Compare the time spent supporting a home grown setup with what the product removes, on one team.' },
      ],
      salesMotion: 'Developers adopt on their own, a platform team standardises it for one group, then an organisation wide deal follows with a security review.',
      metrics: ['time to first commit for a new hire', 'environment setup time', 'build time', 'environment related bugs', 'image vulnerabilities open', 'cost per developer environment', 'share of developers using it'],
      proofShape: 'Setup time for new hires and build time on one team before and after, from the team\'s own onboarding and pipeline records.',
      discovery: [
        'How long does it take a new developer to run the product locally, and what goes wrong?',
        'How do you keep environments the same between laptops, the pipeline and production?',
        'Where are images built and stored today, and who scans them?',
        'Which projects are the hardest to run, and why?',
        'Who must approve a new developer tool (security, IT, platform team)?',
      ],
    },
  },
  {
    id: 'cloud-security', vertical: 'cybersecurity', name: 'cloud security',
    match: /\b(?:cloud security|cloud security posture management|cspm|cnapp|cwpp|ciem|cloud workload protection|cloud native application protection|container security|kubernetes security|cloud misconfiguration|cloud detection and response)\b/i,
    model: 'saas',
    notes: {
      vocabulary: ['attack surface', 'exposure', 'misconfiguration', 'alert fatigue', 'mean time to detect', 'mean time to respond', 'SOC', 'compliance audit', 'risk register', 'threat intelligence'],
      buyerRoles: ['CISO', 'Head of Security Operations', 'Cloud Security Lead', 'Security Architect', 'Chief Information Officer', 'Head of Risk and Compliance'],
      committee: 'The CISO signs; the SOC or cloud security lead champions; security engineers use it; risk, compliance and audit review the evidence it produces; the CIO or CTO checks integration.',
      objections: [
        { objection: 'We already have a tool for this', response: 'Map the overlap honestly and show what the current tool misses, on the buyer\'s own environment.' },
        { objection: 'We have too many alerts already', response: 'Show how findings are ranked by real exposure so the team works on fewer, more important items.' },
        { objection: 'Integration with our SIEM and ticketing', response: 'Name the integrations available today and test them in the proof of value.' },
        { objection: 'We need proof before budget', response: 'Offer a fixed length proof of value with success criteria agreed in writing first.' },
      ],
      salesMotion: 'CISO led, with a proof of value on the buyer\'s own environment; budget often follows an audit finding or an incident.',
      metrics: ['mean time to detect', 'mean time to respond', 'critical exposures open', 'alerts per analyst', 'audit findings', 'time to prepare an audit', 'asset coverage'],
      proofShape: 'Exposures found and closed during the proof of value, with the time it took to fix them.',
      discovery: [
        'Which assets, systems or environments are in scope, and which are you least sure about?',
        'How many alerts does the team handle in a week, and how are they ranked today?',
        'What did the last audit or incident show?',
        'Which tools must this work with (SIEM, ticketing, cloud accounts)?',
        'How would you judge a proof of value a success?',
      ],
    },
  },
  {
    id: 'identity-security', vertical: 'cybersecurity', name: 'identity and access',
    match: /\b(?:identity and access management|identity (?:security|governance|provider|management)|access management|privileged access (?:management|security)|single sign.on|multi.factor (?:authentication|login)|passwordless (?:login|authentication)|customer identity|identity (?:attacks?|silos|fabric|threats?)|ai agent identit(?:y|ies)|iam|ciam)\b/i,
    model: 'saas',
    notes: {
      vocabulary: ['single sign on', 'multi factor authentication', 'least privilege', 'privileged access', 'joiner mover leaver', 'access review', 'directory', 'service accounts', 'passwordless', 'session'],
      buyerRoles: ['CISO', 'Head of Identity and Access Management', 'Head of IT', 'Security Architect', 'Head of Internal Audit', 'Head of Risk and Compliance', 'Head of People Operations'],
      committee: 'The CISO or CIO signs; the identity and access lead champions; IT operations roll it out to users; application owners connect their apps; internal audit and compliance review access evidence; HR owns the joiner and leaver process it depends on.',
      objections: [
        { objection: 'Our main software suite already includes identity features', response: 'Compare what the built in features cannot do for the buyer (apps outside the suite, privileged accounts, reviews, lifecycle), using the buyer\'s own application list.' },
        { objection: 'Extra login steps will annoy users', response: 'Show adaptive rules that ask for more only when risk is higher, and pilot with one friendly group while counting help desk calls.' },
        { objection: 'Connecting all our applications and directories', response: 'List the applications and directories, show which connectors exist today, and agree the order and owner for each one.' },
        { objection: 'Our access reviews already pass audit', response: 'Show what auditors will ask next (dormant accounts, shared admin accounts, time to remove leavers) using a sample of the buyer\'s own accounts.' },
      ],
      salesMotion: 'CISO or CIO led, with a proof of value on a few important applications and one user group, followed by a phased rollout that IT and HR plan together.',
      metrics: ['accounts without multi factor', 'dormant and orphaned accounts', 'time to remove access for leavers', 'access review completion', 'privileged accounts', 'password reset tickets', 'audit findings on access'],
      proofShape: 'Dormant or excess access found and removed during the proof of value, and the time to remove a leaver\'s access before and after.',
      discovery: [
        'Which applications and directories hold your users today, and which are the hardest to connect?',
        'How quickly is access removed when someone leaves or changes role, and who does it?',
        'Which accounts have the most power (admins, service accounts), and how are they controlled?',
        'What did the last audit say about access?',
        'Which user groups would feel extra login steps most?',
      ],
    },
  },
  {
    id: 'email-security', vertical: 'cybersecurity', name: 'email security',
    match: /\b(?:email security|e.mail security|secure email gateway|anti.phishing|phishing (?:protection|simulation|defen[cs]e|detection)|business email compromise|email threat protection|email filtering|email encryption)\b/i,
    model: 'saas',
    notes: {
      vocabulary: ['phishing', 'business email compromise', 'malicious attachment', 'spoofing', 'impersonation', 'quarantine', 'secure email gateway', 'user reporting', 'awareness training', 'mailbox'],
      buyerRoles: ['CISO', 'Head of Security Operations', 'Messaging and IT Lead', 'Head of Risk and Compliance', 'Chief Financial Officer', 'Head of IT'],
      committee: 'The CISO signs; the security operations or messaging lead champions; IT runs the mail system and deploys the product; finance and executive assistants are often the targets and sponsors of the pain; compliance reviews retention and data handling.',
      objections: [
        { objection: 'Our email platform already filters phishing', response: 'Run the product in monitor mode beside the current filter and show what it missed over a set period, using the buyer\'s own mail.' },
        { objection: 'False positives will block real mail', response: 'Show how quarantine, release and allow rules work, who handles them, and the false positive record from the pilot.' },
        { objection: 'Changing mail flow is risky', response: 'Explain the deployment options (API based or gateway), the rollback step, and pilot with one group first.' },
        { objection: 'Our staff have already had training', response: 'Show that training and filtering do different jobs, and measure real reports and clicks rather than course completion.' },
      ],
      salesMotion: 'CISO or IT led, with a side by side trial on the buyer\'s own mail in monitor mode, often triggered by a phishing incident or a payment fraud attempt.',
      metrics: ['phishing emails reaching inboxes', 'user report rate', 'time to remove a message from all mailboxes', 'false positive rate', 'click rate on simulations', 'impersonation attempts stopped', 'analyst time per reported message'],
      proofShape: 'Threats the current filter missed and this product caught in a side by side run on the buyer\'s own mail, with the false positives counted.',
      discovery: [
        'Which email platform and filters do you use today?',
        'What was the last phishing or impersonation attempt that got through, and what happened?',
        'How do staff report suspicious mail, and who handles those reports?',
        'Which teams are targeted most (finance, executives, support)?',
        'How would you judge a trial a success?',
      ],
    },
  },
  {
    id: 'awareness-training', vertical: 'cybersecurity', name: 'security awareness and human risk',
    match: /\b(?:security awareness(?: training| platform| programme| program)?|awareness training|human risk(?: management)?|phishing training|security culture|behaviou?r change (?:training|platform))\b/i,
    model: 'saas',
    notes: {
      vocabulary: ['security awareness', 'human risk', 'user reporting', 'behaviour change', 'repeat clickers', 'adaptive training', 'security champions', 'suspicious message', 'completion', 'employee privacy'],
      buyerRoles: ['CISO', 'Head of Security Awareness', 'Head of Security Operations', 'Head of HR or Learning and Development', 'Head of Risk and Compliance', 'Head of IT'],
      committee: 'The CISO or the head of security awareness signs; the awareness or security operations lead champions it; HR or learning and development checks how training reaches staff; IT handles the identity and mail links; legal and employee representatives check what is recorded about each person.',
      objections: [
        { objection: 'Our staff already do a yearly course', response: 'Show that a yearly course and steady practice do different jobs, and measure real reports and risky clicks over time rather than course completion.' },
        { objection: 'Employees will feel watched or tricked', response: 'Explain what is recorded about each person, who sees it and how practice messages are framed, and agree the rules with HR and employee representatives before launch.' },
        { objection: 'It takes staff away from their work', response: 'Show short sessions tied to real mistakes, the time per person per month, and pilot with one team first.' },
        { objection: 'Our email security already catches phishing', response: 'Email security and awareness do different jobs: show the messages that still reach staff and how many of them get reported.' },
      ],
      salesMotion: 'CISO or security awareness led, often after an incident or an audit finding; a pilot with a few departments, then a company wide rollout with HR and legal involved early.',
      metrics: ['user report rate', 'repeat risky clicks', 'time to report a suspicious message', 'share of staff who took part in practice', 'reports that were real threats', 'time spent per person', 'analyst time per reported message'],
      proofShape: 'Report rate and risky click rate for a group before and after a set period, with the length of the period and the size of the group stated.',
      discovery: [
        'How do you train staff on phishing and social engineering today, and how often?',
        'What happened the last time a staff member clicked on something they should not have?',
        'How do staff report a suspicious message, and who handles those reports?',
        'Which groups carry the most risk (finance, executives, new joiners, support)?',
        'How would you judge a pilot a success, and who has to agree?',
      ],
    },
  },
  {
    id: 'appsec', vertical: 'cybersecurity', name: 'application and developer security',
    match: /\b(?:application security|appsec|static (?:application security testing|analysis)|sast|dast|software composition analysis|code scanning|secrets scanning|api security|dependency scanning|software supply chain security|devsecops (?:tools?|security))\b/i,
    model: 'saas',
    notes: {
      vocabulary: ['static analysis', 'dependency', 'software composition', 'secrets in code', 'false positive', 'pull request check', 'vulnerability backlog', 'time to fix', 'software bill of materials', 'threat model'],
      buyerRoles: ['CISO', 'Head of Application Security', 'VP Engineering', 'Security Champion in Engineering', 'Engineering Manager', 'Head of Risk and Compliance'],
      committee: 'The CISO signs; the application security lead champions; engineering leaders must agree because developers live with the results; developers use it in their pull requests and pipelines; compliance reviews the evidence it produces.',
      objections: [
        { objection: 'Developers will not tolerate noisy scanners', response: 'Show how findings are ranked by whether the code can really be reached, and pilot on one team while counting the findings developers accept.' },
        { objection: 'We already scan with open source tools', response: 'Compare the time spent running and triaging those tools with what the product removes, on the same repositories.' },
        { objection: 'It will slow down our builds', response: 'Show where scans run (on a pull request, in the background, on a schedule) and measure the time added in the pilot.' },
        { objection: 'Our vulnerability backlog is already too long', response: 'Show how the backlog shrinks when findings are ranked and fixes are suggested in the developer\'s own workflow.' },
      ],
      salesMotion: 'Security led, with a pilot on a few repositories owned by a willing engineering team, then a rollout that engineering leadership has agreed to.',
      metrics: ['open vulnerabilities by severity', 'time to fix', 'false positive rate', 'repositories covered', 'secrets found in code', 'scan time added to builds', 'findings accepted by developers'],
      proofShape: 'Real findings from a pilot on one team\'s repositories, how many the developers accepted and fixed, and how long fixing took.',
      discovery: [
        'Which languages, repositories and pipelines are in scope?',
        'How are code and dependency vulnerabilities found and fixed today, and by whom?',
        'What do developers say about the scanners they use now?',
        'How long is the backlog, and how is it ranked?',
        'What evidence do auditors or customers ask you for about your code?',
      ],
    },
  },
  {
    id: 'soc-services', vertical: 'cybersecurity', name: 'managed detection and SOC services',
    match: /\b(?:managed detection and response|managed detection|mdr (?:service|provider)|managed soc|soc as a service|security operations cent(?:re|er)|managed security services?|managed siem|incident response (?:service|retainer)|threat hunting (?:service|team)|security monitoring service)\b/i,
    model: 'services',
    notes: {
      vocabulary: ['detection', 'triage', 'escalation', 'incident response', 'runbook', 'threat hunting', 'log sources', 'retainer', 'analysts', 'coverage hours'],
      buyerRoles: ['CISO', 'Head of Security Operations', 'Chief Information Officer', 'Head of Risk and Compliance', 'Chief Financial Officer', 'Head of Procurement'],
      committee: 'The CISO signs; the head of security operations or the IT lead champions; the CIO and CFO weigh cost against building a team; compliance and legal review data handling and contract terms; procurement runs the commercial process.',
      objections: [
        { objection: 'We would lose control and visibility', response: 'Show the portal, the reports and the escalation rules, and agree what the service decides alone and what it hands back to the buyer.' },
        { objection: 'Providers only forward alerts', response: 'Show real examples of triaged cases with the analyst\'s notes, and agree that escalations must come with a recommended action.' },
        { objection: 'Our logs and data leave our environment', response: 'State where data is stored, who can read it, how long it is kept, and what the contract says about it.' },
        { objection: 'It is cheaper to hire our own analysts', response: 'Compare the full cost of the hours to be covered, including hiring, turnover, tooling and training, with the service fee.' },
      ],
      salesMotion: 'CISO or CIO led, with a scoping workshop, a trial period or onboarding on the main log sources, then a contract with agreed response times; interest often follows an incident or an audit finding.',
      metrics: ['mean time to detect', 'mean time to respond', 'share of alerts triaged by the service', 'escalations that were real', 'incidents contained', 'log source coverage', 'false escalations', 'report timeliness'],
      proofShape: 'Onboarding time and the first real or simulated incident handled, with detection and response times and the buyer\'s own verdict on the quality of the escalation.',
      discovery: [
        'Who watches your alerts today, at which hours, and what do they miss?',
        'Which systems and log sources must be covered, and which are hard to connect?',
        'What happened in your last incident, and how long did detection and response take?',
        'What should the provider decide alone, and what must come back to you?',
        'What do you need from reports for auditors, the board or customers?',
      ],
    },
  },
  {
    id: 'endpoint-network', vertical: 'cybersecurity', name: 'endpoint and network security',
    match: /\b(?:endpoint (?:security|protection|detection and response)|edr|xdr|antivirus|anti.malware|(?:next.generation )?firewalls?|secure web gateway|sase|ztna|zero trust network access|network detection and response)\b/i,
    notes: {
      vocabulary: ['endpoint agent', 'detection and response', 'malware', 'ransomware', 'patching', 'device coverage', 'firewall rules', 'segmentation', 'remote workers', 'zero trust access'],
      buyerRoles: ['CISO', 'Head of IT Infrastructure', 'Network Security Lead', 'Head of Security Operations', 'Chief Information Officer', 'Head of Procurement'],
      committee: 'The CISO or CIO signs; the security operations or network security lead champions; IT operations deploy agents and devices; the helpdesk deals with user complaints; procurement compares licences; compliance reviews the controls.',
      objections: [
        { objection: 'The agent will slow down our laptops and servers', response: 'Measure resource use on the buyer\'s own machines in a pilot and agree a limit before wider rollout.' },
        { objection: 'Protection is already included with our operating system suite', response: 'Compare what the included tool misses or cannot manage across the buyer\'s mix of devices, using one real incident or test.' },
        { objection: 'Rolling out to every device and site is a big job', response: 'Plan deployment in waves by device group and site, with an uninstall path and a named owner for each wave.' },
        { objection: 'Replacing the firewall or remote access tool risks an outage', response: 'Run the new path beside the old one, move one site or user group at a time, and agree a rollback rule.' },
      ],
      salesMotion: 'CISO or IT led, with a pilot on a group of devices or one site, a comparison against the current product, then a phased rollout planned with IT operations.',
      metrics: ['devices covered', 'time to contain a threat', 'threats blocked', 'performance complaints', 'policy exceptions', 'patch lag', 'remote access tickets', 'firewall rules cleaned up'],
      proofShape: 'Threats found or blocked in a pilot on the buyer\'s own devices or sites, compared with the current product, with the effect on user complaints.',
      discovery: [
        'Which devices, operating systems and sites are in scope, and which are unmanaged?',
        'What protection do you run today, and what has it missed?',
        'How do remote and branch users connect to applications today?',
        'Who deploys and maintains agents and rules, and how long does a change take?',
        'How would you judge a pilot a success?',
      ],
    },
  },
];

// The order in which the sectors are tried: the specific ones first, SaaS last (most text mentions software). It breaks a
// tie only after the score and the position of the first strong word.
const ORDER: VerticalId[] = ['vertical-saas', 'logistics-tech', 'telecom', 'cybersecurity', 'ites', 'ai-native', 'fintech', 'software', 'saas'];

/** What the reader looks at, in this order, each only when the earlier ones name no sector:
 *  - `seller`: the seller's own words (what it sells, its category, its product description, its value points);
 *  - `context`: free text about the deal (pain points, blockers, objections, notes, competitors), which tells what the product
 *    is for; a sector needs a second sector word (strong or weak) beside its strong word here, because words such as
 *    "security review" or "delivery" turn up in every deal;
 *  - `role`: the buyer's job titles (a CISO buys security, a head of last-mile operations buys logistics tools);
 *  - `buyer`: who the buyer is (target customer, industry, company name), the weakest evidence of what the seller sells.
 * One strong word is enough in `seller`, `role` and `buyer`. */
export interface ReaderInput { seller?: unknown[]; context?: unknown[]; role?: unknown[]; buyer?: unknown[]; }

// Words that start the buyer part inside one text ("... platform for banks", "... sold to telecom operators", "customers are banks").
// Everything before the first of them is the seller's part; the rest is the buyer's part.
const BUYER_MARK = /\b(?:for|serving|serves|sold to|sells? to|selling to|used by|aimed at|targeting|targeted at|built for|designed for|(?:whose|its|our|their)\s+(?:customers?|clients?|users?)\s+(?:are|include|such as)|(?:customers?|clients?)\s+(?:are|include|such as)|popular with|adopted by|deployed (?:at|by))\b/i;

// "for" followed by an activity ("a platform for testing websites", "software for managing fleets") says what the product does, not who buys it:
// it is not a buyer marker, so the product words after it stay with the seller. A word such as "growing" ("for growing teams") still marks a buyer.
const GERUND_BUYER = /^(?:growing|scaling|emerging|leading|existing|aspiring|fast|rising|struggling|working|living|banking|operating)$/i;
function buyerMark(t: string): RegExpExecArray | null {
  const g = new RegExp(BUYER_MARK.source, 'gi');
  let m: RegExpExecArray | null;
  while ((m = g.exec(t))) {
    if (/^for$/i.test(m[0])) {
      const next = /^\s+([a-z]+)/i.exec(t.slice(m.index + m[0].length))?.[1] ?? '';
      if (/^[a-z]{3,}ing$/i.test(next) && !GERUND_BUYER.test(next)) continue;
      // "a platform for DevSecOps: planning, source code management, CI/CD": a short phrase and a colon, then a list of what the product has
      if (/^\s+(?:[\w&\/-]+\s+){0,3}[\w&\/-]+\s*:/.test(t.slice(m.index + m[0].length))) continue;
    }
    return m;
  }
  return null;
}
function isReaderInput(x: unknown): x is ReaderInput {
  return !!x && typeof x === 'object' && !Array.isArray(x) && ['seller', 'buyer', 'context', 'role'].some((k) => k in (x as object));
}
function texts(list: unknown[] | undefined): string[] {
  return (Array.isArray(list) ? list : []).filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
}
/** Splits what was given into the seller's words, the buyer's words and the context. Each seller text is cut at its first buyer marker. */
function sides(args: unknown[]): { seller: string; buyer: string; context: string; role: string } {
  const input: ReaderInput = args.length === 1 && isReaderInput(args[0]) ? (args[0] as ReaderInput) : { seller: args };
  const seller: string[] = [];
  const buyer: string[] = texts(input.buyer);
  for (const t of texts(input.seller)) {
    const m = buyerMark(t);
    if (m && /[a-z]{2}/i.test(t.slice(0, m.index))) { seller.push(t.slice(0, m.index)); buyer.push(t.slice(m.index)); } else seller.push(t);
  }
  // A job title ends where the company or industry of the person begins ("Head of Testing at a bank", "IT infrastructure heads at banks, retail chains"): the industry is the buyer's, not a clue to what the seller sells.
  const role: string[] = [];
  for (const t of texts(input.role)) { const m = /\s+(?:at|in|from|across)\s+(?!charge\b)/i.exec(t); if (m && /[a-z]{2}/i.test(t.slice(0, m.index))) { role.push(t.slice(0, m.index)); buyer.push(t.slice(m.index)); } else role.push(t); }
  return { seller: seller.join(' \n '), buyer: buyer.join(' \n '), context: texts(input.context).join(' \n '), role: role.join(' \n ') };
}

/** The distinct words a pattern finds. Matches may overlap ("AI agents that" gives "ai agents" and "agents that"). */
function scan(re: RegExp, text: string): string[] {
  const g = new RegExp(re.source, 'gi');
  const found = new Map<string, number>();
  let m: RegExpExecArray | null;
  while ((m = g.exec(text))) {
    const w = m[0].toLowerCase().replace(/\s+/g, ' ');
    if (!found.has(w)) found.set(w, m.index);
    g.lastIndex = m.index + 1;
  }
  return [...found.keys()];
}

interface Candidate { v: Vertical; strong: string[]; weak: string[]; score: number; first: number; }
function candidates(text: string, minWords: number): Candidate[] {
  const out: Candidate[] = [];
  for (const id of ORDER) {
    const v = VERTICALS.find((x) => x.id === id)!;
    const strong = scan(v.match, text);
    if (!strong.length) continue;                       // broad words alone never name a sector
    const weak = scan(v.weak, text).filter((w) => !strong.some((s) => s.split(' ').includes(w)));
    if (strong.length + weak.length < minWords) continue; // free text: a strong word needs a second sector word beside it
    // AI native is a way of building, not a trade: its own words (AI agents, LLM, generative AI) outweigh the trade words beside them.
    const score = strong.length + Math.min(weak.length, 3) * 0.25 + (id === 'ai-native' && strong.some((w) => !BUZZ.test(w)) ? 1 : 0);
    const first = Math.min(...strong.map((w) => text.toLowerCase().indexOf(w)).filter((i) => i >= 0), text.length);
    out.push({ v, strong, weak, score, first });
  }
  return out;
}
/** The sector one text names, or null. A named trade beats the general SaaS words; then the higher score, the earlier first
 * strong word, and the order above decide. */
function pick(text: string, minWords = 1): Candidate | null {
  if (!text.trim()) return null;
  const c = candidates(text, minWords);
  // A named trade beats the general SaaS words, and a bare "AI" (a CRM "with AI features") ranks with them: it only names AI native when nothing else is named.
  const bareAi = (x: Candidate) => x.v.id === 'ai-native' && x.strong.every((w) => w === 'ai');
  const trades = c.filter((x) => x.v.id !== 'saas' && !bareAi(x));
  const generic = c.filter((x) => x.v.id === 'saas');
  const pool = trades.length ? trades : generic.length ? generic : c;
  if (!pool.length) return null;
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
const SERVICES_WORDS = /\b(?:business (?:process )?(?:services|management|outsourcing)|bpo|bpm|bpaas|kpo|(?<!fully )(?<!fully-)managed (?:it |network |cloud )?services?|technology services|engineering services|digital engineering|digital transformation (?:services|partners?|compan(?:y|ies)|firms?)|financial services operations|customer experience (?:management |services|outsourcing)|outsourc\w*|contact cent(?:re|er)s?|call cent(?:re|er)s?|back[- ]office|digital operations|shared services)\b/i;
const PRODUCT_WORDS = /\b(?:software|saas|platforms?|apps?|apis?|tools?|subscriptions?|copilots?|assistants?|automat\w*|engines?)\b/i;
const PEOPLE_WORDS = /\b(?:people|humans?|staff|fte|analysts|specialists|experts|teams?)\b/i;
// Only labels count as marketing; "AI agents", "copilot" and "AI assistant" name the product itself.
const AI_MARKETING = /^(?:ai|ai[- ]native|ai[- ]first|agentic|genai|gen ai|generative ai)$/;
const AI_LABELS = /^(?:ai|ai[- ]native|ai[- ]first|ai (?:company|startup)|ai workforce)$/;
// (c) A seller of billing, invoicing, revenue recognition, dunning or usage-based pricing is SaaS, not fintech, unless it also moves
//     money (payment processing, payouts, lending, cards) or is a spend-management / accounts payable tool.
const BILLING_WORDS = /\b(?:billing|invoicing|subscription management|revenue recognition|usage-based (?:pricing|billing)|metered|dunning|prorat\w*|moneti[sz]\w*|pricing and packaging|quote-to-cash)\b/i;
const SPEND_WORDS = /\b(?:expenses?|spend|reimburs\w*|corporate cards?|prepaid cards?|card issuing|accounts payable|payables|bill pay|procurement|travel|payroll|purchase orders?|vendor payments?|supplier payments?)\b/i;
const MONEY_MOVES = /\b(?:payment (?:gateways?|processing|processors?)|payments? (?:apis?|infrastructure|rails|orchestration)|payouts?|lending|loans?|banking|remittances?|kyc|neobanks?|merchant acquiring)\b/i;
// "acts in the help desk and billing system" names a system the product works with, not billing as the product.
const BILLING_AS_INTEGRATION = /\b(?:and|or|in|into|from|with|to|across)\s+(?:the\s+|your\s+|a\s+|their\s+)?billing (?:systems?|tools?|software|platforms?)\b/gi;
const billingText = (t: string) => BILLING_WORDS.test(t.replace(BILLING_AS_INTEGRATION, ' ')) && !SPEND_WORDS.test(t) && !MONEY_MOVES.test(t);
// run 21c round 5: in a long text (a whole plan or document) one billing word is incidental ("streamline billing and payment"); two different billing terms are needed for the billing profile
const billingProfileText = (t: string) => {
  if (!billingText(t)) return false;
  if (t.length <= 600) return true;
  const clean = t.replace(BILLING_AS_INTEGRATION, ' ');
  const kinds = new Set((clean.match(new RegExp(BILLING_WORDS.source, 'gi')) || []).map((w) => w.toLowerCase().replace(/[^a-z]/g, '').slice(0, 6)));
  return kinds.size >= 2;
};
// Run 22. (e) A services firm is read by its own trade, not by its customers' industries. "technology services", "financial services operations",
//     business process services and the like, said by the seller about itself, make it ITeS even when banks, payments or lending words fill the
//     rest of the description. It stays as read when the seller also names a product of its own kind (a payment gateway) or calls itself SaaS.
const SERVICES_FIRM = /^(?:business (?:process )?(?:services|management|outsourcing)|bpo|bpm|bpaas|kpo|managed (?:it |network |cloud )?services?|it services|it outsourcing|technology services|engineering services|digital engineering|digital transformation \w+|financial services operations|finance and accounting \w+|data operations \w+|analytics operations|(?:we|our) [^.;:]*operations?|designs?,? builds?,? and runs?|outsourc\w*|consultanc(?:y|ies)|consulting (?:firms?|compan(?:y|ies)|services|partners?)|software development \w+|offshore development \w+|delivery \w+|human annotators?|data annotators?|data labell?ers?|(?:custom|bespoke) software development|customer experience (?:management|services|outsourcing)|systems? integrat\w+|staff augmentation|it staffing|application (?:development|maintenance|management|support)|[a-z]+ services? (?:compan(?:y|ies)|firms?|providers?))$/;
// Words a firm uses about its own business: they win even when a work item of the firm ("accounts payable") is also a product category of another vertical.
const SERVICES_SELF = /^(?:outsourc\w*|bpo|bpm|bpaas|kpo|technology services|engineering services|consultanc(?:y|ies)|consulting (?:firms?|compan(?:y|ies)|services|partners?)|(?:we|our) [^.;:]*operations?|software development \w+|[a-z]+ services? (?:compan(?:y|ies)|firms?|providers?))$/;
const SAAS_CLAIM = /\b(?:saas|subscriptions?|per seat|per user|licen[cs]es?|(?:our|an?|the) (?:software|platform|app)\b|software (?:platform|product|suite|solution|that|to)\b)/i;
function adjust(text: string, best: Candidate, all: Candidate[]): Candidate {
  if (best.v.id === 'fintech' && billingText(text)) {
    const saas = all.find((x) => x.v.id === 'saas');
    if (saas) return saas;
  }
  if (best.v.id === 'fintech' || best.v.id === 'logistics-tech' || best.v.id === 'saas') {
    const ites = all.find((x) => x.v.id === 'ites');
    if (ites && ites.strong.some((w) => SERVICES_FIRM.test(w)) && !SAAS_CLAIM.test(text) && (ites.strong.some((w) => SERVICES_SELF.test(w)) || !categoryHits(text).some((h) => h.st.vertical === best.v.id))) return ites;
  }
  // "managed service" alone, inside the description of a hosted product (an open source database, a build service), is not an IT services firm.
  if (best.v.id === 'ites' && best.strong.every((w) => /^managed (?:it |network |cloud )?services?$/.test(w))) {
    const sw = all.find((x) => x.v.id === 'software');
    if (sw && PRODUCT_WORDS.test(text)) return sw;
  }
  if (best.v.id === 'cybersecurity') {
    const tel = all.find((x) => x.v.id === 'telecom');
    const connectivity = scan(CONNECTIVITY_WORDS, text);
    const specialist = best.strong.filter((w) => !SECURITY_GENERIC.test(w));
    if (connectivity.length && !SECURITY_SELF.test(text) && !specialist.length) {
      const v = VERTICALS.find((x) => x.id === 'telecom')!;
      return tel ? { ...tel, strong: [...new Set([...tel.strong, ...connectivity])] } : { v, strong: connectivity, weak: [], score: connectivity.length, first: best.first };
    }
  }
  if (best.v.id === 'ai-native') {
    const ites = all.find((x) => x.v.id === 'ites');
    if (ites && SERVICES_WORDS.test(text) && !PRODUCT_WORDS.test(text) && (best.strong.every((w) => AI_LABELS.test(w)) || PEOPLE_WORDS.test(text))) return ites;
    // (d) "AI-native", "GenAI", "AI agents" and the like say how a product is built, not what it sells. When they are the only AI
    //     words and the seller's text also names a trade of its own (a security platform, a testing cloud, business services, billing,
    //     sales force automation, payments), the trade decides. Support automation stays AI native, and so does a seller that manages
    //     money (investment strategies): that is the AI native investment case.
    if (best.strong.every((w) => AI_MARKETING.test(w)) && !SUPPORT_WORDS.test(text)) {
      const money = modelFromSeller(text) === 'investment';
      const trades = all.filter((x) => x.v.id !== 'ai-native' && (x.v.id !== 'saas' || BILLING_WORDS.test(text)) && !(x.v.id === 'fintech' && money));
      if (trades.length) return trades.sort((a, b) => b.score - a.score || a.first - b.first || ORDER.indexOf(a.v.id) - ORDER.indexOf(b.v.id))[0];
    }
  }
  return best;
}

// ---------------------------------------------------------------------------------------------------------------------------
// Sub-case notes (run 20 round 2). Words only, no figure, statistic or named company (B82).
// ---------------------------------------------------------------------------------------------------------------------------
export type SectorNotes = Pick<Vertical, 'vocabulary' | 'buyerRoles' | 'committee' | 'objections' | 'salesMotion' | 'metrics' | 'proofShape' | 'discovery'>;

/** AI native, support automation: used only when the seller's own text names support, tickets, a help desk, a contact centre or a service desk. */
export const AI_SUPPORT_PROFILE: SectorNotes = {
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
export const INVESTMENT_PROFILE: SectorNotes = {
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

/** SaaS, billing and revenue operations: used when the seller sells billing, subscription billing, invoicing, revenue recognition,
 * usage-based pricing, dunning, proration or monetization (and is not a spend-management or payments seller), and the buyer persona is
 * not an engineering, product, IT or security leader. It replaces the plain SaaS notes (activation, expansion) and keeps the buyer out
 * of the finance block of the spend-management profile (accounts payable, card spends, claims, policy breaches). */
export const BILLING_PROFILE: SectorNotes = {
  vocabulary: ['invoice run', 'dunning', 'proration', 'usage-based pricing', 'plan and add-on', 'revenue recognition', 'audit trail', 'billing dispute', 'pricing change'],
  buyerRoles: ['Chief Financial Officer', 'VP Finance', 'Revenue Operations Lead', 'Billing or Finance Operations Manager', 'Head of Engineering (for the integration)', 'Finance Controller'],
  committee: 'The CFO or VP Finance signs; the revenue operations lead or the billing manager champions it; finance operations use it every month-end; engineering checks the integration with the product, ERP and CRM; the controller and the auditors review revenue recognition and the audit trail.',
  objections: [
    { objection: 'Our homegrown billing works', response: 'Count what it costs to keep running: the engineering time behind each pricing change, the invoices fixed by hand and the disputes, using the buyer\'s own last quarter.' },
    { objection: 'Migration risk for live subscriptions', response: 'Plan the move in waves, run old and new side by side on a part of the live subscriptions, and agree that invoices must match before each wave is switched.' },
    { objection: 'It must work with our ERP and CRM', response: 'Name the systems it must post to and read from, the few fields that move each way, and who on the buyer side owns each connection.' },
    { objection: 'Revenue recognition and the audit trail', response: 'Show how each invoice, credit and change is traced to the schedule the auditor reads, and let the controller test it on real contracts before signing.' },
  ],
  salesMotion: 'Finance-led, with engineering in the evaluation; a pilot on part of the live subscriptions or a new pricing launch before the full move.',
  metrics: ['billing errors and disputes', 'invoice accuracy', 'failed payments recovered', 'revenue recognition errors', 'days to close the month', 'time to launch a new pricing model'],
  proofShape: 'A migration of live subscriptions where invoices matched before and after, or a pricing change launched without engineering time, with the dates and the finance owner who signed it off.',
  discovery: [
    'How are customers billed today (plans, usage, add-ons), and who changes a price or a plan?',
    'How long does a new pricing model take to launch, and how much engineering time does it need?',
    'Which invoice errors, failed payments and disputes does the team fix by hand each month?',
    'How is revenue recognised today, and what does the auditor ask to see?',
    'Which systems must billing work with: ERP, CRM, payments, tax, the data warehouse?',
  ],
};


// Words that say how a product is built or what it guards against, not what it is: when they are the only strong words of the usual
// reading, the product category noun wins even if the buzzword comes first ("an API platform that connects apps to bank accounts").
const BUZZ = /^(?:ai|ai agents?|agents? that|agentic|copilots?|ai assistants?|llms?|genai|gen ai|generative ai|ai[- ]native|ai[- ]first|ai platform|api|apis|api platform|platform|security|fraud|phishing|data security|cloud|automation|iam)$/;
interface CategoryHit { st: SubType; word: string; index: number; end: number; }
/** The category nouns found in the seller's own words, earliest first. */
// HR and payroll software is a kind of vertical SaaS only when it is built for one named industry (shift workers, restaurants, construction crews ...);
// "payroll and compliance for small businesses" is general HR software, so it names SaaS and no kind.
const INDUSTRY_WORD = /\b(?:restaurants?|hospitality|hotels?|retail(?:ers)?|stores?|construction|contractors?|manufactur\w*|factor(?:y|ies)|staffing|temp(?:orary)? (?:workers?|staff)|shift (?:workers?|staff)|hourly (?:workers?|staff)|frontline|deskless|blue.?collar|farms?|agricultur\w*|warehouses?|logistics|drivers?|fleets?|salons?|gyms?|fitness|schools?|education|nonprofits?|cleaning|franchises?|bars?|cafes?|food service|trades?)\b/i;
const HOTEL_WORDS = /\b(?:hotels?|hostels?|hospitality|resorts?|housekeeping|front desk|guests?|reservations?)\b/i;
const LEASE_WORDS = /\b(?:tenants?|leases?|landlords?|rent roll|rent collection|rental propert\w+)\b/i;
const GENERIC_PAYROLL: SubType = { id: 'hr-payroll-general', vertical: 'saas', name: 'HR and payroll', match: /$^/, notes: {} as SectorNotes };
function categoryHits(seller: string, whole: string = seller): CategoryHit[] {
  const out: CategoryHit[] = [];
  for (let st of SUBTYPES) {
    const m = new RegExp(st.match.source, st.match.flags.replace('g', '')).exec(seller);
    if (!m) continue;
    if (st.id === 'industry-hr-payroll' && !INDUSTRY_WORD.test(whole)) st = GENERIC_PAYROLL;
    // Run 22: a "property management system" next to hotel words is a hotel system (front desk, housekeeping), not rent and leases: it is read as the hotel kind.
    if (st.id === 'property-management' && HOTEL_WORDS.test(whole) && !LEASE_WORDS.test(whole)) st = SUBTYPES.find((x) => x.id === 'hotel-lodging') ?? st;
    out.push({ st, word: m[0].toLowerCase().replace(/\s+/g, ' '), index: m.index, end: m.index + m[0].length });
  }
  return out.sort((a, b) => a.index - b.index);
}
/** The product category comes first: the earliest category noun in the seller's words names the sector, before any buzzword
 * ("customer service software with AI agents" is SaaS; "an API platform that connects apps to bank accounts" is fintech). */
function categoryPick(seller: string, whole: string = seller): Candidate | null {
  const hits = categoryHits(seller, whole);
  if (!hits.length) return null;
  if (hits.length > 1 && hits[1].index === hits[0].index && hits[1].st.vertical !== hits[0].st.vertical) return null;   // the same words name two kinds of company: leave it to the usual reading
  // "AI agents" or "copilot" named first in a list of features and then a product category of another vertical ("AI agents, Copilot, ticketing with routing, a knowledge base"):
  // the buzzword says how the product is built, so the later category noun names the sector. "AI agents that handle contact centre calls" is not a list: the agents are the product.
  let h0 = hits[0];
  if (BUZZ.test(h0.word) && /^\s*(?:,|;|&|and\b)/.test(seller.slice(h0.end))) { const other = hits.find((h) => h.st.vertical !== h0.st.vertical && !BUZZ.test(h.word)); if (other) h0 = other; }
  const v = VERTICALS.find((x) => x.id === h0.st.vertical)!;
  return { v, strong: [h0.word], weak: [], score: 1, first: h0.index };
}
/** Free text about the deal: a category noun counts only when every category noun found names the same vertical. */
function categoryPickUnique(text: string): Candidate | null {
  const hits = categoryHits(text);
  if (!hits.length || hits.some((h) => h.st.vertical !== hits[0].st.vertical)) return null;
  return categoryPick(text);
}
/** The one sub-type of this vertical the seller's words name, or null when none or more than one of them match. */
function subtypeFor(v: Vertical, args: unknown[]): SubType | null {
  if (v.subtype) return SUBTYPES.find((x) => x.id === v.subtype) ?? null;
  const sd = sides(args);
  const whole = [sellerWhole(args), sd.buyer, sd.context, sd.role].join(' \n ');
  // the seller's own words first; when they name no sub-type of this vertical, the job titles and the free text about the deal may (a head of
  // last-mile operations, an expense module the buyer already has); the buyer's industry never does
  // Run 22: a vertical SaaS seller names its trade in a phrase the buyer marker may have cut ("ERP and POS software for retail ..."): the whole seller text is read too, after the cut one.
  for (const text of [sd.seller, ...(v.id === 'vertical-saas' ? [sellerWhole(args)] : []), [sd.role, sd.context].join(' \n ')]) {
    const hits = categoryHits(text, whole).filter((h) => h.st.vertical === v.id && h.st !== GENERIC_PAYROLL);
    const ids = new Set(hits.map((h) => h.st.id));
    // A loose descriptive word ("testing in the DevOps cycle") is not enough when the deal text names another kind of the same vertical.
    if (ids.size === 1 && text === sd.seller && hits.every((h) => /^(?:devops|devsecops|source code)$/.test(h.word))) {
      const other = categoryHits([sd.role, sd.context].join(' \n '), whole).filter((h) => h.st.vertical === v.id && h.st !== GENERIC_PAYROLL && h.st.id !== hits[0].st.id);
      if (other.length) return null;
    }
    if (ids.size === 1) return hits[0].st;
    if (ids.size > 1) return null;
  }
  return null;
}
function withSubtype(v: Vertical, st: SubType): Vertical { return { ...v, ...st.notes, name: `${v.name}, ${st.name}`, subtype: st.id }; }

const AI_ANY = /\b(?:ai|a\.i\.|ai[- ](?:native|first|powered|led|driven|based|enabled)|genai|gen ai|generative ai|llms?|artificial intelligence|agentic)\b/i;
const AI_NATIVE = VERTICALS.find((v) => v.id === 'ai-native')!;
const SAAS_BASE = VERTICALS.find((v) => v.id === 'saas')!;
const BILLING_SAAS: Vertical = { ...SAAS_BASE, ...BILLING_PROFILE, name: 'SaaS, billing and revenue operations' };
const AI_SUPPORT: Vertical = { ...AI_NATIVE, ...AI_SUPPORT_PROFILE };

// The seller's own words, whole (not cut at "for ..."): "Voice AI for contact centres" names the contact centre.
function sellerWhole(args: unknown[]): string {
  const input: ReaderInput = args.length === 1 && isReaderInput(args[0]) ? (args[0] as ReaderInput) : { seller: args };
  return texts(input.seller).join(' \n ');
}
const SUPPORT_WORDS = /\b(?:(?:customer|technical|tech|it|client|user|product|employee|helpdesk) support|support (?:tickets?|teams?|agents?|queues?|requests?|inbox(?:es)?|desks?|automation|conversations?|chat|calls?|operations|centre|center)|tickets?|ticketing|help ?desks?|contact cent(?:re|er)s?|call cent(?:re|er)s?|service desks?|customer service|customer care)\b/i;

/** What an AI native seller's product is for, read from the seller's own words only: 'support' when they name support, tickets, a
 * help desk, a contact centre or a service desk; 'investment' when the seller manages money (the investment business model);
 * else 'other'. Investment comes first. Accepts the same inputs as detectVertical. */
export function aiUseCase(...args: unknown[]): 'support' | 'investment' | 'other' {
  if (modelFromSeller(sides(args).seller) === 'investment') return 'investment';
  return SUPPORT_WORDS.test(sellerWhole(args)) ? 'support' : 'other';
}
function forUseCase(v: Vertical, args: unknown[]): Vertical {
  if (v.subtype || v === AI_SUPPORT || v === BILLING_SAAS || /, investment management$/.test(v.name)) return v;   // already a profile or a sub-type: never layer another on top
  if (v === AI_NATIVE && aiUseCase(...args) === 'support') return AI_SUPPORT;
  if (v === SAAS_BASE && isBillingSeller(...args)) return BILLING_SAAS;
  const st = subtypeFor(v, args);
  return st ? withSubtype(v, st) : v;
}

const ENGINEERING_PERSONA = /\b(?:cto|chief technology|engineering|developers?|product|growth|marketing|sales|cio|it|information technology|security|ciso)\b/i;
const FINANCE_PERSONA = /\b(?:cfo|chief financial|finance|financial|revenue operations|revops|billing|controller|accounting|accounts|fp&a|treasury)\b/i;
/** True when the seller's own words sell billing, subscription billing, invoicing, revenue recognition, usage-based pricing, dunning,
 * proration or monetization (not a spend-management, accounts payable or payments seller) and the job titles given, if any, are not
 * only engineering, product, IT or security titles. Accepts the same inputs as detectVertical. */
export function isBillingSeller(...args: unknown[]): boolean {
  const t = sellerWhole(args);
  if (!billingProfileText(t)) return false;
  const input: ReaderInput = args.length === 1 && isReaderInput(args[0]) ? (args[0] as ReaderInput) : {};
  const role = texts(input.role).join(' \n ');
  return !(role && ENGINEERING_PERSONA.test(role) && !FINANCE_PERSONA.test(role));
}

/** The sector notes that fit the business model: a seller that manages money (model 'investment') gets INVESTMENT_PROFILE in place of
 * the sector's roles, committee, objections, metrics, proof shape, discovery questions and vocabulary (the name says so); an AI native
 * seller of support automation gets the support notes. Every other case returns the vertical unchanged. Safe to call twice. */
export function profileFor(v: Vertical | null, model: BusinessModel | null | undefined, ...args: unknown[]): Vertical | null {
  if (!v) return v;
  if (model === 'investment') return /, investment management$/.test(v.name) ? v : { ...v, ...INVESTMENT_PROFILE, name: `${v.name}, investment management` };
  return forUseCase(v, args);
}

// ---------------------------------------------------------------------------------------------------------------------------
// Run 22: software built for ONE named trade. "the operating system for modern hotels", "ERP and POS for retail, restaurants and
// distribution", "school management software" are vertical SaaS even when payments, billing, invoicing or stock words stand inside the
// description: those are modules of the product, not what it is. It applies when the trade-software phrase comes before the first word
// of the sector otherwise read (fintech, logistics tech, SaaS), and never when the seller's words also name a product category of
// another vertical ("a payments platform for restaurants" stays fintech, "warehouse software for retailers" stays logistics tech).
// ---------------------------------------------------------------------------------------------------------------------------
const TRADE = '(?:hotels?|hoteliers?|hospitality|hostels?|resorts?|restaurants?|restaurateurs?|cafes?|caterers?|bakeries|retail(?:ers)?(?! (?:investors?|banking|banks?|lending|customers?|clients?|traders?|payments?|credit|users?|shoppers?|consumers?))|retail chains?|supermarkets?|grocers?|groceries|wholesalers?|distributors?|dealerships?|salons?|spas|gyms?|fitness (?:studios?|clubs?)|schools?|colleges?|universities|farms?|farmers|manufacturers?|factories|landlords|law firms|nonprofits?|charities|churches|travel agen(?:ts|cies)|car dealers?|car wash(?:es)?|agricultur(?:e|al)|accountants?|accounting firms?|tax professionals|cpas|bookkeepers?|real estate (?:agents?|agencies|brokers?)|estate agents?|letting agents?|event (?:venues?|organi[sz]ers?)|venues|childcare|daycare|nurser(?:y|ies)|tour operators?|car rental (?:companies|agencies)|rental companies|(?:yoga|dance|pilates|fitness|photo|tattoo|martial arts) studios?|tutors?|coaching (?:centres|centers|institutes?)|cinemas?|theatres?|barbershops?|florists?)';
// Business-type nouns that name WHO the software is for whatever the trade before them ("independent auto repair shops", "textile mills", "growers").
// Nouns that name a function, a size or another vertical's customers (teams, enterprises, operators, centres, banks, merchants) are not here.
const TRADE_HEAD = '(?:(?:book|work)?shops?|stores?|mills?|factor(?:y|ies)|plants|farms?|ranches|growers|airlines?|clubs?|associations?|schools?|colleges?|universities|dealerships?|dealers|wholesalers?|distributors?|manufacturers?|exporters|importers|venues?|parks|resorts?|hotels?|restaurants?|cafes?|salons?|gyms?|churches|church|municipalit(?:y|ies)|local governments?|nonprofits?|charities|cinemas?|theatres?|installers|contractors|bakeries|garages|wineries|breweries|laundries)';
// A phrase that names a finance, online-selling, security, telecom or software customer is another vertical's business, not a trade of vertical SaaS.
const NOT_A_TRADE = /\b(?:online|e-?commerce|d2c|marketplace|banks?|banking|investment|insurance|insurers?|financial|lend\w*|credit|wealth|asset|funds?|payments?|brokerage|securities|trading|fintech|security|cyber\w*|telecom\w*|logistics|freight|shipping|software|saas|developers?)\b/i;
const TRADE_SYSTEM = '(?:erp|pos|pms|crm|lms|software|system|platform|suite|package|app|solution|operating system|point of sale|management|booking|ticketing|scheduling|engine)s?';
const TRADE_FIRST = new RegExp(`\\b(?<t>(?:${TRADE}|(?:[\\w-]+ ){0,2}${TRADE_HEAD})(?: (?:and|or|&) (?:${TRADE}|${TRADE_HEAD}))?)(?: [\\w-]+){0,4} ${TRADE_SYSTEM}\\b`, 'i');
const TRADE_FOR = new RegExp(`\\b${TRADE_SYSTEM}(?: [\\w-]+){0,3} (?:made |built |designed )?(?:for|to power|to run|serving)(?<t>(?: [\\w-]+){0,3} (?:${TRADE}|${TRADE_HEAD}))\\b`, 'i');
const TRADE_OVERRIDES = new Set<VerticalId>(['fintech', 'logistics-tech', 'saas']);
// A description in pieces (a product line, a pain, a capability) may never say "software for hotels" in one phrase, but it talks the trade's own
// language. Three or more different words of one trade's everyday vocabulary, more than the words of the sector otherwise read, make it that trade's software.
const TRADE_DOMAIN: RegExp[] = [
  /\b(?:hotels?|hoteliers?|hostels?|guests?|housekeeping|front desk|overbookings?|occupancy|revpar|check-?ins?|room (?:rates?|inventory|types?)|reservations?|pms|channel managers?)\b/gi,
  /\b(?:restaurants?|menus?|kitchens?|dine-?in|takeaway|table (?:booking|service|management)|waiters?|food cost|cashiers?|tills?)\b/gi,
  /\b(?:supermarkets?|grocers?|billing counters?|skus?|planograms?|stock-?outs?|cashiers?|retail(?:ers)?|wholesalers?|distributors?|outlets?)\b/gi,
  /\b(?:students?|teachers?|classrooms?|timetables?|attendance|admissions|curriculum|parents?|fee (?:collection|reminders?))\b/gi,
];
function tradeDomain(whole: string): { word: string; index: number; n: number } | null {
  let best: { word: string; index: number; n: number } | null = null;
  for (const re of TRADE_DOMAIN) {
    const found = new Map<string, number>();
    for (const m of whole.matchAll(re)) { const w = m[0].toLowerCase().trim(); if (!found.has(w)) found.set(w, m.index ?? 0); }
    if (found.size >= 3 && (!best || found.size > best.n)) best = { word: [...found.keys()].slice(0, 3).join(', '), index: Math.min(...found.values()), n: found.size };
  }
  if (!best) return null;
  if (categoryHits(whole).some((h) => h.st.vertical !== 'vertical-saas' && h.st.vertical !== 'saas')) return null;
  return best;
}
function tradeSoftware(whole: string): { word: string; index: number } | null {
  const m = [whole.match(TRADE_FIRST), whole.match(TRADE_FOR)].filter((x): x is RegExpMatchArray => !!x && !NOT_A_TRADE.test(x.groups?.t ?? '')).sort((a, b) => (a.index ?? 0) - (b.index ?? 0))[0];
  if (!m) return null;
  if (categoryHits(whole).some((h) => h.st.vertical !== 'vertical-saas' && h.st.vertical !== 'saas')) return null;
  return { word: m[0].toLowerCase().replace(/\s+/g, ' '), index: m.index ?? 0 };
}
function firstIn(whole: string, words: string[]): number {
  const low = whole.toLowerCase();
  const at = words.map((w) => low.indexOf(w.toLowerCase())).filter((i) => i >= 0);
  return at.length ? Math.min(...at) : Infinity;
}

/** The sector read, with the words that decided it and where they came from ('seller' or 'buyer'). */
export function explainSector(...args: unknown[]): { vertical: Vertical | null; source: 'seller' | 'context' | 'role' | 'buyer' | null; strong: string[]; weak: string[] } {
  const { seller, buyer, context, role } = sides(args);
  // The product category noun decides when it comes BEFORE the first strong word of a different sector ("customer service software with AI agents"); otherwise the usual reading stands.
  const pk = pick(seller), cat = categoryPick(seller, [sellerWhole(args), buyer].join(' \n '));
  let s = cat && (!pk || (cat.v.id !== pk.v.id && (cat.first <= pk.first || pk.strong.every((w) => BUZZ.test(w))))) ? cat : pk;
  // Run 22: software built for one named trade (hotels, retail, restaurants ...) is vertical SaaS, whatever its payment or stock modules are called.
  const trade = tradeSoftware(sellerWhole(args));
  if (trade && (!s || (TRADE_OVERRIDES.has(s.v.id) && trade.index <= firstIn(sellerWhole(args), s.strong)))) {
    s = { v: VERTICALS.find((x) => x.id === 'vertical-saas')!, strong: [trade.word], weak: [], score: 1, first: trade.index };
  } else if (!trade && (!s || TRADE_OVERRIDES.has(s.v.id))) {
    const dom = tradeDomain(sellerWhole(args));
    if (dom && (!s || dom.n > s.strong.length)) s = { v: VERTICALS.find((x) => x.id === 'vertical-saas')!, strong: [dom.word], weak: [], score: dom.n, first: dom.index };
  }
  // A bare "AI" in the seller's words says how it is built, not what it sells: when the deal text or the job titles name another sector, that sector is read instead.
  if (s && s.v.id === 'ai-native' && s.strong.every((w) => w === 'ai')) {
    const alt = pick(context, 2) ?? pick(role);
    if (alt && alt.v.id !== 'ai-native') s = null;
  }
  // A seller that manages money (investment strategies, portfolios for allocators) and uses AI words of its own, anywhere in its
  // description, is AI native with the investment model, not fintech (the model is read in detectModel).
  if (s && s.v.id === 'fintech' && modelFromSeller(seller) === 'investment') {
    const ai = scan(AI_ANY, sellerWhole(args));
    if (ai.length) return { vertical: AI_NATIVE, source: 'seller', strong: ai, weak: s.weak };
  }
  if (s) return { vertical: forUseCase(s.v, args), source: 'seller', strong: s.strong, weak: s.weak };
  const c = categoryPickUnique(context) ?? pick(context, 2);
  if (c) return { vertical: forUseCase(c.v, args), source: 'context', strong: c.strong, weak: c.weak };
  const r = pick(role);
  if (r) return { vertical: forUseCase(r.v, args), source: 'role', strong: r.strong, weak: r.weak };
  // The last words (the part of a text after "for", "serving" and the like) may still hold the product ("a platform for route to market: sales force automation, a distributor
  // management system, and AI agents such as ..."): the category noun is read first here too, before a buzzword.
  const bp = pick(buyer), bc = categoryPick(buyer);
  const b = bc && (!bp || (bc.v.id !== bp.v.id && (bc.first <= bp.first || bp.strong.every((w) => BUZZ.test(w))))) ? bc : bp;
  if (b) return { vertical: forUseCase(b.v, args), source: 'buyer', strong: b.strong, weak: b.weak };
  return { vertical: null, source: null, strong: [], weak: [] };
}

/** The sector read from what the user typed, or null when the words do not name one. Give plain texts (each is split at its
 * buyer marker such as "for banks") or { seller, context, role, buyer } (see ReaderInput) to say which words are the seller's,
 * which are free text about the deal, which are job titles and which say who the buyer is. The seller's words come first; the
 * later groups are used only when the earlier ones name no sector. Broad words alone never name a sector. */
export function detectVertical(...args: unknown[]): Vertical | null {
  return explainSector(...args).vertical;
}

// Run 22: the BUYER's industry (not the seller's vertical above). Words and plain questions a buyer in that industry puts to any vendor, so a demo or a
// discovery list can speak to the industry the user typed instead of repeating it as a label. Vocabulary and questions only: no statistic, no
// benchmark, no named company, no fact about any product (rule B82).
export interface BuyerLens { id: string; name: string; match: RegExp; words: string[]; checks: string[]; }
export const BUYER_LENS: BuyerLens[] = [
  { id: 'financial', name: 'financial services', match: /\b(?:bfsi|banks?|banking|financial services?|lend(?:ing|ers?)|insurers?|insurance|fintech|credit unions?|nbfc|payments? (?:technology|companies|providers?))\b/i,
    words: ['regulator', 'audit trail', 'customer data', 'access permissions', 'model risk', 'third party review'],
    checks: ['Where would your customer data sit with a vendor like this, who could see it, and what would your regulator or auditor ask to see?', 'Which of your existing controls and approvals would this have to respect, and who signs them off?', 'If a model or rule decides something about a customer, how is that decision explained and reviewed here?', 'Which employees may see which customer records today, and how would a new tool respect those permissions?'] },
  { id: 'retail', name: 'retail and e-commerce', match: /\b(?:retail\w*|e-?commerce|d2c|online (?:stores?|sellers?|shops?)|marketplaces? sellers?|merchants?)\b/i,
    words: ['sale day', 'orders', 'returns', 'checkout', 'channels', 'stock'],
    checks: ['How does your business cope on a sale day, when order volumes jump, and where does it strain first?', 'Which of your channels (your own site, marketplaces, stores) would this touch first?', 'How do returns and failed orders reach you today?'] },
  { id: 'consumer-goods', name: 'consumer goods and distribution', match: /\b(?:fmcg|consumer goods|beverages?|food and drink|distributors?|route to market|trade marketing)\b/i,
    words: ['outlets', 'distributors', 'secondary sales', 'beat plan', 'trade scheme', 'stock out'],
    checks: ['How do your people work in outlets with a weak signal, and how do the distributor\'s own records fit in?', 'Who in the field would use this every day, and what do they do when it is slow?'] },
  { id: 'education', name: 'education', match: /\b(?:education|schools?|colleges?|universit\w+|edtech|institutes?|coaching|students?|admissions?)\b/i,
    words: ['enquiries', 'admissions', 'counsellors', 'applications', 'intake', 'fee reminders'],
    checks: ['How do enquiries and applications reach your counsellors today, and how soon is each one followed up?', 'Who sees a student\'s record across admissions, fees and communication, and who may change it?'] },
  { id: 'manufacturing', name: 'manufacturing', match: /\b(?:manufactur\w*|factor(?:y|ies)|plants?|industrial|shop floor)\b/i,
    words: ['plant', 'shift', 'suppliers', 'work orders', 'downtime', 'quality checks'],
    checks: ['Which plant systems do you already run, and who keeps the links between them working?', 'What happens on your shop floor when a system is down for an hour?'] },
  { id: 'automotive', name: 'automotive', match: /\b(?:automotive|automobiles?|auto (?:makers?|parts)|vehicles? makers?|oems?|dealers?hips?)\b/i,
    words: ['plants', 'suppliers', 'dealers', 'inbound parts', 'line stoppage', 'shipments'],
    checks: ['Which of your plants, suppliers and dealers would be involved, not just one of them?', 'How do you find out today that a late part will stop a line?'] },
  { id: 'construction', name: 'construction and infrastructure', match: /\b(?:construction|civil|infrastructure|contractors?|builders?|real estate developers?)\b/i,
    words: ['job cost', 'change orders', 'subcontractors', 'site', 'pay applications', 'daily logs'],
    checks: ['How do your people work on a site with a weak signal and many subcontractors?', 'How does the field record reach the job cost and the ledger today, and where is it keyed twice?'] },
  { id: 'software', name: 'software and technology', match: /\b(?:b2b saas|saas and software|software (?:companies|vendors|teams)|technology companies|tech companies|software)\b/i,
    words: ['release', 'product teams', 'engineering', 'platform', 'roadmap', 'incidents'],
    checks: ['Which product or platform teams in your company would use it, and where does it meet your release process?', 'What would your engineers need to see before they trust it?'] },
];
/** The buyer's industry as typed ("BFSI", "Education", "SMB online retailers and D2C brands"), or null when it matches none of the entries. */
export function buyerLens(industry: unknown): BuyerLens | null {
  if (typeof industry !== 'string' || !industry.trim()) return null;
  return BUYER_LENS.find((b) => b.match.test(industry)) || null;
}

export type BusinessModel = 'saas' | 'services' | 'connectivity' | 'transactions' | 'marketplace' | 'hardware_software' | 'investment';
export const BUSINESS_MODELS: BusinessModel[] = ['saas', 'services', 'connectivity', 'transactions', 'marketplace', 'hardware_software', 'investment'];
export const MODEL_NAME: Record<BusinessModel, string> = {
  saas: 'software subscription', services: 'services (people-delivered, per FTE, per ticket or fixed price)', connectivity: 'connectivity (per site, per link or bandwidth, on a term contract)',
  transactions: 'per-transaction (volume based)', marketplace: 'marketplace (a take rate on transactions)', hardware_software: 'hardware plus software',
  investment: 'investment management (fees on assets or performance)',
};

// Read from the SELLER's words only. A seller that sells software (software, SaaS, platform, app, analytics, tools) is a
// subscription however its buyers earn money, so the other models ask that these words are absent (`not`).
const DEVICE = '(?:devices?|sensors?|terminals?|scanners?|trackers?|readers?|cameras?)';
const MODEL_MATCH: { model: BusinessModel; re: RegExp; not?: RegExp }[] = [
  // the seller manages money: it runs funds or portfolios, or is an asset or wealth manager. Software for asset managers is not this.
  { model: 'investment', re: /\b(?:investment strateg\w*|systematic strateg\w*|hedge funds?|mutual funds?|venture (?:fund|capital)|private equity|family offices?|aum|assets under management|(?:manages?|managing|runs|invests?|investing|allocates?)\b[^.;,]{0,40}\b(?:funds?|(?<!application )(?<!product )(?<!service )portfolios?|client money|capital|wealth|investments?))\b/i, not: /\b(?:software|saas)\b/i },
  { model: 'investment', re: /(?<!\bit )(?<!digital )(?<!software )(?<!infrastructure )(?<!network )(?<!cloud )(?<!media )(?<!brand )(?<!enterprise )\b(?:asset|wealth|fund|portfolio|investment) (?:management|managers?|advisory|advisors?)\b/i, not: /\b(?:software|saas|platform|apps?|apis?|analytics|tools?|dashboards?|systems?)\b/i },
  // Run 22: a forwarder, a third party logistics provider or a customs broker sells services; the platform it runs is a tool for the customer.
  // "freight forwarding software" (a tool sold to forwarders) is not matched here and stays a subscription.
  { model: 'services', re: /\b(?:(?<!\b(?:with|for|to|and|or|of|by|between|from|among|including) )freight forwarders?|freight forwarding (?:platform|compan(?:y|ies)|firm|business|provider)|forwarding services|third[- ]party logistics|3pl (?:provider|compan(?:y|ies)|firm)|customs (?:brokers?|brokerage|clearance)|moves? freight|trucking compan(?:y|ies)|haulage compan(?:y|ies)|courier compan(?:y|ies)|delivery compan(?:y|ies)|logistics compan(?:y|ies)|(?:express|parcel|freight|cargo|shipping|transport|moving) compan(?:y|ies))\b/i, not: /\b(?:software|saas|subscriptions?|per seat|per user|marketplace)\b/i },
  // Run 22: a SIM or eSIM seller sells connectivity (data used, per SIM), even when it names a platform, tools or a software SIM beside it.
  { model: 'connectivity', re: /\b(?:iot sims?|iot connectivity|esims?|soft ?sims?|global sims?|roaming sims?|sim cards?|(?:physical|software)(?: based)? sims?|data (?:each|per) sim|cellular iot|pay as you go data)\b/i, not: /\b(?:saas|per seat|per user|device management software)\b/i },
  { model: 'connectivity', re: /\b(?:enterprise networks?|global networks?|private networks?|sd-?wan|mpls|leased lines?|connectivity|bandwidth|per site|per link|5g|business internet|internet access|broadband|isps?|voip|sip trunk\w*|managed network|wi-?fi|colocation|mobile network|satellite (?:internet|connectivity|broadband)|(?:internet service|internet) providers?|(?:telecom\w*|network|mobile|wireless|fib(?:re|er)) (?:operator|provider|carrier|services?))\b/i, not: /\b(?:software|saas|subscriptions?|analytics|dashboards?|tools?|(?:cyber)?security (?:platform|software|vendor|company|product|tool)s?)\b/i },
  { model: 'services', re: /\b(?:(?<!fully )(?<!fully-)managed (?:(?:it|network|cloud|security) )?services?|managed (?:detection|security)|mdr|service desk|help ?desk|outsourc\w*|bpo|bpm|kpo|consulting|consultancy|per fte|per ticket|staff augmentation|it staffing|systems? integrators?|it services|statements? of work|contact cent(?:re|er)s?|call cent(?:re|er)s?|application maintenance|business (?:process )?services?|customer experience services?|cx services|dedicated (?:\w+ ){0,2}teams?)\b/i, not: /\b(?:software|saas|subscriptions?|platform|apps?|apis?|analytics|dashboards?|tools?|ai agents?|agents that|agentic|copilots?|ai assistants?|ai models?|llms?)\b/i },
  { model: 'marketplace', re: /\b(?:marketplace|take rate|gmv|two-sided|takes? an? (?:commission|cut|percentage))\b/i, not: /\b(?:software|saas|analytics|tools?)\b/i },
  // payments sellers are paid per transaction or by volume
  { model: 'transactions', re: /(?:\b(?:per[- ]transaction|transaction fees?|payments? (?:apis?|gateways?|processing|processors?|platforms?|infrastructure|orchestration|rails|acquiring|providers?|companies|stack)|payouts?|(?:hosted|payments?|online|one[- ]click) checkout|interchange|remittances?|merchant acquiring|card issuing|upi)\b|(?:^|\n)\s*payments?\b)/i, not: /\b(?:software|saas|subscriptions?|analytics|dashboards?|tools?|reconcil\w*|security|fraud|risk|compliance|expense\w*|spend|travel|invoic\w*|billing|payroll)\b/i },
  // hardware only when the seller makes, sells or ships devices, or names devices it sells; "test on real devices" is not that
  // the adjective form ("smart sensors", "iot devices") says the seller makes them, unless a word of software follows ("IoT device management software" is a subscription)
  { model: 'hardware_software', re: new RegExp(`\\b(?:hardware|(?:sells?|makes?|makers? of|manufactur\\w*|ships?|produces?)\\b[^.;]{0,40}\\b${DEVICE}\\b|${DEVICE}\\b[^.;]{0,20}(?:\\bplus\\b|\\bwith\\b|\\+)[^.;]{0,20}\\b(?:software|apps?|dashboard)\\b|(?:smart|iot|connected|handheld|rugged|gps|pos|wearable|embedded) (?:\\w+ )?${DEVICE}(?! (?:management|monitoring|analytics|security|software|platform|cloud|data|dashboards?)\\b))\\b`, 'i') },
  { model: 'saas', re: /\b(?:saas|subscriptions?|software|platform|apps?|per seat|per user|licen[cs]es?|cloud|apis?|sdks?|tools?|analytics)\b/i },
];

// The model most companies in a sector use, assumed only when the text names none (the answer says it was assumed).
export const SECTOR_MODEL: Record<VerticalId, BusinessModel> = {
  'logistics-tech': 'saas', fintech: 'saas', saas: 'saas', 'vertical-saas': 'saas', 'ai-native': 'saas', ites: 'services', telecom: 'connectivity', software: 'saas', cybersecurity: 'saas',
};

/** The business model: the explicit input when given, else read from the SELLER's words, else the sector's usual model, else
 * null. Give plain texts or { seller: [...], buyer: [...] } as for detectVertical. */
function modelFromSeller(seller: string): BusinessModel | null {
  for (const { model, re, not } of MODEL_MATCH) if (re.test(seller) && !(not && not.test(seller))) return model;
  return null;
}
export function detectModel(explicit: unknown, ...args: unknown[]): { model: BusinessModel | null; how: 'input' | 'read' | 'sector' | 'unknown' } {
  if (typeof explicit === 'string' && (BUSINESS_MODELS as string[]).includes(explicit)) return { model: explicit as BusinessModel, how: 'input' };
  const { seller } = sides(args);   // the seller's words only: what the buyer's side says about its own money is not the seller's model
  const read = modelFromSeller(seller);
  // The usual model is that of the sector finally chosen (after the AI label is set aside). A services firm that mentions a platform,
  // an app or software ("Brightfield Software", "business services on a digital platform") sells services unless its own words say
  // subscription, SaaS, per seat, per user or licence.
  if (read === 'saas' && !/\b(?:saas|subscriptions?|per seat|per user|licen[cs]es?)\b/i.test(seller) && detectVertical(...args)?.id === 'ites') return { model: 'services', how: 'sector' };
  const v = detectVertical(...args);
  const st = v?.subtype ? SUBTYPES.find((x) => x.id === v.subtype) : undefined;
  // A sub-type with its own usual model (a marketplace, a messaging or payments API) beats the generic software reading unless the seller says subscription, SaaS, per seat, per user or licence.
  if (st?.model && read === 'saas' && (st.model === 'marketplace' || !/\b(?:saas|software|subscriptions?|per seat|per user|licen[cs]es?)\b/i.test(seller))) return { model: st.model, how: 'sector' };
  if (read) return { model: read, how: 'read' };
  if (v) return { model: st?.model ?? SECTOR_MODEL[v.id], how: 'sector' };
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

// Run 22 (rule B82: no statistic, market size, benchmark or named company). What the BUYER's industry adds to a deal. The seller's own sector is read
// above (VERTICALS, SUBTYPES); this is the other side of the table: who reviews a purchase in the buyer's industry, what hurts the buyer there, and
// how the buyer usually buys. Used by account_plan_builder, mutual_action_plan_generator and roi_business_case_builder to word their advice
// for the buyer in the deal. Plain statements about how such buyers work; nothing here is a figure.
export interface BuyerContext {
  id: string;
  /** the industry in plain words, for a sentence ("financial services") */
  name: string;
  match: RegExp;
  /** who reviews a purchase, and what they ask for */
  reviews: string;
  /** what goes wrong for a buyer in this industry (the losses a risk case can count) */
  risks: string;
  /** how the buyer usually buys, and what that means for the plan */
  buying: string;
}
export const BUYER_CONTEXTS: BuyerContext[] = [
  {
    id: 'financial', name: 'financial services',
    match: /\b(?:bfsi|banks?|banking|financial[ _]services?|insurance|insurers?|lenders?|lending|mortgage|nbfc|fintech|asset managers?|wealth|capital markets?|payments? technology)\b/i,
    reviews: 'Information security, third party risk and compliance review a new vendor before it is signed, and internal audit can ask for evidence later.',
    risks: 'an audit finding, a question from the regulator, an outage on a regulated service, or a data exposure that has to be reported',
    buying: 'A vendor risk assessment and a security questionnaire sit in front of the contract, and legal reviews the data processing and outsourcing terms, so these steps start early and run beside the evaluation.',
  },
  {
    id: 'public-sector', name: 'public sector',
    match: /\b(?:government|public[ _]sector|ministry|municipal\w*|state agency|federal|defen[cs]e|public authority|city council)\b/i,
    reviews: 'Procurement rules decide how the purchase is made (a tender, a framework or an approved supplier list), and a security authorisation may be needed before the product is used.',
    risks: 'a challenge to the procurement, an audit of public money, a service outage that citizens notice, or a data exposure',
    buying: 'Budgets follow a fiscal calendar, a formal evaluation scores each bidder against written criteria, and approvals run through committees, so the dates in the plan are set by the buyer\'s process, not by the seller.',
  },
  {
    id: 'retail', name: 'retail and e-commerce',
    match: /\b(?:retail\w*|e-?commerce|d2c|online (?:retailers?|sellers?|stores?|brands?)|social sellers?|merchants?|marketplaces?|consumer brands?)\b/i,
    reviews: 'Operations, finance and the technology lead check the cost per order, the peak season and the link to the store platform.',
    risks: 'a failed peak season, lost or late orders, returns and chargebacks',
    buying: 'Owners and small teams often decide quickly and judge by a trial on live orders; larger chains run a formal review that includes IT.',
  },
  {
    id: 'industrial', name: 'manufacturing and industry',
    match: /\b(?:manufactur\w*|chemicals?|automotive|auto parts|industrial|plants?|factory|factories|steel|aerospace|machinery)\b/i,
    reviews: 'Plant and supply chain leaders, IT and operational technology security, and finance review a purchase, and any change to live production needs an agreed window.',
    risks: 'a line stoppage, late supply, a quality escape or an expensive expedite',
    buying: 'Buyers prefer a pilot at one plant, lane or supplier before a wider rollout, and the budget is approved against a cost case from operations.',
  },
  {
    id: 'education', name: 'education',
    match: /\b(?:education|schools?|universit\w*|colleges?|edtech|coaching|institutes?|admissions?)\b/i,
    reviews: 'Admissions or operations leads, the IT head and the finance office review a purchase, and student data protection comes up early.',
    risks: 'enquiries lost in the admission season, slow follow-up with applicants, or a student data exposure',
    buying: 'Decisions follow the academic calendar, so a rollout has to be live before the intake it is meant to help.',
  },
  {
    id: 'construction', name: 'construction and infrastructure',
    match: /\b(?:construction|civil|infrastructure|contractors?|builders?)\b/i,
    reviews: 'Project controls, the finance lead and IT review a purchase, and the field teams have to be able to use it on site.',
    risks: 'cost overruns, change orders that are not billed, and payment disputes with subcontractors',
    buying: 'Buyers prefer a pilot on one live project, and finance judges it on job cost and the flow of payments.',
  },
  {
    id: 'consumer-goods', name: 'consumer goods',
    match: /\b(?:fmcg|consumer goods|beverages?|foods?|packaged|grocery|condiments?|snacks?|dairy|distributors?|distribution)\b/i,
    reviews: 'Sales, distribution and IT review a purchase, and field adoption and the link to the ERP and the distributor systems are the usual questions.',
    risks: 'stock-outs, returns, and trade spend that cannot be tied to sales',
    buying: 'Buyers prefer a pilot in one region, judged against a comparable region.',
  },
  {
    id: 'telecom-media', name: 'telecom and media',
    match: /\b(?:telecom\w*|communications?|media|broadcast\w*|operators?|isps?)\b/i,
    reviews: 'Network, IT, security and finance review a purchase, and any change to a live service needs an agreed window.',
    risks: 'a service outage, customer churn after a bad experience, or a cost overrun in operations',
    buying: 'Buyers prefer a staged rollout with a fallback for each stage.',
  },
  {
    id: 'gaming', name: 'games',
    match: /\b(?:games?|gaming)\b/i,
    reviews: 'Engineering, live operations and security review a purchase.',
    risks: 'a problem on release day, fraud or cheating, or an outage during a live event',
    buying: 'Buyers prefer a trial timed around a release, with a clear way back.',
  },
  {
    id: 'technology', name: 'technology and software',
    match: /\b(?:software|saas|technology|tech|internet|digital)\b/i,
    reviews: 'Engineering leads, security and finance review a purchase, and developers usually try a tool before anyone signs.',
    risks: 'release delays, an incident that reaches customers, or time lost on tools that do not fit the way teams work',
    buying: 'Engineering teams trial first, security reviews before wider use, and procurement follows once security has signed off.',
  },
];
/** The buyer's industry read from the words that describe the buyer (industry, customer name, the industry before "deal for"); null when none matches. */
export function buyerContextFor(...texts: unknown[]): BuyerContext | null {
  const t = texts.filter((x): x is string => typeof x === 'string').join(' ');
  if (!t.trim()) return null;
  for (const c of BUYER_CONTEXTS) if (c.match.test(t)) return c;
  return null;
}
