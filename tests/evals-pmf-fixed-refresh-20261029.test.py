"""Only the two PMF fixes. Saved responses are replayed without network calls."""
import json
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'evals'))
from generate import ROOT
from graders import grade, section, text

REFRESH = json.loads((ROOT / 'fixtures' / 'pmf-fixed-refresh-20261029.json').read_text())
NEW = {c['id']: c for c in REFRESH['calls']}
OLD_PARSE = next(c for c in json.loads((ROOT / 'fixtures' / 'fresh-live-20261029.json').read_text())['calls'] if c['id'] == 'pmf-activation-supplied')
OLD_SCALE = json.loads((ROOT / 'fixtures' / 'pmf-incomplete-evidence-20261029.json').read_text())


class PMFFixedRefreshTests(unittest.TestCase):
    def test_exact_historical_inputs_are_reused(self):
        for old in [OLD_PARSE, OLD_SCALE]:
            self.assertEqual(NEW[old['id']]['arguments'], old['arguments'])

    def test_both_new_outputs_pass_unchanged_graders(self):
        for label, kind in [('pmf-activation-supplied', 'pmf'), ('pmf-incomplete-retention-evidence', 'pmf-incomplete')]:
            c = NEW[label]
            self.assertTrue(grade(kind, c['result'], c['arguments'])[0])

    def test_old_activation_capture_still_fails(self):
        self.assertFalse(grade('pmf', OLD_PARSE['result'], OLD_PARSE['arguments'])[0])

    def test_old_scaling_capture_still_fails(self):
        self.assertFalse(grade('pmf-incomplete', OLD_SCALE['result'], OLD_SCALE['arguments'])[0])

    def test_restored_activation_defect_still_fails(self):
        c = NEW['pmf-activation-supplied']
        s = text(c['result'])
        self.assertIn('| Activation Rate | 70% |', s)
        s = s.replace('| Activation Rate | 70% |', '| Activation Rate | NOT PROVIDED |')
        self.assertFalse(grade('pmf', {'content': [{'type': 'text', 'text': s}]}, c['arguments'])[0])

    def test_restored_conflicting_scaling_action_still_fails(self):
        c = NEW['pmf-incomplete-retention-evidence']
        s = text(c['result'])
        old = section(s, 'Priority Actions')
        s = s.replace(old, 'All dimensions scoring well: focus on scaling.', 1)
        self.assertFalse(grade('pmf-incomplete', {'content': [{'type': 'text', 'text': s}]}, c['arguments'])[0])

    def test_current_actions_and_closing_match_reported_fix(self):
        actions = section(text(NEW['pmf-incomplete-retention-evidence']['result']), 'Priority Actions')
        self.assertIn('CHURN: not given, so it is not scored.', actions)
        self.assertIn('RETENTION: not given, so it is not scored.', actions)
        self.assertNotIn('focus on scaling', actions.lower())
        closing = section(text(NEW['pmf-activation-supplied']['result']), 'Priority Actions')
        self.assertIn('Every dimension scores well against the example benchmarks.', closing)
        self.assertIn('Check the figures against your own history and customer evidence before you scale.', closing)

    def test_two_complete_timestamped_connector_records(self):
        self.assertEqual(len(REFRESH['calls']), 2)
        for c in REFRESH['calls']:
            self.assertTrue(c['start_utc'] <= c['end_utc'])
            self.assertTrue(text(c['result']).strip())
            self.assertEqual(c['connector_tool'], 'mcp__codex_apps__helix_gtm_planning_test_pmf_scorecard')
        self.assertIn('owner-reported', REFRESH['owner_reported']['limitation'])


if __name__ == '__main__':
    unittest.main(verbosity=2)
