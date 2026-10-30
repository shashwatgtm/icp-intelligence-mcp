// Single calculation path for legacy text and the additive account widget.
export type AccountInputs = {
      accounts?: Array<{
        name?: string;
        fit_score?: number;
        intent_signals?: number;
        relationship?: number;
        timing?: string;
      }>;
      prioritization_weights?: {
        fit?: number;
        intent?: number;
        relationship?: number;
        timing?: number;
      };
      product_category?: string;
      company?: string;
    };
function cleanNum1(n: number): string { return (Math.round(n * 10) / 10 + 0).toLocaleString('en-US', { maximumFractionDigits: 1 }); }
function cleanPct(n: number): string { return `${cleanNum1(n)}%`; }
export function computeAccountPrioritization(args: AccountInputs) {
      // Default weights
      const weights = {
        // Run 16 D45: a weight given as 0 is used as 0; only an omitted or null weight takes its default.
        fit: args.prioritization_weights?.fit ?? 40,
        intent: args.prioritization_weights?.intent ?? 30,
        relationship: args.prioritization_weights?.relationship ?? 15,
        timing: args.prioritization_weights?.timing ?? 15
      };
      // Labels only: a weight the input did not supply is the default (an example figure).
      const givenWeights = args.prioritization_weights || {};
      const has = (v?: number | null) => v !== undefined && v !== null;
      const noWeights = !(has(givenWeights.fit) || has(givenWeights.intent) || has(givenWeights.relationship) || has(givenWeights.timing));

      // If accounts provided, score them
      if (args.accounts && args.accounts.length > 0) {
        const timingScore = (timing: string): number => {
          switch (timing?.toLowerCase()) {
            case 'now': return 100;
            case 'soon': return 70;
            case 'later': return 40;
            default: return 50;
          }
        };
        
        // D41 (run 15): the tier cut-offs are 80%, 60% and 40% of the highest possible score W, the sum of the four weights
        // (ceil in integer-safe form; with the default weights W = 100 they are 80, 60 and 40, as before).
        const W = Number((weights.fit + weights.intent + weights.relationship + weights.timing).toPrecision(12)); // run 20: 33.3 + 33.3 + 33.3 + 0.1 is 100, not 99.99999999999999
        const cut = (p: number) => Math.ceil((W * p) / 100);
        const tierA = cut(80), tierB = cut(60), tierC = cut(40);

        const scoredAccounts = args.accounts.map((account, inputIndex) => {
          // Run 16 D45: a score given as 0 is used as 0; only an omitted or null score takes the default 50.
          const fitScore = account.fit_score ?? 50;
          const intentScore = account.intent_signals ?? 50;
          const relationshipScore = account.relationship ?? 50;
          const timingScoreValue = timingScore(account.timing || 'unknown');
          
          const totalScore = Math.round(
            (fitScore * weights.fit / 100) +
            (intentScore * weights.intent / 100) +
            (relationshipScore * weights.relationship / 100) +
            (timingScoreValue * weights.timing / 100)
          );
          
          return {
            inputIndex,
            name: account.name || 'Unknown',
            fit: fitScore,
            intent: intentScore,
            relationship: relationshipScore,
            timing: account.timing || 'unknown',
            timingScore: timingScoreValue,
            totalScore,
            tier: totalScore >= tierA ? 'A' : totalScore >= tierB ? 'B' : totalScore >= tierC ? 'C' : 'D',
            // Labels only: the values that fell back to the default because the account did not supply them.
            defaults: { fit: account.fit_score == null, intent: account.intent_signals == null, relationship: account.relationship == null, timing: !account.timing }
          };
        });
        
        // Sort by total score
        scoredAccounts.sort((a, b) => b.totalScore - a.totalScore);

        // Run 19 D80 (problem 5): the reason names the factor that adds the most points, with its arithmetic (the score and tier
        // are unchanged). The old labels stay as the opening words where they applied; "Balanced scoring" is gone.
        const reasonFor = (a: typeof scoredAccounts[number]) => {
          const parts = [
            { k: 'fit', v: a.fit, w: weights.fit, txt: `fit ${cleanNum1(a.fit)}` },
            { k: 'intent', v: a.intent, w: weights.intent, txt: `intent ${cleanNum1(a.intent)}` },
            { k: 'relationship', v: a.relationship, w: weights.relationship, txt: `relationship ${cleanNum1(a.relationship)}` },
            { k: 'timing', v: a.timingScore, w: weights.timing, txt: `timing ${a.timing} (${a.timingScore} pts)` },
          ].map(x => ({ ...x, pts: x.v * x.w / 100 })).filter(x => x.w > 0).sort((x, y) => y.pts - x.pts);
          const label = weights.fit > 0 && a.fit >= 80 ? 'Strong ICP fit' : weights.intent > 0 && a.intent >= 80 ? 'High buying intent' : weights.relationship > 0 && a.relationship >= 80 ? 'Strong relationship' : '';
          const top = parts[0];
          const num = cleanNum1;
          const why = top ? `the most points come from ${top.txt.replace(/^(\w+) (\d+)$/, '$1 $2')} × ${cleanPct(top.w)} = ${num(top.pts)} points of ${a.totalScore}` : 'no factor carries weight';
          return label ? `${label} (${why})` : why.charAt(0).toUpperCase() + why.slice(1);
        };

        // Run 20 round 1: the next step follows the account's own scores and timing, so two accounts in one tier do not get the same line
        // (the tier decides the base; the weakest factor and the timing decide the focus). No sales-motion words that belong to one
        // business model (SDR sequences, 24 hour replies) are used.
        // The weakest of fit, intent and relationship decides the label and the next step, so the two always agree (a score of 60 or more is not a gap).
        const weakestOf = (a: typeof scoredAccounts[number]): [string, number] => {
          const w = ([['fit', a.fit], ['intent', a.intent], ['relationship', a.relationship]] as Array<[string, number]>).sort((x, y) => x[1] - y[1])[0];
          return w[1] < 60 ? w : ['timing', a.timingScore];
        };
        const nextStep = (a: typeof scoredAccounts[number]) => {
          const base = a.tier === 'A' ? 'Personal outreach from the account owner this week' : a.tier === 'B' ? 'A targeted sequence of personal messages this week, through a warm introduction where you have one' : a.tier === 'C' ? 'Nurture with relevant content and watch for a change in intent or timing' : 'Monitor and check again next quarter';
          const [wk, wv] = weakestOf(a);
          const focus = a.tier === 'C' || a.tier === 'D' ? `the weakest factor is ${(([['fit', a.fit], ['intent', a.intent], ['relationship', a.relationship]] as Array<[string, number]>).sort((x, y) => x[1] - y[1]).map(([k, n]) => `${k} (${cleanNum1(n)})`)[0])}, so spend sales time only when it changes`
            : wk === 'fit' ? `fit is ${cleanNum1(wv)}, so confirm the buyer has the problem and the budget before you spend time on a proposal`
            : wk === 'relationship' ? `relationship is ${cleanNum1(wv)}, so ask your champion or a mutual contact for an introduction to the budget owner`
            : wk === 'intent' ? `intent is ${cleanNum1(wv)}, so share something relevant to their situation and watch who responds`
            : a.timing.toLowerCase() === 'later' ? 'timing is later, so agree a date to revisit rather than push for a decision' : a.timing.toLowerCase() === 'now' ? 'timing is now, so ask for the next two meeting dates' : 'the scores are strong, so verify the timing with the budget owner';
          return `${base}; ${focus}`;
        };


        return { mode: 'ranking' as const, weights, givenWeights, noWeights, W, tierA, tierB, tierC,
          scoredAccounts: scoredAccounts.map((a, i) => ({ ...a, rank: i + 1, id: 'account-' + a.inputIndex,
            reason: reasonFor(a), nextAction: i < 5 ? nextStep(a) : null, weakest: weakestOf(a),
            contributions: { fit: a.fit * weights.fit / 100, intent: a.intent * weights.intent / 100,
              relationship: a.relationship * weights.relationship / 100, timing: a.timingScore * weights.timing / 100 } })) };
      }
      const W = Number((weights.fit + weights.intent + weights.relationship + weights.timing).toPrecision(12));
      return { mode: 'framework' as const, weights, givenWeights, noWeights, W,
        tierA: Math.ceil(W * 80 / 100), tierB: Math.ceil(W * 60 / 100), tierC: Math.ceil(W * 40 / 100),
        scoredAccounts: [] as Array<{ inputIndex: number; name: string; fit: number; intent: number; relationship: number; timing: string; timingScore: number; totalScore: number; tier: string; defaults: Record<string, boolean>; rank: number; id: string; reason: string; nextAction: string | null; weakest: [string, number]; contributions: Record<string, number> }> };
}

export const ACCOUNT_UI_URI = 'ui://helix/account-prioritization/v1.html';
export const ACCOUNT_UI_MIME = 'text/html;profile=mcp-app';
export const ACCOUNT_UI_META = { ui: { csp: { connectDomains: [], resourceDomains: [], frameDomains: [] } } };
const factors = ['fit', 'intent', 'relationship', 'timing'] as const;
export function accountInputSnapshot(input: any): AccountInputs {
  const output: any = {};
  for (const key of ['company', 'product_category']) if (typeof input?.[key] === 'string') output[key] = input[key];
  if (Array.isArray(input?.accounts)) output.accounts = input.accounts.map((a: any) => {
    const row: any = {};
    for (const key of ['name', 'timing']) if (typeof a?.[key] === 'string') row[key] = a[key];
    for (const key of ['fit_score', 'intent_signals', 'relationship']) if (typeof a?.[key] === 'number' && Number.isFinite(a[key])) row[key] = a[key]; else if (a?.[key] === null) row[key] = null;
    return row;
  });
  if (input?.prioritization_weights && typeof input.prioritization_weights === 'object') {
    output.prioritization_weights = {};
    for (const key of factors) if (typeof input.prioritization_weights[key] === 'number' && Number.isFinite(input.prioritization_weights[key])) output.prioritization_weights[key] = input.prioritization_weights[key]; else if (input.prioritization_weights[key] === null) output.prioritization_weights[key] = null;
  }
  return output;
}
export function accountWidgetResult(model: ReturnType<typeof computeAccountPrioritization>, safe: any, literal: any, textFallback: string) {
  const warnings: Array<{ code: string; message: string }> = [];
  if (factors.some(k => model.weights[k] < 0) || model.W <= 0) warnings.push({ code: 'weights', message: 'Negative weights or a nonpositive maximum are unsuitable for interpretation. Correct them before recalculating.' });
  const rangeSupported = Number.isFinite(model.W) && model.scoredAccounts.every(a => Number.isFinite(a.totalScore) && Object.values(a.contributions).every(Number.isFinite));
  if (!rangeSupported) warnings.push({ code: 'range', message: 'Calculation exceeds the supported numeric range. The original text response is retained; use smaller weights.' });
  const result = { mode: model.mode, weights: model.weights,
    defaultWeights: factors.filter(k => model.givenWeights[k] == null), maximum: model.W,
    cutoffs: { A: model.tierA, B: model.tierB, C: model.tierC }, rangeSupported,
    accounts: model.scoredAccounts.map(a => ({ id: a.id, inputIndex: a.inputIndex, name: a.name, rank: a.rank,
      scores: { fit: a.fit, intent: a.intent, relationship: a.relationship, timing: a.timingScore },
      timingInput: safe?.accounts?.[a.inputIndex]?.timing ?? null,
      defaults: factors.filter(k => a.defaults[k]), contributions: a.contributions, total: a.totalScore,
      tier: a.tier, reason: a.rank <= 5 ? a.reason : null, nextAction: a.nextAction })) };
  return { structuredContent: JSON.parse(JSON.stringify({ schemaVersion: 1, tool: 'account_prioritization',
    input: accountInputSnapshot(safe), result, warnings, textFallback })),
    _meta: { helixAccountPrioritization: { inputsBase64: Buffer.from(JSON.stringify(accountInputSnapshot(literal)), 'utf8').toString('base64') } } };
}

