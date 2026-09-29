// Connector web app: runs a tool from its form and shows the answer. Without JavaScript the same form posts to the
// same endpoint and gets an HTML page back. Nothing typed is saved in the browser.
// R12-13 (icp12, D15): the ICP Intelligence copy of app.js (gen_site3.py copies it for the icp site only). It differs from
// app.js only in collect(): a "rows" box (one entry per line, values split by data-rows sep) and inputs named "parent.part"
// are turned back into the same JSON body the API received when visitors typed JSON.
(function () {
  "use strict";

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }

  // Small Markdown renderer for the tool answers: headings, lists, tables, code, quotes, rules, bold, italic, links.
  // Input is escaped first, so no HTML from the answer is ever run.
  function inline(s) {
    s = esc(s);
    s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" rel="nofollow noopener">$1</a>');
    return s;
  }
  function markdown(md) {
    var lines = String(md).replace(/\r\n/g, "\n").split("\n");
    var out = [], i = 0, list = null;
    function closeList() { if (list) { out.push("</" + list + ">"); list = null; } }
    while (i < lines.length) {
      var line = lines[i];
      if (/^```/.test(line)) {
        closeList();
        var code = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) { code.push(lines[i]); i++; }
        out.push("<pre><code>" + esc(code.join("\n")) + "</code></pre>");
        i++; continue;
      }
      if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {
        closeList();
        var cells = function (l) { return l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(function (c) { return c.trim(); }); };
        var head = cells(line);
        var rows = [];
        i += 2;
        while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) { rows.push(cells(lines[i])); i++; }
        out.push('<div class="hx-table"><table><thead><tr>' + head.map(function (c) { return "<th>" + inline(c) + "</th>"; }).join("") +
          "</tr></thead><tbody>" + rows.map(function (r) { return "<tr>" + r.map(function (c) { return "<td>" + inline(c) + "</td>"; }).join("") + "</tr>"; }).join("") +
          "</tbody></table></div>");
        continue;
      }
      var h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) { closeList(); var lv = Math.min(h[1].length + 3, 6), cls = ["hxr-h2", "hxr-h3", "hxr-h4"][Math.min(h[1].length, 3) - 1]; out.push("<h" + lv + ' class="' + cls + '">' + inline(h[2]) + "</h" + lv + ">"); i++; continue; }
      if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { closeList(); out.push("<hr>"); i++; continue; }
      var ul = line.match(/^\s*[-*+]\s+(.*)$/), ol = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
      if (ul || ol) {
        var want = ul ? "ul" : "ol";
        if (list !== want) { closeList(); out.push("<" + want + ">"); list = want; }
        if (ol) out.push('<li value="' + ol[1] + '">' + inline(ol[2]) + "</li>");
        else out.push("<li>" + inline(ul[1]) + "</li>");
        i++; continue;
      }
      var q = line.match(/^>\s?(.*)$/);
      if (q) { closeList(); out.push("<blockquote>" + inline(q[1]) + "</blockquote>"); i++; continue; }
      if (/^\s*$/.test(line)) {
        var k = i + 1;
        while (k < lines.length && /^\s*$/.test(lines[k])) k++;
        if (list === "ol" && k < lines.length && /^\s*\d+[.)]\s+/.test(lines[k])) { i = k; continue; }
        closeList(); i++; continue;
      }
      closeList();
      var para = [line];
      i++;
      while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|```|\s*[-*+]\s|\s*\d+[.)]\s|>|\s*\|)/.test(lines[i])) { para.push(lines[i]); i++; }
      out.push("<p>" + para.map(inline).join("<br>") + "</p>");
    }
    closeList();
    return out.join("\n");
  }

  function words(list) {
    return list.length < 2 ? list.join("") : list.slice(0, -1).join(", ") + " or " + list[list.length - 1];
  }
  // R12-13: one entry per line; a wrong line gets a plain message such as "Line 2 needs 5 values: name, fit, intent, relationship, timing."
  function rows(v, spec, problems) {
    var out = [];
    v.split(/\r?\n/).forEach(function (line, idx) {
      if (!line.trim()) return;
      var n = idx + 1, bad = false, obj = {};
      var parts = line.split(spec.sep).map(function (s) { return s.trim(); });
      if (parts.length < spec.min || (spec.max && parts.length > spec.max)) { problems.push("Line " + n + " needs " + spec.need + "."); return; }
      spec.cols.forEach(function (c, j) {
        var val = parts[j];
        if (val === undefined || val === "") return;
        if (c[1] === "n") {
          var num = Number(val);
          if (!isFinite(num)) { problems.push("Line " + n + ": " + c[2] + " must be a number."); bad = true; } else obj[c[0]] = num;
        } else if (c[1] === "l") {
          var items = val.split(spec.item).map(function (s) { return s.trim(); }).filter(Boolean);
          if (items.length) obj[c[0]] = items;
        } else if (c[1] === "e") {
          var pick = val.toLowerCase().replace(/\s+/g, "_");
          if (c[3].indexOf(pick) < 0) { problems.push("Line " + n + ": " + c[2] + " must be " + words(c[3]) + "."); bad = true; } else obj[c[0]] = pick;
        } else {
          obj[c[0]] = val;
        }
      });
      if (spec.rest) {
        var rest = parts.slice(spec.cols.length).filter(Boolean);
        if (rest.length) obj[spec.rest] = rest;
      }
      if (!bad) out.push(obj);
    });
    return out;
  }

  function collect(form) {
    var input = {}, problems = [];
    // R12-13: an input named "parent.part" fills one part of the object "parent"
    var put = function (key, value) {
      var dot = key.indexOf(".");
      if (dot < 1) { input[key] = value; return; }
      var parent = key.slice(0, dot);
      if (!input[parent] || typeof input[parent] !== "object") input[parent] = {};
      input[parent][key.slice(dot + 1)] = value;
    };
    form.querySelectorAll("[data-kind]").forEach(function (el) {
      var kind = el.getAttribute("data-kind"), key = el.name, v;
      if (kind === "boolean") { if (el.checked) put(key, true); return; }
      v = (el.value || "").trim();
      if (v === "") return;
      if (kind === "number") {
        var n = Number(v.replace(/,/g, ""));
        if (!isFinite(n)) problems.push(key + " must be a number."); else put(key, n);
      } else if (kind === "lines") {
        put(key, v.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean));
      } else if (kind === "rows") {
        var spec = {};
        try { spec = JSON.parse(el.getAttribute("data-rows") || "{}"); } catch (err) { spec = {}; }
        var list = rows(el.value || "", spec, problems);
        if (list.length) put(key, list);
      } else if (kind === "json") {
        try { put(key, JSON.parse(v)); } catch (err) { problems.push(key + " is not valid JSON."); }
      } else {
        put(key, v);
      }
    });
    var hp = form.querySelector('[name="leave_this_empty"]');
    return { input: input, problems: problems, hp: hp ? hp.value : "" };
  }

  // R12-11 i (SH-M7): smooth scroll only when reduced motion is off; then focus moves to the result (tabindex -1, set below)
  function show(section, html) {
    section.hidden = false;
    var result = section.querySelector("[data-result]");
    result.innerHTML = html;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    section.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    if (result.focus) { try { result.focus({ preventScroll: true }); } catch (err) { result.focus(); } }
  }

  document.querySelectorAll("form.hx-form").forEach(function (form) {
    var section = document.getElementById("result");
    var body = section && section.querySelector("[data-result]");
    var lastText = "";
    form.addEventListener("submit", function (ev) {
      if (!window.fetch || !section) return;
      ev.preventDefault();
      var c = collect(form);
      if (c.problems.length) { show(section, '<div class="hx-error"><ul>' + c.problems.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ul></div>"); return; }
      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      var label = btn.textContent;
      btn.textContent = "Running...";
      fetch(form.getAttribute("action"), {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ input: c.input, leave_this_empty: c.hp })
      }).then(function (r) {
        return r.json().catch(function () { return { ok: false, error: r.status === 429 ? "Too many requests from your address. Wait a minute and try again." : "The server did not answer (status " + r.status + ")." }; });
      }).then(function (data) {
        if (data.ok) {
          lastText = data.text || "";
          show(section, markdown(lastText));
          // A2.4: say so when this answer came from the made-up example (R10-16: hidden again as soon as the visitor edits the form)
          var exNote = section.querySelector("[data-example-note]");
          var fromEx = form.getAttribute("data-from-example") === "1";
          if (exNote) exNote.hidden = !fromEx;
          // D22: the date the answer was made (the visitor's clock) and what it was based on
          var day = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
          section.querySelectorAll("[data-hxr-date]").forEach(function (el) { el.textContent = day; });
          var basis = section.querySelector("[data-hxr-basis]");
          if (basis) basis.textContent = fromEx ? "Based on the made-up example inputs" : "Based on what you entered";
        } else {
          var errs = data.errors || [data.error || "Something went wrong."];
          show(section, '<div class="hx-error"><p><strong>Could not run the tool.</strong></p><ul>' + errs.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ul></div>");
        }
      }).catch(function () {
        show(section, '<div class="hx-error"><p>The request did not reach the server. Check your connection and try again.</p></div>');
      }).then(function () { btn.disabled = false; btn.textContent = label; });
    });

    var fill = form.querySelector("[data-fill-example]");
    var exEl = form.parentNode.querySelector("script[data-example]");
    if (fill && exEl) {
      var example = {};
      try { example = JSON.parse(exEl.textContent || "{}"); } catch (err) { example = {}; }
      if (!Object.keys(example).length) fill.hidden = true;
      // R10-16: the made-up example note hides as soon as the visitor edits any field (or clears the form), not on the next Run
      var hideNote = function () {
        form.removeAttribute("data-from-example");
        var n = section && section.querySelector("[data-example-note]");
        if (n) n.hidden = true;
      };
      form.addEventListener("input", hideNote);
      form.addEventListener("change", hideNote);
      form.addEventListener("reset", hideNote);
      fill.addEventListener("click", function () {
        form.reset();
        Object.keys(example).forEach(function (k) {
          var el = form.querySelector('[name="' + k + '"]');
          if (!el) return;
          if (el.type === "checkbox") el.checked = example[k] === true || example[k] === "true";
          else el.value = example[k];
        });
        form.setAttribute("data-from-example", "1");
        if (form.requestSubmit) form.requestSubmit(); else form.querySelector('[type="submit"]').click();
      });
      if (/(^|[?&])example=1(&|$)/.test(location.search) && Object.keys(example).length) fill.click();
    }
    var copy = section && section.querySelector("[data-copy]");
    if (copy) {
      copy.addEventListener("click", function () {
        if (navigator.clipboard && lastText) navigator.clipboard.writeText(lastText).then(function () { copy.textContent = "Copied"; setTimeout(function () { copy.textContent = "Copy the result"; }, 1500); });
      });
    }
    if (body) body.setAttribute("tabindex", "-1");
  });

  // D22: "Print or save as PDF" is the browser's own print. With no Run result, the Example answer is opened first.
  document.querySelectorAll("[data-print]").forEach(function (b) { b.addEventListener("click", function () { window.print(); }); });
  var opened = [];
  window.addEventListener("beforeprint", function () {
    var res = document.getElementById("result");
    if (res && !res.hidden) return;
    document.querySelectorAll(".hxr-example details:not([open])").forEach(function (d) { d.open = true; opened.push(d); });
  });
  window.addEventListener("afterprint", function () { opened.forEach(function (d) { d.open = false; }); opened = []; });

  // Home and hub "Try it with an example" cards link to #ex-h: open the example on arrival so the answer shows first screen.
  if (location.hash === "#ex-h") {
    document.querySelectorAll(".hxr-example details").forEach(function (d) { d.open = true; });
    var exTarget = document.getElementById("ex-h");
    if (exTarget) exTarget.scrollIntoView();
  }
})();
