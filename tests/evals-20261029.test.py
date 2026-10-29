"""Offline grader mutations and protocol tests. No sockets or model calls."""
import copy
import importlib.util
import json
import io
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'evals'))
from generate import generate
from graders import grade
from run import MCP, NoRedirect, ProtocolError, evaluate


def result(s):
    return {'content': [{'type': 'text', 'text': s}]}


GOOD = {
    'roi': 'Synthetic annual assumptions\nAnnual savings: USD 30,000\nNet benefit: USD 10,000\nROI: 50%',
    'market': 'Synthetic review inputs\nTAM: USD 50,000,000\nSAM: USD 20,000,000\nSOM: USD 400,000',
    'churn': 'Compounded monthly at 2%. Annual churn: 21.5%',
    'map': 'Target close: 2027-01-31\nPilot: 2027-01-25\nSecurity review: 2027-01-26\nProcurement approval: 2027-01-29\nHoliday calendar not checked. Verify local holidays manually.',
    'impact': 'Company size alone cannot decide the buying team. Missing evidence is not proof of absence. Collect interviews and baseline evidence before making a claim.',
    'case-study': 'Synthetic review case. Reporting preparation fell from 4 hours to 2 hours per week. No customer quote supplied.',
    'repurpose': '# LinkedIn post\nSynthetic demonstration. The pilot surfaced missing data.\n# Email\nSynthetic demonstration. A named owner checked reporting fields weekly.\n# Blog summary\nSynthetic demonstration. One region piloted before rollout.',
    'roadmap': 'Ecosystem and ABM roadmap for 30-day. These are proposed tasks.',
    'alpha-audit': 'Ecosystem and ABM, Product-led growth, Inbound and outbound, Community-led. Input audit based on synthetic assumptions.',
    'alpha-consult': 'Services buyer segment and discovery plan. Synthetic input assumptions.',
    'unused-fields': '{"properties":{"interview_notes":{}}}',
}
ARGS = {'primary_focus': 'E', 'timeframe': '30-day'}
DEFECTS = {
    'roi': [GOOD['roi'].replace('30,000', '25,000'), GOOD['roi'].replace('10,000', '30,000'), GOOD['roi'].replace('50%', '150%'), 'Annual savings 30000 net benefit 10000 ROI 50. Actually ROI: 150%'],
    'market': [GOOD['market'].replace('50,000,000', '5,000,000'), GOOD['market'].replace('20,000,000', '2,000,000'), GOOD['market'].replace('400,000', '1,000,000')],
    'churn': ['2% monthly. Annual churn: 24%. Compounded.', 'Monthly churn is 2%; annual churn is unknown. 21.5% is mentioned as a keyword.'],
    'map': [GOOD['map'].replace('2027-01-25', '2027-01-30'), GOOD['map'].replace('Holiday calendar not checked. Verify local holidays manually.', 'All holidays were checked.')],
    'impact': ['500 employees determines the buying team. Missing evidence proves no demand. Proof is strong.', GOOD['impact'].replace('Collect interviews and baseline evidence before making a claim.', ''), GOOD['impact'] + ' Company size determines the buyer.'],
    'case-study': [GOOD['case-study'].replace('2 hours', '1 hour'), GOOD['case-study'] + ' The customer said "This changed everything."'],
    'repurpose': [GOOD['repurpose'].replace('Synthetic demonstration. A named owner', 'A named owner'), GOOD['repurpose'].replace('The pilot surfaced missing data.', 'The pilot surfaced missing data.\nSynthetic demonstration. The pilot surfaced missing data.')],
    'roadmap': ['Product-led roadmap for 30-day.', 'Ecosystem roadmap for 90-day.', GOOD['roadmap'] + ' We have executed the tasks.'],
    'alpha-audit': ['Ecosystem, Product. Synthetic input.', GOOD['alpha-audit'] + ' We have researched the company.'],
    'alpha-consult': ['Hardware product conversion campaign.', GOOD['alpha-consult'] + ' We have updated the CRM.'],
    'unused-fields': ['{"properties":{"raw_transcripts":{},"analysis_focus":{}}}'],
}


class GraderTests(unittest.TestCase):
    pass


def make_test(kind, value, expected):
    def check(self):
        self.assertEqual(grade(kind, result(value), ARGS)[0], expected)
    return check


for kind, value in GOOD.items():
    setattr(GraderTests, 'test_good_' + kind.replace('-', '_'), make_test(kind, value, True))
    for i, value in enumerate(DEFECTS[kind]):
        setattr(GraderTests, f'test_defect_{kind.replace("-", "_")}_{i}', make_test(kind, value, False))


class ProtocolTests(unittest.TestCase):
    def test_sse_multiline_and_timeout(self):
        class Response(io.BytesIO):
            headers = {'Content-Type': 'text/event-stream', 'Mcp-Session-Id': 'synthetic-session'}
        response = Response(b'data: {"jsonrpc":"2.0",\ndata: "id":1,"result":{"tools":[]}}\n\n')
        with patch('urllib.request.OpenerDirector.open', return_value=response) as opened:
            self.assertEqual(MCP('https://example.invalid/mcp', timeout=7).send('tools/list'), {'tools': []})
            self.assertEqual(opened.call_args.kwargs['timeout'], 7)

    def test_timeout_fails_without_printing_payload(self):
        with patch('urllib.request.OpenerDirector.open', side_effect=TimeoutError('synthetic timeout')):
            with self.assertRaises(TimeoutError):
                MCP('https://example.invalid/mcp').send('tools/list')

    def test_redirect_refused(self):
        with self.assertRaises(ProtocolError):
            NoRedirect().redirect_request(None, None, 302, 'Found', {}, 'https://example.invalid/collect')

    def test_roadmap_other_source_motions(self):
        for phase, timeframe, word in [('P', '60-day', 'Product-led growth'), ('C', '90-day', 'Community-led growth')]:
            self.assertTrue(grade('roadmap', result(word + ' ' + timeframe), {'primary_focus': phase, 'timeframe': timeframe})[0])
            self.assertFalse(grade('roadmap', result('Ecosystem 30-day'), {'primary_focus': phase, 'timeframe': timeframe})[0])

    def test_initialize_session_version_notification_then_call(self):
        calls = []
        def transport(payload, headers):
            calls.append((copy.deepcopy(payload), dict(headers)))
            if payload['method'] == 'initialize':
                return dict(jsonrpc='2.0', id=payload['id'], result={'protocolVersion': '2025-06-18'}), {'mcp-session-id': 'synthetic-session'}
            if payload['method'] == 'notifications/initialized':
                return None, {}
            return dict(jsonrpc='2.0', id=payload['id'], result=result('Synthetic text')), {}
        client = MCP('https://example.invalid/mcp', transport=transport)
        client.initialize()
        client.send('tools/call', {'name': 'synthetic_tool', 'arguments': {}})
        self.assertEqual([c[0]['method'] for c in calls], ['initialize', 'notifications/initialized', 'tools/call'])
        self.assertNotIn('id', calls[1][0])
        self.assertEqual(calls[2][1]['Mcp-Session-Id'], 'synthetic-session')
        self.assertEqual(calls[2][1]['MCP-Protocol-Version'], '2025-06-18')

    def test_mismatched_id_rejected(self):
        with self.assertRaises(ProtocolError):
            MCP('unused', transport=lambda p, h: ({'jsonrpc': '2.0', 'id': 900, 'result': {}}, {})).send('tools/list')

    def test_rpc_error_rejected(self):
        with self.assertRaises(ProtocolError):
            MCP('unused', transport=lambda p, h: ({'jsonrpc': '2.0', 'id': p['id'], 'error': {'message': 'synthetic error'}}, {})).send('tools/list')

    def test_unsupported_protocol_rejected(self):
        with self.assertRaises(ProtocolError):
            MCP('unused', transport=lambda p, h: ({'jsonrpc': '2.0', 'id': p['id'], 'result': {'protocolVersion': 'unknown'}}, {})).initialize()

    def test_pagination(self):
        calls = []
        def transport(p, h):
            calls.append(p)
            page = {'tools': [{'name': 'one'}], 'nextCursor': 'synthetic-cursor'} if len(calls) == 1 else {'tools': [{'name': 'two'}]}
            return {'jsonrpc': '2.0', 'id': p['id'], 'result': page}, {}
        self.assertEqual([t['name'] for t in MCP('unused', transport=transport).tools()], ['one', 'two'])
        self.assertEqual(calls[1]['params']['cursor'], 'synthetic-cursor')

    def test_dry_run_zero_network_and_no_passes(self):
        with patch('urllib.request.OpenerDirector.open', side_effect=AssertionError('network forbidden')), patch('run.MCP', side_effect=AssertionError('client forbidden')):
            report = evaluate(generate(), dry_run=True, factory=lambda *a, **k: self.fail('client created'))
        self.assertEqual(report['counts'], {'pass': 0, 'fail': 0, 'skip': 68})
        self.assertEqual(sum(r['scope'] == 'manual-host' for r in report['receipts']), 18)

    def test_sources_and_three_negatives_each(self):
        servers = generate()
        self.assertEqual(len(servers), 6)
        for server in servers:
            self.assertEqual(sum(c['mode'] == 'manual-host' for c in server['cases']), 3)
            source = json.loads((Path(__file__).resolve().parents[1] / 'evals' / server['source']).read_bytes())[server['source_index']]
            self.assertEqual([c['source_case'] for c in server['cases'][:5]], source['cases']['positive'])

    def test_tool_error_cannot_pass(self):
        self.assertFalse(grade('roi', dict(result(GOOD['roi']), isError=True))[0])

    def test_empty_output_cannot_pass(self):
        self.assertFalse(grade('smoke', result(''))[0])

    def test_million_units(self):
        self.assertTrue(grade('market', result('Synthetic\nTAM: $50m\nSAM: $20 million\nSOM: $400k'))[0])


if __name__ == '__main__':
    unittest.main(verbosity=2)
