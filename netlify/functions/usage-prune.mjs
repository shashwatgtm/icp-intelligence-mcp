// 13 Nov 2026 (owner): usage count records are deleted after 90 days. Netlify runs this once a day on the published site.
// It reads only the record keys (day, server, tool, app kind, route) and deletes those older than 90 days.
import { pruneUsage } from "../lib/usage-count.mjs";

export default async () => {
  try {
    const { cutoff, deleted } = await pruneUsage();
    return new Response(`Deleted ${deleted} usage records dated before ${cutoff}.`, { status: 200 });
  } catch {
    return new Response("Usage prune failed; it runs again tomorrow.", { status: 500 });
  }
};

export const config = { schedule: "@daily" };
