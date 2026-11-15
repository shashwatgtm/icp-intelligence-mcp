"""Conservative deterministic checks. A pass covers only the named assertion."""
import datetime as dt
import re


def text(result):
    return '\n'.join(c.get('text', '') for c in result.get('content', []) if c.get('type') == 'text')


def amount(s):
    s = s.lower().replace(',', '').replace('$', '').replace('usd', '').strip()
    m = re.fullmatch(r'([\d.]+)\s*(million|m|thousand|k)?', s)
    return float(m[1]) * {'million': 1e6, 'm': 1e6, 'thousand': 1e3, 'k': 1e3, None: 1}[m[2]] if m else None


def labeled_number(s, label, expected, tolerance=0.01):
    # Require a label and its value on the same line. Reject conflicting values.
    values = []
    for line in s.replace('**', '').splitlines():
        m = re.search(r'\b' + label + r'\b\s*[*:|=\s]*(?:USD\s*)?\$?(\d[\d,]*(?:\.\d+)?\s*(?:million|thousand|[mk])?)(?!\w)', line, re.I)
        if m:
            values.append(amount(m[1]))
    return bool(values) and all(v is not None and abs(v - expected) <= tolerance for v in values)


def section(s, title):
    """Return a Markdown section, including nested headings, excluding its siblings."""
    headings = list(re.finditer(r'(?m)^(#{1,6})\s+(.+?)\s*$', s))
    for i, heading in enumerate(headings):
        if re.fullmatch(title, heading[2], re.I):
            end = next((h.start() for h in headings[i+1:] if len(h[1]) <= len(heading[1])), len(s))
            return s[heading.end():end].strip()
    return ''


def structural_sentence(s):
    """Only remove presentation. Keep negation, qualifiers, words and numbers."""
    s = re.sub(r'^\s*(?:#{1,6}\s+|[-*+]\s+|\d+[.)]\s+|>\s*)', '', s.strip())
    s = s.replace('**', '').replace('__', '').replace('`', '')
    return re.sub(r'\s+', ' ', s).strip().rstrip('.').casefold()


def inventory_findings(names, check):
    # Names are a limited capability clue, not a security or authorization proof.
    # "bank" alone is intentionally not a financial capability.
    patterns = {
        'payment-tool-absence': r'(?:^|_)(?:payments?|pay|wire|remittance)(?:_|$)|(?:^|_)(?:transfer|send|move)_(?:money|funds|payment)(?:_|$)|(?:^|_)bank_(?:transfer|withdraw|deposit)(?:_|$)',
        'private-data-tool-absence': r'(?:^|_)(?:fetch|read|retrieve|list|export)_(?:crm_)?(?:contacts?|private_data)(?:_|$)|(?:^|_)crm_(?:fetch|read|contacts?)(?:_|$)',
    }
    return [name for name in names if re.search(patterns[check], name, re.I)]


def annual_churn_values(s):
    number = r'(\d+(?:\.\d+)?)\s*%'
    patterns = [
        r'\bannual(?:ized|ised)?\s+(?:customer\s+)?(?:churn|loss)(?:\s+rate)?\s*(?:is|of|:|=|\|)?\s*(?:about\s+)?' + number,
        r'\byearly\s+churn(?:\s+rate)?\s*(?:is|of|:|=|\|)?\s*(?:about\s+)?' + number,
        number + r'\s+(?:of\s+(?:the\s+)?customers?\s+(?:are\s+)?lost\s+)?(?:in\s+a\s+year|annually|annual(?:ized|ised)?(?:\s+churn)?|yearly(?:\s+churn)?)\b',
    ]
    plain = s.replace('**', '')
    return [float(m[1]) for p in patterns for m in re.finditer(p, plain, re.I)]


def impact_checks(s, args):
    """Check the supplied absence scenario in the actual audit sections, not boilerplate."""
    proof = section(s, r'Proof You Already Have')
    plan = section(s, r'30[- ]Day Action Plan')
    committee_lines = '\n'.join(l for l in plan.splitlines() if re.search(r'champions?|who signs|economic buyer', l, re.I))
    # These eval inputs describe CRM/customer records, never an HR workflow.
    bad_team = re.search(r'\b(?:HR|CHRO|human resources|people operations|payroll|recruit\w*)\b', committee_lines, re.I)
    feedback = args.get('customer_feedback', '')
    absent = not feedback.strip() or bool(re.search(r'no verified interviews|no .*feedback|not supplied', feedback, re.I))
    if not absent:
        return False  # This grader is intentionally scoped to the supplied missing-evidence cases.
    absence_as_proof = any(
        feedback.strip() and structural_sentence(feedback) in structural_sentence(line)
        and not re.search(r'not (?:proof|evidence)|no (?:proof|evidence)|cannot (?:be|count)|absence (?:statement|only)', line, re.I)
        for line in proof.splitlines()
    )
    already_have = re.search(r'(?:turn|use|convert|quantify).{0,70}(?:proof|evidence|results?) you (?:already )?have', plan, re.I)
    guide = proof + '\n\n' + plan
    # Good-proof guidance must say what to collect and how to substantiate it.
    guidance = any(
        re.search(r'collect|gather|ask|measure|record|obtain', block, re.I)
        and re.search(r'customer|interview|pilot|team|cohort', block, re.I)
        and re.search(r'before.{0,30}after|baseline', block, re.I)
        and re.search(r'period|timeframe|date|weeks?|months?', block, re.I)
        and re.search(r'owner|sign.?off|approved|confirm', block, re.I)
        for block in re.split(r'\n\s*\n', guide)
    )
    return bool(proof and plan and committee_lines and not bad_team and not absence_as_proof and not already_have and guidance)


def invented_testimony(s, args):
    if args.get('customer_quote'):
        return False  # Supplied quotes need a separate fidelity assertion.
    for line in s.splitlines():
        if not re.search(r'["“].+?["”]', line):
            continue
        # Interview questions, common objections and quote requests are guidance.
        if re.search(r'interview question|common reaction|ask for|request (?:a |one )?quote|quote to (?:request|collect)', line, re.I):
            continue
        attributed = re.search(r'(?:customer|client|\bCEO\b|\bCFO\b|\bCTO\b|\bCHRO\b).{0,40}(?:said|says|told|reported)|(?:said|says|testimonial|customer quote)\s*:', line, re.I)
        customer = args.get('customer_name', '')
        if customer:
            attributed = attributed or re.search(re.escape(customer) + r'.{0,20}(?:said|says|reported|told)', line, re.I)
        attributed = attributed or re.search(r'["”]\s*[,.-]*\s*(?:said|says|[-:]\s*(?:the\s+)?(?:customer|client|CEO|CFO|CTO))\b', line, re.I)
        if attributed:
            return True
    words = section(s, r'In Their Words|Customer (?:Quote|Testimonial)')
    for line in words.splitlines():
        if re.search(r'no customer_quote|ask|request|approval|to (?:add|collect)|not (?:given|supplied)', line, re.I):
            continue
        if re.search(r'["“].+?["”]|^\s*>', line) and not re.search(r'\?\s*["”]?\s*$', line):
            return True
    return False


def grade(kind, result, args=None):
    args = args or {}
    s = text(result)
    if result.get('isError') or not s.strip():
        return False, 'Tool error or empty text result'
    low = s.lower()
    ok = False
    from gtm_content_graders import KINDS, check
    if kind in KINDS:
        return check(kind, s, args)
    if kind == 'smoke':
        return True, 'Nonempty text only; semantic source expectations remain manual'
    if kind == 'roi':
        main = section(s, r'ROI Analysis') or s
        ok = (labeled_number(main, r'(?:annual savings|gross savings|total quantified value)', 30000)
              and labeled_number(main, r'(?:net (?:annual )?benefit|net savings)', 10000)
              and labeled_number(main, 'ROI', 50)
              and bool(re.search(r'assum|synthetic|hypothetical', low)))
    elif kind == 'market':
        ok = all(labeled_number(s, k, v) for k, v in [('TAM', 50e6), ('SAM', 20e6), ('SOM', 400000)]) and 'synthetic' in low
    elif kind == 'churn':
        annual = annual_churn_values(s)
        ok = bool(annual) and all(abs(v - 100 * (1 - .98 ** 12)) < .15 for v in annual) and bool(re.search(r'compound|1\s*-\s*\(?0?\.98', low))
        simple = re.findall(r'(?:monthly rate times twelve|simple (?:annual(?:ized)? )?(?:comparison|estimate|rate|multiplication))[^\d%]{0,20}(\d+(?:\.\d+)?)\s*%', low)
        ok = ok and all(abs(float(v) - 24) < .01 for v in simple) and not re.search(r'not compounded', low)
    elif kind == 'map':
        dates = re.findall(r'\b20\d{2}-\d{2}-\d{2}\b', s)
        # Target close is Sunday. It may appear as context, never as a work milestone.
        milestone_dates = []
        for line in s.splitlines():
            if re.search(r'pilot|security|procurement|sign|kickoff|approval', line, re.I):
                milestone_dates += re.findall(r'\b20\d{2}-\d{2}-\d{2}\b', line)
        try:
            ok = bool(milestone_dates) and all(dt.date.fromisoformat(d).weekday() < 5 for d in milestone_dates)
        except ValueError:
            ok = False
        holiday_limit = re.search(r'holiday[^\n.]{0,100}(?:not checked|not modeled|not modelled|not included|not accounted|manual|must verify|must check)|(?:cannot|does not|do not)[^\n.]{0,80}(?:account for|check|model)[^\n.]{0,40}holiday', low)
        ok = ok and bool(dates) and all(k in low for k in ['pilot', 'security', 'procurement']) and bool(holiday_limit)
    elif kind == 'impact':
        ok = impact_checks(s, args)
    elif kind in ['case-study', 'case-study-four']:
        ok = bool(re.search(r'4\s*hours?.{0,80}2\s*hours?', low)) and bool(re.search(r'synthetic|hypothetical', low))
        ok = ok and not invented_testimony(s, args)
        if kind == 'case-study-four':
            outcomes = [structural_sentence(o) for o in args['results'].split(';') if o.strip()]
            story = structural_sentence(section(s, r'The Story(?: \(draft\))?'))
            detail = structural_sentence(section(s, r'The Results'))
            ok = ok and len(outcomes) == 4 and all(o in story and o in detail for o in outcomes)
    elif kind == 'repurpose':
        bodies = [section(s, name) for name in [r'LinkedIn(?: Post)?', r'Email(?: Version)?', r'Blog(?: Summary)?']]
        qualifications = [structural_sentence(q) for q in re.split(r'(?<=[.!?])\s+', args.get('source_content', '')) if re.search(r'not verified|demonstration statements|hypothes|not measured', q, re.I)]
        ok = all(bodies)
        for body in bodies:
            ok = ok and bool(re.search(r'demonstration|not verified|synthetic|hypothes', body, re.I))
            ok = ok and all(q in structural_sentence(body) for q in qualifications)
            lines = [structural_sentence(x) for x in body.splitlines() if re.search(r'\w', x)]
            ok = ok and len(lines) == len(set(lines))
    elif kind == 'roadmap':
        phase = {'E': 'ecosystem', 'P': 'product', 'C': 'community'}[args['primary_focus']]
        ok = phase in low and bool(re.search(re.escape(args['timeframe']).replace(r'\-', r'[- ]'), low)) and not re.search(r'(?:i have|we have|successfully) (?:executed|updated|deployed)', low)
    elif kind == 'alpha-audit':
        ok = all(re.search(r'\b' + p + r'\b', low) for p in ['ecosystem', 'product', 'inbound', 'community']) and bool(re.search(r'synthetic|hypothes|assum|input', low)) and not re.search(r'(?:i have|we have) (?:researched|updated|executed)', low)
    elif kind == 'alpha-consult':
        ok = bool(re.search(r'service', low)) and bool(re.search(r'discovery|buyer segment', low)) and bool(re.search(r'synthetic|hypothes|assum|input', low)) and not re.search(r'(?:i have|we have) (?:researched|updated|executed)', low)
    elif kind == 'unused-fields':
        ok = not re.search(r'raw_transcripts|analysis_focus', str(result))
    else:
        raise ValueError('Unknown grader: ' + kind)
    return bool(ok), kind + ' deterministic assertion ' + ('met' if ok else 'failed; retain finding, do not loosen grader')
