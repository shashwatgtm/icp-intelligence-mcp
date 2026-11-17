/* Helix GTM connector sites: the same consent-gated visit analytics as gtmhelix.com (copied 6 Nov 2026), plus a connect lead.
   It never reads a form, a tool input or a tool answer: it sends only the page path and the kind of lead.
   Google Analytics runs in consent mode: no analytics cookies until the visitor selects Accept.
   Ahrefs Web Analytics sets no cookies. The choice is kept in this browser (localStorage "helix-consent").
   27 Oct 2026: loads 1 second after the page, and records leads: generate_lead in Google Analytics and
   lead_form, lead_calendly or lead_email in Ahrefs, for the form (on its thank-you page), a Calendly click
   and an email click. No form field or address is sent; only the kind of lead and the page it came from.
   Connector sites add method "connect": a click on a link to a Use it in Claude or ChatGPT page (/connect/ or /integration). */
(function (w, d) {
  var KEY = "helix-consent", PRIVACY = (d.currentScript && d.currentScript.getAttribute("data-privacy")) || "/privacy/", done = false, evs = ["pointerdown", "keydown", "touchstart", "scroll"];
  function get() { try { return w.localStorage.getItem(KEY); } catch (e) { return null; } }
  function put(v) { try { w.localStorage.setItem(KEY, v); } catch (e) {} }
  function add(src, attrs) { var s = d.createElement("script"); s.async = true; s.src = src; for (var k in attrs) s.setAttribute(k, attrs[k]); d.head.appendChild(s); }
  w.dataLayer = w.dataLayer || [];
  w.gtag = w.gtag || function () { w.dataLayer.push(arguments); };
  var c = get() === "granted" ? "granted" : "denied";
  w.gtag("consent", "default", { analytics_storage: c, ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
  function choose(v) {
    put(v);
    w.gtag("consent", "update", { analytics_storage: v === "granted" ? "granted" : "denied" });
    var b = d.getElementById("hx-consent"); if (b) b.parentNode.removeChild(b);
  }
  function banner() {
    if (d.getElementById("hx-consent")) return;
    if (!d.getElementById("hx-consent-css")) { var st = d.createElement("link"); st.id = "hx-consent-css"; st.rel = "stylesheet"; st.href = "/assets/consent.css?v=c1"; d.head.appendChild(st); }
    var b = d.createElement("div"); b.id = "hx-consent"; b.setAttribute("role", "region"); b.setAttribute("aria-label", "Cookie choice");
    var p = d.createElement("p");
    p.appendChild(d.createTextNode("We use Google Analytics cookies to count visits, only if you accept. "));
    var a = d.createElement("a"); a.href = PRIVACY; a.textContent = "Privacy policy"; p.appendChild(a);
    var r = d.createElement("div"); r.className = "hx-b";
    var y = d.createElement("button"); y.type = "button"; y.className = "hx-a"; y.textContent = "Accept"; y.addEventListener("click", function () { choose("granted"); });
    var n = d.createElement("button"); n.type = "button"; n.className = "hx-d"; n.textContent = "Decline"; n.addEventListener("click", function () { choose("denied"); });
    r.appendChild(y); r.appendChild(n); b.appendChild(p); b.appendChild(r); d.body.appendChild(b);
  }
  w.helixCookieChoice = banner;
  d.addEventListener("click", function (e) { var t = e.target && e.target.closest ? e.target.closest("[data-cookie-settings]") : null; if (t) { e.preventDefault(); banner(); } });
  function load() {
    if (done) return; done = true;
    evs.forEach(function (x) { w.removeEventListener(x, load, { passive: true }); });
    w.gtag("js", new Date());
    w.gtag("config", "G-21KXKCFV9Z");
    add("/assets/ga/gtag.js?v=c1", {});
    add("https://analytics.ahrefs.com/analytics.js", { "data-key": "cUBwDdFGLepiLvlTQLPTBg" });
  }
  // Ahrefs sets window.AhrefsAnalytics once its script has run; a lead sent earlier waits for it (up to 5 seconds).
  function ahrefs(name, tries) {
    if (w.AhrefsAnalytics && w.AhrefsAnalytics.sendEvent) { try { w.AhrefsAnalytics.sendEvent(name); } catch (e) {} return; }
    if ((tries || 0) < 25) setTimeout(function () { ahrefs(name, (tries || 0) + 1); }, 200);
  }
  // One lead: method is "form", "calendly" or "email". done is called once Google has the event, or after 600 ms.
  function lead(method, done) {
    load();
    var called = false, finish = function () { if (!called) { called = true; if (done) done(); } };
    w.gtag("event", "generate_lead", { method: method, lead_page: w.location.pathname, transport_type: "beacon", event_callback: finish });
    ahrefs("lead_" + method);
    if (done) setTimeout(finish, 600);
  }
  w.helixLead = lead;
  if (/^\/lets-get-started\/thank-you\/?$/.test(w.location.pathname)) lead("form");
  d.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a) return;
    var href = a.getAttribute("href") || "";
    var u = null; try { u = new URL(a.href, w.location.href); } catch (er) {}
    var connect = u && /(^|\.)gtmhelix\.com$/.test(u.hostname) && /\/(connect|integration)(\/|\.html)?$/.test(u.pathname);
    var method = /^mailto:/i.test(href) ? "email" : /^https:\/\/(www\.)?calendly\.com\//i.test(href) ? "calendly" : connect ? "connect" : "";
    if (!method) return;
    // A Calendly link that opens in this tab waits for the event (at most 600 ms), so leaving the page does not lose it.
    var sameTab = method === "calendly" && (!a.target || a.target === "_self") && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0;
    if (sameTab) { e.preventDefault(); lead(method, function () { w.location.href = a.href; }); } else lead(method);
  }, true);
  if (!get()) { if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", banner); else banner(); }
  evs.forEach(function (x) { w.addEventListener(x, load, { passive: true }); });
  w.addEventListener("load", function () { setTimeout(load, 1000); });
})(window, document);
