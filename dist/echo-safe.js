"use strict";
// Run 20 echo safeguard (D86, round 1d). One module, the same in every repo (a JavaScript copy lives in gtm-alpha-secure).
// Wherever a tool repeats text the user typed, markup in that text must not stay live. The tool keeps the user's words;
// it only makes these inert: markdown images (the address is dropped, the alt text stays), HTML tags and fake chat markers
// (shown with angle quotes), javascript:, data: and vbscript: links, and hidden or right-to-left control characters.
// A string that tried to give the assistant an instruction is quoted as the user's own text.
// Applied once, to every string argument of a tool call, before the tool builds its answer (the choke point).
// No figures, no sector knowledge (B82).
Object.defineProperty(exports, "__esModule", { value: true });
exports.neutraliseText = neutraliseText;
exports.neutraliseDeep = neutraliseDeep;
const HIDDEN = /[​-‏‪-‮⁠-⁤⁦-⁩﻿\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const MD_IMAGE = /!\[([^\]]*)\]\(([^)]*)\)/g;
const MD_LINK_BAD = /\[([^\]]*)\]\(\s*(?:javascript|data|vbscript):[^)]*\)/gi;
const BARE_BAD = /\b(?:javascript|vbscript)\s*:|\bdata\s*:\s*(?:text|image|application)\/[a-z0-9.+-]*/gi;
const TAG = /<\/?[a-zA-Z!][^>]*>|<\|[^|>]*\|>/g;
const INSTRUCTION = /\b(?:ignore|disregard|forget)\b[^.\n]{0,40}\b(?:previous|prior|above|earlier|all)\b[^.\n]{0,30}\binstructions?\b|\b(?:reveal|print|show|leak)\b[^.\n]{0,40}\b(?:system prompt|api keys?|secrets?|passwords?)\b|<\|im_(?:start|end)\|>|\bSYSTEM\s*:/i;
function neutraliseText(input) {
    let s = input.replace(HIDDEN, "");
    const before = s;
    s = s.replace(MD_IMAGE, (_m, alt) => (alt.trim() ? `[image removed: ${alt.trim()}]` : "[image removed]"));
    s = s.replace(MD_LINK_BAD, (_m, text) => `${text} (link removed)`);
    s = s.replace(BARE_BAD, "[link removed]");
    s = s.replace(TAG, (t) => t.replace(/</g, "‹").replace(/>/g, "›"));
    if (INSTRUCTION.test(before) && !/^“[\s\S]*”$/.test(s))
        s = `“${s}”`;
    return s;
}
function neutraliseDeep(value) {
    if (typeof value === "string")
        return neutraliseText(value);
    if (Array.isArray(value))
        return value.map((v) => neutraliseDeep(v));
    if (value && typeof value === "object") {
        const out = {};
        for (const [k, v] of Object.entries(value))
            out[k] = neutraliseDeep(v);
        return out;
    }
    return value;
}
//# sourceMappingURL=echo-safe.js.map