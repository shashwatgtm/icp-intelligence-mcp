# C1 Markdown presentation correction

Artifact: ARTIFACT_PREPARED. Tests: local DOM/MCP/CSP and complete baseline compatibility PASS; intentional old-template regression FAIL proves detection. Host and browser: NOT_TESTED. Release: OWNER_GATE.

Headings, bold, emphasis, inline and fenced code, lists, quotes, rules and tables render as DOM elements. Tool text never enters an HTML injection sink. Link labels are shown without enabling untrusted navigation. Literal content inside code remains literal. The complete-text view is also formatted; structuredContent.plainText preserves the original bytes.

The test uses linkedom, a simulated DOM, not a browser or host. Every selected tool executes normal and weak fixtures through real in-memory MCP before its actual template script renders. Restoring tests/fixtures/widget-before-c1.html via WAVE_WIDGET_REVERT=1 makes all rendering cases fail. Raw receipts, including intentional failures, are in the hub checks/c1-* files. No old assertion was weakened.

All existing tool schemas, names, descriptions and text outputs compare equal with separately built default-branch bytes. Hosts without widgets still get unchanged content, with additive UI metadata and structuredContent. They also see the resources capability. Payload sizes are measured in the hub C1-COMPATIBILITY.json; resources are fetched only when a host reads them. No live host is tested. The prior Impact speed failure remains unresolved and was not rerun.
