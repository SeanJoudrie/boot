/* Basic — boot camp journal. Vanilla JS, no build step, works from file://. */
(function () {
  "use strict";

  var J = window.JOURNAL || { entries: [], chapters: [], stats: {} };
  var Q = window.QUESTIONS || { questions: [], cats: [] };
  var ART = window.ART || {};

  var entries = J.entries;
  var byId = {};
  entries.forEach(function (e) { byId[e.id] = e; });

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ── theme ──────────────────────────────────────────────── */
  var root = document.documentElement;

  // Only ever stamp data-theme for an explicit choice. With nothing stamped the
  // CSS media query handles "system", which is what most viewers are on.
  function effectiveTheme() {
    var a = root.getAttribute("data-theme");
    if (a === "dark" || a === "light") return a;
    return (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches)
      ? "dark" : "light";
  }
  try {
    var saved = localStorage.getItem("basic-theme");
    if (saved === "dark" || saved === "light") root.setAttribute("data-theme", saved);
  } catch (e) {}

  $("#theme").addEventListener("click", function () {
    var next = effectiveTheme() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("basic-theme", next); } catch (e) {}
  });

  /* ── stats ──────────────────────────────────────────────── */
  function setText(sel, v) { var n = $(sel); if (n) n.textContent = v; }
  setText("#stPages", J.stats.pages);
  setText("#stWords", (J.stats.words || 0).toLocaleString());
  setText("#stQ", Q.questions.length);
  setText("#stQ2", Q.questions.length);
  setText("#stArt", J.stats.art);

  /* ── render journal ─────────────────────────────────────── */
  function artHTML(entry, block, idx) {
    var slot = entry.id + "-" + idx;
    var cfg = ART[slot];
    var caption = esc((cfg && cfg.caption) || block.x);
    if (cfg && cfg.src) {
      return '<figure class="art has-img"><img src="' + esc(cfg.src) + '" alt="' +
        esc(cfg.alt || block.x) + '" loading="lazy">' +
        '<figcaption>' + caption + '</figcaption></figure>';
    }
    return '<figure class="art"><span class="art-ico" aria-hidden="true">✎</span>' +
      '<figcaption>' + caption + '</figcaption>' +
      '<span class="slot">drawing not scanned yet · ' + slot + '</span></figure>';
  }

  function pageHTML(e) {
    var art = 0;
    var body = e.blocks.map(function (b) {
      if (b.t === "p") return "<p>" + esc(b.x) + "</p>";
      if (b.t === "art") { art++; return artHTML(e, b, art); }
      return '<p class="redacted">[' + esc(b.x) + "]</p>";
    }).join("");

    // the notebook's own heading, unless it just repeats the date above it
    var head = "";
    if (e.head && e.head !== e.pretty)
      head = '<div class="written-head">' + esc(e.head) + "</div>";

    var dateBits = "";
    if (e.pretty) {
      dateBits = '<span class="date">' + (e.approx ? '<span class="approx">≈ </span>' : "") +
        esc(e.pretty) + "</span>";
      if (e.dow) dateBits += '<span class="dow">' + esc(e.dow) + "</span>";
    }
    var day = e.day ? '<span class="dayn">day ' + e.day + " of 74</span>" : "";

    return '<article class="sheet" id="' + e.id + '" data-ch="' + e.ch + '" data-n="' + e.n + '">' +
      '<div class="sheet-head"><span class="pg">page ' + e.n + "</span>" + dateBits + day + "</div>" +
      head + "<h3>" + esc(e.title) + "</h3>" + body + "</article>";
  }

  $("#pages").innerHTML = entries.map(pageHTML).join("");

  $("#chapters").innerHTML = J.chapters.filter(function (c) { return c.count; })
    .map(function (c) {
      return '<li><button data-ch="' + c.key + '" data-first="' + c.first + '">' +
        esc(c.name) + "<small>" + esc(c.span) + " · " + c.count + " pp</small></button></li>";
    }).join("");

  $("#chapters").addEventListener("click", function (ev) {
    var b = ev.target.closest("button");
    if (b) goToPage(b.getAttribute("data-first"));
  });

  /* ── views ──────────────────────────────────────────────── */
  var views = { journal: $("#view-journal"), ask: $("#view-ask"), about: $("#view-about") };
  var current = "journal";

  function show(name, keepScroll) {
    if (!views[name]) name = "journal";
    current = name;
    Object.keys(views).forEach(function (k) { views[k].hidden = k !== name; });
    $$(".tab").forEach(function (t) { t.classList.toggle("is-on", t.getAttribute("data-view") === name); });
    if (!keepScroll) window.scrollTo(0, 0);
  }

  $$(".tab").forEach(function (t) {
    t.addEventListener("click", function () { show(t.getAttribute("data-view")); });
  });

  /* ── navigating to a page ───────────────────────────────── */
  function goToPage(id) {
    var el = document.getElementById(id);
    if (!el) return;
    show("journal", true);
    // let the browser lay out the now-visible view before measuring
    requestAnimationFrame(function () {
      // smooth for a step or two; instant for a long jump across the book,
      // otherwise a citation from page 3 to page 92 flies for several seconds
      var far = Math.abs(el.getBoundingClientRect().top) > window.innerHeight * 2.5;
      var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: (far || reduce) ? "auto" : "smooth", block: "start" });
      $$(".sheet.is-target").forEach(function (n) { n.classList.remove("is-target"); });
      void el.offsetWidth;
      el.classList.add("is-target");
      if (history.replaceState) history.replaceState(null, "", "#" + id);
      else location.hash = id;
    });
  }

  document.addEventListener("click", function (ev) {
    var a = ev.target.closest("a[data-page]");
    if (!a) return;
    ev.preventDefault();
    goToPage(a.getAttribute("data-page"));
  });

  $("#jump").addEventListener("keydown", function (ev) {
    if (ev.key !== "Enter") return;
    var n = parseInt(this.value, 10);
    if (n >= 1 && n <= entries.length) goToPage("p" + n);
    else toast("There are " + entries.length + " pages.");
  });

  /* ── questions ──────────────────────────────────────────── */
  function pageRef(id) {
    var e = byId[id];
    if (!e) return esc(id);
    return '<a href="#' + id + '" data-page="' + id + '">page ' + e.n +
      (e.pretty ? " · " + esc(e.pretty) : "") + "</a>";
  }

  function answerHTML(q) {
    var html = q.a.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");
    if (q.pulls.length) {
      html += '<div class="receipts"><h4>From the journal</h4>' +
        q.pulls.map(function (pu) {
          return '<blockquote class="pull"><q>' + esc(pu.x) + "</q>" + pageRef(pu.p) + "</blockquote>";
        }).join("");
      var extra = q.cites.filter(function (id) {
        return !q.pulls.some(function (pu) { return pu.p === id; });
      });
      if (extra.length) {
        html += '<p class="alsosee">Also on ' + extra.map(function (id) {
          var e = byId[id];
          return '<a href="#' + id + '" data-page="' + id + '">page ' + (e ? e.n : id) + "</a>";
        }).join(", ") + ".</p>";
      }
      html += "</div>";
    }
    return '<div class="answer">' + html + "</div>";
  }

  function renderQuestions(list) {
    var host = $("#questions");
    if (!list.length) { host.innerHTML = ""; $("#qEmpty").hidden = false; return; }
    $("#qEmpty").hidden = true;
    var groups = [];
    var seen = {};
    list.forEach(function (q) {
      if (!seen[q.cat]) { seen[q.cat] = []; groups.push(q.cat); }
      seen[q.cat].push(q);
    });
    host.innerHTML = groups.map(function (cat) {
      return '<section class="qgroup"><h2>' + esc(cat) + "</h2>" +
        seen[cat].map(function (q) {
          return '<div class="qa" id="q-' + q.id + '">' +
            '<button type="button" aria-expanded="false"><span>' + esc(q.q) +
            '</span><span class="chev" aria-hidden="true">▸</span></button></div>';
        }).join("") + "</section>";
    }).join("");
  }

  $("#questions").addEventListener("click", function (ev) {
    var btn = ev.target.closest(".qa > button");
    if (!btn) return;
    var box = btn.parentNode;
    var open = box.classList.contains("open");
    if (open) {
      box.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
      var a = $(".answer", box); if (a) a.remove();
      return;
    }
    var id = box.id.slice(2);
    var q = Q.questions.filter(function (x) { return x.id === id; })[0];
    if (!q) return;
    box.classList.add("open");
    btn.setAttribute("aria-expanded", "true");
    box.insertAdjacentHTML("beforeend", answerHTML(q));
    if (history.replaceState) history.replaceState(null, "", "#q-" + id);
  });

  var activeCat = null;
  function renderCats() {
    $("#cats").innerHTML = ['<button data-cat="">All ' + Q.questions.length + "</button>"]
      .concat(Q.cats.map(function (c) {
        var n = Q.questions.filter(function (q) { return q.cat === c; }).length;
        return '<button data-cat="' + esc(c) + '">' + esc(c) + " " + n + "</button>";
      })).join("");
    $$("#cats button").forEach(function (b) {
      b.classList.toggle("is-on", (b.getAttribute("data-cat") || null) === activeCat);
    });
  }

  $("#cats").addEventListener("click", function (ev) {
    var b = ev.target.closest("button");
    if (!b) return;
    activeCat = b.getAttribute("data-cat") || null;
    renderCats();
    renderQuestions(activeCat ? Q.questions.filter(function (q) { return q.cat === activeCat; }) : Q.questions);
  });

  renderCats();
  renderQuestions(Q.questions);

  /* ── search ─────────────────────────────────────────────── */
  var searchBox = $("#q");
  var resultsHost = document.createElement("div");
  resultsHost.className = "results wrap";
  resultsHost.hidden = true;
  $("#view-journal").appendChild(resultsHost);

  function snippet(text, term) {
    var i = text.toLowerCase().indexOf(term);
    if (i < 0) return text.slice(0, 150) + "…";
    var from = Math.max(0, i - 60);
    var raw = (from ? "…" : "") + text.slice(from, i + term.length + 110) + "…";
    return esc(raw).replace(new RegExp("(" + term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig"),
      "<mark>$1</mark>");
  }

  function runSearch(term) {
    term = term.trim().toLowerCase();
    var layout = $(".layout"), cover = $("#cover");
    if (term.length < 2) {
      resultsHost.hidden = true;
      layout.style.display = "";
      cover.style.display = "";
      renderQuestions(activeCat ? Q.questions.filter(function (q) { return q.cat === activeCat; }) : Q.questions);
      return;
    }
    // questions
    renderQuestions(Q.questions.filter(function (q) {
      return (q.q + " " + q.a.join(" ") + " " + q.cat).toLowerCase().indexOf(term) >= 0;
    }));
    // journal
    var hits = [];
    entries.forEach(function (e) {
      var text = e.blocks.filter(function (b) { return b.t === "p"; })
        .map(function (b) { return b.x; }).join(" ");
      var hay = (e.title + " " + (e.head || "") + " " + text).toLowerCase();
      if (hay.indexOf(term) >= 0) hits.push({ e: e, text: text });
    });
    resultsHost.hidden = false;
    layout.style.display = "none";
    cover.style.display = "none";
    resultsHost.innerHTML = '<h2>' + hits.length + ' page' + (hits.length === 1 ? "" : "s") +
      ' matching “' + esc(term) + '”</h2>' +
      (hits.length ? hits.map(function (h) {
        return '<a class="hit" href="#' + h.e.id + '" data-page="' + h.e.id + '">' +
          "<b>" + esc(h.e.title) + "</b><em>page " + h.e.n +
          (h.e.pretty ? " · " + esc(h.e.pretty) : "") + "</em>" +
          "<span>" + snippet(h.text, term) + "</span></a>";
      }).join("") : '<p class="empty">Nothing in the journal. The Ask tab is still filtered though.</p>');
  }

  var t = null;
  searchBox.addEventListener("input", function () {
    clearTimeout(t);
    var v = this.value;
    t = setTimeout(function () { runSearch(v); }, 130);
  });
  searchBox.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") { this.value = ""; runSearch(""); this.blur(); }
  });

  /* ── keyboard ───────────────────────────────────────────── */
  // the first page still showing below the sticky header
  function visiblePage() {
    var sheets = $$(".sheet");
    for (var i = 0; i < sheets.length; i++) {
      if (sheets[i].getBoundingClientRect().bottom > 80) return sheets[i];
    }
    return sheets[sheets.length - 1] || null;
  }

  document.addEventListener("keydown", function (ev) {
    var tag = (ev.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || ev.metaKey || ev.ctrlKey || ev.altKey) return;
    if (ev.key === "/") { ev.preventDefault(); searchBox.focus(); searchBox.select(); return; }
    if (current !== "journal" || !resultsHost.hidden) return;
    var dir = 0;
    if (ev.key === "j" || ev.key === "ArrowDown") dir = 1;
    if (ev.key === "k" || ev.key === "ArrowUp") dir = -1;
    if (!dir) return;
    var cur = visiblePage();
    if (!cur) return;
    var n = parseInt(cur.getAttribute("data-n"), 10) + dir;
    if (n < 1 || n > entries.length) return;
    ev.preventDefault();
    goToPage("p" + n);
  });

  /* ── scroll: progress + active chapter ──────────────────── */
  var bar = $("#progressBar");
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0) + "%";
      if (current !== "journal" || !resultsHost.hidden) return;
      var cur = visiblePage();
      if (!cur) return;
      var ch = cur.getAttribute("data-ch");
      $$("#chapters button").forEach(function (b) {
        b.classList.toggle("is-on", b.getAttribute("data-ch") === ch);
      });
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ── toast ──────────────────────────────────────────────── */
  var toastEl = $("#toast"), toastT = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.hidden = true; }, 2200);
  }

  /* ── deep links ─────────────────────────────────────────── */
  function openHash() {
    var h = location.hash.slice(1);
    if (!h) return;
    if (h.indexOf("q-") === 0) {
      show("ask", true);
      var box = document.getElementById(h);
      if (box) {
        var btn = $("button", box);
        if (btn && !box.classList.contains("open")) btn.click();
        box.scrollIntoView({ block: "center", behavior: "auto" });
      }
      return;
    }
    if (byId[h]) goToPage(h);
  }
  window.addEventListener("hashchange", openHash);
  openHash();
})();
