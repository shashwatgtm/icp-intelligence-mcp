// Run 40S (owner decision D6, 16 October 2026: "Safe by design"). One module, the same in every repo (a JavaScript copy made
// with tsc lives in gtm-alpha-secure). It replaces the run 22 echo safeguard (src/echo-safe.ts) at the one place each connector
// receives caller values: every text the caller sent is made inert ONCE, before the tool reads it or places it in its own
// template. The tool's own template text and markup are never touched.
//
// How: one pass over the text, left to right, linear in its length, no parser and no cost estimate. A backslash goes before
// each character that can start or end Markdown in CommonMark, GFM or pandoc (gfm and commonmark readers):
//   always:            \ [ ] < > ! ` * ~ |
//   "_"                unless it sits between two ASCII letters or digits (there it can never open or close emphasis)
//   "$"                unless it starts an amount ("$75,000" after a space stays; "$x$" would be math in pandoc gfm)
//   ":"                when it opens an emoji short code (":rocket:" is an emoji in pandoc gfm), or a name running to the end
//   block markers wherever a piece can start (the tools split typed text and start a line with any piece), that is not right
//                      after a letter or digit: a run of "#" before a space, tab or end; "-" or "+" before a space, tab or end;
//                      the first of three "-"; the first "=" of a run or one before a space, tab or end; the "." or ")" after up
//                      to 9 digits before a space, tab or end
// A bare web or mail address cannot be escaped with an invisible backslash (some readers find addresses in the finished
// text), so the answer shows one small backslash in it: "https\://", "www\.", "name\@example.com". The words stay.
// Also kept from the run 22 safeguard, unchanged: hidden and control characters are removed; a bare "javascript:", "vbscript:"
// or "data:text/..." becomes the words "[link removed]" (escaped like the rest); a text that tries to give the assistant an
// instruction is quoted as the caller's own (“...”).
// Line breaks, spaces and tabs are kept as typed (a backslash cannot escape them). No figures, no sector knowledge (B82).

const HIDDEN = /[\u200b-\u200f\u202a-\u202e\u2060-\u2064\u2066-\u2069\ufeff\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const HIDDEN_MORE = /[\u00ad\u034f\u061c\u180e\u{E0000}-\u{E007F}\u{E0100}-\u{E01EF}]/gu;

// ---- schemes written with tabs, newlines, entities or case changes (the run 22 rule, unchanged) ----
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

// ---- instruction text (the run 22 rule, unchanged) ----
const INSTRUCTION_PARTS = [
  String.raw`\b(?:ignore|disregard|forget|override|discard|overrule)\b[^.\n]{0,40}\b(?:previous|prior|above|earlier|preceding|all|any|your|these|those|system|safety|original)\b[^.\n]{0,30}\b(?:instructions?|directions?|guidelines?|prompts?|guardrails?|restrictions?|programming|directives?)\b`,
  String.raw`\b(?:reveal|print|show|leak)\b[^.\n]{0,40}\b(?:system prompt|api keys?|secrets?|passwords?)\b`,
  String.raw`\b(?:reveal|print|show|leak|output|display|expose|dump|repeat|disclose|tell me)\b[^.\n]{0,40}\b(?:system prompt|system message|hidden prompt|initial prompt|your instructions|your prompt)\b`,
  String.raw`<\|im_(?:start|end)\|>`,
  String.raw`\bSYSTEM\s*:`,
  String.raw`(?:^|\n)[ \t]*(?:assistant|developer|human|ai|bot|claude|chatgpt)[ \t]*:`,
  String.raw`(?:^|\n)[ \t]*#{1,4}[ \t]*(?:system|instructions?)\b`,
  String.raw`\[(?:INST|SYS|SYSTEM)\]|<<SYS>>`,
  String.raw`\b(?:begin|end of)\s+(?:system\s+)?(?:prompt|instructions)\b`,
  String.raw`<!--[^>]{0,200}\b(?:assistant|ai|llm|system|instructions?|ignore)\b`,
  String.raw`\b(?:new|updated|revised)\s+instructions?\s*:`,
  String.raw`\b(?:instructions?|notes?|messages?|prompts?|orders?|commands?|attention|warning|reminder|important)\s+(?:to|for)\s+(?:the\s+|any\s+|all\s+)?(?:ai|a\.i\.|assistants?|llms?|language models?|chatbots?|claude|chatgpt|gpt|gemini|copilot)\b(?!\s+(?:manager|director|professor|coach|teacher))`,
  String.raw`\b(?:if|when)\s+you\s+are\s+(?:an?\s+)?(?:ai|a\.i\.|llm|language model|large language model|chatbot|assistant|ai agent|automated)\b`,
  String.raw`\b(?:ai|llm)\s+(?:agents?|assistants?|models?|systems?)\s+(?:reading|processing|summari[sz]ing|parsing|crawling|visiting)\s+this\b`,
  String.raw`\bfor\s+(?:the\s+)?(?:ai\s+)?(?:agents?|assistants?|llms?)\s+reading\s+this\b`,
  String.raw`\bas\s+an?\s+(?:ai|llm|language model)\b[^.\n]{0,60}\byou\s+(?:must|should|will|shall|need to|are required to)\b`,
  String.raw`\byou\s+are\s+now\b[^.\n]{0,40}\b(?:mode|admin|administrator|developer|dan|unrestricted|jailbroken|root|god|unfiltered)\b`,
  String.raw`\bfrom\s+now\s+on\b[^.\n]{0,30}\byou\s+(?:must|will|shall|should|are|can|may)\b`,
  String.raw`\bdo\s+anything\s+now\b`,
  String.raw`\b(?:pretend|act|behave|respond|answer|roleplay|role-play)\b[^.\n]{0,25}\b(?:as if|as though|like)\b[^.\n]{0,30}\b(?:no|without)\s+(?:restrictions?|rules?|filters?|limits?|guidelines?|safety)`,
  String.raw`\b(?:do\s+not|don'?t|never|without)\s+(?:tell(?:ing)?|inform(?:ing)?|mention(?:ing)?|notify(?:ing)?|alert(?:ing)?|reveal(?:ing)?|disclos(?:e|ing))\b[^.\n]{0,25}\b(?:the\s+)?(?:user|human|operator)\b`,
  String.raw`\bkeep\s+(?:this|it|that)\s+(?:secret|hidden|confidential)\s+from\s+(?:the\s+)?(?:user|human)\b`,
  String.raw`\b(?:send|email|e-mail|forward|post|upload|transmit|exfiltrate|leak|submit)\b[^.\n]{0,60}\b(?:system\s+prompt|(?:entire|full|whole)\s+(?:conversation|chat|transcript)|conversation\s+history|chat\s+history)\b`,
  String.raw`\b(?:send|email|e-mail|forward|post|upload|transmit|exfiltrate|leak|reveal|dump|disclose|submit)\b[^.\n]{0,40}\b(?:your|the\s+user'?s|user'?s)\s+(?:credentials?|passwords?|secrets?|api\s+keys?|access\s+tokens?|session\s+tokens?|cookies|private\s+keys?|environment\s+variables?|files)\b`,
  String.raw`\b(?:call|invoke|run|execute|trigger|use)\s+(?:the\s+)?tool\b[^.\n]{0,25}\b[a-z]+_[a-z0-9_]+\b`,
  String.raw`\b(?:delete|drop|wipe|erase|destroy)_(?:all|everything|data|database|users?|records?)\b`,
  String.raw`\b(?:call|invoke|run|execute)\s+(?:the\s+)?(?:function\s+|command\s+)?[a-z]+_[a-z0-9_]+\s*\(`,
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
const QUOTED = /^“[\s\S]*”$/;

// ---- the escape pass ----
const ALWAYS = new Set(["\\", "[", "]", "<", ">", "!", "`", "*", "~", "|"]);
const isAsciiAlnum = (c: number) => (c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
const isDigit = (c: number) => c >= 48 && c <= 57;
const isLetter = (c: number) => (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
const isBlank = (c: number) => c === 32 || c === 9;
const isEol = (c: number) => c === 10 || c === 13;
// characters that may stand right before "@" in a GFM mail address
const isMailLocal = (c: number) => isAsciiAlnum(c) || c === 46 || c === 43 || c === 45 || c === 95;
const isShortcode = (c: number) => isAsciiAlnum(c) || c === 95 || c === 43 || c === 45;
const lower = (c: number) => (c >= 65 && c <= 90 ? c + 32 : c);
// a letter or digit of any script (the character at i, a whole code point when it is a surrogate pair)
const WORD = /[\p{L}\p{N}]/u;
const isWordChar = (s: string, i: number) => {
  const c = s.charCodeAt(i);
  if (c < 128) return isAsciiAlnum(c);
  const lo = c >= 0xdc00 && c <= 0xdfff && i > 0 ? s.slice(i - 1, i + 1) : s[i];
  return WORD.test(lo);
};

// Each check below looks at most a fixed number of characters around the current one, except the "rest of the line" checks
// for "-" and "=" lines, which run once per line from its first character: the pass stays linear.
export function escapeMarkup(s: string): string {
  const n = s.length;
  let out = "";
  for (let i = 0; i < n; i++) {
    const ch = s[i];
    const c = s.charCodeAt(i);
    const prev = i > 0 ? s.charCodeAt(i - 1) : -1;
    const next = i + 1 < n ? s.charCodeAt(i + 1) : -1;
    // block markers are escaped wherever a piece can start, not only at a line start: the tools split typed text at ".", ",",
    // ";", "!", "?" and line breaks and put each trimmed piece on a line of its own, so any place after a character that is not
    // a letter or digit (white space, punctuation, the start) can become a line start ("100+ " and "C# " stay as typed)
    const endsHere = next === -1 || isBlank(next) || isEol(next);
    const pieceStart = prev === -1 || !isWordChar(s, i - 1);
    if (c === 35) {
      // "#" run then a space, a tab or the end: it could open a heading, or close one (a last run of "#" after a space)
      if (pieceStart) {
        let j = i;
        while (j < n && s.charCodeAt(j) === 35) j++;
        const after = j < n ? s.charCodeAt(j) : -1;
        if (after === -1 || isBlank(after) || isEol(after)) {
          out += "\\#";
          continue;
        }
      }
      out += "#";
      continue;
    }
    if (c === 45) {
      // "-" then a space, a tab or the end (a list item), or the first of three or more (a rule or a heading underline)
      if (pieceStart && (endsHere || (next === 45 && i + 2 < n && s.charCodeAt(i + 2) === 45))) {
        out += "\\-";
        continue;
      }
      out += "-";
      continue;
    }
    if (c === 43) {
      out += pieceStart && endsHere ? "\\+" : "+";
      continue;
    }
    if (c === 61) {
      // "=": the first of a run, or one before a space, a tab or the end (a heading underline)
      out += pieceStart && prev !== 61 && (next === 61 || endsHere) ? "\\=" : "=";
      continue;
    }
    if (isDigit(c) && pieceStart) {
      // a numbered item: up to 9 digits, then "." or ")", then a space, a tab or the end
      let j = i;
      while (j < n && j - i < 10 && isDigit(s.charCodeAt(j))) j++;
      const p = j < n ? s.charCodeAt(j) : -1;
      const q = j + 1 < n ? s.charCodeAt(j + 1) : -1;
      if (j - i <= 9 && (p === 46 || p === 41) && (q === -1 || isBlank(q) || isEol(q))) {
        out += s.slice(i, j) + "\\" + s[j];
        i = j;
        continue;
      }
    }
    if (ALWAYS.has(ch)) {
      out += "\\" + ch;
      continue;
    }
    if (c === 95) {
      // "_" between two ASCII letters or digits can neither open nor close emphasis
      out += prev >= 0 && next >= 0 && isAsciiAlnum(prev) && isAsciiAlnum(next) ? "_" : "\\_";
      continue;
    }
    if (c === 36) {
      // "$": pandoc gfm reads "$...$" as TeX math (an opening "$" has no space after it, a closing one no space before it).
      // An amount "$75" at the start of the text or after a space or tab stays as typed (it can only open, never close, and the
      // tools read amounts from it); every other "$" gets a backslash
      out += isDigit(next) && (prev === -1 || isBlank(prev) || isEol(prev)) ? "$" : "\\$";
      continue;
    }
    if (c === 58) {
      // ":" before "//" after a letter (an address scheme): shown with a backslash, so no reader finds an address here
      if (i > 0 && isLetter(s.charCodeAt(i - 1)) && s.charCodeAt(i + 1) === 47 && s.charCodeAt(i + 2) === 47) {
        out += "\\\\:";
        continue;
      }
      // ":" that opens an emoji short code (":name:", up to 50 name characters), also when the name runs to the end of the
      // text (the tool's own text after it may hold the closing ":")
      let j = i + 1;
      while (j < n && j - i <= 50 && isShortcode(s.charCodeAt(j))) j++;
      if (j > i + 1 && (j === n || s.charCodeAt(j) === 58)) {
        out += "\\:";
        continue;
      }
      out += ":";
      continue;
    }
    if (c === 46) {
      // "www." (any case) not preceded by a letter or digit: a GFM address
      if (
        i >= 3 &&
        lower(s.charCodeAt(i - 1)) === 119 &&
        lower(s.charCodeAt(i - 2)) === 119 &&
        lower(s.charCodeAt(i - 3)) === 119 &&
        (i === 3 || !isAsciiAlnum(s.charCodeAt(i - 4)))
      ) {
        out += "\\\\.";
        continue;
      }
      out += ".";
      continue;
    }
    if (c === 64) {
      // "@" of a mail address: a local part character before it and a domain character after it
      if (prev >= 0 && isMailLocal(prev) && next >= 0 && (isAsciiAlnum(next) || next === 95 || next === 45)) {
        out += "\\\\@";
        continue;
      }
      out += "@";
      continue;
    }
    out += ch;
  }
  return out;
}

// The text a tool may repeat: hidden characters removed, bare script and data addresses replaced (run 22), then escaped;
// an instruction-like text is quoted as the caller's own.
export function escapeText(input: string): string {
  const clean = input.replace(HIDDEN, "").replace(HIDDEN_MORE, "");
  let s = clean.replace(BARE_SCRIPT, "[link removed]").replace(BARE_DATA, "[link removed]");
  s = escapeMarkup(s);
  if (looksLikeInstruction(clean) && !QUOTED.test(s)) s = `“${s}”`;
  return s;
}

// The run 22 instruction rule alone, for a sentence a tool builds from values that were already escaped (GTM Alpha joins two
// fields into one sentence; escaping them again would show doubled backslashes).
export function quoteIfInstruction(text: string): string {
  return looksLikeInstruction(text) && !QUOTED.test(text) ? `“${text}”` : text;
}

// Hidden characters only (what the input checks read: a value of hidden characters alone counts as empty, as before).
export function cleanDeep<T>(value: T): T {
  if (typeof value === "string") return value.replace(HIDDEN, "").replace(HIDDEN_MORE, "") as unknown as T;
  if (Array.isArray(value)) return value.map((v) => cleanDeep(v)) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = cleanDeep(v);
    return out as T;
  }
  return value;
}

export function escapeDeep<T>(value: T): T {
  if (typeof value === "string") return escapeText(value) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => escapeDeep(v)) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = escapeDeep(v);
    return out as T;
  }
  return value;
}

// JSON answers (REST bodies; GTM Alpha's tool answers are JSON text): JSON writes each backslash of an escaped value as "\\",
// which a reader of the raw JSON text takes as one plain backslash, leaving the escaped character live again. So, inside JSON
// strings only, an ASCII punctuation character that follows a backslash of the value is written as a \u escape: the parsed
// value is unchanged, and the raw text holds no markup character the caller typed. Text without backslashes is unchanged.
// One pass, linear. Usage: jsonInert(JSON.stringify(value)).
const isPunct = (c: number) => (c >= 33 && c <= 47) || (c >= 58 && c <= 64) || (c >= 91 && c <= 96) || (c >= 123 && c <= 126);
export function jsonInert(json: string): string {
  if (json.indexOf("\\\\") < 0) return json;
  let out = "";
  let i = 0;
  const n = json.length;
  let inString = false;
  let afterBackslash = false; // the previous value character inside this string was a backslash (written as "\\")
  while (i < n) {
    const c = json.charCodeAt(i);
    if (!inString) {
      out += json[i];
      if (c === 34) {
        inString = true;
        afterBackslash = false;
      }
      i++;
      continue;
    }
    if (c === 34) {
      out += '"';
      inString = false;
      i++;
      continue;
    }
    // one value character and its raw JSON text
    let raw: string;
    let v: number;
    if (c === 92) {
      const e = json[i + 1];
      if (e === "u") {
        raw = json.slice(i, i + 6);
        v = parseInt(json.slice(i + 2, i + 6), 16);
        i += 6;
      } else {
        raw = json.slice(i, i + 2);
        v = e === "\\" ? 92 : e === '"' ? 34 : e === "/" ? 47 : -1;
        i += 2;
      }
    } else {
      raw = json[i];
      v = c;
      i++;
    }
    if (afterBackslash && v >= 0 && isPunct(v)) {
      out += "\\u00" + v.toString(16).padStart(2, "0");
      // a backslash written this way still escapes what follows it in the value ("\\@" of an address: the "@" too)
      afterBackslash = v === 92;
      continue;
    }
    out += raw;
    afterBackslash = v === 92;
  }
  return out;
}
