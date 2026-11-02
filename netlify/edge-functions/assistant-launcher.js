const tag = '<script type="module" src="/assistant/launcher.mjs"></script>';

export default async (request, context) => {
  const path = new URL(request.url).pathname;
  if ((request.method === 'GET' || request.method === 'HEAD') && /^\/assistant(?:\/index\.html|\/)?$/.test(path)) return new Response(null, {status: 301, headers: {location: '/', 'cache-control': 'public, max-age=0, must-revalidate'}});
  const res = await context.next();
  if (request.method !== 'GET' || res.status < 200 || res.status >= 300 || res.status === 206 ||
      !res.body || !/^text\/html(?:\s*;|\s*$)/i.test(res.headers.get('content-type') || '') ||
      /^\/(?:assistant|ai-trendwatch|lets-get-started|contact|contact-us|forms?|thank-you|thanks|error|404|500)(?:[/.]|$)/i.test(path) || /\/(?:thank-you|subscribed|success|error)(?:\/|$)/i.test(path)) return res;
  try {
    const html = await res.clone().text();
    if ((!/^\/tools\/[^/]+\/?$/.test(path) && /<form\b/i.test(html)) || !/<\/body\s*>/i.test(html) || /<script\b[^>]*\bsrc\s*=\s*["']\/assistant\/launcher\.mjs(?:\?[^"']*)?["']/i.test(html)) return res;
    const h = new Headers(res.headers);
    h.delete('content-length'); h.delete('etag');
    return new Response(html.replace(/<\/body\s*>/i, tag + '\n</body>'), {
      status: res.status, statusText: res.statusText, headers: h,
    });
  } catch {
    // A launcher failure must never replace the visitor's page.
    return res;
  }
};

export const config = {
  path: '/*',
  excludedPath: ['/assistant/launcher.mjs', '/assistant/panel.mjs', '/assistant/launcher.css', '/assistant/handoff.mjs', '/assistant/tool-next.json', '/assistant/sites.json', '/assets/*', '/og/*', '/images/*',
    '/lets-get-started', '/lets-get-started/*', '/contact', '/contact/*', '/forms/*', '/thank-you/*', '/404.html', '/500.html', '/writing/subscribed/*', '/ai-trendwatch', '/ai-trendwatch/*', '/favicon.ico', '/favicon.svg', '/robots.txt', '/sitemap.xml'],
};
