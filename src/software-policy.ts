export const SOFTWARE_REFERRAL = 'Which software fits your case is a judgement call. Ask Shashwat: book 45 minutes at https://calendly.com/shashwat-gtmhelix/45min';

export const SOFTWARE_OUTSIDE_SCOPE = 'This tool and Helix do not advise on software in that category. Please ask a specialist in that field.';

// Advice about selecting, replacing or retaining an external product. A stack
// fact or a question about positioning the user's own offering is not advice.
const SOFTWARE = /\b(?:Outreach|Salesloft|Demandbase|Gainsight|ChurnZero|Semrush|Ahrefs|ON24|PartnerStack|Crossbeam|ABM|intent data|enrichment|revenue intelligence|conversation intelligence|CPQ|customer success|security tooling|developer tools?|analytics|SEO|cloud|software|tools?|apps?|platforms?|vendors?|CRM|ERP|SIEM|SOAR|EDR|XDR|CDP|HRIS|HRMS|HCM|ATS|TMS|WMS|CPaaS|CCaaS|iPaaS|ITSM|BI|data warehouses?|data lakes?|lakehouses?|payment gateways?|payment processors?|observability|APM|monitoring|marketing automation|sales engagement|accounting|payroll|help ?desks?|service desks?|project management|vector databases?|feature stores?|model serving|MLOps|LLMOps|identity providers?|API gateways?|fleet management|route planning|procurement|billing|ecommerce|e-commerce|HubSpot|Salesforce|Marketo|Clari|Gong|ZoomInfo|Apollo|6sense|Slack|Asana|Notion|Trello|Zapier|Segment|Apigee|Kong|Snowflake|BigQuery|Redshift|Databricks|Splunk|Sentinel|CrowdStrike|SentinelOne|Oracle|SAP|NetSuite|Dynamics|Workday|BambooHR|Rippling|Greenhouse|Lever|Stripe|Adyen|Razorpay|Twilio|Vonage|Sinch|Datadog|New Relic|Grafana|Dynatrace|ServiceNow|Zendesk|Freshdesk|Manhattan|Blue Yonder|Shipwell|project44|Samsara|Motive|Pinecone|Weaviate|SageMaker|Vertex AI|Vercel|GitHub|GitLab|Jira|Okta|Auth0|QuickBooks|Xero|Shopify)\b/i;

// The user's own offering, described by what it is ("for a telecom analytics
// product", "with our analytics platform", "for our AI app that helps ITeS
// firms run service desks"), names what is being sold, not what to buy. It is
// removed before the sentence is read for a software request, so "Choose
// between partner-led and outbound for a telecom analytics product" is a GTM
// question, while "Which CRM should we buy for our analytics product" still
// asks for a CRM. "for" after a buying word ("looking for", "vendor for",
// "recommendations for") keeps the phrase, since there it names the purchase.
const MODIFIER = String.raw`(?:(?!(?:and|or|vs|versus|to|from|than|but|that|which|who)\b)[\w-]+\s+)`;
const OFFERING = String.raw`(?:products?|startups?|compan(?:y|ies)|business(?:es)?|firms?|offerings?|solutions?|brands?|ventures?|SaaS|software|platforms?|apps?|tools?)\b`;
const OFFERING_CLAUSE = String.raw`(?:\s+(?:that|which|who|sold|used|built|made|designed|aimed|targeting)\b[^,;:?.!]*)?`;
const BUYING_WORD = String.raw`(?<!\b(?:look\w*|search\w*|shop\w*|hunt\w*|pay\w*|budget\w*|need\w*|want\w*|options?|alternatives?|replacements?|substitutes?|vendors?|providers?|suppliers?|recommend\w*|suggest\w*|advice|advise)\s+)`;
const OWN_OFFERING = new RegExp(String.raw`\b(?:(?:for|of|with|behind|around)\s+(?:our|my)\s+|${BUYING_WORD}for\s+(?:(?:a|an|the|this)\s+)?|(?:sell(?:ing|s)?|market(?:ing)?|launch(?:ing)?|position(?:ing)?|pric(?:e|ing)|build(?:ing)?|make|offer)\s+(?:a|an|the|our|my|this)\s+)${MODIFIER}{0,6}${OFFERING}${OFFERING_CLAUSE}`, 'gi');
const withoutOwnOffering = (sentence: string): string => sentence.replace(OWN_OFFERING, ' ').replace(/^[\s,;:]+/, '');

// "HubSpot or Salesforce?" compares two named products, as "versus" does.
const NAMED = String.raw`(?:HubSpot|Salesforce|Marketo|Clari|Gong|ZoomInfo|Apollo|6sense|Outreach|Salesloft|Demandbase|Gainsight|ChurnZero|Semrush|Ahrefs|ON24|PartnerStack|Crossbeam|Snowflake|BigQuery|Redshift|Databricks|Splunk|Sentinel|CrowdStrike|SentinelOne|Datadog|New Relic|Stripe|Adyen|Razorpay|Twilio|Zendesk|Freshdesk|ServiceNow|Workday|Rippling)`;
const NAMED_PAIR = new RegExp(String.raw`\b${NAMED}\s+or\s+${NAMED}\b`, 'i');

// Search-style requests have no question mark and no "which" or "what"
// (red team, 14 Nov 2026): "best marketing analytics tool", "best data
// warehouse for us", "top CRM for us", "recommended outbound software". The
// whole sentence must be the request: a leading best, top or recommended, a few
// words, a software noun, and at most "for us" (or our or my team). A product
// description such as "Top route planning software for 3PLs" stays evidence.
const SEARCH_STYLE = new RegExp(String.raw`^\s*(?:the\s+)?(?:best|top|recommended)\s+(?:[\w&-]+\s+){0,4}?(?:tools?|software|platforms?|apps?|vendors?|providers?|solutions?|suites?|systems?|stack|CRM|ERP|SIEM|SOAR|EDR|XDR|CDP|HRIS|HRMS|HCM|ATS|TMS|WMS|CPaaS|CCaaS|iPaaS|ITSM|BI|CPQ|data warehouses?|data lakes?|lakehouses?|databases?|payment gateways?|payment processors?|cloud providers?|help ?desks?|service desks?|marketing automation|sales engagement|intent data|enrichment)(?:\s+(?:for|to use for)\s+(?:us|me|(?:our|my)\s+(?:[\w-]+\s+){0,3}?(?:teams?|compan(?:y|ies)|business(?:es)?|startups?|firms?)))?(?:\s+teams?)?\s*[.!?]?\s*$`, 'i');

function softwareQuestions(value: unknown): string[] {
  const texts: string[] = [];
  const visit = (x: unknown): void => {
    if (typeof x === 'string') texts.push(x);
    else if (Array.isArray(x)) x.forEach(visit);
    else if (x && typeof x === 'object') {
      for (const [field, text] of Object.entries(x)) {
        // This contract field records buyers' objections to the user's own
        // product. Its quoted questions are evidence to answer, rather than
        // a request from the user to select external software.
        if (!['common_objections','known_objections','competitor_objections','blockers'].includes(field)) {
          if (field === 'account_notes' && typeof text === 'string') visit(text.split(/\bobjections?\s*:/i)[0]);
          else if (typeof text === 'string') visit(text.replace(/\b(?:Risks|Objections):[^\n]*/gmi,''));
          else visit(text);
        }
      }
    }
  };
  visit(value);
  // SEARCH_STYLE reads the sentence as typed (red team R2 finding A, 14 Nov
  // 2026). Removing the own-offering phrase first turned a seller's tagline
  // ("Best HR software for Indian startups") into a bare request.
  return texts.flatMap(text => text.split(/(?<=[.!?;])\s+|\n/)).map(original => ({original, sentence: withoutOwnOffering(original)})).filter(({original, sentence}: {original: string; sentence: string}) => {
    if (!SOFTWARE.test(sentence)) return false;
    // A labelled differentiation statement is supplied positioning evidence.
    if (/^\s*What sets (?:it|us|them) apart\s*:/i.test(sentence)) return false;
    if (/\b(?:not asking|do not recommend|don't recommend|do not suggest|don't suggest|no software recommendations|do not choose|don't choose|do not compare|don't compare)\b/i.test(sentence)) return false;
    if (/\b(?:which|what) (?:(?:go[ -]to[ -]market|GTM)\s+)?(?:motion|operational\s+pain|pain|buyer|customer(?! success)|segment|audience|team|role|persona|people|employee|metric|KPI|strategy|step|action|message|campaign|report|dashboard|workflow|field)s?\b/i.test(sentence)) return false;
    if (/^\s*(?:please\s+)?(?:choose|pick|recommend|suggest|compare)\s+(?:a\s+|the\s+)?(?:(?:go[ -]to[ -]market|GTM)\s+)?(?:motion|strategy|positioning|message)\b/i.test(sentence)) return false;
    // "customer success" names a GTM software category, not the buyers ("Which customer success analytics platform
    // should our software team buy?" is a purchase, 13 Nov 2026).
    // These questions concern the seller's product and its market, even when
    // they mention a named competitor or use words such as "better"/"choose".
    if (/\b(?:how|what|which|who)\b[^.!?]*\b(?:position|market|sell|message|price|differentiate|launch|improve|describe|explain|features?|buyers?|customers?(?!\s+success))\b[^.!?]*\b(?:our|my|your) (?:own )?(?:product|solution|offering|software|platform|CRM|ERP|SIEM|TMS|HRIS|CPaaS)\b/i.test(sentence)
      || /\b(?:what|which) features?\b[^.!?]*\b(?:our|my|your)\b[^.!?]*\b(?:product|solution|offering)\b/i.test(sentence)
      // "should our software marketing team buy" names a team, not the product.
      || /\b(?:is|does|can|should|would) (?:our|my|your) (?:own )?(?:product|solution|offering|software|platform|CRM|ERP|SIEM|TMS|HRIS|CPaaS)\b(?!\s+(?:[\w-]+\s+)?(?:teams?|departments?)\b)/i.test(sentence)
      || /\b(?:buyers?|customers?)\b[^.!?]*\bchoose (?:our|my|your)\b/i.test(sentence)) return false;
    // Require a question or a request: past switches and supplied rival names
    // remain evidence, including "we chose the better CRM last year".
    if (!SEARCH_STYLE.test(original) && !/\?|^\s*(?:(?:please|can you|could you|help (?:me|us)(?: to)?)\s+)?(?:recommend|suggest|shortlist|choose|decide|pick|compare|which|what|should|shall|advise)\b|\b(?:any|need|want|looking for)\s+(?:a\s+)?(?:recommendations?|suggestions?|advice)\b/i.test(sentence)) return false;
    return /\bwhich\b/i.test(sentence)
      || /\bwhat\b[^.!?]*\b(?:buy|choose|use|adopt|switch|replace|keep|avoid|recommend|suggest|best|better|alternative|fits?|suits?)\b/i.test(sentence)
      || /\b(?:recommend(?:ations?)?|suggest(?:ions?)?|shortlist|choose|decide|pick|compare|advice|advise)\b/i.test(sentence)
      || /\b(?:better|worse|best|worst|worth|alternative|alternatives|versus|vs\.?)\b/i.test(sentence)
      || NAMED_PAIR.test(sentence)
      || SEARCH_STYLE.test(original)
      || /\b(?:should|shall|can|could|would|do) (?:I|we|our team)\b[^.!?]{0,100}\b(?:buy|use|choose|adopt|switch|replace|migrate|keep|retain|stay|avoid|drop|renew|move|leave|stop|stick)\b/i.test(sentence);
  }).map(({sentence}) => sentence);
}


// Categories name the advice requested, independently of the seller's vertical.
// Explicit categories take precedence over ambiguous product names (e.g. Dynamics).
const GTM_CATEGORY = /\b(?:CRM|marketing automation|sales engagement|(?:outbound|prospecting|sales prospecting) (?:tools?|software|platforms?)|ABM|account.based marketing|intent data|enrichment|revenue intelligence|conversation intelligence|CPQ|customer success (?:platforms?|software|tools?)|(?:marketing|sales|revenue|pipeline|campaign|demand (?:gen|generation)|customer success|CS|go[ -]to[ -]market|GTM) analytics|analytics for (?:marketing|sales|marketing and sales|demand (?:gen|generation)|customer success|go[ -]to[ -]market|GTM)|content (?:tools?|software|platforms?)|SEO(?: tools?| software| platforms?)?|events? (?:tools?|software|platforms?)|webinar(?: tools?| software| platforms?)?|partner (?:tools?|software|platforms?|relationship management))\b/i;
const OUTSIDE_CATEGORY = /\b(?:data warehouses?|data lakes?|lakehouses?|SIEM|SOAR|EDR|XDR|ERP|HRIS|HRMS|HCM|ATS|TMS|WMS|CPaaS|CCaaS|iPaaS|ITSM|BI|cloud(?: infrastructure| platforms?| providers?)?|payroll|developer tools?|security (?:tools?|tooling|software|platforms?)|payment gateways?|payment processors?|observability|APM|monitoring|accounting|help ?desks?|service desks?|project management|vector databases?|feature stores?|model serving|MLOps|LLMOps|identity providers?|API gateways?|fleet management|route planning|procurement|billing|ecommerce|e-commerce)\b/i;
// Owner decision, 13 Nov 2026: a plain analytics tool question ("What is the
// best analytics tool for us?") is a GTM stack question and goes to the
// booking, like marketing, sales, demand generation and customer success
// analytics. "Plain" means no qualifier, or only a light word ("best", "an",
// "which"), before "analytics". A non-GTM qualifier ("security analytics",
// "product analytics", "telecom analytics"), the user's own product ("our
// analytics platform") or a non-GTM purpose ("for our SOC team") keeps the
// plain decline.
const PLAIN_ANALYTICS = /(?<!\b(?:our|my|your|their)\s+(?:[\w-]+\s+){0,3})(?:^\s*|\b(?:best|top|good|great|better|right|ideal|recommended|suitable|simple|cheap|free|affordable|basic|modern|leading|popular|reliable|new|single|an?|the|which|what|any|some|one|for|of|on|about|with|and|or)\s+)analytics\s+(?:tools?|platforms?|software|solutions?|stack|vendors?|providers?|suites?|apps?|systems?|packages?)\b/i;
const NON_GTM_USE = /\b(?:security|SOC|fraud|threats?|network (?:operations|traffic|performance)|logs?|finance (?:team|function|department)|FP&A|supply chain|inventory|warehouses?|fleet|manufacturing|factory|IoT|engineering|DevOps|infrastructure|HR|payroll|clin(?:ical)|pat(?:ients?)|trading)\b/i;
const GTM_PRODUCT = /\b(?:HubSpot|Salesforce|Marketo|Clari|Gong|ZoomInfo|Apollo|6sense|Outreach|Salesloft|Demandbase|Gainsight|ChurnZero|Semrush|Ahrefs|ON24|PartnerStack|Crossbeam)\b/i;

export function classifySoftwareQuestion(value: unknown): 'gtm' | 'outside' | 'none' {
  const questions = softwareQuestions(value);
  if (!questions.length) return 'none';
  let gtm = false;
  for (const question of questions) {
    // Ignore a stack fact before a direct request in the same sentence.
    const start = question.search(/\b(?:which|what|recommend|suggest|shortlist|compare|should (?:I|we)|any suggestions)\b/i);
    const requested = (start >= 0 ? question.slice(start) : question)
      .replace(/analytics for (?:marketing and sales|marketing|sales|demand (?:gen|generation)|customer success|go[ -]to[ -]market|GTM)\b/gi, 'marketing analytics');
    // The category being selected takes precedence over its use case. A CRM
    // for cloud-security sellers is GTM; a warehouse for sales analytics is not.
    const purpose = requested.search(/\b(?:for|to (?:help|reach|manage|track|engage|sell|coordinate|support))\b/i);
    const beforePurpose = purpose >= 0 ? requested.slice(0, purpose) : requested;
    const target = GTM_CATEGORY.test(beforePurpose) || OUTSIDE_CATEGORY.test(beforePurpose) || GTM_PRODUCT.test(beforePurpose) ? beforePurpose : requested;
    if (OUTSIDE_CATEGORY.test(target)) return 'outside';
    if (GTM_CATEGORY.test(target) || GTM_PRODUCT.test(target)) gtm = true;
    else if (PLAIN_ANALYTICS.test(target) && !NON_GTM_USE.test(requested)) gtm = true;
    else return 'outside';
  }
  return gtm ? 'gtm' : 'outside';
}

export function softwareAdvice(value: unknown): string | undefined {
  const category = classifySoftwareQuestion(value);
  return category === 'gtm' ? SOFTWARE_REFERRAL : category === 'outside' ? SOFTWARE_OUTSIDE_SCOPE : undefined;
}

export function asksForSoftware(value: unknown): boolean {
  return classifySoftwareQuestion(value) !== 'none';
}
