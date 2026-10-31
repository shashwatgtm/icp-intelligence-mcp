"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isReserveTool = exports.reserveTools = exports.esc = exports.sum = exports.round = exports.plusDays = exports.days = exports.iso = exports.array = exports.object = exports.choice = exports.bool = exports.num = exports.text = void 0;
exports.requireDate = requireDate;
exports.requireUnique = requireUnique;
exports.reportText = reportText;
exports.define = define;
exports.callReserveTool = callReserveTool;
exports.text = { type: 'string', maxLength: 8000 };
const num = (minimum = 0, maximum = Number.MAX_VALUE) => ({ type: 'number', minimum, maximum });
exports.num = num;
exports.bool = { type: 'boolean' };
const choice = (...values) => ({ ...exports.text, enum: values });
exports.choice = choice;
const object = (properties, required = Object.keys(properties)) => ({ type: 'object', properties, required, additionalProperties: false });
exports.object = object;
const array = (items, maxItems = 100, minItems = 0) => ({ type: 'array', items, minItems, maxItems });
exports.array = array;
const iso = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(+new Date(s + 'T00:00:00Z')) && new Date(s + 'T00:00:00Z').toISOString().slice(0, 10) === s;
exports.iso = iso;
const days = (from, to) => Math.round((+new Date(to + 'T00:00:00Z') - +new Date(from + 'T00:00:00Z')) / 86400000);
exports.days = days;
const plusDays = (date, n) => new Date(+new Date(date + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);
exports.plusDays = plusDays;
const round = (n) => Math.round(n * 10) / 10;
exports.round = round;
const sum = (values) => { const n = values.reduce((a, b) => a + b, 0); if (!Number.isFinite(n))
    throw new Error('Calculated total exceeds the finite numeric range.'); return n; };
exports.sum = sum;
function requireDate(date, label, asOf) { if (!(0, exports.iso)(date))
    throw new Error(label + ' must be a real YYYY-MM-DD date.'); if (asOf && (0, exports.days)(date, asOf) < 0)
    throw new Error(label + ' cannot be after the assessment date.'); }
function requireUnique(rows, key) { const ids = rows.map(r => String(r[key]).trim().toLowerCase()); if (new Set(ids).size !== ids.length)
    throw new Error('Duplicate ' + key + ' values are not allowed.'); }
const esc = (value) => String(value ?? 'Not supplied').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, '').replace(/[\u2013\u2014]/g, ' - ').replace(/\r?\n/g, ' ').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\\`*_{}\[\]()#+.!|>~\-]/g, c => '\\' + c);
exports.esc = esc;
const safeData = (v) => typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, '').replace(/[\u2013\u2014]/g, ' - ') : Array.isArray(v) ? v.map(safeData) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, safeData(x)])) : v;
function reportText(report) { let s = report.summary.map(exports.esc).join('\n') + '\n\n# ' + (0, exports.esc)(report.title) + '\n'; if (report.metrics?.length) {
    s += '\n| Measure | Result |\n| --- | --- |\n';
    for (const m of report.metrics)
        s += '| ' + (0, exports.esc)(m.label) + ' | ' + (0, exports.esc)(m.value) + (m.example ? ' (Example figure)' : '') + ' |\n';
} for (const section of report.sections ?? []) {
    s += '\n## ' + (0, exports.esc)(section.heading) + '\n\n';
    if (section.body)
        s += (0, exports.esc)(section.body) + '\n';
    if (section.table) {
        s += '\n| ' + section.table.headers.map(exports.esc).join(' | ') + ' |\n| ' + section.table.headers.map(() => '---').join(' | ') + ' |\n';
        for (const row of section.table.rows)
            s += '| ' + row.map(exports.esc).join(' | ') + ' |\n';
    }
} s += '\n## Limits\n\n' + ['Only supplied data was assessed. No page was fetched, model called, message sent or fact independently verified.', ...(report.limitations ?? [])].map(x => '- ' + (0, exports.esc)(x)).join('\n') + '\n'; return s; }
function validate(s, v, path = '$') { const issues = []; if (s.type === 'object') {
    if (!v || typeof v !== 'object' || Array.isArray(v))
        return [path + ': object required'];
    for (const k of s.required ?? [])
        if (!Object.prototype.hasOwnProperty.call(v, k) || (typeof v[k] === 'string' && !v[k].trim()))
            issues.push(path + '.' + k + ': required');
    for (const [k, x] of Object.entries(v)) {
        if (!Object.prototype.hasOwnProperty.call(s.properties ?? {}, k))
            issues.push(path + ': unknown property');
        else
            issues.push(...validate(s.properties[k], x, path + '.' + k));
    }
}
else if (s.type === 'array') {
    if (!Array.isArray(v))
        return [path + ': array required'];
    if (v.length < (s.minItems ?? 0) || v.length > (s.maxItems ?? 100))
        return [path + ': row count outside bounds'];
    v.forEach((x, i) => issues.push(...validate(s.items, x, path + '[' + i + ']')));
}
else if (s.type === 'string') {
    if (typeof v !== 'string')
        return [path + ': text required'];
    if (v.length > (s.maxLength ?? 8000))
        issues.push(path + ': text too long');
    if (s.enum && !s.enum.includes(v))
        issues.push(path + ': unsupported choice');
}
else if (s.type === 'number') {
    if (typeof v !== 'number' || !Number.isFinite(v) || v < (s.minimum ?? -Infinity) || v > (s.maximum ?? Infinity))
        issues.push(path + ': finite number in range required');
}
else if (s.type === 'boolean' && typeof v !== 'boolean')
    issues.push(path + ': boolean required'); return issues; }
const registry = {};
function define(name, description, schema, run) { registry[name] = { tool: { name, description, inputSchema: schema, annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } }, run }; }
const reserveTools = () => Object.values(registry).map(x => x.tool);
exports.reserveTools = reserveTools;
const isReserveTool = (name) => Object.prototype.hasOwnProperty.call(registry, name);
exports.isReserveTool = isReserveTool;
function callReserveTool(name, args) { if (!(0, exports.isReserveTool)(name))
    return { isError: true, content: [{ type: 'text', text: 'Unknown reserve tool.' }] }; const entry = registry[name], issues = validate(entry.tool.inputSchema, args); if (issues.length)
    return { isError: true, content: [{ type: 'text', text: 'Invalid input: ' + issues.join('; ') }] }; try {
    const report = entry.run(args);
    return { content: [{ type: 'text', text: reportText(report) }], structuredContent: { report: safeData(report) } };
}
catch (error) {
    return { isError: true, content: [{ type: 'text', text: 'Invalid input: ' + (0, exports.esc)(error instanceof Error ? error.message : 'could not be assessed') }] };
} }
//# sourceMappingURL=reserve-common.js.map