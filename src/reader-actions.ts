/** Reading guidance is deterministic and does not turn supplied claims into verified facts. */
type Guide = [string, string, string, string];
const GUIDES: Record<string, Guide> = {
  pmf_scorecard: ['fit', 'The score compares supplied metrics with the selected benchmark. It does not establish product market fit outside that sample.', 'retention, cohort size and the benchmark choice', 'the decision to increase acquisition spending'],
  launch_commander: ['plan', 'This is a proposed launch sequence. A date and a goal do not establish delivery capacity.', 'the launch date, available capacity and buyer acceptance conditions', 'the launch scope'],
  customer_interview_kit: ['research', 'These questions test the stated hypothesis. A suggested answer is not customer evidence.', 'observations that contradict the interview hypothesis', 'the decision this interview is meant to inform'],
  retention_playbook: ['research', 'Reported reasons are leads to investigate, not established causes of churn.', 'the churn cohort, renewal dates and observed behaviour before departure', 'the retention intervention'],
  partner_architect: ['plan', 'The proposed partner motion still needs a qualified introduction and agreed commercial terms.', 'partner sourced opportunities, attribution and support capacity', 'the partner pilot'],
  crisis_planner: ['plan', 'The response follows the incident described. It does not establish exposure or resolve an incident.', 'confirmed impact, affected customers and the incident timeline', 'the response scope'],
  competitive_intel: ['research', 'The comparison separates the supplied claims from questions for the buyer. It does not prove superiority.', 'the buyer criterion and observed performance of the named alternatives', 'the competitive claim'],
  craft_gtm_analyzer: ['fit', 'The review identifies evidence present in the document. A keyword score is not a forecast of commercial success.', 'budget, conversion evidence, capacity and an agreed stop rule', 'the plan approval'],
  case_study_generator: ['publish', 'The story is a draft based on the supplied results. Customer permission and source checks remain separate decisions.', 'the original result records and written permission for the exact story', 'the customer story'],
  newsletter_builder: ['publish', 'The issue proposes a reader action. It does not establish that the claims or the action will improve results.', 'sources for the issue claims and evidence that readers can complete the requested action', 'the newsletter issue'],
  webinar_script: ['publish', 'The script is a delivery plan. The host must be able to demonstrate each promised takeaway.', 'the worked example, speaker confirmation and evidence behind each takeaway', 'the webinar'],
  content_repurposer: ['publish', 'The drafts reuse the supplied source. Repetition across channels does not add evidence.', 'source accuracy, customer permission and the destination for the reader action', 'the channel drafts'],
  thought_leadership_series: ['publish', 'The series develops a point of view. Interview observations do not establish a measured effect.', 'counterexamples to the argument and attributable evidence for the central claim', 'the article series'],
  testimonial_capture: ['publish', 'The kit prepares a customer conversation. It is not an approved customer endorsement.', 'the customer confirmed wording and written permission for the intended use', 'the testimonial'],
  sales_enablement_content: ['publish', 'The material is a sales draft. Claims need a source and the proposed next step needs buyer agreement.', 'claim evidence and the buyer decision the material must support', 'the sales material'],
  craft_content_improver: ['publish', 'The review identifies wording and evidence gaps. A cleaner sentence does not make a claim true.', 'the source behind each claim and a reader test of the revised action', 'the revised content'],
  account_plan_builder: ['deal', 'The plan organizes the supplied account facts and open questions. It does not confirm access or buying intent.', 'the account priorities, named decision makers and their confirmed approval steps', 'the account investment'],
  deal_strategy_coach: ['deal', 'The advice identifies the next uncertainty to resolve. It does not certify a close date or probability.', 'buyer confirmed authority, acceptance conditions and the stated blocker', 'the deal commitment'],
  discovery_question_bank: ['research', 'The questions seek observations about the supplied problem. Their wording is not proof that the problem exists.', 'the buyer examples, frequency and cost of the reported problem', 'the discovery conclusion'],
  roi_business_case_builder: ['fit', 'The arithmetic applies the supplied assumptions. Capacity value is not cash unless a cost is released.', 'buyer confirmed benefit, recurring price, implementation cost and the same measurement period', 'the investment case'],
  mutual_action_plan_generator: ['deal', 'The schedule is proposed until both parties agree owners, dependencies and acceptance conditions.', 'buyer availability, task dependencies and the earliest feasible start', 'the mutual plan'],
  win_loss_analyzer: ['research', 'The analysis interprets the recorded deal notes. A repeated reason is not a causal explanation on its own.', 'buyer confirmed reasons and comparable wins and losses', 'the change to the sales motion'],
  proposal_section_writer: ['deal', 'The proposal section is draft scope. It does not create delivery or pricing authority.', 'the agreed scope, excluded work and buyer acceptance conditions', 'the proposal'],
  email_sequence_generator: ['publish', 'The sequence is a draft invitation. It does not establish contact permission or buyer interest.', 'contact permission, claim evidence and the relevance of the requested reply', 'the outreach sequence'],
  demo_script_builder: ['deal', 'The script proposes what to show. A feature demonstration is not an agreed acceptance test.', 'buyer approved observations and pass conditions for the demonstration', 'the demo commitment'],
  pricing_negotiation_guide: ['deal', 'The guide prepares a negotiation. Suggested terms are not approved concessions.', 'pricing authority, delivery cost and the buyer objection', 'the commercial offer'],
  champion_enablement_kit: ['deal', 'The kit helps a contact explain the case internally. It does not establish that the contact has influence or authority.', 'the contact willingness, internal decision process and evidence requested by approvers', 'the champion strategy'],
  competitive_trap_setter: ['research', 'The questions compare alternatives against buyer needs. They do not establish a rival weakness.', 'the buyer test conditions and observed results for each alternative', 'the comparison used in the deal'],
  impact_get_framework: ['research', 'This is a method for collecting positioning evidence. It cannot choose a position without customer and alternative evidence.', 'customer interviews, observed alternatives and attributable outcome evidence', 'the positioning decision'],
  impact_identify_champions: ['deal', 'Suggested roles are candidates to validate. A title does not prove ownership, influence or access.', 'the actual problem owner and the buyer confirmed approval process', 'the champion shortlist'],
  impact_map_alternatives: ['research', 'The map organizes supplied alternatives. Unmeasured strengths remain claims to test.', 'the customer chosen criterion and observed results from the alternatives', 'the competitive position'],
  impact_pinpoint_value: ['research', 'The value statement is a hypothesis unless the supplied evidence supports the outcome and scope.', 'the before and after records, measurement period and attribution limits', 'the value claim'],
  impact_anchor_market: ['fit', 'The segment comparison uses supplied assumptions. Missing demand and capacity evidence prevent a market commitment.', 'account counts, fit criteria, obtainable share and delivery capacity', 'the beachhead choice'],
  impact_craft_message: ['publish', 'The message expresses the supplied position. A claim labelled unproved must stay a hypothesis in use.', 'customer recognition of the problem and proof for the proposed difference', 'the positioning message'],
  impact_translate_execution: ['publish', 'The channel drafts adapt the supplied position. They do not independently validate it.', 'claim evidence and whether the next step fits the stated buyer decision', 'the channel execution'],
  impact_full_audit: ['fit', 'The audit checks the supplied positioning evidence. Completeness is not proof of a differentiated position.', 'customer demand, alternative comparisons and evidence for the claimed outcome', 'the positioning approval'],
  icp_deep_dive: ['research', 'The profile summarizes the customer sample. It does not establish which traits caused success.', 'comparable customer outcomes and examples that contradict the proposed profile', 'the customer profile'],
  icp_scoring_model: ['fit', 'The score applies the stated rules. Qualification needs a separate test on deals not used to set the weights.', 'held back wins and non wins against a stop rule agreed before testing', 'the qualification rule'],
  buyer_group_analyzer: ['deal', 'The roles are a buying group hypothesis. Only buyer confirmation establishes the actual people and authority.', 'the named contacts, approval responsibilities and unresolved objections', 'the account coverage plan'],
  tam_sam_som_calculator: ['fit', 'The revenue figures are the result of the account, price, fit and share assumptions. They are not a demand forecast.', 'a dated account list, supportable annual price, fit evidence and achievable share', 'the market investment'],
  lookalike_signal_generator: ['research', 'The criteria define a search to test. A match is not proof that an account will buy.', 'verified company attributes and outcomes from a manually reviewed account sample', 'the prospecting criteria'],
  account_prioritization: ['fit', 'The ranking reflects the supplied account facts and weights. Missing evidence can change the order.', 'verified account attributes, weights and a review of the lowest ranked actual wins', 'the account allocation'],
  icp_gap_analysis: ['research', 'The gaps compare the supplied customer picture with the stated target. A target is not evidence of demand.', 'the customer sample, target assumptions and measured economics', 'the profile change'],
  icp_evolution_tracker: ['research', 'The suggested changes follow the recorded wins, losses and market notes. They do not establish a trend outside that sample.', 'comparable recent deals and evidence that the proposed change improves selection', 'the profile revision'],
  icp_interview_synthesizer: ['research', 'The synthesis groups the supplied interviews. A recurring phrase does not establish prevalence or a causal effect.', 'contradictory interviews, sample coverage and the original attributed notes', 'the interview conclusion'],
  gtm_consultation: ['plan', 'The motion follows the stated stage and economics. It is a planning hypothesis, not a growth forecast.', 'buyer access, acquisition economics and delivery capacity', 'the go to market motion'],
  epic_audit: ['fit', 'The scores apply the documented EPIC rubric to supplied facts. They do not measure future revenue.', 'verified economics and evidence for the strongest and weakest motion', 'the motion priority'],
  generate_roadmap: ['plan', 'The roadmap is a proposed sequence for the selected focus. It does not establish staffing or feasibility.', 'available owners, task dependencies and the acceptance check for the first milestone', 'the roadmap commitment'],
};

export function readingGuide(name: string, result: string, args: Record<string,unknown> = {}): string {
  let caseLabel='';
  for(const key of ['company_name','account_name','product_name','company']){const value=args[key];if(typeof value==='string'&&value.trim().length<=60&&!/^(?:unknown|not supplied|not given)$/i.test(value.trim())){caseLabel=value.trim();break;}}
  if(!caseLabel)for(const key of ['your_solution','your_product','product','product_feature','product_description']){const value=args[key];if(typeof value!=='string')continue;const match=/^([A-Z][A-Za-z0-9 &'’.-]{1,38})(?:,|:| is (?:a|an|the)\b)/.exec(value.trim());if(match){caseLabel=match[1];break;}}
  if(!caseLabel){const match=/\*Sector: (?:read from your inputs as|from your choice:)\s*([^.\n*]+)/.exec(result);if(match)caseLabel=match[1].trim()+' case';}
  const g = GUIDES[name];
  if (!g || !result || /^(?:Error|Invalid|Missing required|No contact|Contact declined)/i.test(result)) return '';
  const [kind, meaning, evidence, decision] = g;
  const held = /^# .*\bheld\b|^Use not approved|^Publication is not approved|^## Overall Score:[^\n]*\(NOT PROVED YET\)/im.test(result);
  const status = held ? ' Keep the stated hold in place; this guidance does not override it.' : '';
  let roles = kind === 'publish' ? [
    `Founder: check the central claim against the supplied evidence before endorsing ${decision}.`,
    `CEO: confirm who can approve ${decision} before committing the company to its claims.`,
    `CMO: check ${evidence} before approving the final copy.`,
    `CRO: ask the relevant buyer whether ${decision} answers their next decision before sales use.`,
    `Demand generation head: test the stated reader action and destination before distributing ${decision}.`,
  ] : kind === 'deal' ? [
    `Founder: challenge the least supported assumption in ${decision} before promising an outcome.`,
    `CEO: check delivery capacity against ${decision} before authorizing a commitment.`,
    `CMO: verify the source of the claim used in ${decision} before adding it to sales material.`,
    `CRO: confirm ${evidence} with the buyer before advancing the deal.`,
    `Demand generation head: compare the originating account criteria with ${decision} before sending more accounts to sales.`,
  ] : [
    `Founder: identify which missing fact could reverse ${decision} before accepting the recommendation.`,
    `CEO: set the resource limit and stop condition for ${decision} before committing budget.`,
    `CMO: check whether the audience and claim in ${decision} are supported by the supplied customer evidence before briefing the team.`,
    `CRO: validate ${evidence} with the relevant buyer or account owner before changing sales priorities.`,
    `Demand generation head: compare the next account sample with ${decision} before expanding outreach.`,
  ];
  const noPayback=name==='roi_business_case_builder'&&/^\| \*\*Payback Period\*\*[^\n]*No payback/im.test(result);
  const unsupportedClaim=/\(NOT PROVED YET\)|^> Unproved value hypothesis:|^Use not approved/m.test(result);
  const failedScore=name==='icp_scoring_model'&&/^# Scoring decision held/m.test(result);
  if(noPayback)roles=[
    'Founder: revise the scope or price before supporting this investment; the stated annual value does not cover the recurring fee.',
    'CEO: hold the investment commitment until finance confirms cash benefit, annual fee and implementation cost for the same period.',
    'CMO: remove any positive return claim from this case until the measured economics support it.',
    'CRO: confirm the cost baseline and achievable improvement with the buyer before revising the proposal.',
    'Demand generation head: do not reuse this case as a positive return example before the buyer confirms a supported result.',
  ];
  if(unsupportedClaim)roles=[
    `Founder: keep the unsupported claim in ${decision} as a hypothesis until the stated evidence gap is resolved.`,
    `CEO: hold external use of ${decision} until the evidence owner approves the claim and its scope.`,
    'CMO: compare the claimed outcome with its original record, baseline and period before approving copy; an unmeasured outcome is not a fact.',
    'CRO: ask the buyer for an observed result and its limits before using the claim in a sales conversation.',
    `Demand generation head: keep ${decision} out of distribution until the evidence and permission checks pass.`,
  ];
  if(failedScore)roles=[
    'Founder: review the missed test cases before proposing a revised qualification rule.',
    'CEO: hold automated qualification until a new test satisfies the stop rule agreed in advance.',
    'CMO: keep the failed score out of audience selection until the evidence has been reviewed.',
    'CRO: keep account decisions under manual review; record the evidence for each exception before outreach.',
    'Demand generation head: use a fresh held back sample for a revised model; do not tune on the failed test set.',
  ];
  const contextual=roles.map(line=>caseLabel?line.replace(': ', ': For '+caseLabel+', '):line);
  if(name==='launch_commander')return '\n\n## Reading the answer\n\nThis sequence is proposed. Change scope if the date, capacity or buyer acceptance check changes.\n\n## Decisions by role\n\nFounder: confirm the buyer before choosing launch scope.\nCEO: match owners to capacity before approving the date.\nCMO: verify the launch claim before briefing channels.\nCRO: agree the buyer acceptance check before offering a meeting.\nDemand generation head: check contact volume against channel capacity before outreach.\n';

  return `\n\n## Reading the answer\n\n${caseLabel ? `For ${caseLabel}: ` : ''}${meaning}${status} The conclusion needs review if new evidence changes ${evidence}.\n\n## Decisions by role\n\nProposed owners. Confirm the named person before acting.\n\n${contextual.join('\n\n')}\n`;
}

export function withReadingGuide(name:string,result:string,args:Record<string,unknown>={}):string {
  const guide=readingGuide(name,result,args);
  if(!guide)return result;
  const at=result.indexOf('To sharpen this, give:');
  if(at>=0){const start=result.lastIndexOf('\n',at)+1;return result.slice(0,start).trimEnd()+guide+'\n'+result.slice(start);}
  return result+guide;
}
