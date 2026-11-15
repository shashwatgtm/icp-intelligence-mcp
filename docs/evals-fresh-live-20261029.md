# Fresh GTM Planning and Content Studio checks, 29 October 2026

Draft PR: https://github.com/shashwatgtm/icp-intelligence-mcp/pull/4.
Branch: `codex/mcp-evals-20261029`.
Revision parent: `e6819fc689e1d96348e3d595be1d2e7abab2a02a`.
The delivered head is in the PR metadata. Keep this PR draft.

All ten exact review fixtures pass. The four-outcome probe passes. One derived
activation input remains a parsing failure. No check was weakened to hide it.

## Capture and provenance

Thirteen fresh LIVE calls used the connected Helix GTM Planning Test and Helix
Content Studio Test tools. All requested tools were available. Ten calls used
the exact five source inputs for each server. Three calls were derived probes:
the existing four-outcome case study and two activation input formats.

`evals/fixtures/fresh-live-20261029.json` holds every complete synthetic input,
returned result, connector tool name, start time and end time. Timestamps are UTC.
The first ten calls ran from 18:54:02 to 18:54:36 IST. The later probes have their
own timestamps. These are connector calls, not `evals/run.py` HTTP calls. Offline
replay sends no requests. No blocked direct networking was retried or bypassed.

GitHub main refs were read through the connector and match the owner's values:

| Repository | Verified main SHA | Owner-reported live deploy |
| --- | --- | --- |
| GTM Planning | `8dfee13d07bcf0deb336e5517e5b0189b21e294a` | `6ae34147` |
| Content Studio | `34384340f3a8dfe218b31b9a9d8a3aaa78b4b9f1` | `6ae30601` |

The tool responses do not attest their deployed commit. The deploy identifiers
remain owner-reported provenance, not independently verified build identities.
Real company names occur only in the authorized synthetic review fixture inputs.

## Every current GTM and Content grader

Case IDs below refer to the fresh capture. The replay receipt records the grader,
case ID, timestamps, provenance and exact failed assertions when present.

| Tool | Grader | Fresh fixture ID | Result | What is checked |
| --- | --- | --- | --- | --- |
| `pmf_scorecard` | `pmf` | `pmf_scorecard-review` | Pass | Rule score is not proof; activation is missing and not scored; measure it before scaling; 4 of 5 dimensions and 8.5/10 |
| `launch_commander` | `launch` | `launch_commander-review` | Pass | Supplied launch date, valid dated phases, audience and both numeric goals |
| `customer_interview_kit` | `interview` | `customer_interview_kit-review` | Pass | Neutral opening, rejection allowed, confirmation before severity or incident questions, counter-evidence |
| `retention_playbook` | `churn` | `retention_playbook-review` | Pass | About 21.5 percent compounded annual loss and the 24 percent simple comparator |
| `craft_gtm_analyzer` | `plan-review` | `craft_gtm_analyzer-review` | Pass | One-paragraph labelled plan; owner, 20 meetings, 200 to 1000 employees, USD 15000, correct dates and 39/50 |
| `case_study_generator` | `case-study` | `case_study_generator-review` | Pass | Supplied 4 to 2 hours result, synthetic qualification, no invented customer testimony |
| `newsletter_builder` | `newsletter` | `newsletter_builder-review` | Pass | No repeated opening in the body; supplied points, topic and CTA retained |
| `webinar_script` | `webinar` | `webinar_script-review` | Pass | Continuous 30-minute schedule, supplied takeaways, speaker, audience, polls and no added product pitch |
| `content_repurposer` | `repurpose` | `content_repurposer-review` | Pass | No title/body/bullet duplication; source qualification remains in each requested format |
| `craft_content_improver` | `content-review` | `craft_content_improver-review` | Pass | Exact original copy retained; no fabricated automatic edit or repeated empty opening |
| `case_study_generator` | `case-study-four` | `case-study-four-outcomes` | Pass | All four supplied outcomes appear in both narrative and detailed results |
| `pmf_scorecard` | `pmf` | `pmf-activation-labelled` | Pass | `Activation: 70%` is read; all 5 dimensions score, with overall 8.6/10 |
| `pmf_scorecard` | `pmf` | `pmf-activation-supplied` | Fail | `activation rate 70%` is reported as missing; output still scores only 4 of 5 dimensions |

The last row is a real current observation. The input text explicitly supplies
activation at 70 percent. The tool description says activation figures can be
included in current_metrics. The output does not read this unlabelled form. The
labelled control succeeds. Both records are preserved. This workstream does not
change production parsing. The replay exits 1 to retain this finding.

## Changed graders and reasons

Seven former smoke assertions now use deterministic checks. No GTM or Content
review case is left as a nonempty-text-only pass.

| Grader | Change | Reason |
| --- | --- | --- |
| `pmf` | New assertion set for rule limits, activation evidence, scale caution and scored dimensions | A strong example score is not proof or permission to scale with missing activation |
| `launch` | New checks for supplied date, phase dates, goals, audience and no executed-action claim | Nonempty text did not verify the dated review fixture |
| `interview` | New checks for neutral discovery and conditional follow-up | The old "Is this true for you" prompt assumed the hypothesis; it is obsolete |
| `plan-review` | New section checks for the exact labelled paragraph and 39/50 | The earlier analyzer missed labelled clauses, numbers, audience, budget and dates |
| `newsletter` | New body uniqueness, point and CTA checks | Smoke checks could miss repeated openings or lost input points |
| `webinar` | New schedule arithmetic and input fidelity checks | Smoke checks did not verify duration, takeaways or the no-pitch request |
| `content-review` | New original-copy, no-edit and opening checks | Nonempty text could hide invented edits or a repeated empty hook |
| `churn` | Retained annual compounding check; added validation of any simple comparator and rejection of "not compounded" | Correct 21.5 percent prose must pass; wrong 24 percent compounding or a wrong comparator must fail |

The existing `case-study`, `case-study-four` and `repurpose` assertions did not
need relaxation. They pass fresh correct outputs and still reject the old bad
outputs. The registry now maps all ten review tools to explicit graders. Two
activation probes were added to generated cases. No server tool names changed.

Tests mutate correct fresh outputs to restore old defects. They change numeric
goals, scores, audience range, budget and dates. They remove confirmation gates,
counter-evidence, qualifications and individual outcomes. They add repeated
openings, fabricated testimony, product pitches and inconsistent schedules.
The previous 150 tests and negative inventory/protocol checks remain in place.

## Commands and results

All computation ran in cloud. No production build was needed.

```sh
python tests/evals-20261029.test.py
python tests/evals-observed-20261029.test.py
python tests/evals-fresh-live-20261029.test.py
python evals/replay.py --current --output evals/receipts/current-connector-replay.json
python evals/run.py --dry-run --output evals/receipts/dry-run.json
git diff --cached --check
```

| Check | Pass | Fail | Skip | Exit |
| --- | ---: | ---: | ---: | ---: |
| Original offline tests | 51 | 0 | 0 | 0 |
| Prior observed-format tests | 99 | 0 | 0 | 0 |
| Fresh capture and mutation tests | 74 | 0 | 0 | 0 |
| Total offline tests | 224 | 0 | 0 | 0 |
| Current connector capture replay | 12 | 1 | 0 | 1 |
| Dry-run | 0 | 0 | 73 | 0 |
| Whitespace check | 1 | 0 | 0 | 0 |

Replay failures are output findings, not failing harness tests. The test suite
expects the activation parsing failure and checks that replay keeps it. Dry-run
constructs no network client and makes zero network calls. Fresh captures were
made once through the connected tools before offline replay and testing.

The three text test receipts, current replay JSON and dry-run JSON are committed
under `evals/receipts/`. The complete fresh response snapshot is committed under
`evals/fixtures/`. A cloud path alone is not the delivery.

## Historical evidence and limits

Earlier source fixtures, negative checks, readiness outputs and receipts remain
unchanged as historical evidence. Old repurposer duplication and four-outcome
truncation failures are superseded by the fresh passing observations. The old
PMF, discovery and paragraph-analyzer defects remain negative regression inputs.
They must not be described as current failures. The historical replay mode is
labelled historical. Use `--current` for this GTM/Content capture.

Positioning was not called or regraded in this task. Its old records are not
current observations. The owner says Positioning is In review with no new version
and W5b is stopped because live is fixed. This work does not reopen W5b or draft
another privacy disclosure. No host negative chats ran.

The assertions cover these review inputs and stated properties. They do not
certify all strategy advice, all tool modes or every possible text format. For
example, the launch grader checks valid dated phases but does not certify a
holiday calendar. The Content tests allow quoted interview guidance and repeated
facts in distinct distribution formats. They do not require global text uniqueness.

## Documentation and boundaries

Read the official HTML pages directly on 29 October 2026:

- https://developers.openai.com/plugins/build/chatgpt-ui
- https://developers.openai.com/plugins/deploy/app-review

The Markdown fetch was unsupported by the web tool, so HTML was used. The UI guide
keeps MCP tools useful without optional UI and describes the MCP Apps bridge. The
review page distinguishes public review endpoints and exact-domain UI CSP. These
reads authorize no submission or publication. No UI or server metadata changed.

Delivery uses the existing draft branch and the GitHub connector. Repository
automation is inspected before the branch update. The owner register says ICP
deploys manually. No deployment command or settings change is used.

Changes are confined to eval, test and docs paths. No main/master write, merge,
force push, deployment, Netlify command, workflow dispatch, DNS or challenge/header
edit, server tool name, endpoint, authentication or version change, hosted video
edit, submission, package upload, publication, declaration, secrets, client or
prospect data, paid API call, OpenAI skill or shell MCP tool is part of this work.
