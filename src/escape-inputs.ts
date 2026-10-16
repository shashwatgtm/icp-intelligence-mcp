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
//   a last line of only digits (after a line break) gets one backslash after it, for the tool's own "." or ")" that may follow
//   "&"                when it starts a character reference ("&#58;" would be decoded into ":")
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
// every character String.prototype.trim() removes (the tools trim each piece they cut): a marker before any of them can open a block
const isTrimSpace = (c: number) =>
  c === 32 || (c >= 9 && c <= 13) || c === 0xa0 || c === 0x1680 || (c >= 0x2000 && c <= 0x200a) || c === 0x2028 || c === 0x2029 ||
  c === 0x202f || c === 0x205f || c === 0x3000 || c === 0xfeff;
const isEol = (c: number) => c === 10 || c === 13;
// characters that may stand right before "@" in a GFM mail address
const isMailLocal = (c: number) => isAsciiAlnum(c) || c === 46 || c === 43 || c === 45 || c === 95;
const isShortcode = (c: number) => isAsciiAlnum(c) || c === 95 || c === 43 || c === 45;
const lower = (c: number) => (c >= 65 && c <= 90 ? c + 32 : c);
// a letter or digit of any script (the character at i, a whole code point when it is a surrogate pair)
// Run 40S2 fix round (GTM Alpha F4): combining marks count too (pandoc composes a letter and its mark into one letter)
const WORD = /[\p{L}\p{N}\p{M}]/u;
const isWordChar = (s: string, i: number) => {
  const c = s.charCodeAt(i);
  if (c < 128) return isAsciiAlnum(c);
  const lo = c >= 0xdc00 && c <= 0xdfff && i > 0 ? s.slice(i - 1, i + 1) : s[i];
  return WORD.test(lo);
};

// Each check below looks at most a fixed number of characters around the current one (a run of "#" or digits is read once):
// the pass stays linear. scan() decides, for each character, 0 (as typed), 1 (a backslash before it) or 2 (a visible backslash
// before it: a literal backslash, then the character as typed). escapeMarkup() writes those decisions; escapePiece() (below)
// uses the same decisions again on a piece a tool cut, joined or changed.
//
// Run 40S2 (40S-2, 40S-4): a block marker counts as live before ANY character that is not a letter or digit (white space,
// punctuation such as "," "." ";" "(" ")" ":" "|", or the end), not only before white space: the tools cut typed text at that
// punctuation, so a marker right before it could reach a line start. That also covers a table delimiter row ("--:", "-:").
// Run 40S2 (40S-3): the trailing backslash after a last line of digits is gone (it escaped the tool's own "**", "*" or "]").
// In its place, a run of 1 to 9 digits that starts a line the caller typed (after a line break) and that a tool could end there
// (the end, a line break, white space up to the end or a line break or a non letter, or one of , ; ! ? : ( or a "." or ")"
// before a letter or digit) gets a backslash before its first digit: "\2024" (a small visible backslash), so no "." or ")" the
// tool writes after it can make a numbered item. "1. " stays escaped invisibly ("1\. "), as before.
const CUT_AFTER_DIGITS = new Set([44, 59, 33, 63, 58, 40]); // , ; ! ? : (
function scan(s: string, emit: (i: number, kind: number) => void): void {
  const n = s.length;
  let lineStart = false; // only trim spaces since the last line break the caller typed
  // the text "ends" after its last character that trim() keeps: the tools trim values, so trailing white space counts as the end
  let last = n - 1;
  while (last >= 0 && isTrimSpace(s.charCodeAt(last))) last--;
  const endsAt = (k: number) => k >= n || !isWordChar(s, k);
  for (let i = 0; i < n; i++) {
    const ch = s[i];
    const c = s.charCodeAt(i);
    const prev = i > 0 ? s.charCodeAt(i - 1) : -1;
    const atLine = lineStart;
    lineStart = isEol(c) ? true : isTrimSpace(c) ? lineStart : false;
    // block markers are escaped wherever a piece can start, not only at a line start: the tools split typed text at ".", ",",
    // ";", "!", "?" and line breaks and put each trimmed piece on a line of its own, so any place after a character that is not
    // a letter or digit (white space, punctuation, the start) can become a line start ("100+ " and "C# " stay as typed)
    const endsHere = endsAt(i + 1);
    const pieceStart = prev === -1 || !isWordChar(s, i - 1);
    if (c === 35) {
      // a run of "#" before a character that is not a letter or digit: it could open a heading, or close one
      // the whole run is read once (reading it again from each "#" would be quadratic)
      let j = i;
      while (j < n && s.charCodeAt(j) === 35) j++;
      if (pieceStart && endsAt(j)) emit(i, 1);
      i = j - 1;
      continue;
    }
    // Run 40S2 fix round (ICP F2, F3): "www" (any case, not after a letter or digit) before "-" or "_" (pandoc gfm links
    // "www-host" and "www_host"), or at the end of the value (the tool's own "." may follow): a visible backslash
    if ((c === 45 || c === 95) && isWww(s, i)) {
      emit(i, 2);
      continue;
    }
    if ((c === 119 || c === 87) && i + 1 > last && isWww(s, i + 1)) {
      emit(i, 1);
      continue;
    }
    if (c === 45 || c === 43) {
      // "-" or "+" before a character that is not a letter or digit: a list item, a rule, a heading underline, a delimiter row
      // (only the first of a run: a line can start inside a run only where a tool cuts in it, and escapePiece reads such a piece)
      if (pieceStart && prev !== c && endsHere) emit(i, 1);
      continue;
    }
    if (c === 61) {
      // "=": the first of a run, or one before a character that is not a letter or digit (a heading underline)
      if (pieceStart && prev !== 61 && endsHere) emit(i, 1);
      continue;
    }
    if (isDigit(c) && pieceStart) {
      let j = i;
      while (j < n && j - i < 10 && isDigit(s.charCodeAt(j))) j++;
      const p = j < n ? s.charCodeAt(j) : -1;
      if (j - i <= 9) {
        const dotOrParen = p === 46 || p === 41;
        // a numbered item: up to 9 digits, then "." or ")", then a character that is not a letter or digit
        if (dotOrParen && endsAt(j + 1)) {
          emit(j, 1);
          i = j;
          continue;
        }
        if (atLine) {
          let k = j;
          while (k < n && isTrimSpace(s.charCodeAt(k)) && !isEol(s.charCodeAt(k))) k++;
          const cut = p === -1 || isEol(p) || (k > j && endsAt(k)) || CUT_AFTER_DIGITS.has(p) || dotOrParen;
          if (cut) emit(i, 1);
        }
      }
      i = j - 1;
      continue;
    }
    if (c === 38) {
      // "&" that starts a character reference ("&#58;", "&colon;", "&#x3a;": a name or number, then ";"): shown as typed, so no
      // reader decodes it (mdast with GFM decodes it into finished text and finds an address there)
      let j = i + 1;
      while (j < n && j - i <= 33 && (isAsciiAlnum(s.charCodeAt(j)) || s.charCodeAt(j) === 35)) j++;
      // Run 40S2 fix round (GTM Alpha F2): also a reference that runs to the end (the tool's own ";" may follow): a number,
      // or a name of two or more characters (no entity name has one letter, so "AT&T" stays as typed)
      if (j > i + 1 && ((j > last && (s.charCodeAt(i + 1) === 35 || j > i + 2)) || (j < n && s.charCodeAt(j) === 59))) emit(i, 1);
      continue;
    }
    if (ALWAYS.has(ch)) {
      emit(i, 1);
      continue;
    }
    const next = i + 1 < n ? s.charCodeAt(i + 1) : -1;
    if (c === 95) {
      // "_" between two ASCII letters or digits can neither open nor close emphasis
      if (!(prev >= 0 && next >= 0 && isAsciiAlnum(prev) && isAsciiAlnum(next))) emit(i, 1);
      continue;
    }
    if (c === 36) {
      // "$": pandoc gfm reads "$...$" as TeX math (an opening "$" has no space after it, a closing one no space before it).
      // An amount "$75" at the start of the text or after a space or tab stays as typed (it can only open, never close, and the
      // tools read amounts from it); every other "$" gets a backslash
      if (!(isDigit(next) && (prev === -1 || isBlank(prev) || isEol(prev)))) emit(i, 1);
      continue;
    }
    if (c === 58) {
      // ":" before "//" after a letter (an address scheme): shown with a backslash, so no reader finds an address here
      // (a letter of any script: a tool that changes case can turn "ſ" into "S")
      if (i > 0 && isWordChar(s, i - 1) && next === 47 && s.charCodeAt(i + 2) === 47) {
        emit(i, 2);
        continue;
      }
      // ":" that opens an emoji short code (":name:", up to 50 name characters), also when the name runs to the end of the
      // text (the tool's own text after it may hold the closing ":")
      let j = i + 1;
      while (j < n && j - i <= 50 && isShortcode(s.charCodeAt(j))) j++;
      if (j > i + 1 && (j > last || s.charCodeAt(j) === 58)) emit(i, 1);
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
        emit(i, 2);
      }
      continue;
    }
    if (c === 64) {
      // "@" of a mail address: a local part character before it and a domain character after it
      // (letters of any script count: a tool that changes case can turn one into an ASCII letter)
      // Run 40S2 fix round (IMPACT F2, GTM Alpha F3): a "." after "@" counts too (micromark and mdast link "q@.host")
      if (prev >= 0 && (isMailLocal(prev) || isWordChar(s, i - 1)) && next >= 0 && (isAsciiAlnum(next) || next === 95 || next === 45 || next === 46 || isWordChar(s, i + 1))) {
        emit(i, 2);
      }
      continue;
    }
  }
}

// "www" (any case) right before position k, not after an ASCII letter or digit
function isWww(s: string, k: number): boolean {
  return (
    k >= 3 &&
    lower(s.charCodeAt(k - 1)) === 119 &&
    lower(s.charCodeAt(k - 2)) === 119 &&
    lower(s.charCodeAt(k - 3)) === 119 &&
    (k === 3 || !isAsciiAlnum(s.charCodeAt(k - 4)))
  );
}

function write(s: string, kinds: Uint8Array): string {
  let out = "";
  let from = 0;
  for (let i = 0; i < s.length; i++) {
    const k = kinds[i];
    if (k === 0) continue;
    out += s.slice(from, i) + (k === 2 ? "\\\\" : "\\");
    from = i;
  }
  return out + s.slice(from);
}

export function escapeMarkup(s: string): string {
  const kinds = new Uint8Array(s.length);
  scan(s, (i, k) => {
    kinds[i] = k;
  });
  return write(s, kinds);
}

// Run 40S2 (40S-2, 40S-3; the HANDOFF's helper): every tool calls this on each piece of caller text it cuts, joins or changes
// case, right before the piece enters its template. The piece is read back into its typed characters (each backslash pair of
// the pass is one escaped character) and scanned again in its own context, as if it were a whole value; every escape it had
// stays, and the new context can only add escapes. So a cut, a join or a case change can never undo what the pass decided.
// A lone backslash at the end (its character was cut away) or before a line break (the pass never writes one there) is
// dropped, so it cannot escape the tool's own next character. On text the pass made and no tool changed, it returns the same
// text (tested). One pass, linear.
export function escapePiece(piece: string): string {
  if (piece.length === 0) return piece;
  let d = "";
  const had: number[] = [];
  for (let i = 0; i < piece.length; i++) {
    if (piece.charCodeAt(i) === 92) {
      if (i + 1 >= piece.length || isEol(piece.charCodeAt(i + 1))) continue;
      d += piece[i + 1];
      had.push(1);
      i++;
      continue;
    }
    d += piece[i];
    had.push(0);
  }
  const kinds = new Uint8Array(d.length);
  scan(d, (i, k) => {
    kinds[i] = k;
  });
  for (let i = 0; i < d.length; i++) if (had[i] > kinds[i]) kinds[i] = had[i];
  return write(d, kinds);
}

// For a tool that cuts typed text (at "!", ".", "?" or at a length): a piece that ends in a lone backslash kept the backslash of an
// escape whose character was cut away; that backslash would escape the tool's own next character, so it is dropped. A piece
// without backslashes is returned as it is.
export function dropLoneBackslash(piece: string): string {
  let k = 0;
  for (let i = piece.length - 1; i >= 0 && piece.charCodeAt(i) === 92; i--) k++;
  return k % 2 === 1 ? piece.slice(0, -1) : piece;
}

// The text a tool may repeat: hidden characters removed, bare script and data addresses replaced (run 22), then escaped;
// an instruction-like text is quoted as the caller's own.
export function escapeText(input: string): string {
  // Run 40S2 fix round (IMPACT F1, GTM Alpha F1): a lone carriage return becomes a line feed (pandoc drops a lone CR before it
  // reads the text, which would join the characters on both sides; CommonMark reads it as a line end, as this pass does)
  const clean = input.replace(HIDDEN, "").replace(HIDDEN_MORE, "").replace(/\r(?!\n)/g, "\n");
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

// JSON answers (REST bodies, MCP bodies; GTM Alpha's tool answers are JSON text): JSON writes each backslash of an escaped value
// as "\\", which a reader of the raw JSON text takes as one plain backslash, leaving the escaped character live again. So,
// inside JSON strings only, the ASCII punctuation character a value backslash escapes is written as a \u escape: the parsed
// value is unchanged, and the raw text holds no markup character the caller typed.
// Run 40S2 (40S-5 and the ICP auditor's finding 2): (1) backslash pairs are counted, so only the character a backslash escapes
// is written this way, never the tool's own next character (its "**" stays as it is); (2) JSON writes a line feed, a carriage
// return, a tab, a lone surrogate or a \u escape with a letter or digit last ("\n", "\ud800", "\"), so an "@" or ":" right
// after one would follow a letter or digit in the raw text ("n@host" is a mail address there): that "@" or ":" is written as
// a \u escape too. JSON without any backslash is unchanged. One pass, linear. Usage: jsonInert(JSON.stringify(value)).
const isPunct = (c: number) => (c >= 33 && c <= 47) || (c >= 58 && c <= 64) || (c >= 91 && c <= 96) || (c >= 123 && c <= 126);
const hex = (v: number) => "\\u" + v.toString(16).padStart(4, "0");
export function jsonInert(json: string): string {
  if (json.indexOf("\\") < 0) return json;
  let out = "";
  let from = 0; // json[from, at) is copied as it is when the next change is written
  let i = 0;
  const n = json.length;
  let inString = false;
  let pending = false; // an odd value backslash came last: it escapes the next value character
  let afterSeq = false; // the raw text written last is a JSON escape ending in a letter or digit
  while (i < n) {
    const c = json.charCodeAt(i);
    if (!inString) {
      if (c === 34) {
        inString = true;
        pending = false;
        afterSeq = false;
      }
      i++;
      continue;
    }
    if (c === 34) {
      inString = false;
      i++;
      continue;
    }
    // one value character and its raw JSON text json[at, i)
    const at = i;
    let v: number;
    let seq = false;
    if (c === 92) {
      const e = json.charCodeAt(i + 1);
      seq = true;
      if (e === 117) {
        v = parseInt(json.slice(i + 2, i + 6), 16);
        i += 6;
      } else {
        v = e === 92 ? 92 : e === 34 ? 34 : e === 47 ? 47 : -1;
        i += 2;
      }
    } else {
      v = c;
      i++;
    }
    let write = false;
    if (pending) {
      pending = false;
      write = v >= 0 && isPunct(v);
    } else if (v === 92) {
      pending = true;
      afterSeq = false;
      continue;
    }
    if (!write && afterSeq && (v === 64 || v === 58 || v === 36)) write = true; // Run 40S2 fix round (IMPACT F4): "$" too
    if (write) {
      out += json.slice(from, at) + hex(v);
      from = i;
      afterSeq = true;
      continue;
    }
    afterSeq = seq && isAsciiAlnum(json.charCodeAt(i - 1));
  }
  return from === 0 ? json : out + json.slice(from);
}
