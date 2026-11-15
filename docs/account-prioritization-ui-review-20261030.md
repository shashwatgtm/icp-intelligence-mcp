# Account prioritization UI review - 30 October 2026

Draft source candidate only. Not deployed, not tested inside ChatGPT, and not merge ready until the dependency-dependent checks below pass.

Base: `shashwatgtm/icp-intelligence-mcp` main `db0de05e754e45861fe59e63c153c824dddc4ddf`. Design: GTM PR #4, commit `66cb328b12c2a24060aa7a4dd9fca0638f3cd496`, `docs/interactive-tools-shortlist-20261029.md`. No GitHub workflows or AGENTS.md found in the base tree; existing coordinator evidence identifies manual CLI hosting. No hosting command was run.

The existing `account_prioritization` tool gains an inline MCP Apps resource and structured result. Its name, input schema, validation, annotations and text formatter stay unchanged. Other tools retain their metadata and behavior. A single extracted calculation supplies both the legacy formatter and structured factors; the browser does not parse Markdown or calculate competing scores. The widget starts empty and accepts the user's own inputs. It displays weights, default provenance, weighted contributions, stable ties, tier thresholds, first-five actions and rank movement. Blank inputs preserve server defaults and explicit zero remains zero. Negative/all-zero weights are refused in the editor without changing legacy server acceptance; nonfinite results cannot be presented as a valid ranking.

The resource uses `text/html;profile=mcp-app`, inline initialization, the parent host bridge, and empty connection/resource/frame domain allowlists. Existing font files are embedded. There are no component network fetches, credential fields or browser persistence. Recalculation calls only the existing tool. Caller strings use inert text nodes; a component-only allowlisted input snapshot preserves literal editing across escaped text responses. Request generation and edit revision checks protect edits and reset from delayed replies. Buttons work in an iframe without the sandbox `allow-forms` permission. The footer describes component editing and tool transport without making claims about ChatGPT or server retention.

Package and lockfile remain unchanged at version **1.2.26**. Runtime output and tool metadata change, so release/version and submission decisions remain a later gated task. No version change is made here. Existing ICP PR #3 remains untouched.

## Validation

| Check | Result | Scope and evidence |
|---|---|---|
| Pure model differential | PASS - 20 tests | Node 24.19.0; frozen original source Git blob `57bed3ac74874b7f0fc86b6073fca91f307a1681`; exact original formatter templates, 11 calculation/reason/first-five-action cases, neutral package arithmetic 71/B and 48/C, defaults, zero, negative and overflow behavior, literal input allowlist, exact U+00D7 punctuation |
| Browser | PASS - 18 checks | Windows Chrome through installed playwright-core 1.55.0; local parent-host simulation calls the shared calculation, not SDK transport or ChatGPT. Empty layouts at 320/768/1280, recalculation, factors, zero, three literal round trips, stale success/error, ignored unrelated notifications, reset, keyboard activation, resize, no external requests and no uncaught errors |
| Source syntax / generated HTML agreement | PASS | `node --check src/index.ts`, `node --check src/account-prioritization.ts`, `node scripts/build-account-prioritization-ui.mjs --check` |
| Full SDK content-array/metadata/resource differential | NOT_TESTED | The test file is written, but startup fails `ERR_MODULE_NOT_FOUND` for `@modelcontextprotocol/sdk` |
| TypeScript build and full existing suite | NOT_TESTED | No candidate dependencies; `node node_modules/typescript/bin/tsc` fails `MODULE_NOT_FOUND`. Required SDK is ^1.32.2; discovered caches contain 1.30.1/1.31.0, not the required version |
| Hosted endpoint, ChatGPT and deployment | NOT_TESTED | No endpoint, app registration, deployment, upload or submission performed |

Dependency setup attempted a Windows junction to an existing dependency directory and returned **Access is denied**. No copy, reinstall, relocation or alternate dependency setup was attempted after that block. Pure functions and standalone browser checks used already readable runtimes, independent of the denied dependency operation. The work ran locally on Windows, not a cloud executor.

An earlier browser run **FAILED** the first recalculation timeout: native form submission was blocked by the iframe sandbox. Recalculate now handles an explicit button event and the same restrictive harness passes. An earlier source-baseline check failed because snapshot materialization appended a newline; only a trailing byte proven against the Git blob was removed, and the committed fixture now matches the pin exactly. A console-rendered multiplication-sign concern was a display-encoding false positive: both raw sources already contained U+00D7 (UTF-8 C3 97); the explicit byte-sensitive test passes. These source/model checks do not establish full SDK content-array parity, which remains NOT_TESTED.

`tests/fixtures/account-prioritization-baseline.ts` is an exact frozen source baseline used only by differential tests. Production code never imports it. Its historical framework examples are preserved for compatibility evidence; the widget has no seeded accounts or company examples.

## Reproduction

With Node 24.19.0, the independent checks need no dependency installation:

```sh
node --test tests/account-prioritization-model.test.mjs
node scripts/build-account-prioritization-ui.mjs --check
```

For the standalone browser harness, set `HELIX_PLAYWRIGHT_MODULE` to an already installed playwright-core module URL and `HELIX_CHROME_EXECUTABLE` to an existing Chrome executable, then run `node scripts/check-account-prioritization-browser.mjs`. It writes a receipt and screenshots under `docs/review-assets/account-prioritization-20261030/`. No browser or dependency downloads are requested by the script.

In a separately authorized environment with the exact locked dependencies, run `npm run build`, `node --test tests/account-prioritization-ui.test.mjs`, and the repository's existing test suite. Then test the draft resource inside ChatGPT using a separately authorized test server/app. No such setup is performed by this draft.

No rebase, merge, main/master push, version change, deployment, Netlify command, paid API call, legal declaration, schedule change, or change to gtm-alpha-secure was performed.
