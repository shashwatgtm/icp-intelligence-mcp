// Account Prioritization: the one calculation behind both the text answer (index.ts) and the result widget.
// The arithmetic, ordering, reasons and next steps were moved here unchanged from the tool's execute function, so the
// text and the widget read the same model object and cannot disagree. No text is written here except the reason and
// next step lines the text answer already printed.
import { timingFact } from './text-signals.ts';

// A percentage typed by the user and printed back: one decimal at most, no trailing ".0" (20 stays 20, 23.456789 prints 23.5).
export function cleanNum1(n: number): string {
  return (Math.round(n * 10) / 10 + 0).toLocaleString('en-US', { maximumFractionDigits: 1 });
}
export function cleanPct(n: number): string {
  return `${cleanNum1(n)}%`;
}

export type AccountInput = { name?: string; fit_score?: number; intent_signals?: number; relationship?: number; timing?: string };
export type AccountArgs = {
  accounts?: AccountInput[];
  prioritization_weights?: { fit?: number; intent?: number; relationship?: number; timing?: number };
  product_category?: string;
  company?: string;
};

export function computeAccountPrioritization(args: AccountArgs) {
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
  const base = { weights, givenWeights, noWeights };

  if (!(args.accounts && args.accounts.length > 0)) return { ...base, mode: 'framework' as const };

  const timingScore = (timing: string): number => timingFact(timing).score;

  // D41 (run 15): the tier cut-offs are 80%, 60% and 40% of the highest possible score W, the sum of the four weights
  // (ceil in integer-safe form; with the default weights W = 100 they are 80, 60 and 40, as before).
  const W = Number((weights.fit + weights.intent + weights.relationship + weights.timing).toPrecision(12)); // run 20: 33.3 + 33.3 + 33.3 + 0.1 is 100, not 99.99999999999999
  const cut = (p: number) => Math.ceil((W * p) / 100);
  const tierA = cut(80), tierB = cut(60), tierC = cut(40);

  // Unknown signals remain ranges; supplied zero is evidence, never a default.
  const intervals = args.accounts.map((account, inputIndex) => {
    const tf = timingFact(account.timing || 'unknown');
    const values: Record<keyof typeof weights, number | undefined> = {fit: account.fit_score, intent: account.intent_signals, relationship: account.relationship, timing: tf.state === 'affirmed' ? tf.score : undefined};
    const keys = Object.keys(weights) as Array<keyof typeof weights>;
    const unknown = keys.filter(k => values[k] == null && weights[k] > 0);
    const low = keys.reduce((n,k) => n + (values[k] ?? 0) * weights[k] / 100, 0);
    const high = low + unknown.reduce((n,k) => n + weights[k], 0);
    return {inputIndex, account, values, unknown, low: Math.round(low), high: Math.round(high)};
  });
  if (intervals.some(a => a.unknown.length) || intervals.some((a,i) => intervals.some((b,j) => i !== j && a.low === b.low))) {
    const overlaps = (a: typeof intervals[number], b: typeof intervals[number]) => a.low <= b.high && b.low <= a.high;
    const signals = intervals.flatMap(a => a.unknown.filter(k=>weights[k]>0).map(k=>({account:a.account.name, key:k, swing:weights[k], overlap:intervals.some(b=>a!==b&&overlaps(a,b))}))).sort((a,b)=>Number(b.overlap)-Number(a.overlap)||b.swing-a.swing);
    const next = signals[0];
    return { ...base, mode: 'intervals' as const, W, tierA, tierB, tierC, next,
      intervals: intervals.map(a => {
        const overlap = intervals.some(b=>a!==b&&overlaps(a,b));
        return { ...a, overlap, rank: overlap ? null : 1+intervals.filter(b=>b.low>a.high).length };
      }) };
  }

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
      : wk === 'relationship' ? (wv === 0 ? 'relationship is 0, so map the buying group and earn a first contact through a relevant trigger or peer reference before pitching the budget owner' : `relationship is ${cleanNum1(wv)}, so ask your champion or a mutual contact for an introduction to the budget owner`)
      : wk === 'intent' ? `intent is ${cleanNum1(wv)}, so share something relevant to their situation and watch who responds`
      : a.timing.toLowerCase() === 'later' ? 'timing is later, so agree a date to revisit rather than push for a decision' : a.timing.toLowerCase() === 'now' ? 'timing is now, so ask for the next two meeting dates' : 'the scores are strong, so verify the timing with the budget owner';
    return `${base}; ${focus}`;
  };

  return { ...base, mode: 'ranking' as const, W, tierA, tierB, tierC,
    scoredAccounts: scoredAccounts.map((a, i) => ({ ...a, rank: i + 1, reason: reasonFor(a), weakest: weakestOf(a), nextAction: nextStep(a) })) };
}

export type AccountModel = ReturnType<typeof computeAccountPrioritization>;
const FACTORS = ['fit', 'intent', 'relationship', 'timing'] as const;
const oneDecimal = (n: number) => Math.round(n * 10) / 10;

// The widget's structured result, read straight from the model the text answer printed. The first five accounts carry the
// reason and next step the text shows under Next Actions by Account; later accounts carry none, as in the text.
export function accountWidgetResult(model: AccountModel) {
  const warnings: Array<{ code: string; message: string }> = [];
  const maximum = model.mode === 'framework' ? Number((model.weights.fit + model.weights.intent + model.weights.relationship + model.weights.timing).toPrecision(12)) : model.W;
  if (FACTORS.some(k => model.weights[k] < 0) || maximum <= 0) warnings.push({ code: 'weights', message: 'A negative weight, or weights that add up to zero or less, make this ranking unsuitable for decisions. Correct the weights and run the tool again.' });
  const common = { mode: model.mode, weights: model.weights, defaultWeights: FACTORS.filter(k => model.givenWeights[k] == null), maximum };
  let result: Record<string, unknown>;
  if (model.mode === 'framework') result = { ...common, accounts: [] };
  else if (model.mode === 'intervals') result = { ...common, cutoffs: { A: model.tierA, B: model.tierB, C: model.tierC },
    accounts: model.intervals.map(a => ({ id: 'account-' + a.inputIndex, inputIndex: a.inputIndex, name: a.account.name || 'Unknown',
      scores: { fit: a.values.fit ?? null, intent: a.values.intent ?? null, relationship: a.values.relationship ?? null, timing: a.values.timing ?? null },
      timingInput: a.account.timing || null, low: a.low, high: a.high, rank: a.rank })),
    nextEvidence: model.next ? { account: model.next.account || null, factor: model.next.key, points: model.next.swing } : null };
  else result = { ...common, cutoffs: { A: model.tierA, B: model.tierB, C: model.tierC },
    accounts: model.scoredAccounts.map(a => ({ id: 'account-' + a.inputIndex, inputIndex: a.inputIndex, rank: a.rank, name: a.name,
      scores: { fit: a.fit, intent: a.intent, relationship: a.relationship, timing: a.timingScore },
      timingInput: a.timing, timingClear: timingFact(a.timing).state === 'affirmed',
      defaults: FACTORS.filter(k => a.defaults[k]),
      contributions: { fit: oneDecimal(a.fit * model.weights.fit / 100), intent: oneDecimal(a.intent * model.weights.intent / 100), relationship: oneDecimal(a.relationship * model.weights.relationship / 100), timing: oneDecimal(a.timingScore * model.weights.timing / 100) },
      total: a.totalScore, tier: a.tier, reason: a.rank <= 5 ? a.reason : null, nextAction: a.rank <= 5 ? a.nextAction : null })) };
  const finite = JSON.stringify(result) === JSON.stringify(result, (_k, v) => (typeof v === 'number' && !Number.isFinite(v) ? 'x' : v));
  if (!finite) warnings.push({ code: 'range', message: 'Some figures are too large to calculate reliably. The full answer is kept; use smaller weights and run the tool again.' });
  return { structuredContent: JSON.parse(JSON.stringify({ schemaVersion: 1, tool: 'account_prioritization', result, warnings })) };
}
