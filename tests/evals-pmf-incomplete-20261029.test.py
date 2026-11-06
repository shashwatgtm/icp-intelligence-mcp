"""Targeted regression only. Replay one saved fresh connector response offline."""
import json
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'evals'))
from generate import ROOT
from graders import grade, text

CALL = json.loads((ROOT / 'fixtures' / 'pmf-incomplete-evidence-20261029.json').read_text())
BAD_ACTION = 'All dimensions scoring well: focus on scaling.'
GOOD_ACTION = 'Measure churn and retention before deciding whether to scale.'


def with_text(s):
    return {'content': [{'type': 'text', 'text': s}], 'isError': False}


class IncompletePMFTests(unittest.TestCase):
    def test_fresh_observation_fails_only_conflicting_action(self):
        passed, reason = grade('pmf-incomplete', CALL['result'], CALL['arguments'])
        self.assertFalse(passed)
        self.assertEqual(reason, 'Failed: no conflicting scaling action with incomplete evidence')

    def test_only_correcting_action_passes(self):
        s = text(CALL['result'])
        self.assertIn(BAD_ACTION, s)
        self.assertTrue(grade('pmf-incomplete', with_text(s.replace(BAD_ACTION, GOOD_ACTION)), CALL['arguments'])[0])

    def test_restoring_bad_action_fails(self):
        fixed = text(CALL['result']).replace(BAD_ACTION, GOOD_ACTION)
        self.assertFalse(grade('pmf-incomplete', with_text(fixed.replace(GOOD_ACTION, BAD_ACTION)), CALL['arguments'])[0])

    def test_missing_priority_section_cannot_pass(self):
        s = text(CALL['result'])
        self.assertFalse(grade('pmf-incomplete', with_text(s.replace('## Priority Actions', '## Removed actions')), CALL['arguments'])[0])

    def test_forged_complete_evidence_cannot_pass(self):
        s = text(CALL['result']).replace(BAD_ACTION, GOOD_ACTION).replace('3 of 5', '5 of 5')
        self.assertFalse(grade('pmf-incomplete', with_text(s), CALL['arguments'])[0])

    def test_activation_is_separate_from_scaling_defect(self):
        self.assertIn('Activation: 70%', CALL['arguments']['current_metrics'])
        self.assertIn('| Activation Rate | 70% |', text(CALL['result']))
        self.assertNotIn('churn', CALL['arguments']['current_metrics'].lower())
        self.assertNotIn('retention', CALL['arguments']['current_metrics'].lower())

    def test_wrong_activation_cannot_pass_corrected_action(self):
        s = text(CALL['result']).replace(BAD_ACTION, GOOD_ACTION).replace('| Activation Rate | 70%', '| Activation Rate | 7%')
        self.assertFalse(grade('pmf-incomplete', with_text(s), CALL['arguments'])[0])

    def test_complete_provenance_is_saved(self):
        self.assertIn('connected', CALL['provenance'])
        self.assertEqual(CALL['connector_tool'], 'mcp__codex_apps__helix_gtm_planning_test_pmf_scorecard')
        self.assertTrue(CALL['start_utc'] <= CALL['end_utc'])


if __name__ == '__main__':
    unittest.main(verbosity=2)
