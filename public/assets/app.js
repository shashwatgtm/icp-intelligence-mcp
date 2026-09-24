// Connector web app: runs a tool from its form and shows the answer. Without JavaScript the same form posts to the
// same endpoint and gets an HTML page back. Nothing typed is saved in the browser.
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
      if (h) { closeList(); var lv = Math.min(h[1].length + 1, 6); out.push("<h" + lv + ">" + inline(h[2]) + "</h" + lv + ">"); i++; continue; }
      if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { closeList(); out.push("<hr>"); i++; continue; }
      var ul = line.match(/^\s*[-*+]\s+(.*)$/), ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
      if (ul || ol) {
        var want = ul ? "ul" : "ol";
        if (list !== want) { closeList(); out.push("<" + want + ">"); list = want; }
        out.push("<li>" + inline((ul || ol)[1]) + "</li>");
        i++; continue;
      }
      var q = line.match(/^>\s?(.*)$/);
      if (q) { closeList(); out.push("<blockquote>" + inline(q[1]) + "</blockquote>"); i++; continue; }
      if (/^\s*$/.test(line)) { closeList(); i++; continue; }
      closeList();
      var para = [line];
      i++;
      while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|```|\s*[-*+]\s|\s*\d+[.)]\s|>|\s*\|)/.test(lines[i])) { para.push(lines[i]); i++; }
      out.push("<p>" + para.map(inline).join("<br>") + "</p>");
    }
    closeList();
    return out.join("\n");
  }

  function collect(form) {
    var input = {}, problems = [];
    form.querySelectorAll("[data-kind]").forEach(function (el) {
      var kind = el.getAttribute("data-kind"), key = el.name, v;
      if (kind === "boolean") { if (el.checked) input[key] = true; return; }
      v = (el.value || "").trim();
      if (v === "") return;
      if (kind === "number") {
        var n = Number(v.replace(/,/g, ""));
        if (!isFinite(n)) problems.push(key + " must be a number."); else input[key] = n;
      } else if (kind === "lines") {
        input[key] = v.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
      } else if (kind === "json") {
        try { input[key] = JSON.parse(v); } catch (err) { problems.push(key + " is not valid JSON."); }
      } else {
        input[key] = v;
      }
    });
    var hp = form.querySelector('[name="leave_this_empty"]');
    return { input: input, problems: problems, hp: hp ? hp.value : "" };
  }

  function show(section, html) {
    section.hidden = false;
    section.querySelector("[data-result]").innerHTML = html;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
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
      fill.addEventListener("click", function () {
        form.reset();
        Object.keys(example).forEach(function (k) {
          var el = form.querySelector('[name="' + k + '"]');
          if (!el) return;
          if (el.type === "checkbox") el.checked = example[k] === true || example[k] === "true";
          else el.value = example[k];
        });
      });
    }
    var copy = section && section.querySelector("[data-copy]");
    if (copy) {
      copy.addEventListener("click", function () {
        if (navigator.clipboard && lastText) navigator.clipboard.writeText(lastText).then(function () { copy.textContent = "Copied"; setTimeout(function () { copy.textContent = "Copy the result"; }, 1500); });
      });
    }
    if (body) body.setAttribute("tabindex", "-1");
  });
})();
