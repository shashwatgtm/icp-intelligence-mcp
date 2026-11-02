"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOFTWARE_REFERRAL = void 0;
exports.asksForSoftware = asksForSoftware;
exports.SOFTWARE_REFERRAL = 'Which software fits your case is a judgement call. Ask Shashwat: book 45 minutes at https://calendly.com/shashwat-gtmhelix/45min';
// Selection intent, not the mere presence of an existing stack or competitor name.
function asksForSoftware(value) {
    const texts = [];
    const visit = (x) => { if (typeof x === 'string')
        texts.push(x);
    else if (Array.isArray(x))
        x.forEach(visit);
    else if (x && typeof x === 'object')
        Object.values(x).forEach(visit); };
    visit(value);
    const category = /\b(?:software|tools?|apps?|platforms?|vendors?|CRM|ERP|SIEM|CDP|marketing automation|sales engagement|HubSpot|Salesforce|Marketo|Clari|Gong|ZoomInfo|Apollo|6sense|Slack|Asana|Notion|Trello|Zapier)\b/i;
    return texts.some(text => text.split(/(?<=[.!?])\s+|\n/).some(sentence => {
        if (/\b(?:not asking|do not recommend|don't recommend|no software recommendations|do not choose|don't choose)\b/i.test(sentence))
            return false;
        if (!category.test(sentence))
            return false;
        if (/\b(?:which|what) (?:buyer|customer|audience|team|role|persona|people|employee)s?\b/i.test(sentence))
            return false;
        if (!/\?|^\s*(?:please )?(?:recommend|suggest|shortlist|choose|decide|pick|compare|which|what|should|shall|can)\b/i.test(sentence))
            return false;
        return /\b(?:which|what)\b[^.!?]{0,100}\b(?:use|buy|purchase|choose|select|adopt|best|fits?|recommend)\b/i.test(sentence)
            || /\b(?:recommend|suggest|shortlist)\b[^.!?]{0,80}\b(?:software|tools?|apps?|platforms?|vendors?|CRM|ERP|SIEM)\b/i.test(sentence)
            || /\b(?:should|shall|can) (?:I|we|our team)\b[^.!?]{0,30}\b(?:buy|use|choose|adopt|switch to)\b/i.test(sentence)
            || /\b(?:choose|decide|pick) between\b/i.test(sentence)
            || /\b(?:best|better)\b[^.!?]{0,35}\b(?:software|tool|platform|vendor|CRM|ERP)\b/i.test(sentence)
            || /^\s*compare\b[^.!?]{0,100}\b(?:buy|purchase|choose|select)\b/i.test(sentence);
    }));
}
//# sourceMappingURL=software-policy.js.map