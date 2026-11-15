# W3 market sizing UI review

Date: 29 October 2026. PR [#3](https://github.com/shashwatgtm/icp-intelligence-mcp/pull/3) remains draft.
W3 is pending coordinator review. Nothing is deployed or marked ready.
Branch: codex/market-sizing-ui-20261029.
Base: 80296186cd67fa6fdc610151eedcdd43f8fc329f.
The final remote head and tree are recorded in the PR delivery receipt.

## Review changes

The legacy text executor keeps the original arithmetic, including overflow.
The additive structured result reports rangeSupported=false for unsupported amounts.
Nonfinite amounts become null, not zero. A separate rangeMessage explains the limit.
The UI keeps the inputs editable and hides unsupported numeric results.
It does not convert an accepted legacy call into an error.
The input schema and text template are unchanged.

Model-facing text and structured strings still use escapeDeep.
Literal edit values travel as numeric character arrays in component-only result _meta.
The UI decodes only allowlisted fields and renders them with textContent or form values.
It never puts escaped model-facing strings back into editable fields.
The existing escape-inputs.ts module and domain protection are unchanged.
This avoids repeated escaping without exposing raw dangerous strings to the model.

Local edits advance an edit revision. A delayed RPC result or error is ignored after another edit.
After local editing starts, uncorrelated tool-input and tool-result notifications are ignored.
The UI reports that it preserved the local draft. Only a matching current tools/call response updates results.
Notifications cannot silently overwrite newer fields or restore obsolete results.

The bridge sends debounced ui/notifications/size-changed messages after initialization.
A ResizeObserver watches intrinsic main content height. It does not use the iframe's current height as a minimum.
This lets a flexible host grow and shrink the frame without a resize loop.
The harness applies reported heights and checks growth, shrinking after edits and mobile width changes.
The component declares inline display support during initialization.

## Documentation read directly

These public pages were read through the web connector for this revision:

- https://developers.openai.com/plugins/build/chatgpt-ui
- https://developers.openai.com/plugins/deploy/app-review
- https://developers.openai.com/plugins/reference
- https://modelcontextprotocol.io/extensions/apps/overview
- https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx

The OpenAI UI page points to the MCP Apps specification for bridge behavior.
The specification recommends size notifications when rendered content size changes.
The OpenAI reference says result _meta is component-only, while content and structuredContent reach the model.
Resource URI, MIME and empty CSP allowlists remain unchanged.
The earlier implementation used coordinator supplied documentation findings. This revision uses direct readings.
No submission, publication or deployment action from those pages was performed.

## Compatibility evidence

scripts/capture-market-base.mjs captured the actual base executor from git show.
Only import paths were resolved to the original unchanged helpers.
Base source blob: c7b9ffdb0fc07cc3b769caac433786555e6d4636.
The captured text is in tests/fixtures/market-sizing-differential-base.json.
Each of 15 cases compares base text with both the core and hosted candidate text.
All content arrays are byte identical. All 15 base and candidate calls keep isError=false.
Per-case text SHA-256 receipts are in [differential.json](review-assets/market-sizing/differential.json).

Cases cover the exact review fixture, ordinary values, omitted rates, null rates,
zero counts and rates, accepted numeric strings, small values, large finite values,
and overflow with ordinary rates, zero ICP and zero share.
The overflow case includes total_potential_companies=1e308 and average_contract_value=5000.

The literal tests cover ampersands, entities, apostrophes, angle brackets, Markdown,
URLs, Unicode and literal backslashes. Seven samples each survive three hosted handler round trips.
The browser checks seven samples through three calls each. A fresh result-only hydration case
also populates literal fields and survives three calls without relying on prior tool-input data.
Stale browser checks cover delayed successful RPCs, delayed RPC errors and both notification types.
All existing inert-output regressions pass.

## Synthetic fixture and screenshots

The exact coordinator supplied fixture is used. Its company value is a review fixture input only.
It is not a client, prospect or observed company finding.

```json
{"total_potential_companies":10000,"average_contract_value":5000,"icp_percentage":40,"year1_market_share_target":2,"data_sources":"Synthetic test inputs only, not company or market findings","segment_name":"B2B software test segment","product_category":"CRM software","company":"HubSpot"}
```

Both modes show TAM USD 50,000,000, SAM USD 20,000,000 and SOM USD 400,000.
Changing the count to 20,000 changes SOM to USD 800,000, along with scenarios and trace.
The screenshots below are review evidence only. They are outside public/ and the package file list.

| Mode | Desktop fixture | Mobile fixture |
| --- | --- | --- |
| Synthetic MCP host | [Desktop](review-assets/market-sizing/mcp-fixture-desktop.png) | [390px mobile](review-assets/market-sizing/mcp-fixture-mobile.png) |
| Standalone | [Desktop](review-assets/market-sizing/standalone-fixture-desktop.png) | [390px mobile](review-assets/market-sizing/standalone-fixture-mobile.png) |

## Commands and receipts

All execution was in the cloud at /workspace/icp-intelligence-mcp. Installed dependencies were used.

```sh
git show 80296186cd67fa6fdc610151eedcdd43f8fc329f:src/index.ts > work/market-sizing/revision/base-source.ts
node scripts/capture-market-base.mjs
node scripts/build-market-ui.mjs
npm run build
node tests/market-sizing-ui.test.mjs
npm test
node scripts/check-market-ui.mjs
git diff --check
```

Final outcomes: build passed. Focused tests: 22 passed, 0 failed, 0 skipped.
Regression: 38 test files passed, 0 failed, 0 skipped. The focused file is included.
Browser: 7 cases passed, 0 failed, 0 skipped, spanning both modes and focused bridge cases.
The browser uses installed Playwright and /usr/bin/chromium with in-memory routes.
MCP calls reach the real local handler. No live ChatGPT session is claimed.
No external requests, page errors, cookies or user storage were observed.

Exact captured outputs are preserved as strings in [test-logs.json](review-assets/market-sizing/test-logs.json).
The browser summary is in [browser.json](review-assets/market-sizing/browser.json).

One draft test assertion incorrectly treated an escaped angle bracket as raw markup.
It was replaced by an exact comparison with escapeText. The production escaping stayed intact.
The base capture script initially hit a sandbox child-process restriction.
It now reads the source exported by the explicit git show command above.
Cloud Chromium used the same authorized execution permission as the prior checks.
No dependency or sandbox policy setting was changed.

## Boundaries

Only this draft branch is updated. The coordinator confirmed ICP deploys through manual CLI.
The repository has no tracked GitHub deployment workflows. Automation is rechecked before delivery.
No deploy, Netlify command, workflow dispatch, default branch write, force push or merge occurred.
No auth, endpoint, existing tool name, input schema, server version or package version changed.
No challenge file, _headers block, hosted video, deployment setting or unrelated work changed.
No secrets, paid calls, API agents, shell MCP tools or skills were introduced.
No analytics, accounts, checkout, storage, directory submission or package upload was added.
The existing interview field fix, transport and usage-count behavior are preserved.
