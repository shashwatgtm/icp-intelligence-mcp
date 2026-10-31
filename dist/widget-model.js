"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitRow = splitRow;
exports.parseSections = parseSections;
exports.widgetPayload = widgetPayload;
// Presentation parsing only. The original text is retained byte for byte as the fallback.
function splitRow(line) { const result = []; let value = '', escaped = false; for (const c of line.trim()) {
    if (escaped) {
        value += c;
        escaped = false;
    }
    else if (c === '\\') {
        escaped = true;
        value += c;
    }
    else if (c === '|') {
        result.push(value.trim());
        value = '';
    }
    else
        value += c;
} result.push(value.trim()); if (result[0] === '')
    result.shift(); if (result.at(-1) === '')
    result.pop(); return result; }
function parseSections(text) {
    const sections = [];
    let current = { heading: 'Tool result', body: '', tables: [] };
    const flush = () => { if (current.body.trim() || current.tables.length)
        sections.push(current); };
    const lines = text.split('\n');
    let fence = '';
    for (let i = 0; i < lines.length; i++) {
        const marker = /^\s*(`{3,}|~{3,})/.exec(lines[i]);
        if (marker) {
            if (!fence)
                fence = marker[1][0];
            else if (marker[1][0] === fence)
                fence = '';
            current.body += (current.body ? '\n' : '') + lines[i];
            continue;
        }
        if (fence) {
            current.body += (current.body ? '\n' : '') + lines[i];
            continue;
        }
        const heading = /^#{1,6}\s+(.+?)\s*$/.exec(lines[i]);
        if (heading) {
            flush();
            current = { heading: heading[1], body: '', tables: [] };
            continue;
        }
        if (lines[i].includes('|') && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[i + 1])) {
            const headers = splitRow(lines[i]), rows = [];
            i += 2;
            while (i < lines.length && lines[i].includes('|') && !/^\s*$/.test(lines[i])) {
                const row = splitRow(lines[i]);
                if (row.length !== headers.length)
                    break;
                rows.push(row);
                i++;
            }
            i--;
            current.tables.push({ headers, rows });
            continue;
        }
        current.body += (current.body ? '\n' : '') + lines[i];
    }
    flush();
    return sections;
}
function widgetPayload(tool, title, text) { return { tool, title, plainText: text, sections: parseSections(text), presentation: 'Source text retained. Tables are a presentation view, not recalculated results.' }; }
//# sourceMappingURL=widget-model.js.map