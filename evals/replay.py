"""Replay saved synthetic observations. Findings are not live endpoint results."""
import argparse
import json
import sys
from pathlib import Path

from generate import ROOT, GRADERS
from graders import grade


def current_replay():
    """Offline replay of fresh LIVE connector captures, without making new calls."""
    import hashlib
    fixture = ROOT / 'fixtures' / 'fresh-live-20261029.json'
    raw = fixture.read_bytes()
    snapshot = json.loads(raw)
    rows = []
    for call in snapshot['calls']:
        kind = 'case-study-four' if call['id'] == 'case-study-four-outcomes' else GRADERS[call['tool']]
        if kind == 'smoke':
            raise ValueError('Every current GTM/Content case needs a deterministic grader')
        passed, reason = grade(kind, call['result'], call['arguments'])
        rows.append(dict(case=call['id'], tool=call['tool'], server=call['server'], grader=kind,
                         status='pass' if passed else 'fail', reason=reason,
                         start_utc=call['start_utc'], end_utc=call['end_utc'],
                         provenance=call['provenance']))
    return dict(mode='current-connector-capture-replay', scope='Offline replay of fresh LIVE Helix connector calls. Not evals/run.py HTTP requests. No new calls during replay.',
                fixture='evals/fixtures/fresh-live-20261029.json', fixture_sha256=hashlib.sha256(raw).hexdigest(),
                counts={k: sum(r['status'] == k for r in rows) for k in ['pass', 'fail', 'skip']}, receipts=rows)


def replay():
    fixtures = ROOT / 'fixtures'
    prior = json.loads((fixtures / 'readiness-live-20261029.json').read_bytes())
    connected = json.loads((fixtures / 'connector-observed-20261029.json').read_text())['calls']
    cloud = json.loads((fixtures / 'cloud-source-20261029.json').read_text())
    cases = []
    for call in prior['package_fixture_calls']:
        kind = {'retention_playbook': 'churn', 'case_study_generator': 'case-study', 'content_repurposer': 'repurpose'}.get(call['tool'])
        if kind:
            cases.append(('authorized prior receipt', kind, call))
    for label, kind in [('caseExtra', 'case-study'), ('caseFour', 'case-study-four')]:
        call = prior['supplemental_calls'][label]
        cases.append(('authorized prior receipt ' + label, kind, dict(call, args=call.get('args', {}))))
    for call in connected:
        cases.append(('Helix connector observation ' + call['id'], 'roi' if call['id'] == 'roi' else 'impact', call))
    for call in cloud['impact']:
        if call['tool'] == 'impact_full_audit':
            cases.append(('offline cloud source ' + call['id'], 'impact', call))
    rows = []
    for provenance, kind, call in cases:
        passed, reason = grade(kind, call['result'], call['args'])
        rows.append(dict(provenance=provenance, grader=kind, status='pass' if passed else 'fail', reason=reason))
    return dict(mode='historical-observation-replay', scope='Historical saved synthetic responses. GTM/Content failures superseded by fresh-live-20261029.json where covered. No current Positioning observation or claim. No endpoint runner calls. Repeated cases are not independent observations.', counts={k: sum(r['status'] == k for r in rows) for k in ['pass', 'fail', 'skip']}, receipts=rows)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path)
    parser.add_argument('--current', action='store_true', help='Replay the fresh LIVE GTM/Content connector capture offline')
    args = parser.parse_args()
    report = current_replay() if args.current else replay()
    encoded = json.dumps(report, indent=2) + '\n'
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(encoded)
    print(encoded)
    sys.exit(int(report['counts']['fail'] > 0))
