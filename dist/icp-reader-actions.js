"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.icpReading = icpReading;
// Caller strings have already passed the shared input escaping boundary. Long text
// stays in the result; do not cut an escaped sequence to make a role label.
const label = (value, fallback) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 160 && !/[\r\n]/.test(value) ? value.trim() : fallback;
const number = (value, fallback) => typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString('en-US', { maximumFractionDigits: 6 }) : fallback;
const records = (value) => Array.isArray(value) ? value.filter(x => x && typeof x === 'object' && !Array.isArray(x)) : [];
const names = (value, fallback) => {
    const values = Array.isArray(value) ? value.map(x => label(x, '')).filter(Boolean) : [];
    const text = [...new Set(values)].join(', ');
    return text && text.length <= 180 ? text : fallback;
};
function icpReading(name, a, result = '') {
    const product = label(a.product_category, 'the supplied product');
    if (name === 'icp_deep_dive') {
        const sample = records(a.customers), customers = names(sample.map(x => x.name), 'the supplied customer records'), industries = names(sample.map(x => x.industry), 'the recorded industries');
        return { meaning: `This profile describes ${sample.length} supplied customer records for ${product}. A common trait in this sample does not establish why customers bought.`, evidence: `a comparison with lost or unsuitable accounts, verified deal economics and contrary examples to the proposed traits`, roles: [
                `Founder: compare the buying reasons in ${customers} with at least one lost or unsuitable account before approving the profile; record any trait shared by both groups.`,
                `CEO: ask finance to verify contract value and sales effort for ${customers} before funding expansion; do not use customer count as a profitability check.`,
                `CMO: check whether the concentration in ${industries} reflects the supplied sample or an observed customer need before writing the audience brief.`,
                `CRO: ask the account owners for ${customers} to confirm the recorded champion and buying trigger before using those roles to qualify new deals.`,
                `Demand generation head: test the proposed criteria on a fresh account sample outside ${customers} before widening outreach; record false matches as well as matches.`,
            ] };
    }
    if (name === 'icp_scoring_model') {
        const criteria = records(a.scoring_criteria), dimensions = names(criteria.map(x => x.criterion), 'the proposed criteria');
        return { meaning: `The model turns ${criteria.length} supplied criteria into a proposed qualification rule for ${product}. Ordered values and weights are not evidence of predictive accuracy.`, evidence: `outcomes on wins and losses held out of model design, using a stop rule agreed before seeing those outcomes`, roles: [
                `Founder: challenge the causal reason for using ${dimensions} before adopting the score; keep a criterion only with a stated hypothesis that a deal review can disprove.`,
                `CEO: name the decision owner and agree the acceptable cost of a false qualification for ${product} before permitting automated use.`,
                `CMO: verify that ${dimensions} can be observed consistently in an account record before using the score to define an audience.`,
                `CRO: have sales operations score won and lost ${product} deals without seeing their outcome before accepting the rule; report the mistakes against the agreed stop rule.`,
                `Demand generation head: reserve a fresh test set for ${product} before tuning weights; keep it out of the records used to design the model.`,
            ] };
    }
    if (name === 'buyer_group_analyzer') {
        const contacts = names(a.known_stakeholders, 'the supplied contacts'), champion = label(a.typical_champion, 'the proposed champion'), amount = label(a.deal_size, 'the unstated deal amount');
        return { meaning: `This is a contact and approval hypothesis for ${product}. A title in ${contacts} does not establish authority, advocacy or access.`, evidence: `direct confirmation of approval authority, the buying steps and the acceptance condition for ${amount}`, roles: [
                `Founder: ask ${champion} to describe the problem in their own words before endorsing the purchase story; keep their observation separate from a role inferred from a title.`,
                `CEO: confirm who can approve ${amount} and what approval they require before committing delivery resources; do not assign that power from a job title.`,
                `CMO: collect one stated acceptance concern from ${contacts} before preparing committee material; mark any missing concern as unconfirmed.`,
                `CRO: ask ${champion} to arrange contact with the actual approver before the next deal review; record whether the introduction and approval path are confirmed.`,
                `Demand generation head: distinguish ${contacts} from confirmed buying roles before adding similar titles to a target list; validate the proposed role with the account owner.`,
            ] };
    }
    if (name === 'tam_sam_som_calculator') {
        const shown = (field, fallback) => result.match(new RegExp('^\\| ' + field + ' \\| ([^|]+)\\|', 'm'))?.[1]?.trim() || fallback;
        const count = number(a.total_potential_companies, 'the unstated account count'), price = shown('Average Contract Value', number(a.average_contract_value, 'the unstated annual price')).replace(/^\$/, ''), fit = typeof a.icp_percentage === 'number' ? shown('ICP Match Rate', number(a.icp_percentage, '')) + ' fit' : 'the displayed fit assumption', share = typeof a.year1_market_share_target === 'number' ? shown('Year 1 Market Share Target', number(a.year1_market_share_target, '')) + ' share' : 'the displayed share assumption', segment = label(a.segment_name, 'the supplied segment');
        return { meaning: `The revenue scenario for ${segment} uses ${count} accounts and an annual price of USD ${price}, then applies the displayed fit and share assumptions. It is not evidence that those accounts will buy.`, evidence: `a dated and deduplicated account count, observed annual prices, a checked fit sample and capacity to win and serve the assumed share`, roles: [
                `Founder: verify the source and date behind the ${count} accounts in ${segment} before accepting the market boundary; remove duplicate or ineligible accounts.`,
                `CEO: ask sales and delivery to compare the customer requirement at ${share} with their actual capacity before funding the scenario; record the shortfall or support.`,
                `CMO: label the ${fit} and ${share} as assumptions in any market claim before publishing it; retain the account source and limits beside the revenue figure.`,
                `CRO: compare the USD ${price} annual price with closed deals in ${segment} before adopting a revenue target; confirm the period and scope match.`,
                `Demand generation head: review a separate sample from the ${count} listed accounts against the criteria behind ${fit} before building outreach; record exclusions and the resulting fit rate.`,
            ] };
    }
    if (name === 'lookalike_signal_generator') {
        const titles = names(a.champion_titles, 'the proposed champion titles'), triggers = names(a.buying_triggers, 'the unconfirmed buying triggers');
        return { meaning: `These are search criteria for ${product}, not a verified account list. ${titles} and ${triggers} remain signals to check rather than proof of intent.`, evidence: `observable company attributes, confirmed buying roles and a reviewed sample that shows both useful matches and false matches`, roles: [
                `Founder: confirm which customer traits are essential for ${product} before approving the search; separate those traits from convenient data fields.`,
                `CEO: set the owner and maximum research effort for validating ${product} matches before paying to scale the list; require a sample review first.`,
                `CMO: check the source and date for ${triggers} before treating them as campaign evidence; do not describe a trigger as buying intent without confirmation.`,
                `CRO: ask account owners whether ${titles} actually sponsored comparable purchases before making those titles a qualification rule.`,
                `Demand generation head: review a fresh set of ${product} account matches by hand before outreach; record missing attributes and why each rejected match failed.`,
            ] };
    }
    if (name === 'account_prioritization') {
        const accounts = records(a.accounts), accountNames = names(accounts.map(x => x.name), 'the supplied accounts'), first = accounts[0] || {}, account = label(first.name, 'the first supplied account'), timing = label(first.timing, 'unstated timing');
        return { meaning: `The ranking orders ${accounts.length} supplied accounts using the stated scores and timing rules. It does not confirm purchase intent or the evidence behind a score.`, evidence: `dated source records for fit, intent, relationships and timing, plus a comparison with the cost of pursuing each account`, roles: [
                `Founder: challenge the strongest unsupported assumption in the scores for ${accountNames} before endorsing the ranking; retain the source for each contested score.`,
                `CEO: compare expected pursuit effort and delivery constraints for ${accountNames} before allocating staff; the numeric rank alone does not establish return.`,
                `CMO: verify the source and age of intent signals for ${accountNames} before using the ranking to allocate campaign spend.`,
                `CRO: ask the owner of ${account} to verify its supplied timing of ${timing} and the buyer action behind it before moving it into the next sales priority list.`,
                `Demand generation head: check duplicates, missing scores and the fit evidence for ${accountNames} before exporting the ordered list; flag records whose scores cannot be traced.`,
            ] };
    }
    if (name === 'icp_gap_analysis') {
        const current = label(a.current_customers, 'the current customer segment'), ideal = label(a.ideal_icp, 'the proposed customer segment'), from = (a.current_metrics || {}), to = (a.target_metrics || {});
        return { meaning: `The gap compares the supplied current and proposed customer segments. Target economics are goals, not evidence that the new segment can achieve them.`, evidence: `comparable customer outcomes, acquisition effort and delivery economics in the proposed segment`, roles: [
                `Founder: interview a buyer in each supplied segment before changing the profile; record whether the defining profile difference changes the stated buying problem.`,
                `CEO: ask finance to test the proposed annual value of ${number(to.avg_acv, 'the target')} against the current ${number(from.avg_acv, 'unstated value')} and delivery cost before approving a segment move.`,
                `CMO: validate the problem and claim with prospects at the proposed annual value of ${number(to.avg_acv, 'the stated target')} before replacing the audience brief; record contrary interviews.`,
                `CRO: inspect why the current sales cycle is ${number(from.avg_sales_cycle, 'unstated')} days before adopting the ${number(to.avg_sales_cycle, 'proposed')} day target; require a comparable deal sample.`,
                `Demand generation head: review a separate sample against the defining attributes in the proposed profile before expanding outreach; keep current and proposed segments separately labelled.`,
            ] };
    }
    if (name === 'icp_evolution_tracker') {
        const period = label(a.time_period, 'the supplied period'), profile = label(a.current_icp, 'the current profile');
        return { meaning: `The wins and losses from ${period} suggest changes to ${profile}. A small or selected sample does not establish a market trend.`, evidence: `a comparable set of wins, losses and deferred decisions with dated reasons and delivery constraints`, roles: [
                `Founder: compare the supplied wins with the contrary losses from ${period} before approving a profile change; name the observation that would reverse the proposed revision.`,
                `CEO: check whether the ${period} losses report a delivery constraint before funding a new profile; require evidence that the team can serve the proposed customers.`,
                `CMO: confirm whether the market changes reported in ${period} recur outside the quoted customer calls before turning them into a market claim.`,
                `CRO: have account owners confirm the sponsor, approval path and stated loss reason for the ${period} deals before changing qualification.`,
                `Demand generation head: test the proposed revision to ${profile} on a separate account sample before replacing the current audience; preserve the old criteria for comparison.`,
            ] };
    }
    if (name === 'icp_interview_synthesizer') {
        const interviews = records(a.interview_notes), customers = names(interviews.map(x => x.customer), 'the supplied interviewees'), roles = names(interviews.map(x => x.role), 'the recorded roles'), problems = names(interviews.flatMap(x => Array.isArray(x.pain_points) ? x.pain_points : []), 'the reported problems');
        return { meaning: `The synthesis describes ${interviews.length} ${interviews.length === 1 ? 'interview' : 'interviews'} with ${customers}. Quotes are observations from those people, not a measured market outcome or proof of causation.`, evidence: `the original interview notes, contrary customer needs and measured outcomes with permission for any quoted claim`, roles: [
                `Founder: resolve the priorities around ${problems} reported by ${customers} before choosing one positioning problem; ask which observation would contradict the proposed common theme.`,
                `CEO: ask the customer owner to verify observed outcomes and mark any unmeasured claim in the ${interviews.length} ${interviews.length === 1 ? 'interview' : 'interviews'} before committing the business to a benefit.`,
                `CMO: check the original wording and publication permission for ${customers} before using a quote; retain the scope and any unmeasured outcome beside it.`,
                `CRO: confirm whether ${roles} had purchase authority and what triggered their decision before treating the interviews as a buying committee pattern.`,
                `Demand generation head: test the interview based criteria outside ${customers} before widening the audience; record accounts whose problem differs from the proposed theme.`,
            ] };
    }
    return undefined;
}
//# sourceMappingURL=icp-reader-actions.js.map