# Discovery report: icp-intelligence-mcp

Source work is closed on codex/discovery-20261111. Nothing was deployed or published.

Before: Generic ICP scoring title and a workshop route mainly buried on home.

Why it matters: Buyers confuse account fit scoring with market size.

Now in the draft: A B2B ICP scoring title and answer, TAM SAM SOM answer, matching guide and current Market Sizing Lab links, current setup and count copy.

Checks: build passed; changed HTML has one h1, valid JSON-LD, titles at most 65 characters, extensionless canonicals, full raw text and resolving local targets. Browser source review passed at 375 and 1280 px with JavaScript disabled. Exact, same meaning and opposite buyer questions are retained in the hub acceptance cases. Runtime tool code, descriptions, schemas, tests and assistant JSON were left untouched.

Full suite: 6867 tests, 6846 passed, 15 failed, 6 skipped. The suite is not clean.

Already failing on main:

- `All tool names descriptions schemas annotations and lists stay unchanged`
- `C12 Logistics tech timing points follow the stated horizon`
- `No region byte parity and three runs: tam_sam_som_calculator ai-native`
- `No region byte parity and three runs: tam_sam_som_calculator cybersecurity`
- `No region byte parity and three runs: tam_sam_som_calculator fintech`
- `No region byte parity and three runs: tam_sam_som_calculator ites`
- `No region byte parity and three runs: tam_sam_som_calculator logistics-tech`
- `No region byte parity and three runs: tam_sam_som_calculator saas`
- `No region byte parity and three runs: tam_sam_som_calculator software`
- `No region byte parity and three runs: tam_sam_som_calculator telecom`
- `No region byte parity and three runs: tam_sam_som_calculator vertical-saas`
- `complete tools/list bytes equal the pinned reviewed production contract over HTTP`
- `complete tools/list bytes equal the pinned reviewed production contract over compiled stdio`
- `scripts/test-in-field.mjs`
- `the escape pass: every escaped value is inert by itself (unit)`
- `tool names, descriptions and input schemas equal the pinned production contract; only the widget tool gains _meta`

Files changed:

- `discovery-20261111/REPORT.md`
- `discovery-20261111/state.json`
- `public/connect/index.html`
- `public/index.html`
- `public/llms.txt`
- `public/tools/account-prioritization/index.html`
- `public/tools/buyer-group-analyzer/index.html`
- `public/tools/icp-deep-dive/index.html`
- `public/tools/icp-evolution-tracker/index.html`
- `public/tools/icp-gap-analysis/index.html`
- `public/tools/icp-interview-synthesizer/index.html`
- `public/tools/icp-scoring-model/index.html`
- `public/tools/lookalike-signal-generator/index.html`
- `public/tools/tam-sam-som-calculator/index.html`

Owner questions: no additional question for this source branch. Cross-site blockers and the release sequence are in the hub discovery-20261111/OWNER-QUESTIONS.md and REPORT.md. Claude reviews the assembled draft, the owner approves release, then Fable checks the live result.
