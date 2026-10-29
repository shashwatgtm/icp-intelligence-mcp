"""Offline regressions for fresh LIVE test connector captures. No connector calls here."""
import copy
import datetime as dt
import json
from pathlib import Path
import re
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'evals'))
from generate import GRADERS, ROOT, generate
from graders import grade, section, text
from replay import current_replay

SNAPSHOT = json.loads((ROOT / 'fixtures' / 'fresh-live-20261029.json').read_text())
CALLS = {c['id']: c for c in SNAPSHOT['calls']}
PRIOR = json.loads((ROOT / 'fixtures' / 'readiness-live-20261029.json').read_bytes())


def kind(c):
    return 'case-study-four' if c['id'] == 'case-study-four-outcomes' else GRADERS[c['tool']]


def mutate(c, s):
    return dict(c, result={'content': [{'type': 'text', 'text': s}], 'isError': False})


def replace(c, old, new):
    s = text(c['result'])
    assert old in s, old
    return mutate(c, s.replace(old, new))


def in_section(c, heading, old, new):
    s = text(c['result'])
    body = section(s, heading)
    assert body and old in body, (heading, old)
    return mutate(c, s.replace(body, body.replace(old, new), 1))


class FreshLiveTests(unittest.TestCase):
    def test_exact_five_source_inputs_each(self):
        source = json.loads((ROOT / 'source' / 'HOST-REVIEW-CASES.json').read_bytes())
        for m in source:
            if m['name'] in ['helix-craft-gtm', 'helix-craft-content']:
                for c in m['cases']['positive']:
                    args = json.loads(c['prompt'][c['prompt'].index('{'):])
                    fresh = CALLS[c['tools_triggered'] + '-review']
                    self.assertEqual(fresh['arguments'], args)

    def test_capture_has_complete_outputs_and_timestamps(self):
        self.assertEqual(len(CALLS), 13)
        for c in CALLS.values():
            start = dt.datetime.strptime(c['start_utc'], '%Y-%m-%d %H:%M:%S UTC')
            end = dt.datetime.strptime(c['end_utc'], '%Y-%m-%d %H:%M:%S UTC')
            self.assertLessEqual(start, end)
            self.assertTrue(text(c['result']).strip())
            self.assertIn('connector', c['provenance'])
            self.assertFalse(c['result'].get('isError'))

    def test_every_gtm_content_review_case_has_deterministic_grader(self):
        for server in generate():
            if server['name'] in ['helix-craft-gtm', 'helix-craft-content']:
                for c in server['cases']:
                    if c['mode'] == 'backend':
                        self.assertNotEqual(c['grader'], 'smoke')

    def test_current_replay_is_offline_and_keeps_parsing_finding(self):
        with patch('urllib.request.OpenerDirector.open', side_effect=AssertionError('network forbidden')):
            r = current_replay()
        self.assertEqual(r['counts'], {'pass': 14, 'fail': 0, 'skip': 0})
        self.assertEqual([c['case'] for c in r['receipts'] if c['status'] == 'fail'], [])

    def test_old_pmf_scaling_and_proof_gap_is_historical_failure(self):
        c = next(c for c in PRIOR['package_fixture_calls'] if c['tool'] == 'pmf_scorecard')
        self.assertFalse(grade('pmf', c['result'], c['args'])[0])

    def test_old_discovery_confirmation_is_historical_failure(self):
        c = next(c for c in PRIOR['package_fixture_calls'] if c['tool'] == 'customer_interview_kit')
        self.assertIn('Is this true for you', text(c['result']))
        self.assertFalse(grade('interview', c['result'], c['args'])[0])

    def test_old_one_paragraph_analyzer_is_historical_failure(self):
        c = next(c for c in PRIOR['package_fixture_calls'] if c['tool'] == 'craft_gtm_analyzer')
        self.assertFalse(grade('plan-review', c['result'], c['args'])[0])

    def test_old_repurposing_duplicate_is_superseded_failure(self):
        c = next(c for c in PRIOR['package_fixture_calls'] if c['tool'] == 'content_repurposer')
        self.assertFalse(grade('repurpose', c['result'], c['args'])[0])

    def test_old_four_outcome_truncation_is_superseded_failure(self):
        c = PRIOR['supplemental_calls']['caseFour']
        self.assertFalse(grade('case-study-four', c['result'], c['args'])[0])


def test_grade(c, expected):
    def test(self):
        self.assertEqual(grade(kind(c), c['result'], c['arguments'])[0], expected)
    return test


for label, c in CALLS.items():
    setattr(FreshLiveTests, 'test_current_' + label.replace('-', '_'), test_grade(c, label != 'pmf-activation-supplied'))

mutations = []
def bad(label, c):
    mutations.append((label, c))

c = CALLS['pmf_scorecard-review']
bad('pmf_proof_claim', replace(c, 'It is a rule score from the figures you supplied, not proof of product-market fit.', 'This proves product-market fit.'))
bad('pmf_scale_with_missing_activation', in_section(c, 'Priority Actions', '1. ACTIVATION:', 'Focus on scaling.\n1. ACTIVATION:'))
bad('pmf_missing_activation_unreported', replace(c, 'NOT PROVIDED', '70%'))
bad('pmf_wrong_dimension_count', replace(c, '4 of 5', '5 of 5'))
bad('pmf_wrong_rule_score', replace(c, '8.5/10', '10/10'))
c = CALLS['pmf-activation-labelled']
bad('pmf_ignores_supplied_labelled_activation', replace(c, '| Activation Rate | 70%', '| Activation Rate | NOT PROVIDED'))

c = CALLS['launch_commander-review']
bad('launch_wrong_date', in_section(c, 'The plan in brief', '2027-02-15', '2027-03-15'))
bad('launch_loses_meeting_goal', in_section(c, 'Goals and how each is measured', '20 qualified meetings', '200 qualified meetings'))
bad('launch_loses_pilot_goal', in_section(c, 'Goals and how each is measured', '5 pilot customers', '50 pilot customers'))
bad('launch_invalid_date', in_section(c, 'Timeline', '2027-01-04', '2027-01-40'))
bad('launch_claims_execution', mutate(c, text(c['result']) + '\nWe have launched this product.'))

c = CALLS['customer_interview_kit-review']
bad('interview_asserts_hypothesis', replace(c, 'How close is that to your experience, if at all?', 'Since this is true, tell us how much time you lose.'))
bad('interview_leading_old_question', replace(c, 'Walk me through how this works for you today. What, if anything, slows it down?', 'Is this true for you?'))
bad('interview_unconditional_severity', replace(c, 'Understand severity, only if they confirm it', 'Understand severity'))
bad('interview_unconditional_incident', replace(c, 'Find a real case, only if they confirm it', 'Find a real case'))
bad('interview_loses_counter_evidence', replace(c, '| Find counter-evidence |', '| Confirm our hypothesis |'))
bad('interview_loses_source_hypothesis', replace(c, 'Manual data entry delays pipeline reporting', 'A different unprovided problem'))

c = CALLS['craft_gtm_analyzer-review']
bad('analyzer_wrong_score', replace(c, '39/50 (78%)', '50/50 (100%)'))
for label, heading, old, new in [
    ('owner', r'C: CHARACTER \(who runs it\)', 'Owner: marketing director', 'Owner: CEO'),
    ('meetings', r'R: RESULT \(what success looks like\)', '20 discovery meetings', '2 discovery meetings'),
    ('audience', r'F: FRAME \(context and limits\)', '200 to 1000 employees', '2000 to 10000 employees'),
    ('budget', r'F: FRAME \(context and limits\)', '15000', '1500'),
    ('dates', r'T: TIMELINE \(when it happens\)', '31 March 2027', '31 May 2027'),
    ('channels', r'A: ARTIFACT \(what gets produced\)', 'customer webinars and partner referrals', 'unprovided paid ads')]:
    bad('analyzer_wrong_' + label, in_section(c, heading, old, new))

c = CALLS['retention_playbook-review']
bad('churn_wrong_compounded_rate', replace(c, '21.5%', '24%'))
bad('churn_wrong_simple_comparator', replace(c, 'monthly rate times twelve, 24%', 'monthly rate times twelve, 25%'))
bad('churn_contradictory_annual_claim', mutate(c, text(c['result']) + '\nAnnual churn: 24%.'))

c = CALLS['newsletter_builder-review']
first = 'This issue is about CRM adoption lessons from a synthetic Salesforce rollout.'
bad('newsletter_repeated_opening', replace(c, first, first + '\n\n**' + first + '**'))
bad('newsletter_lost_cta', replace(c, 'Button: Read the implementation checklist', 'Button: Buy now'))
bad('newsletter_lost_source_point', replace(c, 'review adoption weekly', 'review new unprovided facts'))

c = CALLS['webinar_script-review']
bad('webinar_wrong_duration', in_section(c, 'Run of Show', '| 0:29 | 1 min |', '| 0:29 | 10 min |'))
bad('webinar_discontinuous_schedule', in_section(c, 'Run of Show', '| 0:29 |', '| 0:28 |'))
bad('webinar_missing_takeaway', in_section(c, 'Full Script', 'choose one pilot team', 'do another unprovided task'))
bad('webinar_missing_speaker', in_section(c, 'Full Script', 'Workshop facilitator', 'Unprovided person'))
bad('webinar_added_pitch', mutate(c, text(c['result']).replace('**END WEBINAR**', 'Buy now our product pitch.\n**END WEBINAR**')))

c = CALLS['craft_content_improver-review']
bad('content_review_lost_input', in_section(c, 'Your Text, With the Findings Marked', 'Review missing fields every Friday', 'Review every year'))
bad('content_review_invents_edit', in_section(c, 'Improved Version', 'No automatic edits were found', 'We rewrote the customer evidence'))
bad('content_review_repeats_empty_hook', in_section(c, 'Suggested Opening:', 'No opening can be built from this text without a fact from you.', 'Synthetic HubSpot copy review.'))

c = CALLS['content_repurposer-review']
bad('repurpose_old_title_body_bullet', in_section(c, 'Blog Summary', '**Synthetic Cisco planning exercise**', '**Synthetic Cisco planning exercise**\n\nSynthetic Cisco planning exercise.\n\n- Synthetic Cisco planning exercise.'))
for heading in ['LinkedIn Post', 'Email Version', 'Blog Summary']:
    bad('repurpose_loses_qualification_' + heading, in_section(c, heading, 'These are demonstration statements, not verified Cisco company findings.', 'These are verified company findings.'))

c = CALLS['case_study_generator-review']
bad('case_invents_testimony', mutate(c, text(c['result']) + '\nCisco said "We saved millions."'))
bad('case_changes_result', replace(c, '4 hours to 2 hours', '4 hours to 1 hour'))
c = CALLS['case-study-four-outcomes']
for i, outcome in enumerate(c['arguments']['results'].split(';')):
    for heading in [r'The Story \(draft\)', 'The Results']:
        bad('case_four_loses_' + str(i) + '_' + heading, in_section(c, heading, outcome.strip() + '.', ''))

for i, (label, c) in enumerate(mutations):
    setattr(FreshLiveTests, f'test_mutation_{i}_{re.sub(r"[^a-z0-9]+", "_", label.lower())}', test_grade(c, False))


if __name__ == '__main__':
    unittest.main(verbosity=2)
