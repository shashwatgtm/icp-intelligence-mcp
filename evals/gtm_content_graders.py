"""Deterministic assertions for the ten authorized GTM and Content review cases.

These checks certify named properties of the synthetic fixtures, not strategy quality.
"""
import datetime as dt
import re

from graders import section, structural_sentence

KINDS = {'pmf', 'pmf-incomplete', 'launch', 'interview', 'plan-review', 'newsletter', 'webinar', 'content-review'}


def contains(s, value):
    return structural_sentence(value) in structural_sentence(s)


def unique_body_lines(s):
    lines = [structural_sentence(line) for line in s.splitlines()
             if re.search(r'\w', line) and not line.lstrip().startswith('#')]
    return len(lines) == len(set(lines))


def check(kind, s, args):
    checks = {}
    low = s.lower()
    if kind == 'pmf-incomplete':
        overall = section(s, 'Overall PMF Assessment')
        actions = section(s, 'Priority Actions')
        churn = section(s, r'1\. Customer Retention \(Churn\)')
        retention = section(s, r'4\. Revenue Retention')
        activation = section(s, r'5\. Activation')
        checks['labelled activation is read'] = bool(re.search(r'\|\s*Activation Rate\s*\|\s*70%\s*\|', activation))
        checks['churn and retention gaps are explicit'] = all('NOT PROVIDED' in p and 'not scored' in p.lower() for p in [churn, retention])
        checks['three of five dimensions scored'] = '3 of 5' in overall and '9/10' in overall
        checks['rule score is not proof'] = bool(re.search(r'rule score.{0,80}not proof', overall, re.I))
        checks['incomplete evidence caveat is retained'] = bool(re.search(r'fill.{0,40}missing.{0,80}before.{0,80}scale', overall, re.I | re.S))
        checks['no conflicting scaling action with incomplete evidence'] = bool(actions) and not re.search(r'all dimensions scoring well|focus on scaling|scale (?:now|immediately|aggressively)', actions, re.I)
    elif kind == 'pmf':
        overall = section(s, 'Overall PMF Assessment')
        activation = section(s, r'5\. Activation')
        actions = section(s, 'Priority Actions')
        expected = re.search(r'activation(?:\s+rate)?\s*[:=]?\s*(\d+(?:\.\d+)?)\s*%', args['current_metrics'], re.I)
        checks['rule score is not proof'] = bool(re.search(r'rule score', overall, re.I) and re.search(r'not proof.{0,30}product.market fit', overall, re.I))
        if expected:
            checks['supplied activation is read'] = bool(re.search(r'\|\s*Activation Rate\s*\|\s*' + re.escape(expected[1]) + r'%\s*\|', activation, re.I))
            checks['all five dimensions scored'] = '5 of 5' in overall and '8.6/10' in overall
        else:
            checks['activation gap is explicit'] = 'NOT PROVIDED' in activation and 'not scored' in activation.lower() and 'activation' in actions.lower()
            checks['four dimensions scored'] = '4 of 5' in overall and '8.5/10' in overall
            checks['no scaling recommendation with missing activation'] = not re.search(r'focus on scaling|scale (?:now|immediately|aggressively)', overall + actions, re.I)
            checks['measure activation before scaling'] = bool(re.search(r'fill.{0,40}missing.{0,80}before.{0,80}scale', overall, re.I | re.S))
        checks['input metrics retained'] = all(value in s for value in ['3%', '45', '$500', '$3,000', '92%'])
    elif kind == 'launch':
        goals = section(s, 'Goals and how each is measured')
        timeline = section(s, 'Timeline')
        launch_date = dt.date.fromisoformat(args['launch_date'])
        dates = re.findall(r'\b20\d{2}-\d{2}-\d{2}\b', timeline)
        try:
            parsed = [dt.date.fromisoformat(d) for d in dates]
            checks['valid dated phases around launch'] = bool(parsed) and min(parsed) < launch_date < max(parsed)
        except ValueError:
            checks['valid dated phases around launch'] = False
        checks['requested launch date retained'] = args['launch_date'] in section(s, 'The plan in brief')
        checks['both numeric goals retained'] = all(contains(goals, goal) for goal in args['goals'].split(';'))
        checks['supplied audience retained'] = contains(s, args['target_segments'])
        checks['four phases present'] = all(section(timeline, p) for p in ['Prep', 'Build', 'Launch', 'Follow-up'])
        checks['no completed external action claim'] = not re.search(r'(?:we have|i have|successfully) (?:launched|published|sent|deployed)', low)
    elif kind == 'interview':
        hypothesis = section(s, 'Hypothesis Validation Questions')
        hypotheses = [h.strip().rstrip('.') for h in args['key_hypotheses'].split(';') if h.strip()]
        checks['supplied hypotheses remain hypotheses'] = all(contains(hypothesis, h) for h in hypotheses)
        checks['neutral opening before hypothesis'] = bool(re.search(r'open without.{0,100}walk me through.{0,100}what,? if anything', hypothesis, re.I | re.S))
        checks['respondent can reject hypothesis'] = bool(re.search(r'how close.{0,90}if at all', hypothesis, re.I | re.S))
        checks['severity and incident require confirmation'] = len(re.findall(r'only if they confirm', hypothesis, re.I)) >= 2
        checks['counter-evidence is sought'] = bool(re.search(r'counter.evidence', hypothesis, re.I) and re.search(r'NOT true|opposite', hypothesis, re.I))
        checks['no obsolete leading confirmation'] = not re.search(r'confirm it is true|is this true for you', hypothesis, re.I)
    elif kind == 'plan-review':
        # This case is the exact one-paragraph labelled plan, not a general scoring oracle.
        character = section(s, r'C: CHARACTER \(who runs it\)')
        result = section(s, r'R: RESULT \(what success looks like\)')
        artifact = section(s, r'A: ARTIFACT \(what gets produced\)')
        frame = section(s, r'F: FRAME \(context and limits\)')
        timeline = section(s, r'T: TIMELINE \(when it happens\)')
        checks['review is 39 of 50'] = bool(re.search(r'Overall Score:\s*39/50\s*\(78%\)', s))
        checks['owner is read from labelled clause'] = contains(character, 'Owner: marketing director') and '10/10' in character
        checks['numeric meeting outcome is read'] = contains(result, 'Outcome: 20 discovery meetings') and '8/10' in result
        checks['channel asset is read'] = contains(artifact, 'Channels: customer webinars and partner referrals') and '5/10' in artifact
        checks['audience range is retained in Frame'] = contains(frame, 'Target: revenue operations directors at firms with 200 to 1000 employees')
        checks['budget is retained in Frame'] = bool(re.search(r'Budget:\s*USD\s*15,?000', frame)) and '6/10' in frame
        checks['correct dates are retained in Timeline'] = contains(timeline, 'Timeline: 1 January to 31 March 2027') and '10/10' in timeline
    elif kind == 'newsletter':
        draft = s.split('## Subject Lines', 1)[0]
        # Subject/preview, A/B alternatives and suggested hooks are not body repetition.
        body = draft.split('---', 1)[-1]
        checks['body has no opening repetition'] = unique_body_lines(body)
        checks['all supplied key points retained'] = all(contains(body, p) for p in args['key_points'].split(';'))
        checks['supplied CTA is the button'] = contains(body, 'Button: ' + args['cta_goal'])
        checks['synthetic topic retained'] = contains(draft, args['topic'])
    elif kind == 'webinar':
        schedule = section(s, 'Run of Show')
        script = section(s, 'Full Script')
        rows = re.findall(r'\|\s*(\d+):(\d{2})\s*\|\s*(\d+) min\s*\|', schedule)
        elapsed = 0
        valid = bool(rows)
        for hours, minute, duration in rows:
            valid = valid and int(hours) * 60 + int(minute) == elapsed
            elapsed += int(duration)
        checks['continuous requested duration'] = valid and elapsed == int(args['duration'].split('_')[0])
        checks['takeaways retained in script'] = all(contains(script, p) for p in args['key_takeaways'].split(';'))
        checks['speaker and audience retained'] = contains(script, args['speakers']) and contains(script, args['target_audience'])
        checks['polls included when requested'] = not args.get('include_polls') or 'poll' in script.lower()
        # A supplied topic may contain the product name. That is not an extra sales pitch.
        checks['no added product pitch with none selected'] = args.get('product_mention_level') != 'none' or not re.search(r'product (?:tie.in|demo|pitch)|buy (?:now|our)', script, re.I)
    elif kind == 'content-review':
        original = section(s, 'Your Text, With the Findings Marked')
        improved = section(s, 'Improved Version')
        checks['original synthetic copy retained'] = contains(original, args['content'])
        checks['no fabricated improved text when no edit found'] = 'No automatic edits were found' in improved and 'no improved version to show' in improved
        checks['goal and audience retained'] = contains(s, args['goal']) and contains(s, args['audience'])
        checks['missing evidence is flagged'] = 'No specific figure in the text' in s and 'prove' in s.lower()
        opening = section(s, 'Suggested Opening:')
        checks['opening does not repeat empty source hook'] = bool(opening) and not contains(opening, args['content'].split('.')[0])
    else:
        raise ValueError('Unknown GTM/Content grader: ' + kind)
    failed = [name for name, passed in checks.items() if not passed]
    return not failed, ('Assertions met: ' + '; '.join(checks)) if not failed else 'Failed: ' + '; '.join(failed)
