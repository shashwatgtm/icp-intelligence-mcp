// Run 42 (owner decision, 17 October 2026): a usage count per tool.
// Stored: the day, this server's name, the tool name (only a name this server declares), the kind of app that made the
// call (one of a few fixed words read from the User-Agent) and the route (mcp or web). Never stored: the arguments,
// the answer, the IP address, the full User-Agent or anything else the user sent. A failure here never affects the answer.
import { getStore } from "@netlify/blobs";

const APPS = [
  [/helix-(?:run|health|test)/i, "helix-test"],
  [/claude|anthropic/i, "claude"],
  [/openai|chatgpt/i, "chatgpt"],
  [/cursor/i, "cursor"],
  [/windsurf|codeium/i, "windsurf"],
  [/vscode|copilot/i, "vscode"],
  [/gemini|google/i, "gemini"],
  [/mozilla|chrome|safari|firefox/i, "browser"],
];

export function appOf(userAgent) {
  const ua = typeof userAgent === "string" ? userAgent.slice(0, 300) : "";
  for (const [re, name] of APPS) if (re.test(ua)) return name;
  return ua ? "other" : "none";
}

export function countUse(server, tool, req, route, context) {
  try {
    if (!/^[a-z][a-z0-9_]{0,63}$/.test(String(tool || ""))) return;
    const app = appOf(req && req.headers && req.headers.get ? req.headers.get("user-agent") : "");
    const day = new Date().toISOString().slice(0, 10);
    const key = `${day}/${server}/${tool}/${app}/${route}/${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    const write = Promise.race([
      getStore("usage").set(key, "1"),
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]).catch(() => {});
    if (context && typeof context.waitUntil === "function") context.waitUntil(write);
    return write;
  } catch {
    return undefined;
  }
}
