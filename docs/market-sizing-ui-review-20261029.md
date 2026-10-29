# W3 market sizing UI review

Date: 29 October 2026. Draft handoff only. No PR exists.

Base: 80296186cd67fa6fdc610151eedcdd43f8fc329f.
The coordinator verified this as main at about 09:48 IST.
Branch: codex/market-sizing-ui-20261029.
The final head and changed files are in head.txt and changed-files.txt in the evidence archive.
Origin: https://github.com/shashwatgtm/icp-intelligence-mcp.git.

## Design and documentation provenance

The cloud proxy refused connections. Direct documentation fetches failed.
The implementation uses the coordinator's verified findings from these exact URLs:

- https://developers.openai.com/plugins/build/chatgpt-ui
- https://developers.openai.com/plugins/deploy/app-review

This is coordinator supplied evidence, not a claim that this workstream read the pages.
The component initializes with ui/initialize and ui/notifications/initialized.
It receives tool-input and tool-result notifications. Recalculation uses tools/call.
Only tam_sam_som_calculator gains _meta.ui.resourceUri.
No render tool was added.
The resource is ui://helix/market-sizing/v1.html.
Its MIME is text/html;profile=mcp-app.
Resource CSP has empty connectDomains, resourceDomains and frameDomains.

The tool keeps its input schema and existing text output.
Structured output uses the existing sanitized inputs. Domain protection stays intact.
The same calculation function supplies tool arithmetic and the browser bundle.
The generator embeds that function and the existing Archivo font.
The UI uses the existing Helix h mark and brand colours from public/assets/helix.css.
The same generated component is served at public/lab/market-sizing/index.html.
Run node scripts/build-market-ui.mjs after editing the calculation or template.
Generated source and dist files are included for review.
A test checks that the bundle contains the current calculation function.

No example is prefilled. Omitted optional rates are labelled example assumptions.
Zero company counts and rates are valid. Zero ACV is refused.
Missing values, out of range values and numeric overflow are refused.
Scenarios show half, entered and one and a half times the entered share.
Shares are capped at 100% of SAM. The table labels them as assumptions.
The formula trace gives annual USD units and every arithmetic step.
Received values are untrusted. Rendering uses textContent and form values.
The message handler checks event.source against window.parent.

## Exact review fixture

The company name below is an explicitly labelled review fixture input only.
It is not a client, prospect or observed company finding.

```json
{"total_potential_companies":10000,"average_contract_value":5000,"icp_percentage":40,"year1_market_share_target":2,"data_sources":"Synthetic test inputs only, not company or market findings","segment_name":"B2B software test segment","product_category":"CRM software","company":"HubSpot"}
```

Observed in both browser modes: TAM USD 50,000,000. SAM USD 20,000,000.
SOM USD 400,000. Scenario SOM values were USD 200,000, 400,000 and 600,000.
Changing the count to 20,000 gave SOM USD 800,000.
The scenario table and trace both changed. The synthetic label stayed visible.
The fixture was supplied by the coordinator. It was not inferred from market data.

## Commands and final receipts

All execution was in the cloud at /workspace/icp-intelligence-mcp.
Existing dependencies were used. Nothing was installed.

```sh
git switch -c codex/market-sizing-ui-20261029
node work/market-sizing/baseline.mjs
node scripts/build-market-ui.mjs
npm run build
node tests/market-sizing-ui.test.mjs
npm test
node scripts/check-market-ui.mjs
git diff --check
git ls-remote origin refs/heads/main
curl -fLsS --max-time 20 https://developers.openai.com/plugins/build/chatgpt-ui -o work/market-sizing/official-ui.html
```

- Build: pass. TypeScript exited 0.
- Focused tests: 5 passed, 0 failed, 0 skipped.
- Regression: 38 test files passed, 0 failed, 0 skipped. This includes the focused file.
- Browser: 2 mode cases passed, 0 failed, 0 skipped.
- Diff whitespace check: pass.
- Remote read: failed, exit 128. Cloud proxy refused port 8080.
- Documentation retry: failed, exit 7. Same proxy failure.

The focused tests compare tools/list against a captured base snapshot.
Only the intended UI metadata differs. The exact text fixture stays identical.
They check resource MIME, URI, CSP, bundled HTML and numerical expectations.
They cover changed inputs, zero values, defaults, errors and overflow.
The existing escape regressions pass with the additive structured output.

The browser harness uses installed Playwright and /usr/bin/chromium.
Routes are fulfilled in memory. The MCP harness calls the real local handler.
No remote host is contacted. This is a synthetic MCP host, not a ChatGPT session.
Checks include the fixture, changed inputs, zero rates, defaults, validation,
inert hostile values, source checks, host errors, keyboard tab order and mobile width.
No page errors or external requests were observed. Browser storage and cookies stayed empty.
The sandbox initially blocked local sockets and Chromium startup.
The final browser run used the authorized cloud execution permission.
No proxy or network policy was changed.

The first escape regression failed because structured output used raw text.
It was fixed by using the existing sanitized arguments.
The first completed browser run found default labels lost after MCP recalculation.
It was fixed by retaining omitted inputs in structured output.
Both fixes passed the final checks above.
Initial browser setup also failed on ESM module resolution and socket permissions.
The harness now uses installed dependency resolution and in-memory routes.

Screenshots show a cream page, red Helix mark, oxblood heading and clay input panel.
Desktop has two input columns and three USD result cards.
Mobile has a single column and no horizontal page overflow at 390 pixels.
The evidence archive includes fixture, changed-input and mobile screenshots for both modes.

## Automation and boundary audit

No AGENTS.md was found at the workspace root or in tracked repository files.
No tracked GitHub workflows were found.
netlify.toml defines a build and public output. It was inspected, not changed.
Remote deployment integration settings could not be verified offline.
No branch push or PR creation was attempted. No deployment was triggered.
The coordinator can review the full binary patch before any remote action.
The prescribed output directory could not be created in this cloud runtime.
Both normal and elevated output writes were refused.
The patch and archive are retained under work/market-sizing/handoff for retrieval.
The patch includes every new file and generated artifact. Evidence is separate.

No deployment, Netlify command, DNS change, force push, merge or main write occurred.
No authentication, endpoint, existing tool name or package version changed.
No challenge file or its _headers block changed. The interview field fix is preserved.
No hosted video, legal declaration, directory submission or package upload changed.
No skills or shell MCP tools were added. No paid calls or API agents were used.
No secrets were read, printed or committed. Other repositories were not changed.
No new analytics, account system, checkout or durable user storage was added.
Existing host transport and usage-count behaviour were left unchanged.
No work was marked ready, deployed or published.
