"""Replay authorized synthetic observations and controlled defects. No network."""
import copy
import hashlib
import json
from pathlib import Path
import re
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'evals'))
from graders import grade, inventory_findings, section, structural_sentence, text

FIXTURES = Path(__file__).resolve().parents[1] / 'evals' / 'fixtures'
RECEIPT = json.loads((FIXTURES / 'readiness-live-20261029.json').read_bytes())
CONNECTED = json.loads((FIXTURES / 'connector-observed-20261029.json').read_text())['calls']
CLOUD = json.loads((FIXTURES / 'cloud-source-20261029.json').read_text())
CORRECTED = json.loads((FIXTURES / 'controlled-corrections-20261029.json').read_text())['cases']


def observed(tool):
    return next(c for c in RECEIPT['package_fixture_calls'] if c['tool'] == tool)


def with_text(call, value):
    return {'args': call['args'], 'result': {'content': [{'type': 'text', 'text': value}], 'isError': False}}


def replace_section(s, heading, body):
    old = section(s, heading)
    assert old
    return s.replace(old, body, 1)


def correct_impact(call):
    s = text(call['result'])
    guide = ('No customer result was supplied. Collect a customer baseline and an after measurement '
             'for the same team over the same period, with the measure and named owner who confirms it. '
             'Ask for an approved customer quote before using it as proof.')
    s = replace_section(s, 'Proof You Already Have', guide)
    s = s.replace('Turn the proof you already have into 3 quantified proof points', 'Gather new customer evidence before drafting quantified proof points')
    return with_text(call, s)


class ObservedFormatTests(unittest.TestCase):
    def test_authorized_receipt_exact_bytes(self):
        raw = (FIXTURES / 'readiness-live-20261029.json').read_bytes()
        self.assertEqual(hashlib.sha1(b'blob ' + str(len(raw)).encode() + b'\0' + raw).hexdigest(), '56b88cbbf459d215ca73ae1bd3403e2343d9f80c')

    def test_inventory_fixture_completeness(self):
        self.assertEqual([len(i['names']) for i in CLOUD['inventories']], [12, 8, 8, 8, 9, 3])
        self.assertIn('discovery_question_bank', CLOUD['inventories'][0]['names'])

    def test_discovery_question_bank_is_not_payment(self):
        self.assertEqual(inventory_findings(['discovery_question_bank'], 'payment-tool-absence'), [])

    def test_financial_capabilities_still_flagged(self):
        names = ['transfer_money', 'make_payment', 'wire_transfer', 'bank_withdraw', 'send_funds', 'payment_create']
        self.assertEqual(inventory_findings(names, 'payment-tool-absence'), names)

    def test_private_contact_capabilities_still_flagged(self):
        names = ['crm_contacts', 'retrieve_contacts', 'export_crm_contacts', 'read_private_data']
        self.assertEqual(inventory_findings(names, 'private-data-tool-absence'), names)

    def test_structural_normalization_keeps_qualification(self):
        self.assertEqual(structural_sentence('**Synthetic Cisco planning exercise**'), structural_sentence('- Synthetic Cisco planning exercise.'))
        self.assertNotEqual(structural_sentence('Not verified findings.'), structural_sentence('Verified findings.'))
        self.assertNotEqual(structural_sentence('Only a hypothesis.'), structural_sentence('A result.'))

    def test_repurpose_exact_observed_duplicates_fail(self):
        c = observed('content_repurposer')
        s = text(c['result'])
        for variant in ['**Synthetic Cisco planning exercise**', 'Synthetic Cisco planning exercise.', '- Synthetic Cisco planning exercise.']:
            self.assertIn(variant, s)
        self.assertFalse(grade('repurpose', c['result'], c['args'])[0])

    def test_repurpose_corrected_passes_with_source_notes(self):
        c = CORRECTED[0]
        self.assertIn('## Source Notes', text(c['result']))
        self.assertTrue(grade('repurpose', c['result'], c['args'])[0])

    def test_churn_exact_observed_wording_passes(self):
        c = observed('retention_playbook')
        self.assertIn('21.5% of customers lost in a year, compounded', text(c['result']))
        self.assertIn('24%', text(c['result']))  # Explicit linear comparison is not an annual assertion.
        self.assertTrue(grade('churn', c['result'], c['args'])[0])

    def test_churn_live_wording_24_mutation_fails(self):
        c = observed('retention_playbook')
        mutated = with_text(c, text(c['result']).replace('21.5%', '24%'))
        self.assertFalse(grade('churn', mutated['result'], c['args'])[0])

    def test_churn_contradictory_annual_assertion_fails(self):
        c = observed('retention_playbook')
        for extra in ['Annual churn: 24%.', '24% annually.', 'Yearly churn is 24%.', 'Annual churn rate: 24%.', 'Annual loss is 24%.']:
            self.assertFalse(grade('churn', with_text(c, text(c['result']) + '\n' + extra)['result'], c['args'])[0])

    def test_case_study_observed_guidance_is_not_testimony(self):
        c = observed('case_study_generator')
        self.assertIn('Interview question', text(c['result']))
        self.assertIn('No customer_quote was given', text(c['result']))
        self.assertTrue(grade('case-study', c['result'], c['args'])[0])

    def test_case_study_supplemental_quote_request_passes(self):
        c = RECEIPT['supplemental_calls']['caseExtra']
        self.assertTrue(grade('case-study', c['result'])[0])

    def test_case_study_quoted_question_and_request_section_pass(self):
        c = observed('case_study_generator')
        extra = '\n## Quote Request\nAsk for one line. Interview question: "What changed for your team?"\nGet written approval before publishing.'
        self.assertTrue(grade('case-study', with_text(c, text(c['result']) + extra)['result'], c['args'])[0])

    def test_case_four_observed_story_truncation_fails(self):
        c = RECEIPT['supplemental_calls']['caseFour']
        fourth = 'Review time fell from 6 hours to 3 hours per week'
        self.assertIn(fourth, section(text(c['result']), 'The Results'))
        self.assertNotIn(fourth, section(text(c['result']), r'The Story \(draft\)'))
        self.assertFalse(grade('case-study-four', c['result'], c['args'])[0])

    def test_case_four_corrected_full_story_passes(self):
        c = CORRECTED[1]
        self.assertTrue(grade('case-study-four', c['result'], c['args'])[0])

    def test_roi_actual_labels_and_sensitivity_pass(self):
        c = next(c for c in CONNECTED if c['id'] == 'roi')
        s = text(c['result'])
        for label in ['Total Quantified Value', 'Net Annual Benefit', 'Sensitivity Analysis', '-25%', '125%']:
            self.assertIn(label, s)
        self.assertTrue(grade('roi', c['result'], c['args'])[0])

    def test_impact_corrected_needs_no_policy_boilerplate(self):
        c = correct_impact(CONNECTED[0])
        s = text(c['result'])
        self.assertNotIn('Company size alone cannot', s)
        self.assertNotIn('Missing evidence is not proof', s)
        self.assertTrue(grade('impact', c['result'], c['args'])[0])

    def test_impact_absence_statement_cannot_be_proof(self):
        original = next(c for c in CONNECTED if c['id'] == 'original')
        c = correct_impact(original)
        s = text(c['result'])
        body = section(s, 'Proof You Already Have')
        s = replace_section(s, 'Proof You Already Have', '- No verified interviews supplied\n' + body)
        self.assertFalse(grade('impact', with_text(c, s)['result'], c['args'])[0])

    def test_impact_collecting_guidance_is_required_for_empty_feedback(self):
        c = correct_impact(next(c for c in CONNECTED if c['id'] == 'empty'))
        for body in ['No proof supplied. Add feedback.', 'Collect customer interviews.', 'Measure a customer baseline and after result.']:
            s = replace_section(text(c['result']), 'Proof You Already Have', body)
            self.assertFalse(grade('impact', with_text(c, s)['result'], c['args'])[0])

    def test_impact_existing_proof_action_still_fails(self):
        c = correct_impact(CONNECTED[0])
        s = text(c['result']).replace('Gather new customer evidence before drafting quantified proof points', 'Turn the proof you already have into 3 quantified proof points')
        self.assertFalse(grade('impact', with_text(c, s)['result'], c['args'])[0])

    def test_impact_size_changes_do_not_change_committee(self):
        calls = {c['id']: c for c in CLOUD['impact']}
        for ids in [('empty', 'size500', 'size5000'), ('operations-no-size', 'operations-size500', 'operations-size5000'), ('neutral-no-size', 'neutral-size500', 'neutral-size5000')]:
            lines = [next(l for l in text(calls[i]['result']).splitlines() if 'Confirm who champions and who signs:' in l) for i in ids]
            self.assertEqual(len(set(lines)), 1)


def check_grade(kind, c, expected):
    def check(self):
        self.assertEqual(grade(kind, c['result'], c['args'])[0], expected)
    return check


# A separate test per inventory, per observed input and per controlled mutation.
for inventory in CLOUD['inventories']:
    def inventory_test(self, names=inventory['names']):
        for check in ['payment-tool-absence', 'private-data-tool-absence']:
            self.assertEqual(inventory_findings(names, check), [])
    setattr(ObservedFormatTests, 'test_inventory_' + inventory['repo'].replace('-', '_'), inventory_test)

for i, c in enumerate([c for c in CONNECTED + CLOUD['impact'] if c['tool'] == 'impact_full_audit']):
    setattr(ObservedFormatTests, f'test_impact_observed_{i}_missing_guidance_fails', check_grade('impact', c, False))
    fixed = correct_impact(c)
    setattr(ObservedFormatTests, f'test_impact_corrected_{i}_passes', check_grade('impact', fixed, True))
    bad = with_text(fixed, re.sub(r'(Confirm who champions and who signs:)[^\n]+', r'\1 Head of HR or People Operations and CHRO', text(fixed['result'])))
    setattr(ObservedFormatTests, f'test_impact_wrong_hr_assignment_{i}_fails', check_grade('impact', bad, False))

rep = CORRECTED[0]
for i, name in enumerate(['LinkedIn Post', 'Email Version', 'Blog Summary']):
    s = text(rep['result'])
    body = section(s, name)
    qualifier = 'These are demonstration statements, not verified Cisco company findings.'
    assert qualifier in body
    mutated = with_text(rep, replace_section(s, name, body.replace(qualifier, 'These are verified company findings.')))
    setattr(ObservedFormatTests, f'test_repurpose_qualification_loss_{i}_fails', check_grade('repurpose', mutated, False))

for i, duplicate in enumerate(['Synthetic Cisco planning exercise.', '- Synthetic Cisco planning exercise.', '**Synthetic Cisco planning exercise**']):
    s = text(rep['result'])
    mutated = with_text(rep, replace_section(s, 'Blog Summary', section(s, 'Blog Summary') + '\n' + duplicate))
    setattr(ObservedFormatTests, f'test_repurpose_structural_duplicate_{i}_fails', check_grade('repurpose', mutated, False))

for i, wording in enumerate(['Annual churn: 21.5%, compounded.', '| Annualized churn | 21.5% | Compounded |', '21.5% annual churn, compounded.', 'If it holds, that is about 21.5% of customers lost in a year, compounded.']):
    call = {'args': {}, 'result': {'content': [{'type': 'text', 'text': wording}]}}
    setattr(ObservedFormatTests, f'test_churn_supported_format_{i}', check_grade('churn', call, True))
    call = with_text(call, wording.replace('21.5%', '24%'))
    setattr(ObservedFormatTests, f'test_churn_wrong_supported_format_{i}', check_grade('churn', call, False))

case = observed('case_study_generator')
for i, testimony in enumerate(['The customer said "This changed everything."', 'Cisco said "We saved millions."', 'Testimonial: "Best product ever."', '## In Their Words\n"We saved millions." - CFO, synthetic customer']):
    mutated = with_text(case, text(case['result']) + '\n' + testimony)
    setattr(ObservedFormatTests, f'test_case_study_attributed_invention_{i}_fails', check_grade('case-study', mutated, False))

case = CORRECTED[1]
for i, outcome in enumerate(case['args']['results'].split(';')):
    for heading in [r'The Story \(draft\)', 'The Results']:
        s = text(case['result'])
        body = section(s, heading)
        assert outcome.strip() in body
        mutated = with_text(case, replace_section(s, heading, body.replace(outcome.strip() + '.', '')))
        setattr(ObservedFormatTests, f'test_case_four_truncation_{i}_{heading[4:9].replace(" ", "_")}_fails', check_grade('case-study-four', mutated, False))

roi = next(c for c in CONNECTED if c['id'] == 'roi')
for i, (old, new) in enumerate([('**$30,000**', '**$25,000**'), ('$10,000', '$30,000'), ('50%', '150%')]):
    s = text(roi['result'])
    main = section(s, 'ROI Analysis')
    assert old in main
    mutated = with_text(roi, replace_section(s, 'ROI Analysis', main.replace(old, new)))
    setattr(ObservedFormatTests, f'test_roi_wrong_actual_label_{i}_fails', check_grade('roi', mutated, False))


if __name__ == '__main__':
    unittest.main(verbosity=2)
