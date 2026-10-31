# C2 focused market sizing widget

Artifact: ARTIFACT_PREPARED. Test: 37 local tests PASS on final bytes; first initialization-order test FAIL retained. Host and browser: NOT_TESTED. Release: OWNER_GATE.

The server supplies exact TAM, SAM, SOM, deals, monthly target, pipeline and display strings. The widget shows the three figures first, a static SVG stage diagram explicitly not to scale, inputs, deal targets and validation. Every preset-dependent figure has an adjacent Example figure label. Pipeline always carries that label because the original method assumes a 1 in 3 win rate. Explicit zero rates remain zero. Inputs that overflow the numeric range get no fabricated structured result.

The original source's arithmetic and currency rounding are ported into an additive server summary. Twelve input sets compare its figures and example labels with the unchanged tool text. The existing tool name, schema, description and text remain unchanged; all nine existing tools were compared with separately built default-branch bytes, normal and weak. C2-SOURCE.json pins the original source.

The official MCP Apps UI documentation shows `tools/call` for UI-initiated tool calls. The card allows ICP rate and Year 1 share edits after bridge initialization and calls the same server tool. The tool's additive UI visibility includes model and app. The card performs no market arithmetic. A simulated bridge test checks the actual server recalculation, invalid rates and message-source guard. This does not establish real-host support.

First test failure: a size notification was emitted before ui/initialize. The assertion required initialization first. Implementation now waits for bridge readiness before size notifications. No test assertion changed. The original FAIL and corrected 37-PASS run are both retained in hub checks/c2-*.

Official source: https://developers.openai.com/apps-sdk/build/chatgpt-ui/ . The fetched, hashed page is in hub dot-sources/apps-ui.html.gz; the table states Call a tool from the UI / tools/call, and its example calls request("tools/call", {name: "roll_dice", arguments: {sides}}). Source bytes and exact snippet are in C2-OFFICIAL-BRIDGE.json in the hub.

Hosts without widgets still receive the same text and error flags, plus structuredContent on selected successful tool calls, additive UI metadata and resource discovery. The widget resource loads only if requested. Exact UTF-8 JSON byte deltas are in hub checks/c2-final-compat-details.json. No host latency was measured.
