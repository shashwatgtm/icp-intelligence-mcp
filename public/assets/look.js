/* Look layer movement, 11 Nov 2026 (after the owner's corrections). Adds no words and changes no behaviour.
   A helix turns behind the example card in the hero (pages that have that card). Blocks rise softly as they
   arrive, bars grow, the header gets a shadow after the first scroll, and the assistant pill is cream with a red outline and the ChatGPT mark.
   Everything reads in full without this file, and with reduced motion nothing here moves on its own. */
(function () {
  'use strict';
  var root = document.documentElement;
  if (!root.classList.contains('hx-look')) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TAU = Math.PI * 2, OX = '#641220', NAVY = '#14213D', INK = '#1D1416';

  // header shadow once the page has moved
  var sy = window.pageYOffset, push = 0;
  var onScroll = function () {
    var y = window.pageYOffset;
    root.classList.toggle('lk-scrolled', y > 8);
    push += Math.max(-60, Math.min(60, y - sy)) * 0.004; sy = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // 1. hero: the helix behind the example card. Two strands, oxblood and navy, with faint rungs. Decoration only.
  var fig = document.querySelector('.hx-hero .hx-fig');
  if (fig) {
    var cv = document.createElement('canvas');
    cv.className = 'lk-helix'; cv.setAttribute('aria-hidden', 'true');
    fig.insertBefore(cv, fig.firstChild);
    var time = 0, seen = true;
    var fit = function () {
      var r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
      if (!r.width || !r.height) return null;
      var w = Math.round(r.width * d), h = Math.round(r.height * d);
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      var c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, r.width, r.height);
      return { c: c, w: r.width, h: r.height };
    };
    // one strand pass; segments are grouped into four depth steps, so the helix is drawn with a handful of strokes
    var strands = function (g, n, at, front) {
      var c = g.c; c.lineCap = 'round';
      for (var s = 0; s < 2; s++) {
        var groups = {}, prev = at(0, s);
        for (var i = 0; i < n; i++) {
          var b = at((i + 1) / n, s), z = (prev.z + b.z) / 2;
          if ((z >= 0) === front) {
            var step = Math.min(3, Math.floor((z + 1) * 2));
            (groups[step] || (groups[step] = [])).push(prev.x, prev.y, b.x, b.y);
          }
          prev = b;
        }
        for (var id in groups) {
          var p = groups[id], k = (+id + 0.5) / 4;
          c.strokeStyle = s ? NAVY : OX; c.globalAlpha = 0.24 + 0.68 * k; c.lineWidth = 1.4 + 2.8 * k;
          c.beginPath();
          for (var q = 0; q < p.length; q += 4) { c.moveTo(p[q], p[q + 1]); c.lineTo(p[q + 2], p[q + 3]); }
          c.stroke();
        }
      }
      c.globalAlpha = 1;
    };
    var draw = function () {
      var g = fit(); if (!g) return;
      var ph = 0.7 + time * 0.32;
      var at = function (p, side) {
        var th = p * (g.h / 300) * TAU + ph + (side ? Math.PI : 0);
        return { x: g.w / 2 + Math.sin(th) * g.w * 0.36, y: p * g.h, z: Math.cos(th) };
      };
      var n = Math.ceil(g.h / 7);
      strands(g, n, at, false);
      var m = Math.floor(g.h / 18); g.c.lineWidth = 1; g.c.strokeStyle = INK; g.c.globalAlpha = 0.14;
      g.c.beginPath();
      for (var i = 1; i < m; i++) { var a = at(i / m, 0), b = at(i / m, 1); g.c.moveTo(a.x, a.y); g.c.lineTo(b.x, b.y); }
      g.c.stroke(); g.c.globalAlpha = 1;
      strands(g, n, at, true);
    };
    window.addEventListener('resize', draw); window.addEventListener('load', draw); draw();
    if (!reduce) {
      if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { seen = e[0].isIntersecting; }, { rootMargin: '60px' }).observe(cv);
      // the helix turns at 30 frames a second, only while it is on screen and the tab is visible, and starts after load.
      // On phones and small tablets (900 px and narrower) the card covers most of it, so it is drawn once and stays
      // still: no frame loop runs there at all, which keeps the main thread free on slow phones.
      var last = 0, frame = 0, running = false;
      var small = window.matchMedia('(max-width: 900px)');
      var tick = function (now) {
        if (!running) return;
        window.requestAnimationFrame(tick);
        if (document.hidden || !seen || (++frame & 1)) return;
        var dt = Math.min(0.1, (now - last) / 1000 || 0); last = now;
        var extra = push * 0.24; push -= extra; time += dt + extra * 2.2;
        draw();
      };
      var sync = function () {
        if (small.matches) { running = false; return; }
        if (!running) { running = true; last = 0; window.requestAnimationFrame(tick); }
      };
      var start = function () {
        window.setTimeout(function () {
          sync();
          if (small.addEventListener) small.addEventListener('change', sync); else if (small.addListener) small.addListener(sync);
        }, 600);
      };
      if (document.readyState === 'complete') start(); else window.addEventListener('load', start, { once: true });
    }
  }

  // 2. the assistant pill: cream with a thin red outline (owner, 11 Nov 2026: option B), named "ChatGPT assistant" with the ChatGPT mark (owner, 11 Nov 2026),
  //    because every answer opens in ChatGPT. The panel inside takes the same paper, fonts and soft corners as the page. The pill and panel live in the launcher's own shadow root, which page CSS
  //    cannot reach, so one style rule is added there and the label is set from here. The launcher file is not changed.
  //    "Ask Shashwat" (the booking page) keeps its own words and gets no mark.
  var NAMES = { 'Ask Helix': 'ChatGPT assistant', 'Ask about this tool': 'ChatGPT assistant', 'Ask Shashwat': 'ChatGPT assistant' };
  var label = function (btn) {
    var t = (btn.textContent || '').trim();
    if (btn.querySelector('.hx-gpt')) { if (t === 'ChatGPT assistant') return; }
    if (!NAMES[t]) return;
    var ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('class', 'hx-gpt'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
    // the ChatGPT mark (owner, 11 Nov 2026: the assistant keeps the ChatGPT logo; the compass is for the gtmexpert.com logo)
    var p = document.createElementNS(ns, 'path'); p.setAttribute('d', 'M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z'); p.setAttribute('fill', 'currentColor'); svg.appendChild(p);
    var sp = document.createElement('span'); sp.textContent = NAMES[t];
    btn.replaceChildren(svg, sp);
  };
  var tint = function () {
    var host = document.getElementById('helix-assistant-launcher');
    if (!host || !host.shadowRoot) return false;
    var btn = host.shadowRoot.querySelector('button.launcher');
    if (!btn) {
      if (!host.hxWaiting && 'MutationObserver' in window) {
        host.hxWaiting = true;
        var so = new MutationObserver(function () { if (host.shadowRoot.querySelector('button.launcher')) { so.disconnect(); tint(); } });
        so.observe(host.shadowRoot, { childList: true, subtree: true });
      }
      return true;
    }
    if (!host.shadowRoot.querySelector('style[data-look]')) {
      var st = document.createElement('style'); st.setAttribute('data-look', '');
      st.textContent = 'button.launcher{display:inline-flex;align-items:center;gap:8px;background:#FFFDF9;border:1.5px solid #641220;color:#641220;font-weight:600;box-shadow:0 4px 16px rgba(60,20,28,.18)}button.launcher:hover{background:#F3EADF}button.launcher .hx-gpt{width:18px;height:18px;flex:none;color:#641220}@media (max-width:600px){button.launcher{padding:9px 14px;font-size:13px;gap:6px}button.launcher .hx-gpt{width:16px;height:16px}}' +
        ':host{font-family:"Instrument Sans",Arial,sans-serif;color:#1D1416}.panel{background:#FBF7F1;border:1px solid rgba(100,18,32,.28);border-top:3px solid #641220;border-radius:16px;box-shadow:0 18px 50px rgba(60,20,28,.18)}.heading{padding:14px 16px;border-bottom:1px solid #EADFD6}h2{font-family:"Fraunces",Georgia,serif;font-weight:600;font-size:21px;letter-spacing:-.01em;color:#1D1416}.close{border-radius:999px;border:1px solid rgba(100,18,32,.35);background:#FFFDF9;color:#641220;font-weight:600;padding:6px 12px}.panel-body{padding:12px 16px}.roles{gap:6px}.roles button{border-radius:999px;border:1px solid rgba(100,18,32,.3);background:#FFFDF9;color:#641220;font-weight:600;padding:5px 12px}.roles button[aria-pressed=true]{background:#641220;border-color:#641220;color:#FFFDF9}label{font-weight:600;color:#1D1416;font-size:13px}textarea,select{border-radius:12px;border:1px solid #D9CBC2;background:#FFFDF9;color:#1D1416;padding:10px 12px}.topics{gap:8px}.topics button{border-radius:12px;border:1px solid #E3D3CA;background:#F3EADF;color:#3C2622;font-weight:600;padding:8px 10px}.topics button:hover,.roles button:hover,.close:hover,.secondary:hover{background:#EFE2D4}.roles button[aria-pressed=true]:hover{background:#4d0d18}.panel-actions{background:#F3EADF;border-top:1px solid #EADFD6;padding:12px 16px}.primary{border-radius:12px;background:#641220;border-color:#641220;color:#FFFDF9;font-weight:600;min-height:46px}.primary:hover{background:#4d0d18}.consult,.secondary{border-radius:999px;background:#FFFDF9;border-color:rgba(100,18,32,.35);color:#641220}.note,.role-note{color:#5A4B4E}.text-link,.setup,.next a{color:#8A1C2B}.address,.command{background:#F3EADF;border-radius:8px}@media (max-width:480px){h2{font-size:19px}.heading{padding:10px 12px}.panel-body,.panel-actions{padding:10px 12px}}' +
        ':host{width:min(440px,calc(100vw - 20px))}.panel{max-height:min(640px,calc(100dvh - 96px))}.heading{padding:10px 14px}h2{font-size:18px;line-height:1.2}.panel-body{min-height:200px;scrollbar-width:thin;scrollbar-color:#641220 #F3EADF;background:linear-gradient(#FBF7F1 30%,rgba(251,247,241,0)) top/100% 28px no-repeat local,linear-gradient(rgba(251,247,241,0),#FBF7F1 70%) bottom/100% 28px no-repeat local,radial-gradient(farthest-side at 50% 0,rgba(60,20,28,.22),rgba(60,20,28,0)) top/100% 10px no-repeat scroll,radial-gradient(farthest-side at 50% 100%,rgba(60,20,28,.28),rgba(60,20,28,0)) bottom/100% 12px no-repeat scroll;background-color:#FBF7F1}.panel-body::-webkit-scrollbar{width:8px}.panel-body::-webkit-scrollbar-thumb{background:#641220;border-radius:8px}.panel-body::-webkit-scrollbar-track{background:#F3EADF}.panel-actions{padding:8px 14px}.panel-actions .note{margin:4px 0;font-size:11.5px;line-height:1.35}.primary{min-height:42px}.extras{margin-top:2px}@media (max-height:760px){.panel-actions .note:first-child{display:none}}';
      host.shadowRoot.appendChild(st);
    }
    label(btn);
    if (!btn.hxWatched && 'MutationObserver' in window) {
      btn.hxWatched = true;
      new MutationObserver(function () { label(btn); }).observe(btn, { childList: true, characterData: true, subtree: true });
    }
    return true;
  };
  if (!tint() && 'MutationObserver' in window) {
    var mo = new MutationObserver(function () { if (tint()) mo.disconnect(); });
    mo.observe(document.body, { childList: true, subtree: true });
  }

// 2a. phones: keep the hero button clear of the pill (fixes B, 12 Nov 2026). The pill is centred on the right edge, so its band is known before it shows.
  var clearPill = function () {
    var btn = null, all = document.querySelectorAll('.hx-hero a.hx-btn, .hx-hero a.btn, section.hero a.hx-btn, section.hero a.btn, .hero-grid a.hx-btn, .hero-grid a.btn');
    for (var i = 0; i < all.length; i++) { if (!all[i].closest('header') && all[i].offsetParent) { btn = all[i]; break; } }
    if (!btn) return;
    var row = btn.parentElement; row.style.marginTop = '';
    if (window.innerWidth > 600) return;
    var vh = window.innerHeight, top = vh / 2 - 26, bottom = vh / 2 + 26, left = window.innerWidth - 8 - 180;
    var r = btn.getBoundingClientRect(), y = r.top + window.pageYOffset;
    if (y < bottom && y + r.height > top && r.right > left) {
      var cur = parseFloat(getComputedStyle(row).marginTop) || 0;
      row.style.marginTop = (cur + bottom + 10 - y) + 'px';
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', clearPill, { once: true }); else clearPill();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(clearPill);
  var lastW = window.innerWidth;
  window.addEventListener('resize', function () { if (window.innerWidth !== lastW) { lastW = window.innerWidth; clearPill(); } });

  // 2b. guides filter dropdowns: after a choice, fold the list away
  document.addEventListener('change', function (e) {
    var t = e.target; if (t && t.name === 'gd-cat' && t.closest && t.closest('.gd-hub')) { t.blur(); var f = t.closest('.gd-filter'); if (f) { f.classList.add('lk-shut'); f.addEventListener('mouseleave', function () { f.classList.remove('lk-shut'); }, { once: true }); } }
  });

  // 3. blocks rise as they arrive; bars grow when their block arrives. Only blocks below the first screen are held
  //    back, and three seconds after the start every block is shown in full (it then only slides into place).
  if (reduce || !('IntersectionObserver' in window)) return;
  var vh = window.innerHeight;
  var rise = [].slice.call(document.querySelectorAll('#main .sh, .hx-decide li, .hx-decide-more, .hx-enough, .stat, .sh-grid, .hx8-tiles li, .recog-wrap, .hx9-chips, .hx9-job, .duo > .win, .hx-nf li, .hx-plainqa h3, .hx-plainqa p'));
  var bars = [].slice.call(document.querySelectorAll('.hx9-job, .duo > .win'));
  bars.forEach(function (el) { el.classList.add('lk-bars'); });
  rise.forEach(function (el) { if (el.getBoundingClientRect().top > vh * 0.92) el.classList.add('lk-rv'); });
  root.classList.add('lk-anim');
  window.setTimeout(function () { root.classList.add('lk-safe'); }, 3000);
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('lk-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
  rise.concat(bars).forEach(function (el) { io.observe(el); });
})();
