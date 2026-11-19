# W5c timing test review, 29 October 2026

Base: `80296186cd67fa6fdc610151eedcdd43f8fc329f` on `main`. The coordinator verified this SHA through GitHub at about 09:48 IST on 29 October 2026. Branch: `codex/timing-tests-20261029`. Runtime: Node 24.19.0. No runtime version was changed.

## Measurement design

Correctness stays independent of timing. Keep every hostile value, legacy fixture, inertness assertion, ordinary-text assertion and long input. The four escape test files split the original combined test into a correctness test and a timing test. Content already has separate correctness tests.

The timing helper runs synchronous work in a worker thread. It warms every quarter-size and full-size input once. It then measures each size exactly once. It measures user plus system CPU time while the parent waits. This removes scheduling delay from the performance budget. GC and worker CPU still count. No result is selected from retries.

Keep the original numeric CPU ceilings: 250 ms for each full escape input, or 4000 ms for Content's full input set. Add a growth check: four times the input may use less than eight times the CPU. The small sample has a 5 ms floor to avoid timer noise. Linear work should approach four times. Quadratic work approaches sixteen times. The fixed ceiling still catches slower work below the growth floor.

The responsive parent terminates the worker after 15000 ms, including imports, warmup and measurement. This is a completion bound, not the CPU pass budget. The original escape budgets sum to 3500 ms for one full pass. Warmup and quarter-size work need additional time. Healthy busy runs remain well below the wall bound. A nonreturning mutant proves termination. This worker approach avoids this cloud's Node child-process restriction. It provides the same independent timeout property without a shell or child-process launch.

A process CPU clock also counts Node background threads. The helper assumes the calling test does not run other work concurrently in the same process. These top-level tests use Node's default sequential scheduling. Parallel test files normally have separate processes. Cloud receipts use in-process isolation with sequential tests because nested Node child execution is restricted.

## Test receipts

Counts are individual Node tests, not file-only runner summaries. Existing suite skips are preserved. No skip was added. Preliminary default-runner logs are not accepted as receipts. Default isolation could report a file without reporting individual tests. The accepted runs use `--test-isolation=none`.

| Run | Exit | Pass | Fail | Skip |
| --- | --- | --- | --- | --- |
| base-isolated-actual | 0 | 1 | 0 | 0 |
| changed-isolated-actual | 0 | 12 | 0 | 0 |
| base-busy-actual | 0 | 1 | 0 | 0 |
| changed-busy-actual | 0 | 2 | 0 | 0 |
| suite | 0 | 833 | 0 | 6 |

| Mutant | Exit | Pass | Fail | Skip |
| --- | --- | --- | --- | --- |
| slow | 1 | 0 | 1 | 0 |
| unsafe | 1 | 0 | 1 | 0 |
| slow-busy | 1 | 0 | 1 | 0 |
| unsafe-busy | 1 | 0 | 1 | 0 |

Busy checks used `taskset -c 0` for the tests and two bounded Python CPU workers on CPU 0. The normal busy phase was capped at 240 seconds. The mutant phase was capped at 120 seconds. Both workers were stopped in a finally block after each phase. No live load testing occurred. The unchanged bases also passed in these conditions, so the intermittent failure was not reproduced in this run.

Slow mutants add 300 ms CPU to escape input 0, or 4500 ms CPU to Content input 0. Original output is retained. Isolated runs fail the CPU ceiling. Busy runs also fail; Content reaches the wall bound. Unsafe mutants return input unchanged and fail existing inertness assertions. A shared nonreturning mutant fails at the wall bound. An 80 ms quadratic mutant stays below 250 ms but fails the growth assertion. Mutants live only in the scratch evidence tree, never in production.

Build command: `npm run build` (exit 0).

Accepted test commands, working directories, exit codes and complete TAP logs are in the [cloud evidence archive](https://github.com/shashwatgtm/icp-intelligence-mcp/raw/refs/heads/codex/timing-tests-20261029/docs/w5c-evidence-20261029.tar.gz). The archive also includes the base scaffolds specification, mutation wrappers, harnesses, timing logs and Alpha patch. The JSON manifests retain exact argv, not reconstructed commands.

Main test commands in this repository:

```sh
node --test --test-isolation=none --test-reporter=tap tests/run40s-escape.test.mjs
node --test --test-isolation=none --test-reporter=tap tests/*.test.mjs
```

## Automation and delivery

Inspected tracked instructions, package scripts, netlify.toml and the complete GitHub tree at the verified base. No applicable AGENTS.md or workflow files were found. The GitHub workflow-list URL was rejected by the connector, so the complete nontruncated Git tree was used. Builds are TypeScript only, except Alpha's static-site script. No automation settings were changed.

The coordinator confirms this site uses manual CLI deployment. A codex branch and draft PR are authorized. The connector will deliver the tested bytes because shell Git cannot connect to the cloud proxy. No deployment command is part of delivery.

## Documentation and UI scope

Read directly through the connected web tool on 29 October 2026:

- https://developers.openai.com/plugins/build/chatgpt-ui
- https://developers.openai.com/plugins/deploy/app-review

The coordinator independently read these pages and supplied the same findings. Direct cloud curl failed because the configured proxy refused connections. The connected web reader succeeded.

The UI guide favors MCP Apps fields and bridge messages. It uses `_meta.ui.resourceUri`, tool notifications, `tools/call` and `structuredContent`. The review page requires exact CSP domains. The coordinator also verified `ui/initialize`, `ui/notifications/initialized`, MIME `text/html;profile=mcp-app`, and resource `_meta.ui.csp` keys `connectDomains`, `resourceDomains` and `frameDomains`. Any later UI must check `event.source === parent`, treat received data as untrusted, and keep text-only hosts useful. Bundle assets and use empty domain lists when no network access is needed. Keep attachment on the existing named tool. Do not add a render tool. No checkout flow or durable user storage.

This patch changes tests and review evidence only. No browser check or screenshot was taken. There is no new UI to inspect. The existing text responses are exercised by direct local handler tests. No live endpoint was contacted.

## Boundary audit

Only the new `codex/timing-tests-20261029` branch is used. No main or master write, force push, merge, ready-for-review transition, workflow dispatch, deployment, Netlify command or DNS change. No challenge file or its headers changed. No production algorithm, schema, output, endpoint, authentication, tool name, package version, dependency or hosted video changed. No submission, publication, package upload, legal declaration, OpenAI package skill, shell MCP tool, paid API call or delegated agent was used. No credentials were read or printed. All checks ran in this cloud. Inputs are synthetic. Any company names already present in suite fixtures are review fixture inputs, not clients or prospects. No unrelated branch or user work was changed.
