// Shared by the reserve tool and the lead fit Site. Arithmetic stays provisional until accepted.
export function fitModelDecision(lead: {tier: string | null; missing?: unknown[]}, accepted: boolean) {
  return {
    decisionTier: accepted && !(lead.missing?.length) ? lead.tier : null,
    provisionalTier: lead.tier,
    modelStatus: accepted ? 'Accepted for this review; outcome validation still needed' : 'Awaiting explicit model acceptance',
    next: lead.missing?.length ? 'Resolve the named missing field before assigning a tier.' : accepted ? 'Validate against dated closed won and lost outcomes from comparable cohorts; inspect false positives and false negatives.' : 'Confirm every weight, option point and tier boundary before using a decision tier.',
  };
}
