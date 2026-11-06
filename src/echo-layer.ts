// Echo fixes, 6 Nov 2026. The company size band must change the targeting criteria and signals, not only the echoed band.
// Deterministic: reads only the supplied fields. No figures are invented; the size bands come from the user's input.
type Args = Record<string, unknown>;
const strs = (v: unknown): string[] => (Array.isArray(v) ? v : typeof v === 'string' ? [v] : []).map(x => String(x).trim()).filter(Boolean);

export type SizeTier = 'micro' | 'small' | 'mid' | 'large' | 'enterprise' | 'unknown';
/** The largest number in a band such as "1,001 to 5,000 employees" decides the tier. */
export function sizeTier(band: string): SizeTier {
  const nums = (band.replace(/,/g, '').match(/\d+(?:\.\d+)?\s*[kK]?/g) || []).map(x => (/[kK]/.test(x) ? parseFloat(x) * 1000 : parseFloat(x))).filter(n => Number.isFinite(n));
  if (!nums.length) return 'unknown';
  const hi = /\+|or more|over|more than|plus/i.test(band) ? Infinity : Math.max(...nums);
  const lo = Math.min(...nums);
  if (hi === Infinity) return lo >= 5000 ? 'enterprise' : lo >= 1000 ? 'large' : lo >= 200 ? 'mid' : 'small';
  if (hi <= 50) return 'micro';
  if (hi <= 200) return 'small';
  if (hi <= 1000) return 'mid';
  if (hi <= 5000) return 'large';
  return 'enterprise';
}

interface TierPlan { label: string; deciders: string[]; seniority: string; functions: string; signals: string[]; avoid: string; note: string }
const GENERIC: Record<Exclude<SizeTier, 'unknown'>, TierPlan> = {
  micro: { label: 'owner led', deciders: ['Owner', 'Founder', 'General Manager'], seniority: 'Owner, Founder, CXO', functions: 'any (one person usually decides)', signals: ['a new location or first hire in the role that owns the problem', 'the owner posting about the problem in public', 'a first job post for the role that would use the product'], avoid: 'groups with a central buying team', note: 'One person usually decides and buys, so target the owner directly and keep the ask short.' },
  small: { label: 'single site, a few managers', deciders: ['General Manager', 'Operations Manager', 'Owner'], seniority: 'Manager, Director, Owner', functions: 'Operations, Sales', signals: ['a new manager in the owning function', 'job posts for the roles the product supports', 'a second location opening'], avoid: 'large groups with a central buying team', note: 'A manager decides with the owner nearby, so target the manager who feels the problem and keep the owner as the second contact.' },
  mid: { label: 'department heads decide', deciders: [], seniority: 'Director, VP, Manager', functions: 'Operations, Sales, Marketing', signals: ['a new department head', 'job posts for the roles that run the process', 'a recent acquisition or new location'], avoid: 'single site owner led companies and very large groups', note: 'A department head runs the process and signs, so the supplied champion titles are the right first targets.' },
  large: { label: 'multi site group with central teams', deciders: ['VP of Operations', 'Chief Operating Officer', 'Group CIO or CTO', 'Head of Procurement'], seniority: 'VP, CXO, Director of a central function', functions: 'Operations, Information Technology, Procurement, Finance', signals: ['an acquisition that adds a site, which triggers a roll up of tools and processes', 'a central or shared services team being built', 'group level job posts in IT, procurement or operations', 'a new group executive in operations or technology', 'a tool consolidation or vendor review across sites'], avoid: 'single site operators; companies with one location', note: 'Several sites mean a central team owns tools and buying, so add group level titles and look for signs of consolidation.' },
  enterprise: { label: 'enterprise with a formal buying process', deciders: ['Chief Operating Officer', 'Chief Information Officer', 'Head of Procurement', 'Chief Information Security Officer'], seniority: 'CXO, SVP, VP of a central function', functions: 'Operations, Information Technology, Security, Procurement, Legal', signals: ['an enterprise wide programme or transformation announced', 'a published tender or request for proposal', 'security, risk or procurement job posts', 'a new CXO in technology or operations'], avoid: 'business units without a central budget', note: 'A formal process with security and procurement review applies, so target the executive sponsor and the central functions together.' },
  };
const DEALER: Partial<Record<SizeTier, Partial<TierPlan> & { extra: string[] }>> = {
  large: { deciders: ['VP of Operations', 'Group CIO', 'Group Director of Procurement', 'Group BDC Director', 'Chief Operating Officer'], signals: ['a group acquiring another rooftop, which pulls the new store onto group tools', 'a central BDC or call centre being set up for several rooftops', 'group level IT and procurement job posts', 'a new VP of Operations or group CIO', 'a vendor consolidation across rooftops'], avoid: 'single rooftop dealers; independent used car lots', note: 'Multi rooftop groups run a central BDC and buy through group IT and procurement, so target group titles as well as the store level champions.', extra: ['Number of rooftops: multi rooftop groups (confirm from the group website)', 'Group structure: dealer group, not a single store'] },
  mid: { extra: ['Number of rooftops: one to a few (confirm from the dealer website)'] },
  small: { extra: ['Number of rooftops: one'] },
  micro: { extra: ['Number of rooftops: one'] },
  enterprise: { extra: ['Number of rooftops: a large group or publicly listed group'] }
};

export function lookalikeSize(args: Args, out: string): string {
  const fp = (args.icp_firmographics && typeof args.icp_firmographics === 'object' ? args.icp_firmographics : {}) as Args;
  const bands = strs(fp.company_sizes);
  if (!bands.length || !/\n### Saved Search Strategy/.test(out)) return out;
  const tiers = bands.map(sizeTier);
  const known = tiers.filter(t => t !== 'unknown') as Exclude<SizeTier, 'unknown'>[];
  if (!known.length) return out;
  const tier = known[known.length - 1];
  const plan0 = GENERIC[tier];
  const champs = strs(args.champion_titles);
  const industries = strs(fp.industries).join(' ') + ' ' + String(args.product_category || '');
  const dealer = /motor vehicle|dealer|automotive|\bcars?\b/i.test(industries);
  const d = dealer ? DEALER[tier] : undefined;
  const plan: TierPlan = { ...plan0, ...(d ? { deciders: d.deciders || plan0.deciders, signals: d.signals || plan0.signals, avoid: d.avoid || plan0.avoid, note: d.note || plan0.note } : {}) };
  const titles = [...new Set([...(tier === 'mid' ? [] : plan.deciders), ...champs])];
  const added = plan.deciders.filter(t => !champs.some(c => c.toLowerCase() === t.toLowerCase()));
  const triggers = strs(args.buying_triggers);
  const band = bands.join(' or ');
  const L: string[] = [`### Targeting for the size band: ${band}`, '', `**Read as:** ${plan.label}. ${plan.note}`, ''];
  L.push('**Titles to target at this size**');
  L.push(`- Your champion titles stay: ${champs.length ? champs.join(', ') : 'none supplied'}.`);
  if (added.length) L.push(`- Add for this size: ${added.join(', ')}.`);
  else L.push('- No extra titles are needed at this size: the champion titles are the deciders.');
  L.push('', '**Extra search lines for this size**', '```');
  L.push(`Seniority level: ${plan.seniority}`);
  L.push(`Function: ${plan.functions}`);
  if (titles.length) L.push(`Current job title: ${titles.map(t => '"' + t + '"').join(' OR ')}`);
  for (const e of d?.extra || []) L.push(e);
  L.push(`Exclude: ${plan.avoid}`);
  L.push('```', '');
  L.push('**Signals that matter at this size**');
  for (const sg of plan.signals) L.push(`- ${sg.charAt(0).toUpperCase() + sg.slice(1)}`);
  if (triggers.length) {
    const lead = triggers.filter(t => plan.signals.some(sg => sg.split(/\W+/).filter(w => w.length > 5).some(w => t.toLowerCase().includes(w.toLowerCase()))));
    if (lead.length) L.push('', `**Of your own triggers, weight these first at this size:** ${lead.join('; ')}.`);
    else L.push('', 'None of your own triggers is specific to this size, so keep them as supplied and add the signals above.');
  }
  L.push('', 'These are search criteria and signals to check, not verified accounts. Confirm the size band from the company\'s own page or a source you already use.', '');
  return out.replace(/\n### Saved Search Strategy/, '\n' + L.join('\n') + '\n### Saved Search Strategy');
}

export function applyEcho(name: string, args: Args, out: string): string {
  try {
    return name === 'lookalike_signal_generator' ? lookalikeSize(args, out) : out;
  } catch {
    return out;
  }
}
