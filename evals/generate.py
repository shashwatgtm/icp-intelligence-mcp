"""Generate per-server cases from the exact authoritative source files."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DOMAINS = ['revenue-enablement', 'craft-gtm', 'impact', 'craft-content', 'icp-intelligence', 'gtmalpha']
GRADERS = {'roi_business_case_builder': 'roi', 'mutual_action_plan_generator': 'map', 'retention_playbook': 'churn', 'case_study_generator': 'case-study', 'content_repurposer': 'repurpose', 'tam_sam_som_calculator': 'market', 'generate_roadmap': 'roadmap', 'epic_audit': 'alpha-audit', 'gtm_consultation': 'alpha-consult'}
SOURCE_BLOBS = {'HOST-REVIEW-CASES.json': '55798516394fa253d2815e94a7af67936cbaf7f2', 'ICP-ALPHA-PACKAGE-CASES.json': '3d0622f9c15273615dd6b495fd6e5dc5a9c9f157'}


def generate():
    servers = []
    for filename in ['HOST-REVIEW-CASES.json', 'ICP-ALPHA-PACKAGE-CASES.json']:
        source = ROOT / 'source' / filename
        raw = source.read_bytes()
        if hashlib.sha1(b'blob ' + str(len(raw)).encode() + b'\0' + raw).hexdigest() != SOURCE_BLOBS[filename]:
            raise ValueError('Authoritative source bytes changed: ' + filename)
        for index, mcp in enumerate(json.loads(raw)):
            cases = []
            for i, c in enumerate(mcp['cases']['positive']):
                # Decode the exact JSON object embedded in the supplied prompt.
                args = json.loads(c['prompt'][c['prompt'].index('{'):])
                cases.append(dict(id=f'positive-{i+1}', mode='backend', tool=c['tools_triggered'], arguments=args,
                                  grader=GRADERS.get(c['tools_triggered'], 'smoke'), source_case=c,
                                  manual_assertion='Full expected_behavior requires host review'))
            for i, c in enumerate(mcp['cases']['negative']):
                cases.append(dict(id=f'negative-{i+1}', mode='manual-host', source_case=c,
                                  backend_check=['payment-tool-absence', 'private-data-tool-absence', 'hostile-source-handling'][i]))
            if mcp['name'] == 'helix-impact':
                args = dict(cases[4]['arguments'], customer_feedback='', target_customer='Operations team at synthetic firms with 500 employees')
                cases.append(dict(id='empty-feedback-size', mode='backend', tool='impact_full_audit', arguments=args, grader='impact', source_case='Derived synthetic regression, not a replacement source'))
            if mcp['name'] == 'helix-icp-intelligence':
                cases.append(dict(id='unused-interview-fields', mode='schema', tool='icp_interview_synthesizer', grader='unused-fields'))
            data = dict(name=mcp['name'], endpoint='https://' + DOMAINS[len(servers)] + '.gtmhelix.com/mcp', source=f'source/{filename}', source_index=index, source_sha256=hashlib.sha256(raw).hexdigest(), cases=cases)
            servers.append(data)
    out = ROOT / 'cases'
    out.mkdir(exist_ok=True)
    for server in servers:
        (out / (server['name'] + '.json')).write_text(json.dumps(server, indent=2) + '\n')
    return servers


if __name__ == '__main__':
    print('Generated', len(generate()), 'server files from authoritative sources')
