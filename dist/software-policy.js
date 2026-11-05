"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOFTWARE_REFERRAL = void 0;
exports.asksForSoftware = asksForSoftware;
exports.SOFTWARE_REFERRAL = 'Which software fits your case is a judgement call. Ask Shashwat: book 45 minutes at https://calendly.com/shashwat-gtmhelix/45min';
// Advice about selecting, replacing or retaining an external product. A stack
// fact or a question about positioning the user's own offering is not advice.
const SOFTWARE = /\b(?:software|tools?|apps?|platforms?|vendors?|CRM|ERP|SIEM|SOAR|EDR|XDR|CDP|HRIS|HRMS|HCM|ATS|TMS|WMS|CPaaS|CCaaS|iPaaS|ITSM|BI|data warehouses?|data lakes?|lakehouses?|payment gateways?|payment processors?|observability|APM|monitoring|marketing automation|sales engagement|accounting|payroll|help ?desks?|service desks?|project management|vector databases?|feature stores?|model serving|MLOps|LLMOps|identity providers?|API gateways?|fleet management|route planning|procurement|billing|ecommerce|e-commerce|HubSpot|Salesforce|Marketo|Clari|Gong|ZoomInfo|Apollo|6sense|Slack|Asana|Notion|Trello|Zapier|Segment|Apigee|Kong|Snowflake|BigQuery|Redshift|Databricks|Splunk|Sentinel|CrowdStrike|SentinelOne|Oracle|SAP|NetSuite|Dynamics|Workday|BambooHR|Rippling|Greenhouse|Lever|Stripe|Adyen|Razorpay|Twilio|Vonage|Sinch|Datadog|New Relic|Grafana|Dynatrace|ServiceNow|Zendesk|Freshdesk|Manhattan|Blue Yonder|Shipwell|project44|Samsara|Motive|Pinecone|Weaviate|SageMaker|Vertex AI|Vercel|GitHub|GitLab|Jira|Okta|Auth0|QuickBooks|Xero|Shopify)\b/i;
function asksForSoftware(value) {
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
                if (field !== 'common_objections')
                    visit(text);
            }
        }
    };
    visit(value);
    return texts.some(text => text.split(/(?<=[.!?;])\s+|\n/).some(sentence => {
        if (!SOFTWARE.test(sentence))
            return false;
        if (/\b(?:not asking|do not recommend|don't recommend|do not suggest|don't suggest|no software recommendations|do not choose|don't choose|do not compare|don't compare)\b/i.test(sentence))
            return false;
        if (/\b(?:which|what) (?:buyer|customer|audience|team|role|persona|people|employee)s?\b/i.test(sentence))
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
        return /\b(?:which|what)\b/i.test(sentence)
            || /\b(?:recommend(?:ations?)?|suggest(?:ions?)?|shortlist|choose|decide|pick|compare|advice|advise)\b/i.test(sentence)
            || /\b(?:better|worse|best|worst|worth|alternative|alternatives|versus|vs\.?)\b/i.test(sentence)
            || /\b(?:should|shall|can|could|would|do) (?:I|we|our team)\b[^.!?]{0,100}\b(?:buy|use|choose|adopt|switch|replace|migrate|keep|retain|stay|avoid|drop|renew|move|leave|stop|stick)\b/i.test(sentence);
    }));
}
//# sourceMappingURL=software-policy.js.map