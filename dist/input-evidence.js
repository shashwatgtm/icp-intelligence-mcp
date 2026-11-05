"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPlaceholder = isPlaceholder;
exports.isDenial = isDenial;
exports.missingEvidence = missingEvidence;
exports.guardInputs = guardInputs;
exports.hasAbsoluteClaim = hasAbsoluteClaim;
exports.hasPublicationPermission = hasPublicationPermission;
exports.unapprovedCustomerNames = unapprovedCustomerNames;
exports.copyEvidenceReview = copyEvidenceReview;
exports.holdBuyerCopy = holdBuyerCopy;
// @ts-nocheck
// RTM39. Keep this dependency free source byte identical in all six repositories.
// Values are examined before escaping. Never put the supplied value in a refusal.
const EMPTY_WORDS = new Set(['', 'none', 'none yet', 'noneyet', 'n a', 'na', 'not applicable', 'notapplicable', 'tbd', 'unknown', 'not sure', 'notsure', 'no idea', 'noidea', 'empty']);
const normal = value => String(value).normalize('NFKC').replace(/[\u200B-\u200D\u2060\uFEFF]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
function isPlaceholder(value) {
    if (typeof value !== 'string')
        return false;
    const text = normal(value);
    return EMPTY_WORDS.has(text) || EMPTY_WORDS.has(text.replace(/\s/g, ''));
}
function isDenial(value) {
    if (typeof value !== 'string')
        return false;
    const text = normal(value.replace(/\bC[._\s]*F[._\s]*O\b/gi, 'CFO').replace(/\b(?:isn['’]?t|wasn['’]?t|aren['’]?t)\b/gi, ' is not ').replace(/\b(?:hasn['’]?t|haven['’]?t)\b/gi, ' has not '));
    if (['nochampion', 'budgetnotconfirmed', 'cfounknown'].includes(text.replace(/\s/g, '')))
        return true;
    const role = '(?:champion|budget(?: owner| authority)?|economic buyer|cfo|approv(?:al|er|al authority)|authority)';
    return new RegExp('^(?:no|without|not confirmed|unconfirmed|unknown) (?:a |an |the |named |confirmed )?' + role + '$').test(text)
        || new RegExp('^(?:the )?' + role + '(?: is| has| remains)? (?:not confirmed|not approved|unconfirmed|unknown|not known|not identified|not established|not supplied|not yet confirmed)$').test(text)
        || /^(?:cfo|champion|budget owner|economic buyer) authority (?:is )?(?:not confirmed|unconfirmed|unknown)$/.test(text)
        || new RegExp('\\b(?:no|without) (?:a |an |the |named |confirmed )?' + role + '\\b').test(text)
        || new RegExp('\\b' + role + '(?: is| was| remains| has)? (?:unknown|unconfirmed|pending|not (?:yet )?(?:confirmed|approved|known|identified|named|assigned|engaged|established|available))\\b').test(text);
}
const fieldDenial = (value, key) => isDenial(value) && (normal(value).split(' ').length <= 20 || /champion|budget_owner|economic_buyer|approval_authority|known_stakeholders/.test(key));
const fieldLabel = key => key.replace(/[^a-zA-Z0-9_ .[\]]/g, '').replace(/_/g, ' ').trim();
function missingEvidence(args, schema = {}) {
    const missing = [], denied = [];
    const visit = (value, spec, key) => {
        if (typeof value === 'string') {
            // Closed choices retain their documented semantics, including a valid "none" choice.
            if (spec?.enum)
                return;
            if (isPlaceholder(value))
                missing.push(fieldLabel(key));
            else if (fieldDenial(value, key))
                denied.push(fieldLabel(key));
        }
        else if (Array.isArray(value))
            value.forEach((item, i) => visit(item, spec?.items, key + '[' + i + ']'));
        else if (value && typeof value === 'object')
            for (const [name, item] of Object.entries(value))
                visit(item, spec?.properties?.[name], key ? key + '.' + name : name);
    };
    visit(args, schema, '');
    if (!missing.length && !denied.length)
        return null;
    return (missing.length ? 'Missing input: ' + [...new Set(missing)].join(', ') + '. These fields were not supplied. Provide the actual information before using the answer as fact.' : '')
        + (denied.length ? (missing.length ? '\n\n' : '') + 'Unconfirmed input: ' + [...new Set(denied)].join(', ') + '. The supplied answer denies confirmation. No budget authority or champion advocacy is confirmed. Provide the person, role and observed evidence, or state that it remains unconfirmed.' : '');
}
function guardInputs(args, schema = {}) {
    let stop = false;
    const walk = (value, spec, required, path = []) => {
        if (typeof value === 'string' && !spec?.enum && (isPlaceholder(value) || fieldDenial(value, path.join('.')))) {
            if (required)
                stop = true;
            return undefined;
        }
        if (Array.isArray(value))
            return value.map((item, index) => {
                // "None" as the last option in a scoring rule is an absence worth zero,
                // never an observed customer fact. Keep the existing zero point rule.
                if (path[0] === 'scoring_criteria' && path.at(-1) === 'values' && index === value.length - 1 && value.length > 1 && typeof item === 'string' && normal(item) === 'none' && value.some(v => typeof v === 'string' && !isPlaceholder(v)))
                    return item;
                return walk(item, spec?.items, false, [...path, index]);
            }).filter(item => item !== undefined);
        if (value && typeof value === 'object') {
            const clean = {};
            for (const [key, item] of Object.entries(value)) {
                const next = walk(item, spec?.properties?.[key], spec?.required?.includes(key), [...path, key]);
                if (next !== undefined)
                    Object.defineProperty(clean, key, { value: next, enumerable: true, configurable: true, writable: true });
            }
            return clean;
        }
        return value;
    };
    const notice = missingEvidence(args, schema);
    return { args: walk(args, schema, false), notice: notice || '', stop };
}
function hasAbsoluteClaim(value) {
    if (typeof value !== 'string')
        return false;
    const raw = value.normalize('NFKC').replace(/[\u200B-\u200D\u2060\uFEFF]/g, '');
    return /\b0*100(?:\.0+)?\s*(?:%|percent\b|per\s+cent\b)/i.test(raw)
        || /\b(?:guarantee(?:d|s)?|never fails?|only solution|zero risk|all attacks|100 (?:percent|per cent)|(?:replace|stop|prevent)s? all)\b/i.test(normal(raw));
}
function hasPublicationPermission(value) {
    if (typeof value !== 'string')
        return false;
    // Permission is affirmative, tied to publication and to this endorsement.
    // Negated, pending and hypothetical permissions cannot unlock customer names.
    if (/\b(?:not|no|without|pending|awaiting|unless|if|seek|request|need|unconfirmed|revoked|denied)\b/i.test(value))
        return false;
    if (/\b(?:website|web site|blog)\b[^.;\n]{0,35}\bonly\b|\bonly\b[^.;\n]{0,35}\b(?:website|web site|blog)\b/i.test(value))
        return false;
    if (/\bpermission (?:is |was |has been )?granted\b|\b(?:gave|granted|provided) (?:us )?(?:(?:written|explicit) )?permission\b/i.test(value))
        return true;
    return /\b(?:we (?:have|obtained)|customer (?:gave|granted)|permission (?:is )?granted|approved for)\b[^.\n;]{0,80}\b(?:permission|publish|publication|public use|email|endorsement|customer name)\b/i.test(value)
        || /\b(?:written|explicit) permission to (?:publish|use|name|cite)\b/i.test(value);
}
const COPY_TOOLS = new Set(['case_study_generator', 'newsletter_builder', 'webinar_script', 'content_repurposer', 'thought_leadership_series', 'testimonial_capture', 'sales_enablement_content', 'craft_content_improver', 'impact_pinpoint_value', 'impact_craft_message', 'impact_translate_execution', 'impact_full_audit', 'email_sequence_generator', 'proposal_section_writer', 'demo_script_builder', 'champion_enablement_kit', 'competitive_trap_setter', 'launch_commander']);
function unapprovedCustomerNames(args) {
    const names = new Set();
    const strings = Object.entries(args || {}).filter(([, v]) => typeof v === 'string');
    const add = (name, value, explicit = false) => {
        if (/^(?:i|you|we|they|he|she|it|this|that|these|those|the|our|their|customer|customers|teams|users|company|one|anonymous|unnamed)\b/i.test(name))
            return;
        if (!explicit && /^(?:AI|API|IT|CRM|ERP|HR|B2B|B2C)$/i.test(name))
            return;
        if (!explicit && strings.some(([field, v]) => /^(?:your_solution|your_product|product|product_name|company_name)$/.test(field) && v.toLowerCase().startsWith(name.toLowerCase())))
            return;
        if (hasPublicationPermission(value) || strings.some(([, v]) => v.includes(name) && hasPublicationPermission(v)))
            return;
        names.add(name);
    };
    const company = '([A-Z][A-Za-z0-9&.]*\\b(?: [A-Z][A-Za-z0-9&.]*\\b){0,3})';
    for (const [field, value] of strings) {
        if (/social_proof|testimonial|customer_quote|proof_points|customer_metrics/.test(field)) {
            for (const match of value.matchAll(new RegExp('\\b(?:[Uu]sed by|[Tt]rusted by|[Cc]ustomers? includes?|[Cc]lients? includes?)\\s+' + company, 'g')))
                add(match[1], value, true);
            for (const match of value.matchAll(/\b(?:used by|trusted by)\s+([a-z][a-z0-9&.]*)/gi))
                if (!/^(?:over|more|nearly|about|around|teams|users|customers|companies|banks|businesses|global|leading|many|some|hundreds|thousands|millions)$/i.test(match[1]))
                    add(match[1], value, true);
            for (const match of value.matchAll(new RegExp('\\b' + company + '\\s+(?:uses?|said|says|cut|reduced?|increased?|raised?|saved?|achieved?)\\b', 'g')))
                add(match[1], value);
            for (const match of value.matchAll(new RegExp('\\b(?:at|from)\\s+' + company + '(?=[:;]|\\s*\\(|\\s*["“])', 'g')))
                add(match[1], value, true);
        }
        if (/^customer_(?:name|company)$/.test(field) && value.trim())
            add(value.trim(), value, true);
    }
    return [...names];
}
function copyEvidenceReview(tool, args) {
    if (!COPY_TOOLS.has(tool))
        return null;
    const strings = [];
    const collect = (value, field) => {
        if (typeof value === 'string')
            strings.push({ value, field });
        else if (Array.isArray(value))
            value.forEach(v => collect(v, field));
        else if (value && typeof value === 'object')
            Object.entries(value).forEach(([k, v]) => collect(v, k));
    };
    collect(args, '');
    const absolute = strings.some(({ value }) => hasAbsoluteClaim(value));
    const unapproved = unapprovedCustomerNames(args).length > 0;
    if (!absolute && !unapproved)
        return null;
    return '# Copy review before drafting\n\n'
        + (absolute ? 'Absolute claim held out of buyer copy. Supply independently checkable results, the test scope, sample, period, limitations and the source. An unrestricted guarantee needs evidence and approved terms covering every promised case. Use a narrower evidenced claim before drafting.\n\n' : '')
        + (unapproved ? 'Named customer social proof held out of the email body and other buyer copy. Confirm that the customer gave permission to publish this specific endorsement and name in this channel. A customer relationship alone does not give publication permission.\n\n' : '')
        + 'Provide the missing proof and permissions, then generate the copy.';
}
function holdBuyerCopy(tool, args, text) {
    const review = copyEvidenceReview(tool, args);
    if (!review)
        return text;
    const names = unapprovedCustomerNames(args);
    const namePatterns = names.map(name => new RegExp('(?:^|[^\\p{L}\\p{N}])' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?=$|[^\\p{L}\\p{N}])', 'iu'));
    const held = [];
    const kept = [];
    let internalEvidence = false;
    for (const line of text.split('\n')) {
        if (tool === 'impact_pinpoint_value' && /^## [^#]/.test(line))
            internalEvidence = /^## (?:Value Quantification Matrix|Proof Point Framework)\b/.test(line);
        if (tool === 'email_sequence_generator' && /^## Before you send\b/.test(line))
            internalEvidence = true;
        if (internalEvidence) {
            kept.push(line);
            continue;
        }
        if (hasAbsoluteClaim(line) || namePatterns.some(pattern => pattern.test(line))) {
            const statement = line.trim();
            if (statement && !held.includes(statement))
                held.push(statement);
        }
        else
            kept.push(line);
    }
    // The review precedes the actual draft. None of these source lines belong
    // in a subject, email body, script, message or other sendable copy.
    const source = held.length ? '\n\n## Supplied text for review\n\nUnverified source statements held out of buyer copy:\n\n' + held.map(line => '> ' + line).join('\n\n') : '';
    return review + source + '\n\n## Draft with held statements omitted\n\n' + kept.join('\n').replace(/\n{3,}/g, '\n\n');
}
//# sourceMappingURL=input-evidence.js.map