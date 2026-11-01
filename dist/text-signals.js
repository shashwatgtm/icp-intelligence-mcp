"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SIGNALS = void 0;
exports.clauses = clauses;
exports.readSignal = readSignal;
exports.hasSignal = hasSignal;
exports.signal = signal;
exports.evidenceLine = evidenceLine;
exports.confirmedMatches = confirmedMatches;
exports.SIGNALS = {
    'a named role, title or team': /\b(?:head of (?:growth|revenue|marketing|sales|operations|security)|person in charge|business lead)\b/i,
    'an owner or responsible party': /\b(?:accountable for|answerable for|takes responsibility|person in charge)\b/i,
    'a KPI, metric or goal': /\b(?:we aim to|we intend to achieve|success means|we will measure)\b/i,
    'a deliverable or output': /\b(?:put together|roll out|bring to market|make available)\b/i,
    'a named document or tool': /\b(?:written instructions|step by step instructions|single source of figures)\b/i,
    'a campaign or content asset': /\b(?:sales slides|buyer education material|outreach sequence)\b/i,
    'a channel asset': /\b(?:online seminar|virtual seminar|product page)\b/i,
    'an audience, persona or segment': /\b(?:people we sell to|firms we serve|who this is for)\b/i,
    'constraints or assumptions': /\b(?:must stay within|cannot exceed|working assumption|we assume)\b/i,
    'a budget or resources': /\b(?:money set aside|funds allocated|people available)\b/i,
    'context or current state': /\b(?:where we are today|as things stand|today we)\b/i,
    'a quarter or financial year': /\b(?:first|second|third|fourth) quarter(?: of)?(?: 20\d{2})?\b/i,
    'a duration with a number': /\b(?:one|two|three|four|five|six|seven|eight|nine|ten|twelve) (?:days?|weeks?|months?|years?)\b(?! at a time)/i,
    specificity: /\b(?:employees|revenue|Series|staff|annual sales|funding round)\b/i,
    education: /\b(?:educate|inform|teach|explain how|help .* understand)\b/i,
    awareness: /\b(?:awareness|brand|become known|more people know)\b/i,
    trust: /\b(?:trust|credibility|earn confidence|be believed)\b/i,
    ask: /\b(?:get in touch|write back|take a look|give it a try)\b/i,
    engaged: /\b(?:engaged|participates? in (?:the )?(?:decision|evaluation)|attends? (?:our |the )?(?:decision|evaluation|review) meetings?|actively involved|working with us on the decision)\b/i,
    incumbent: /\b(?:incumbent|already (?:use|uses|using|have|has) (?:a |the )?(?:rival|competitor|supplier|provider|vendor)|current (?:supplier|provider|vendor)|existing (?:supplier|provider|vendor))\b/i,
    blocker: /\b(?:blockers?|blocked|cannot proceed|can't proceed|held up|stalled|waiting for (?:budget|approval)|approval pending|budget (?:approval )?pending|stands? in the way|obstacles?|barriers?)\b/i,
    cancelled: /\b(?:cancelled|canceled|terminated|called off|abandoned|will not proceed|won't proceed|asked for a refund|requested a refund|ended the contract)\b/i,
    recognition: /\b(?:industry analysts? (?:consider|regard|rate|place)|analysts? (?:placed|ranked|rated|selected)|front[- ]runner|top[- ]rated|judged (?:best|top)|recognition|award\w*|gartner|forrester|magic quadrant|named (?:a )?leader)\b/i,
    unique: /\b(?:no other (?:vendor|platform|supplier)|one[- ]of[- ]a[- ]kind|first and only|the only|unique|unrivalled|unrivaled|nothing else (?:can|does))\b/i,
    enterprise: /\b(?:enterprise|very large (?:corporate|companies|groups)|global corporations?|fortune 500|large corporate groups|big banks)\b/i,
    small: /\b(?:small|smb|tiny|under 50 (?:staff|employees)|fewer than 50 (?:staff|employees)|small businesses)\b/i,
    midmarket: /\b(?:mid[- ]market|mid[- ]size|medium[- ]sized)\b/i,
    finance: /\b(?:finance|fintech|financial|banks?|lenders?|people who keep our books|close each period|chief financial officer)\b/i,
    price: /\b(?:price|costs?(?! codes?\b)|expensive|budget|fees?|discount\w*|more money than (?:we|they) planned|paying more than .*worth|cannot afford|can't afford|too much money|spending ceiling)\b/i,
    offline: /\b(?:offline|lose coverage|lose signal|without (?:a )?(?:mobile )?(?:network|internet|signal)|no (?:internet|network|signal|connectivity)|poor network|remote areas?)\b/i,
    security: /\b(?:security|privacy|data protection|breach|hacked|records? leak(?:ed)?|records? .*public|unauthori[sz]ed access|attackers? (?:accessed|stole)|data (?:leak|stolen))\b/i,
    adoption: /\b(?:adoption|usage|not using|stopped using|rarely open|never log in|logins?|sits? unused|shelfware)\b/i,
    champion: /\b(?:champion|internal advocate|sponsor|person driving the purchase)\b/i,
    departed: /\b(?:champion left|sponsor left|key contact left|champion departed|sponsor departed|advocate resigned|contact resigned)\b/i,
    positive_result: /\b(?:improv\w*|saved?|reduc\w*|cut|cuts|faster|fewer|a fifth of the time|half the time|time fell|costs? fell|collections (?:rose|grew)|revenue (?:rose|grew))\b/i,
    adverse_result: /\b(?:(?:costs?|errors?|delays?|churn|losses?|tickets?) (?:rose|grew|increased|doubled)|(?:revenue|collections|retention|sales) (?:fell|dropped|declined)|lost money|worse than before|no (?:customer|client|user).*improvement|cancelled|canceled|refund)\b/i,
    hiring: /\b(?:hired|appointed|new (?:cfo|ceo|ciso|cto)|joined as|took over as|became (?:the )?(?:head|chief|director))\b/i,
    timing: /\b(?:timing|priority|later|on hold|postponed|deferred|until (?:their|our) finances recover|next year|not now)\b/i,
    leaky: /\b(?:pipeline|new logos?|acquisition|top of funnel|more leads|more deals from new accounts|win new customers|bring in new customers)\b/i,
    ai_search: /\b(?:organic traffic dropping|ai search|zero click|chatgpt traffic|buyers .*answers from chatgpt|seo leads collapsed|search clicks fell)\b/i,
    upmarket: /\b(?:enterprise|upmarket|move up|moving to larger accounts|selling to big banks|fortune 500 buyers)\b/i,
};
const normalized = (text) => text.replace(/&#(?:0*39|x0*27);|&apos;|[’‘]/gi, "'").replace(/[–—]/g, '-');
function clauses(text) {
    return String(text ?? '').replace(/\\([;.!?])/g, '$1').replace(/\b(Sr|Jr|Dr|Mr|Mrs|Ms|Prof|Inc|Ltd|vs)\./gi, '$1\u2024').split(/(?:[;\n!?]+|(?<!\d)\.(?!\d)|\b(?:but|however|whereas|yet now)\b|,?\s+and\s+(?=(?:we|they|it\s+(?:is|was|has|does)|our|their|the issue|the problem)\b))/i).map(s => s.trim().replace(/\u2024/g, '.')).filter(Boolean);
}
function denied(clause, index, match) {
    const before = clause.slice(0, index), after = clause.slice(index + match.length);
    // Negation that is part of a rule's exact phrase has that phrase's own meaning (not using, no signal).
    const left = (before.split(/[,:(]/).pop() ?? before).replace(/\bwhy not\b/gi, 'why');
    if (/\b(?:not|never|no|without|neither|nor|isn't|aren't|wasn't|weren't|don't|doesn't|didn't|cannot|can't|won't)\b(?:\W+\w+){0,6}\W*$/i.test(left.replace(/\bnot only\b/gi, '')))
        return true;
    if (/\bnon-\s*$/i.test(before))
        return true;
    if (/^\s*(?:(?:is|are|was|were|has|have|does|do)\s+)?(?:not|never|isn't|aren't|wasn't|weren't)\b/i.test(after))
        return true;
    if (/^\s*(?:is|are)\s+(?:fine|healthy|not (?:an? )?(?:issue|problem|concern)|no (?:issue|problem|concern))/i.test(after))
        return true;
    if (/^\s*(?:is|are)?\s*not for us\b/i.test(after))
        return true;
    if (/^\s*(?:nothing|no one|nobody)\b/i.test(after))
        return true;
    if (/\b(?:we (?:avoid|reject|deny)|do not claim|not claiming)\b/i.test(before))
        return true;
    return false;
}
function readSignal(text, floor, additional) {
    const affirmed = [], negative = [], unclear = [], matched = [];
    for (const original of clauses(text)) {
        const c = normalized(original);
        for (const re of [floor, additional].filter(Boolean)) {
            const flags = [...new Set((re.flags.replace(/[gy]/g, '') + 'gi').split(''))].join('');
            for (const m of c.matchAll(new RegExp(re.source, flags))) {
                if (!m[0])
                    continue;
                if (denied(c, m.index ?? 0, m[0]))
                    negative.push(original);
                else if (/\b(?:maybe|perhaps|might|unclear|not sure|not confirmed|hypothetically|if we|if they)\b/i.test(c))
                    unclear.push(original);
                else {
                    affirmed.push(original);
                    matched.push(m[0]);
                }
            }
        }
    }
    const state = affirmed.length && negative.length ? 'unclear' : affirmed.length ? 'affirmed' : unclear.length ? 'unclear' : negative.length ? 'negated' : 'absent';
    return { state, evidence: [...new Set([...affirmed, ...negative, ...unclear])], matched: [...new Set(matched)] };
}
function hasSignal(text, floor, kind) { return readSignal(text, floor, kind ? exports.SIGNALS[kind] : undefined).state === 'affirmed'; }
function signal(text, kind) { return readSignal(text, exports.SIGNALS[kind] ?? /(?!)/); }
function evidenceLine(label, reading) { return `${label}: ${reading.state === 'affirmed' ? 'stated' : reading.state === 'negated' ? 'negated' : 'fact was not clear'}${reading.evidence.length ? `; read "${reading.evidence.join('"; "')}"` : ''}.`; }
function confirmedMatches(text, floor, additional) { const r = readSignal(text, floor, additional); return r.state === 'affirmed' ? r.matched : []; }
//# sourceMappingURL=text-signals.js.map