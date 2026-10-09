// Run 22 echo safeguard (risk R2 of the run 20 register closed in run 22 job 2c; first written in run 20, D86, round 1d).
// One module, the same in every repo (a JavaScript copy of this file lives in gtm-alpha-secure, made with tsc from this text).
// Wherever a tool repeats text the user typed, markup in that text must not stay live. The tool keeps the user's words;
// it only makes these inert: markdown images (inline, reference-style and shortcut: the address is dropped, the alt text stays),
// links whose target is not http, https, mailto or tel (also when the scheme is split by a tab or newline or written as
// entities), the query, fragment and credentials of bare web addresses, HTML tags and fake chat markers (shown with angle
// quotes), and hidden, tag and right-to-left control characters.
// A string that tried to give the assistant an instruction (English and a few other languages, spaced or width-changed
// letters included) is quoted as the user's own text.
// Applied once, to every string argument of a tool call, before the tool builds its answer (the choke point).
// Time is close to linear in the length of the text: every scan has a fixed window (checked by a test with hostile inputs).
// No figures, no sector knowledge (B82).

const HIDDEN = /[​-‏‪-‮⁠-⁤⁦-⁩﻿\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const HIDDEN_MORE = /[\u00ad\u034f\u061c\u180e\u{E0000}-\u{E007F}\u{E0100}-\u{E01EF}]/gu;
const TAG = /<\/?[a-zA-Z!][^>]*>|<\|[^|>]*\|>/g;
const LONE_LT = /<(?=\/?[a-zA-Z!]|\|)/g;

// ---- schemes written with tabs, newlines, entities or case changes ----
const SEP = "(?:[\\s\\u0000-\\u001f]|&(?:Tab|NewLine);|&#0{0,10}(?:9|10|13);?|&#x0{0,10}(?:9|a|d);?){0,12}";
const COLON = "(?::|&colon;|&#0{0,10}58;?|&#x0{0,10}3a;?)";
function letter(ch: string): string {
  const lo = ch.toLowerCase().charCodeAt(0);
  const up = ch.toUpperCase().charCodeAt(0);
  return `(?:${ch}|&#0{0,10}(?:${lo}|${up});?|&#x0{0,10}(?:${lo.toString(16)}|${up.toString(16)});?)`;
}
function word(w: string): string {
  return w.split("").map(letter).join(SEP);
}
const BARE_SCRIPT = new RegExp(`(?<![A-Za-z0-9])(?:${word("javascript")}|${word("vbscript")})${SEP}${COLON}`, "gi");
const BARE_DATA = new RegExp(`(?<![A-Za-z0-9])${word("data")}${SEP}${COLON}${SEP}(?:text|image|application)\\/[a-z0-9.+-]*`, "gi");

const NAMED: Record<string, string> = { tab: "\t", newline: "\n", colon: ":", lpar: "(", rpar: ")", sol: "/", period: ".", quot: '"', apos: "'", amp: "&", lt: "<", gt: ">", num: "#", quest: "?", excl: "!", comma: ",", semi: ";", equals: "=", percnt: "%", plus: "+", ast: "*", lowbar: "_", hyphen: "-" };
function fromCode(c: number): string {
  return c > 0 && c <= 0x10ffff ? String.fromCodePoint(c) : "";
}
function decodeEntities(t: string): string {
  return t
    .replace(/&#x([0-9a-f]{1,8});?/gi, (_m, h: string) => fromCode(parseInt(h, 16)))
    .replace(/&#(\d{1,10});?/g, (_m, d: string) => fromCode(parseInt(d, 10)))
    .replace(/&([a-z]{2,8});?/gi, (m, n: string) => NAMED[n.toLowerCase()] ?? m);
}
const SAFE_SCHEMES = new Set(["http", "https", "mailto", "tel"]);
// The scheme a browser or renderer would see in a link target, or null when there is none (a relative address or an anchor).
function schemeOf(raw: string): string | null {
  let t = raw.trim();
  if (t.startsWith("<")) t = t.slice(1);
  t = decodeEntities(t).replace(/[\u0000-\u0020\u007f-\u009f\u00ad\u200b-\u200f\u2028\u2029\u2060-\u2064\ufeff]/g, "");
  const m = /^([a-z][a-z0-9+.-]{0,30}):/i.exec(t);
  return m ? m[1].toLowerCase() : null;
}
function badTarget(raw: string): boolean {
  const s = schemeOf(raw);
  return s !== null && !SAFE_SCHEMES.has(s);
}

// ---- markdown: a bounded scan (no regex that can run to the end of the text from every bracket) ----
const MAX_TEXT = 300;
const MAX_TARGET = 1500;
const MAX_LABEL = 200;
function closeOf(s: string, open: number, limit: number, up: number, down: number): number {
  let depth = 0;
  const end = Math.min(s.length, open + limit);
  for (let i = open; i < end; i++) {
    const c = s.charCodeAt(i);
    if (c === 92) i++;
    else if (c === up) depth++;
    else if (c === down) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}
function escaped(s: string, at: number): boolean {
  let n = 0;
  for (let i = at - 1; i >= 0 && s.charCodeAt(i) === 92; i--) n++;
  return n % 2 === 1;
}
function markdownOnce(s: string): string {
  if (s.indexOf("[") < 0) return s;
  let out = "";
  let last = 0;
  let from = 0;
  for (;;) {
    const k = s.indexOf("[", from);
    if (k < 0) break;
    from = k + 1;
    if (escaped(s, k)) continue;
    const bang = k > 0 && s.charCodeAt(k - 1) === 33 && !escaped(s, k - 1);
    const close = closeOf(s, k, MAX_TEXT, 91, 93);
    if (close < 0) continue;
    const text = s.slice(k + 1, close);
    let end = -1;
    let target: string | null = null;
    if (s.charCodeAt(close + 1) === 40) {
      let p = close + 2;
      while (p < s.length && p < close + 2 + 40 && /\s/.test(s[p])) p++;
      let paren = -1;
      if (s[p] === "<") {
        const gt = s.indexOf(">", p);
        if (gt > 0 && gt - p < MAX_TARGET) {
          const rest = s.indexOf(")", gt);
          if (rest > 0 && rest - gt < MAX_TARGET) paren = rest;
        }
      }
      if (paren < 0) paren = closeOf(s, close + 1, MAX_TARGET, 40, 41);
      if (paren >= 0) {
        end = paren + 1;
        target = s.slice(close + 2, paren);
      }
    } else if (bang) {
      let q = close + 1;
      if (s[q] === " " || s[q] === "\t") q++;
      if (s[q] === "[") {
        const lc = closeOf(s, q, MAX_LABEL, 91, 93);
        end = lc >= 0 ? lc + 1 : close + 1;
      } else end = close + 1;
    }
    if (end < 0) continue;
    if (bang) {
      const alt = markdownPass(text).trim();
      out += s.slice(last, k - 1) + (alt ? `[image removed: ${alt}]` : "[image removed]");
      last = end;
      from = end;
    } else if (target !== null && badTarget(target)) {
      out += s.slice(last, k) + `${markdownPass(text)} (link removed)`;
      last = end;
      from = end;
    }
  }
  return out + s.slice(last);
}
function markdownPass(s: string): string {
  // repeat until nothing changes, because removing an image can leave "(" after a bracket pair that then reads as a link
  let cur = s;
  for (let i = 0; i < 5; i++) {
    const next = markdownOnce(cur);
    if (next === cur) break;
    cur = next;
  }
  return cur;
}
// "[label]: target" definitions: a target with a bad scheme is replaced
const DEFINITION = /^( {0,3}\[[^\]\n]{1,200}\]:[ \t]*\n?[ \t]*)(<[^>\n]{1,1500}>|\S{1,1500})/gm;
function definitionPass(s: string): string {
  return s.replace(DEFINITION, (m, head: string, target: string) => (badTarget(target) ? `${head}(link removed)` : m));
}

// ---- bare web addresses: keep the address, drop credentials, query and fragment ----
const CREDS = /\b(https?:\/\/)[^\s/@?#]{1,200}@/gi;
const URL_QUERY = /\b((?:https?:\/\/|www\.)[^\s<>"'“”()[\]{}?#]{1,1500})[?#][^\s<>"'“”)\]]{0,1500}/gi;

// ---- instruction text ----
const INSTRUCTION_PARTS = [
  // run 20 patterns
  String.raw`\b(?:ignore|disregard|forget|override|bypass|discard|overrule|neglect)\b[^.\n]{0,40}\b(?:previous|prior|above|earlier|preceding|all|any|your|these|those|system|safety|original)\b[^.\n]{0,30}\b(?:instructions?|directions?|guidelines?|prompts?|guardrails?|restrictions?|programming|directives?)\b`,
  String.raw`\b(?:reveal|print|show|leak|output|display|expose|dump|repeat|disclose)\b[^.\n]{0,40}\b(?:system prompt|system message|hidden prompt|initial prompt|api keys?|secrets?|passwords?|credentials?|access tokens?|private keys?|environment variables?)\b`,
  String.raw`<\|im_(?:start|end)\|>`,
  String.raw`\bSYSTEM\s*:`,
  // role markers at the start of a line, and prompt delimiters
  String.raw`(?:^|\n)[ \t]*(?:assistant|developer|human|ai|bot|claude|chatgpt)[ \t]*:`,
  String.raw`(?:^|\n)[ \t]*#{1,4}[ \t]*(?:system|instructions?)\b`,
  String.raw`\[(?:INST|SYS|SYSTEM)\]|<<SYS>>`,
  String.raw`\b(?:begin|end of)\s+(?:system\s+)?(?:prompt|instructions)\b`,
  String.raw`<!--[^>]{0,200}\b(?:assistant|ai|llm|system|instructions?|ignore)\b`,
  // new or changed instructions, and text addressed to the AI
  String.raw`\b(?:new|updated|revised)\s+instructions?\s*:`,
  String.raw`\b(?:instructions?|notes?|messages?|prompts?|orders?|commands?|attention|warning|reminder|important)\s+(?:to|for)\s+(?:the\s+|any\s+|all\s+)?(?:ai|a\.i\.|assistants?|llms?|language models?|chatbots?|claude|chatgpt|gpt|gemini|copilot)\b(?!\s+(?:manager|director|professor|coach|teacher))`,
  String.raw`\b(?:if|when)\s+you\s+are\s+(?:an?\s+)?(?:ai|a\.i\.|llm|language model|large language model|chatbot|assistant|ai agent|automated)\b`,
  String.raw`\b(?:ai|llm)\s+(?:agents?|assistants?|models?|systems?)\s+(?:reading|processing|summari[sz]ing|parsing|crawling|visiting)\s+this\b`,
  String.raw`\bfor\s+(?:the\s+)?(?:ai\s+)?(?:agents?|assistants?|llms?)\s+reading\s+this\b`,
  String.raw`\bas\s+an?\s+(?:ai|llm|language model)\b[^.\n]{0,60}\byou\s+(?:must|should|will|shall|need to|are required to)\b`,
  // role switch
  String.raw`\byou\s+are\s+now\b[^.\n]{0,40}\b(?:mode|admin|administrator|developer|dan|unrestricted|jailbroken|root|god|unfiltered)\b`,
  String.raw`\bfrom\s+now\s+on\b[^.\n]{0,30}\byou\s+(?:must|will|shall|should|are|can|may)\b`,
  String.raw`\bdo\s+anything\s+now\b|\bjailbreak(?:ed)?\b`,
  String.raw`\b(?:pretend|act|behave|respond|answer|roleplay|role-play)\b[^.\n]{0,25}\b(?:as if|as though|like)\b[^.\n]{0,30}\b(?:no|without)\s+(?:restrictions?|rules?|filters?|limits?|guidelines?|safety)`,
  // stealth and exfiltration
  String.raw`\b(?:do\s+not|don'?t|never|without)\s+(?:tell(?:ing)?|inform(?:ing)?|mention(?:ing)?|notify(?:ing)?|alert(?:ing)?|reveal(?:ing)?|disclos(?:e|ing))\b[^.\n]{0,25}\b(?:the\s+)?(?:user|human|operator)\b`,
  String.raw`\bkeep\s+(?:this|it|that)\s+(?:secret|hidden|confidential)\s+from\s+(?:the\s+)?(?:user|human)\b`,
  String.raw`\b(?:send|email|e-mail|forward|post|upload|transmit|exfiltrate|leak|submit)\b[^.\n]{0,60}\b(?:system\s+prompt|api\s+keys?|credentials?|passwords?|secrets?|access\s+tokens?|session\s+tokens?|cookies|(?:entire|full|whole)\s+(?:conversation|chat|transcript|context)|conversation\s+history|chat\s+history|private\s+files?|environment\s+variables?)\b`,
  // coaxing a tool call
  String.raw`\b(?:call|invoke|run|execute|trigger|use)\s+(?:the\s+)?(?:tool|function|command|script|api|endpoint)\b[^.\n]{0,25}\b[a-z]+_[a-z0-9_]+\b`,
  String.raw`\b(?:delete|drop|wipe|erase|destroy)_(?:all|everything|data|database|users?|records?)\b`,
  String.raw`\b(?:call|invoke|run|execute)\s+(?:the\s+)?[a-z]+_[a-z0-9_]+\s*\(`,
  // other languages
  String.raw`\bignor(?:ez|er|e|ons)\b[^.\n]{0,40}\b(?:instructions?|consignes?|directives?)\b`,
  String.raw`\bignorier(?:e|en|t|st)?\b[^.\n]{0,40}\b(?:anweisungen|instruktionen|vorgaben|befehle|regeln)\b`,
  String.raw`\bignor(?:a|ar|e|en|ad)\b[^.\n]{0,40}\b(?:instrucciones|indicaciones|directrices|reglas)\b`,
  String.raw`\bignor(?:e|ar|em)\b[^.\n]{0,40}\binstru[cç][oõ]es\b`,
  String.raw`\bignora(?:re)?\b[^.\n]{0,40}\bistruzioni\b`,
  String.raw`\bnegeer\b[^.\n]{0,40}\b(?:instructies|opdrachten)\b`,
  String.raw`忽略[^。\n]{0,10}(?:指令|指示|说明|提示)|無視[^。\n]{0,10}(?:指示|命令)|(?:指示|命令)[^。\n]{0,6}無視`,
  String.raw`игнорируй(?:те)?[^.\n]{0,30}инструкци`,
];
const INSTRUCTION = new RegExp(INSTRUCTION_PARTS.join("|"), "i");
const SPACED = /\b(?:[A-Za-z][ \t._*-]){3,}[A-Za-z]\b/g;
function looksLikeInstruction(text: string): boolean {
  if (INSTRUCTION.test(text)) return true;
  const wide = text.normalize("NFKC");
  if (wide !== text && INSTRUCTION.test(wide)) return true;
  const squeezed = wide.replace(SPACED, (m) => m.replace(/[ \t._*-]/g, ""));
  return squeezed !== wide && INSTRUCTION.test(squeezed);
}

export function neutraliseText(input: string): string {
  let s = input.replace(HIDDEN, "").replace(HIDDEN_MORE, "");
  const before = s;
  s = markdownPass(s);
  s = definitionPass(s);
  s = s.replace(BARE_SCRIPT, "[link removed]").replace(BARE_DATA, "[link removed]");
  s = s.replace(CREDS, "$1").replace(URL_QUERY, "$1 (query removed)");
  const cut = s.lastIndexOf(">") + 1;
  s = s.slice(0, cut).replace(TAG, (t) => t.replace(/</g, "‹").replace(/>/g, "›")) + s.slice(cut).replace(LONE_LT, "‹");
  if (looksLikeInstruction(before) && !/^“[\s\S]*”$/.test(s)) s = `“${s}”`;
  return s;
}

export function neutraliseDeep<T>(value: T): T {
  if (typeof value === "string") return neutraliseText(value) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => neutraliseDeep(v)) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = neutraliseDeep(v);
    return out as T;
  }
  return value;
}
