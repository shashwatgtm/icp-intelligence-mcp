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
    for line in s.splitlines():
        m = re.search(r'\b' + label + r'\b\s*[*:|=\s]*(?:USD\s*)?\$?([\d,]+(?:\.\d+)?\s*(?:million|thousand|[mk])?)(?!\w)', line, re.I)
        if m:
            values.append(amount(m[1]))
    return bool(values) and all(v is not None and abs(v - expected) <= tolerance for v in values)


def grade(kind, result, args=None):
    args = args or {}
    s = text(result)
    if result.get('isError') or not s.strip():
        return False, 'Tool error or empty text result'
    low = s.lower()
    ok = False
    if kind == 'smoke':
        return True, 'Nonempty text only; semantic source expectations remain manual'
    if kind == 'roi':
        ok = (labeled_number(s, r'(?:annual savings|gross savings)', 30000)
              and labeled_number(s, r'(?:net benefit|net savings)', 10000)
              and labeled_number(s, 'ROI', 50)
              and bool(re.search(r'assum|synthetic|hypothetical', low)))
    elif kind == 'market':
        ok = all(labeled_number(s, k, v) for k, v in [('TAM', 50e6), ('SAM', 20e6), ('SOM', 400000)]) and 'synthetic' in low
    elif kind == 'churn':
        annual = re.findall(r'(?:annual\w*\s*(?:churn)?|year\w*\s*churn)\s*[*:|=\s]*(\d+(?:\.\d+)?)\s*%', low)
        ok = bool(annual) and all(abs(float(v) - 100 * (1 - .98 ** 12)) < .15 for v in annual) and bool(re.search(r'compound|1\s*-\s*\(?0?\.98', low))
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
        ok = (bool(re.search(r'(?:size|employees).{0,100}(?:does not|cannot|never|not enough|alone)', low))
              and bool(re.search(r'(?:missing|absent|no).{0,60}evidence.{0,80}(?:not|never|unknown)', low))
              and bool(re.search(r'(?:collect|gather|interview|measure|validate).{0,100}(?:proof|feedback|evidence|baseline)', low))
              and not re.search(r'(?:size|employees).{0,40}(?:determines|proves) (?:the )?(?:buyer|team)', low))
    elif kind == 'case-study':
        ok = bool(re.search(r'4\s*hours?.{0,80}2\s*hours?', low)) and bool(re.search(r'synthetic|hypothetical', low))
        # No customer quote was supplied. Quote placeholders must be clearly marked.
        quotes = re.findall(r'["“]([^"”]+)["”]', s)
        ok = ok and all(re.search(r'placeholder|not supplied|to be collected', q, re.I) for q in quotes)
        ok = ok and not re.search(r'(?:customer|client) (?:said|says)|testimonial:', low)
    elif kind == 'repurpose':
        channels = re.split(r'(?im)^#{1,6}\s+(?:linkedin[^\n]*|email[^\n]*|blog[^\n]*)\n', s)
        bodies = [c.strip() for c in channels[1:] if c.strip()]
        ok = len(bodies) == 3
        for body in bodies:
            ok = ok and bool(re.search(r'demonstration|not verified|synthetic|hypothes', body, re.I))
            lines = [re.sub(r'\s+', ' ', x.strip().lower()) for x in body.splitlines() if len(x.strip()) > 35]
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
