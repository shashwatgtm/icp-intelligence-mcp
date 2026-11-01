// Generated copies live in the five permitted reserve-tool homes. Edit this hub source.
const descriptions: Record<string, string> = {
  accepted: "Number of accepted leads you want the backward plan to reach.",
  accepted_rate:
    "Your percentage of first-stage leads that reach the accepted stage, from 0 to 100; do not invent a rate.",
  accepted_stage:
    "Your definition of an accepted lead, such as sales-accepted or qualified opportunity.",
  account_id:
    "Your internal account label; use a non-identifying label when testing.",
  accounts: "Accounts to review using only supplied facts and evidence.",
  activation:
    "Your activation rate as a percentage, using the same event and period for value and target.",
  acv: "Average annual contract value in a consistent currency for current value and target.",
  acv_usd:
    "Annual contract value in USD supplied by you; leave out if unknown.",
  additional_units:
    "Number of additional units being considered, in the same unit as current usage.",
  addressable_accounts:
    "Whole number of accounts that could buy, supplied by you rather than estimated.",
  age_days:
    "Days since the account became a customer; accounts under 90 days use an onboarding baseline.",
  allowed_words:
    "Words you explicitly permit despite a style flag; this does not change factual checks.",
  annual:
    "Annual deal value as text in plain currency units, lakh or crore; do not use K or M abbreviations.",
  approval_path:
    "The actual people or roles whose approval is required before an offer.",
  arr: "Annual recurring revenue in USD, used only for the example escalation thresholds.",
  as_of: "Date to assess the supplied facts, in YYYY-MM-DD format.",
  audience:
    "Intended reader group, used to choose the stated approximate reading-level guide.",
  backward:
    "Target and supplied conversion rates for calculating the event count needed.",
  bands:
    "Your high and medium priority cut-offs for relative metric gaps; omitted bands use labelled examples.",
  bases:
    "Optional definitions, periods and units for each supplied value and target; missing bases remain unconfirmed.",
  better: "Whether a higher or lower value is better for this custom metric.",
  budget_event_date:
    "Known date of the customer's budget decision, in YYYY-MM-DD format.",
  business_model:
    "How the business earns revenue; select only the model the user confirms.",
  cac: "Customer acquisition cost in the same currency and measurement basis as lifetime value.",
  category:
    "Category of the expansion signal: usage, organization, value or timing.",
  challenge_type:
    "The main challenge the user reports; do not infer it from the company name.",
  champion:
    "Supplied facts for a draft the internal champion can review before forwarding.",
  champion_departure_date:
    "Confirmed date the champion left, in YYYY-MM-DD format.",
  champion_role: "Role of the internal champion who would send the draft.",
  change:
    "Proposed change to the existing ideal customer profile, kept as a hypothesis to test.",
  churn:
    "Churn percentage for a stated period; current and target must describe the same measure.",
  claim:
    "Exact claim supplied by the user; do not invent a number or customer outcome.",
  claims:
    "Claims for the draft, each with its stated evidence type and any supplied source.",
  classification:
    "The caller's classification after reading the whole supplied quote; it is not independently verified.",
  company:
    "Optional company context supplied by the user; do not invent a name.",
  comparisons:
    "Quoted comparisons between the existing ideal customer profile and current customer evidence.",
  complete:
    "True only if the user confirms this task is complete; omitted means completion is unknown.",
  contacts_per_event:
    "Your expected or observed contacts per event, with the basis confirmed in conversation.",
  cost: "Cost wording supplied for the champion draft; do not invent pricing.",
  cost_per_event: "Your cost for one event in the declared currency.",
  count:
    "Whole number of records in this group; it cannot exceed the supplied total.",
  counts:
    "Marginal group counts used to calculate a possible overlap range, not an exact intersection.",
  criteria:
    "Exact fit criteria, permitted values and weights supplied or explicitly approved by the user.",
  criterion:
    "Name of the fit criterion; lead fields must match the corresponding criterion exactly.",
  critical:
    "Example default whole-point weight for a criterion marked critical.",
  crm_fields:
    "CRM fields needed to test the hypothesis; this tool does not change CRM records.",
  currency:
    "Currency of all monetary inputs; no exchange-rate conversion is performed.",
  current: "Current observed metric values supplied by the user.",
  current_arr:
    "Current contracted annual recurring revenue, in the same currency as the expansion estimate.",
  current_basis:
    "Definition, period and units of the current metric value, in the user's words.",
  current_customers:
    "Pasted description of the actual current customers, not an invented profile.",
  current_motions:
    "Motions already in use: E for ecosystem, P for product-led, I for inbound/outbound, C for community.",
  current_state:
    "The customer's current plan, usage and situation, using supplied facts only.",
  current_units:
    "Number of units covered by the existing annual contract value.",
  custom:
    "Additional user-defined metrics with their own values, targets and improvement direction.",
  customer_quote:
    "Exact text present in the supplied current-customer description.",
  cycle:
    "Sales cycle length in days, measured consistently for current value and target.",
  cycle_days: "Observed sales cycle in days; leave out if unknown.",
  data_handling:
    "Supplied constraints on data use or handling for the champion draft.",
  date: "Supplied calendar date in YYYY-MM-DD format; do not guess a date.",
  deadline:
    "A supplied reply or signing deadline; a reply deadline is not treated as a signing commitment.",
  deal_kind: "Whether this is a new deal, a renewal or not yet known.",
  deal_sources:
    "Your observed share of deals by source; percentages together must not exceed 100.",
  decision: "The specific decision the champion asks the reader to make.",
  decision_date: "Supplied decision date in YYYY-MM-DD format.",
  default_weights:
    "Optional example weights by importance; confirm them before treating them as your scoring policy.",
  dimension: "Health dimension supported by the supplied signal and evidence.",
  discount_percent:
    "Discount being considered as a percentage from 0 to 100, confirmed by the user.",
  discounts:
    "One user-confirmed discount percentage per contract year, in year order.",
  disproof: "What observation would show the proposed hypothesis is wrong.",
  draft:
    "The actual prose to check; paste the text without adding invented context.",
  enterprise_focus:
    "Whether the user confirms an enterprise focus; leave out if unknown.",
  event_share:
    "Percentage of the user's accepted-lead target that events should supply, from 0 to 100.",
  events: "Whole number of events of this type being planned.",
  evidence:
    "Supplied evidence for this observation; unknown health or renewal signals may omit it.",
  evidence_ids:
    "IDs of distinct supplied evidence records supporting this hypothesis.",
  expansion_resolves_risk:
    "True only when the user says the proposed expansion addresses a stated risk.",
  expansion_type:
    "Whether expansion adds the same product, another product or a new division.",
  factor: "Renewal factor described by this supplied signal.",
  factors:
    "Renewal factors with positive, negative or unknown signals and their evidence.",
  feedback: "Customer statements and the caller's whole-quote classifications.",
  fields:
    "Exact observed lead values for the supplied criteria; missing values stay unknown.",
  first_stage_rate:
    "Your percentage of relevant contacts reaching the first lead stage, from 0 to 100.",
  format:
    "The event format being planned; analyst formats use influencer measures rather than lead conversion.",
  gap_percent:
    "Price gap stated by the buyer, from 0 to 100; it is not a verified competitor price.",
  geography:
    "Primary geography supplied by the user; adjustments are labelled example heuristics.",
  get: "Specific trade the buyer would give in exchange for the proposed concession.",
  give: "Specific concession the seller is considering; no approval is granted by this tool.",
  graded:
    "Whether this criterion uses the supplied graded point values rather than a binary match.",
  health_evidence:
    "Evidence supporting the supplied health score; a number alone is not confirmed health.",
  health_score:
    "User-supplied account health score from 0 to 100, with its supporting evidence.",
  hypotheses:
    "Proposed profile changes with evidence, a test and a way to disprove each one.",
  icp: "The existing ideal customer profile to review, pasted in the user's own wording.",
  icp_quote: "Exact text present in the supplied ideal customer profile.",
  id: "Unique label used to refer to this supplied evidence record.",
  importance: "Importance assigned to this fit criterion by the user.",
  important:
    "Example default whole-point weight for a criterion marked important.",
  industry: "Industry confirmed by the user; do not infer it from a name.",
  kind: "The applicable supplied evidence or deadline category; choose the schema option that matches the facts.",
  label: "User-supplied record label for keeping results distinct.",
  leads: "Lead records to compare with the approved fit criteria.",
  lower_complexity_choice:
    "User-selected lower-complexity option among tied leaders: E, P, I or C; never invent a choice.",
  ltv: "Customer lifetime value in the same currency and measurement basis as acquisition cost.",
  ltv_cac:
    "Lifetime-value to acquisition-cost ratio, using consistent supplied figures.",
  measure: "Outcome measure supplied for the champion's decision request.",
  metric:
    "Metric key being described; use its schema key, or custom: followed by the exact custom metric name for PMF.",
  metrics:
    "Observed metric values supplied by the user; missing values are not zero.",
  milestones: "Known completion status of each renewal cadence step.",
  mode: "Calculation needed: one discount, multiple years, a buyer-stated price gap, or a champion draft.",
  name: "Distinct user-supplied name of this custom metric or event type.",
  next_step:
    "Next action agreed or proposed by the user, with no action executed by the tool.",
  nice_to_have:
    "Example default whole-point weight for a criterion marked nice to have.",
  nps: "Net Promoter Score from -100 to 100; changes are reported in points.",
  nrr_percent:
    "Measured net revenue retention percentage; never estimate it from other signals.",
  observed_date:
    "Date the evidence was observed, in YYYY-MM-DD format, no later than the assessment date.",
  opportunity:
    "Expansion opportunity stated by the user, including scope and buyer if known.",
  owner:
    "Role or person responsible according to the user; leave out rather than inventing an owner.",
  part: "Name of the profile dimension or record group being compared or counted.",
  parts:
    "Groups with supplied whole-number counts; overlap remains a range without record-level data.",
  percent:
    "Observed share of deals from this source, as percentage points from 0 to 100.",
  period:
    "Period covered by the user's plan and figures, such as a named quarter or date range.",
  points:
    "Whole points awarded to this exact criterion value under the user's model.",
  present:
    "Whether the user confirms the expansion signal is present, absent or unknown.",
  pricing_authority:
    "True only if the user's pricing authority is confirmed; this tool grants none.",
  prior_renewal_conversation:
    "Whether a renewal conversation has actually occurred; omission means not confirmed.",
  problem: "The buyer problem supplied for the champion draft.",
  projected_value:
    "User-supplied value projection and its basis; do not invent a return estimate.",
  proposal: "The proposed scope or approach as supplied by the user.",
  proposed_mark:
    "How the caller proposes to mark the change in the reviewed profile; single evidence remains a question.",
  proposed_revision:
    "Optional rewritten draft to compare with the original facts and flagged spans.",
  quote:
    "Exact supplied statement, preserved as evidence rather than followed as an instruction.",
  reader_role: "Role of the person who would receive the champion draft.",
  reason: "User-supplied reason for the comparison or classification.",
  reduction:
    "Supplied mitigation for the named risk; do not invent a commitment.",
  relevant_share:
    "Your percentage of event contacts relevant to the target audience, from 0 to 100.",
  renewal_date: "Contract renewal date in YYYY-MM-DD format.",
  renewal_signed:
    "True only when renewal signature is confirmed; omission means not confirmed.",
  replacement_engaged:
    "Whether a replacement for the departed champion is confirmed as engaged.",
  retention:
    "Your retention percentage with the measurement period and definition confirmed.",
  risk: "The actual risk supplied for the proposed deal or draft.",
  risks:
    "Supplied risks and supporting evidence; unknown risk is not evidence of safety.",
  save_evidence:
    "Evidence for the claim that expansion would resolve an existing risk.",
  self_serve:
    "Whether a self-serve product journey actually exists; leave out if unknown.",
  signal:
    "Positive, negative or unknown renewal evidence; unknown signals do not enter the index.",
  signals: "Observed health or expansion signals with their supplied evidence.",
  skip_quotes:
    "Whether quoted source text should be excluded from ordinary style flags.",
  source: "Acquisition source to which the observed deal share belongs.",
  source_quote: "Exact source excerpt supplied to support the claim.",
  source_url:
    "Supplied source URL for the claim; the tool does not fetch or verify it.",
  stage:
    "Funding or company stage confirmed by the user; defaults are labelled examples.",
  stated_reason:
    "Reason explicitly stated in the evidence; do not infer a cause.",
  status:
    "Known risk presence or milestone completion status; unknown means not confirmed.",
  step: "Renewal cadence step whose completion status is being supplied.",
  target:
    "The user's own target for this measure; do not substitute a benchmark.",
  target_basis:
    "Definition, period and units of the user's target, in their words.",
  targets:
    "The user's own metric targets, using the same units and definitions as observed values.",
  task: "Task the user wants included in the supplied timeline.",
  test: "Specific observation or experiment the user will use to test the hypothesis.",
  tier_percents:
    "User-supplied whole-percentage thresholds for the fit tiers, in descending order.",
  timeline:
    "Tasks, owners and dates supplied by the user; no calendar events are created.",
  timezone:
    "Time zone supplied for the event; do not assume one from geography.",
  total: "Whole number of records in the population being counted.",
  trades: "Concessions and explicit buyer trades to review before an offer.",
  type: "Category of the supplied account risk.",
  type_name:
    "Exact name of one supplied event type whose rates may be reused when backward rates are missing.",
  types:
    "Event types with only the user's own counts, costs and conversion rates.",
  usage_percent:
    "Observed usage percentage supplied by the user, with the measurement basis confirmed.",
  value:
    "The actual observed value supplied by the user; preserve its stated units.",
  value_basis:
    "Definition, period and units of the observed metric value, in the user's words.",
  values: "Exact allowed criterion values and their user-approved points.",
  walk_away:
    "The seller's confirmed boundary for declining the deal; do not invent a threshold.",
  weekday:
    "Weekday the user says the event falls on; it is checked against the supplied date.",
  weight:
    "Whole-point importance weight approved by the user for this fit criterion.",
  win_rate:
    "Win percentage using the same opportunity definition and period for value and target.",
  worth:
    "Seller-estimated monetary worth of the buyer trade as text in plain units, lakh or crore.",
  year: "Contract year to which this trade belongs, beginning at 1.",
};
const words = (key: string) =>
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^custom:/, "")
    .replace(/^./, (c) => c.toUpperCase());
export function describeSchema(schema: any, tool: string, path = ""): any {
  const out = { ...schema };
  if (schema.properties)
    out.properties = Object.fromEntries(
      Object.entries(schema.properties).map(([key, raw]) => {
        const child = describeSchema(raw, tool, path ? path + "." + key : key);
        let description =
          child.description ||
          descriptions[key] ||
          `${words(key)} supplied by the user for this review; ask if required and absent.`;
        if (path === "bands")
          description =
            "High and medium relative-gap cut-offs for " +
            words(key) +
            ", in that order; these are your chosen bands.";
        if (tool === "negotiation_trade_check" && key === "value")
          description =
            "Deal value as text in plain currency units, lakh or crore; do not use K or M abbreviations.";
        if (tool === "event_portfolio_plan" && key === "target")
          description =
            "Your total accepted-lead target for the declared period.";
        if (tool === "icp_evidence_review" && key === "evidence")
          description =
            "Dated evidence records supplied by the user, with unique IDs for hypotheses to reference.";
        if (key === "as_of" || key === "date" || key.endsWith("_date"))
          if (!description.includes("YYYY-MM-DD"))
            description += " Use YYYY-MM-DD format.";
        child.description = description;
        return [key, child];
      }),
    );
  if (schema.items) out.items = describeSchema(schema.items, tool, path + "[]");
  return out;
}
const exact: Record<string, string> = {
  E: "Ecosystem and account-based selling",
  P: "Product-led growth",
  I: "Inbound and outbound demand",
  C: "Community and customer advocacy",
  CRITICAL: "Critical",
  AT_RISK: "At risk",
  LOW_SCORE_NEEDS_CORROBORATION: "Low score needing corroboration",
  AT_RISK_QUALITATIVE_OVERRIDE: "At risk from supplied qualitative evidence",
  INSUFFICIENT_EVIDENCE: "Insufficient evidence",
  ONBOARDING_BASELINE: "Onboarding baseline",
  PROVISIONALLY_HEALTHY: "Provisionally healthy",
  NEEDS_ATTENTION: "Needs attention",
  SOURCE_PLAN_FIELDS: "Planning details to confirm",
  METHOD_BEING_COMPLETED: "Method details are incomplete",
  NEW_DEAL_SELLER_REVIEW: "Seller review of a new deal",
  PRELIMINARY_MISSING_INPUTS: "Preliminary: information is missing",
  COMPLETE_SUPPLIED_INPUTS: "Based on all requested inputs",
};
function plain(value: unknown): string {
  if (value === null || value === undefined) return "Not supplied";
  if (typeof value === "number")
    return value.toLocaleString("en-US", { maximumSignificantDigits: 15 });
  if (typeof value === "boolean") return value ? "Yes" : "No";
  let text = String(value);
  if (exact[text] && text.length > 1) return exact[text];
  text = text.replace(
    /\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b/g,
    (token) => exact[token] ?? words(token.toLowerCase()),
  );
  text = text.replace(
    /\b(CRITICAL|PROVISIONALLY_HEALTHY|NEEDS_ATTENTION)\b/g,
    (token) => exact[token] ?? token,
  );
  return text
    .replace(/Source method/gi, "Calculation method")
    .replace(/This port accepts/g, "This calculation accepts")

    .replace(/\bltv_cac\b/g, "lifetime value to acquisition cost")
    .replace(/\brenewal_save_plan\b/g, "the renewal review")
    .replace(/\baccount_health_check\b/g, "the account health review");
}
const escape = (value: unknown) =>
  plain(value)
    .replace(
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g,
      "",
    )
    .replace(/[\u2013\u2014]/g, " - ")
    .replace(/\r?\n/g, " ")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/[\\`*_{}\[\]()#+.!|>~\-]/g, (c) => "\\" + c);
function lines(value: any, prefix = ""): string[] {
  if (Array.isArray(value))
    return value.length
      ? value.flatMap((item, index) =>
          lines(
            item,
            prefix ? prefix + " " + (index + 1) : "Item " + (index + 1),
          ),
        )
      : [(prefix ? prefix + ": " : "") + "None supplied"];
  if (value && typeof value === "object")
    return Object.entries(value).flatMap(([key, v]) =>
      lines(v, (prefix ? prefix + " / " : "") + (exact[key] ?? words(key))),
    );
  return [(prefix ? prefix + ": " : "") + plain(value)];
}
function readable(value: any): string[] {
  if (typeof value === "string")
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object") return lines(parsed);
      if (typeof parsed === "string") return [plain(parsed)];
    } catch {}
  return [plain(value)];
}
export function renderReport(report: any): string {
  let output =
    report.summary.map((v: any) => escape(v)).join("\n\n") +
    "\n\n# " +
    escape(report.title) +
    "\n";
  if (report.metrics?.length) {
    output += "\n| Measure | Result |\n| --- | --- |\n";
    for (const m of report.metrics)
      output +=
        "| " +
        escape(exact[m.label] ?? m.label) +
        " | " +
        escape(m.value) +
        (m.example ? " (Example figure)" : "") +
        " |\n";
  }
  for (const section of report.sections ?? []) {
    output += "\n## " + escape(section.heading) + "\n\n";
    if (section.body)
      output += readable(section.body).map(escape).join("\n\n") + "\n";
    if (section.table) {
      output +=
        "\n| " +
        section.table.headers.map(escape).join(" | ") +
        " |\n| " +
        section.table.headers.map(() => "---").join(" | ") +
        " |\n";
      for (const row of section.table.rows)
        output +=
          "| " +
          row.map((v: any) => escape(readable(v).join("; "))).join(" | ") +
          " |\n";
    }
  }
  output +=
    "\n## Limits\n\n" +
    [
      "Only supplied data was assessed. No page was fetched, model called, message sent or fact independently verified.",
      ...(report.limitations ?? []),
    ]
      .map((v) => "- " + escape(v))
      .join("\n") +
    "\n";
  return output;
}
