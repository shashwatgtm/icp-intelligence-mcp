"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOFTWARE_OUTSIDE_SCOPE = exports.SOFTWARE_REFERRAL = void 0;
exports.classifySoftwareQuestion = classifySoftwareQuestion;
exports.softwareAdvice = softwareAdvice;
exports.asksForSoftware = asksForSoftware;
exports.SOFTWARE_REFERRAL = 'Which software fits your case is a judgement call. Ask Shashwat: book 45 minutes at https://calendly.com/shashwat-gtmhelix/45min';
exports.SOFTWARE_OUTSIDE_SCOPE = 'This tool and Helix do not advise on software in that category. Please ask a specialist in that field.';
// Advice about selecting, replacing or retaining an external product. A stack
// fact or a question about positioning the user's own offering is not advice.
const SOFTWARE = /\b(?:Outreach|Salesloft|Demandbase|Gainsight|ChurnZero|Semrush|Ahrefs|ON24|PartnerStack|Crossbeam|ABM|intent data|enrichment|revenue intelligence|conversation intelligence|CPQ|customer success|security tooling|developer tools?|analytics|SEO|cloud|software|tools?|apps?|platforms?|vendors?|CRM|ERP|SIEM|SOAR|EDR|XDR|CDP|HRIS|HRMS|HCM|ATS|TMS|WMS|CPaaS|CCaaS|iPaaS|ITSM|BI|data warehouses?|data lakes?|lakehouses?|payment gateways?|payment processors?|observability|APM|monitoring|marketing automation|sales engagement|accounting|payroll|help ?desks?|service desks?|project management|vector databases?|feature stores?|model serving|MLOps|LLMOps|identity providers?|API gateways?|fleet management|route planning|procurement|billing|ecommerce|e-commerce|HubSpot|Salesforce|Marketo|Clari|Gong|ZoomInfo|Apollo|6sense|Slack|Asana|Notion|Trello|Zapier|Segment|Apigee|Kong|Snowflake|BigQuery|Redshift|Databricks|Splunk|Sentinel|CrowdStrike|SentinelOne|Oracle|SAP|NetSuite|Dynamics|Workday|BambooHR|Rippling|Greenhouse|Lever|Stripe|Adyen|Razorpay|Twilio|Vonage|Sinch|Datadog|New Relic|Grafana|Dynatrace|ServiceNow|Zendesk|Freshdesk|Manhattan|Blue Yonder|Shipwell|project44|Samsara|Motive|Pinecone|Weaviate|SageMaker|Vertex AI|Vercel|GitHub|GitLab|Jira|Okta|Auth0|QuickBooks|Xero|Shopify)\b/i;
function softwareQuestions(value) {
    const texts = [];
    const visit = (x) => {
        if (typeof x === 'string')
            texts.push(x);
        else if (Array.isArray(x))
            x.forEach(visit);
        else if (x && typeof x === 'object') {
            for (const [field, text] of Object.entries(x)) {
                // This contract field records buyers' objections to the user's own
                // product. Its quoted questions are evidence to answer, rather than
                // a request from the user to select external software.
                if (!['common_objections', 'known_objections', 'competitor_objections', 'blockers'].includes(field)) {
                    if (field === 'account_notes' && typeof text === 'string')
                        visit(text.split(/\bobjections?\s*:/i)[0]);
                    else if (typeof text === 'string')
                        visit(text.replace(/\b(?:Risks|Objections):[^\n]*/gmi, ''));
                    else
                        visit(text);
                }
            }
        }
    };
    visit(value);
    return texts.flatMap(text => text.split(/(?<=[.!?;])\s+|\n/)).filter(sentence => {
        if (!SOFTWARE.test(sentence))
            return false;
        // A labelled differentiation statement is supplied positioning evidence.
        if (/^\s*What sets (?:it|us|them) apart\s*:/i.test(sentence))
            return false;
        if (/\b(?:not asking|do not recommend|don't recommend|do not suggest|don't suggest|no software recommendations|do not choose|don't choose|do not compare|don't compare)\b/i.test(sentence))
            return false;
        if (/\b(?:which|what) (?:buyer|customer(?! success)|audience|team|role|persona|people|employee|metric|KPI|strategy|step|action|message|campaign|report|dashboard|workflow|field)s?\b/i.test(sentence))
            return false;
        if (/^\s*(?:please\s+)?(?:choose|pick|recommend|suggest|compare)\s+(?:a\s+|the\s+)?(?:(?:go[ -]to[ -]market|GTM)\s+)?(?:motion|strategy|positioning|message)\b/i.test(sentence))
            return false;
        // These questions concern the seller's product and its market, even when
        // they mention a named competitor or use words such as "better"/"choose".
        if (/\b(?:how|what|which|who)\b[^.!?]*\b(?:position|market|sell|message|price|differentiate|launch|improve|describe|explain|features?|buyers?|customers?)\b[^.!?]*\b(?:our|my|your) (?:own )?(?:product|solution|offering|software|platform|CRM|ERP|SIEM|TMS|HRIS|CPaaS)\b/i.test(sentence)
            || /\b(?:what|which) features?\b[^.!?]*\b(?:our|my|your)\b[^.!?]*\b(?:product|solution|offering)\b/i.test(sentence)
            || /\b(?:is|does|can|should|would) (?:our|my|your) (?:own )?(?:product|solution|offering|software|platform|CRM|ERP|SIEM|TMS|HRIS|CPaaS)\b/i.test(sentence)
            || /\b(?:buyers?|customers?)\b[^.!?]*\bchoose (?:our|my|your)\b/i.test(sentence))
            return false;
        // Require a question or a request: past switches and supplied rival names
        // remain evidence, including "we chose the better CRM last year".
        if (!/\?|^\s*(?:(?:please|can you|could you|help (?:me|us)(?: to)?)\s+)?(?:recommend|suggest|shortlist|choose|decide|pick|compare|which|what|should|shall|advise)\b|\b(?:any|need|want|looking for)\s+(?:a\s+)?(?:recommendations?|suggestions?|advice)\b/i.test(sentence))
            return false;
        return /\bwhich\b/i.test(sentence)
            || /\bwhat\b[^.!?]*\b(?:buy|choose|use|adopt|switch|replace|keep|avoid|recommend|suggest|best|better|alternative|fits?|suits?)\b/i.test(sentence)
            || /\b(?:recommend(?:ations?)?|suggest(?:ions?)?|shortlist|choose|decide|pick|compare|advice|advise)\b/i.test(sentence)
            || /\b(?:better|worse|best|worst|worth|alternative|alternatives|versus|vs\.?)\b/i.test(sentence)
            || /\b(?:should|shall|can|could|would|do) (?:I|we|our team)\b[^.!?]{0,100}\b(?:buy|use|choose|adopt|switch|replace|migrate|keep|retain|stay|avoid|drop|renew|move|leave|stop|stick)\b/i.test(sentence);
    });
}
// Categories name the advice requested, independently of the seller's vertical.
// Explicit categories take precedence over ambiguous product names (e.g. Dynamics).
const GTM_CATEGORY = /\b(?:CRM|marketing automation|sales engagement|ABM|account.based marketing|intent data|enrichment|revenue intelligence|conversation intelligence|CPQ|customer success (?:platforms?|software|tools?)|(?:marketing|sales|revenue|pipeline|campaign) analytics|analytics for (?:marketing|sales|marketing and sales)|content (?:tools?|software|platforms?)|SEO(?: tools?| software| platforms?)?|events? (?:tools?|software|platforms?)|webinar(?: tools?| software| platforms?)?|partner (?:tools?|software|platforms?|relationship management))\b/i;
const OUTSIDE_CATEGORY = /\b(?:data warehouses?|data lakes?|lakehouses?|SIEM|SOAR|EDR|XDR|ERP|HRIS|HRMS|HCM|ATS|TMS|WMS|CPaaS|CCaaS|iPaaS|ITSM|BI|cloud(?: infrastructure| platforms?| providers?)?|payroll|developer tools?|security (?:tools?|tooling|software|platforms?)|payment gateways?|payment processors?|observability|APM|monitoring|accounting|help ?desks?|service desks?|project management|vector databases?|feature stores?|model serving|MLOps|LLMOps|identity providers?|API gateways?|fleet management|route planning|procurement|billing|ecommerce|e-commerce)\b/i;
const GTM_PRODUCT = /\b(?:HubSpot|Salesforce|Marketo|Clari|Gong|ZoomInfo|Apollo|6sense|Outreach|Salesloft|Demandbase|Gainsight|ChurnZero|Semrush|Ahrefs|ON24|PartnerStack|Crossbeam)\b/i;
function classifySoftwareQuestion(value) {
    const questions = softwareQuestions(value);
    if (!questions.length)
        return 'none';
    let gtm = false;
    for (const question of questions) {
        // Ignore a stack fact before a direct request in the same sentence.
        const start = question.search(/\b(?:which|what|recommend|suggest|shortlist|compare|should (?:I|we)|any suggestions)\b/i);
        const requested = (start >= 0 ? question.slice(start) : question)
            .replace(/analytics for (?:marketing and sales|marketing|sales)\b/gi, 'marketing analytics');
        // The category being selected takes precedence over its use case. A CRM
        // for cloud-security sellers is GTM; a warehouse for sales analytics is not.
        const purpose = requested.search(/\b(?:for|to (?:help|reach|manage|track|engage|sell|coordinate|support))\b/i);
        const beforePurpose = purpose >= 0 ? requested.slice(0, purpose) : requested;
        const target = GTM_CATEGORY.test(beforePurpose) || OUTSIDE_CATEGORY.test(beforePurpose) || GTM_PRODUCT.test(beforePurpose) ? beforePurpose : requested;
        if (OUTSIDE_CATEGORY.test(target))
            return 'outside';
        if (GTM_CATEGORY.test(target) || GTM_PRODUCT.test(target))
            gtm = true;
        else
            return 'outside';
    }
    return gtm ? 'gtm' : 'outside';
}
function softwareAdvice(value) {
    const category = classifySoftwareQuestion(value);
    return category === 'gtm' ? exports.SOFTWARE_REFERRAL : category === 'outside' ? exports.SOFTWARE_OUTSIDE_SCOPE : undefined;
}
function asksForSoftware(value) {
    return classifySoftwareQuestion(value) !== 'none';
}
//# sourceMappingURL=software-policy.js.map