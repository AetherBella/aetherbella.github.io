/* Shared behaviour for the homepage and the case-study pages.
   Every block checks that its elements exist, so one file serves all pages. */
(function () {
  "use strict";

  var root = document.documentElement;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };
  var announcer = $("#copy-status");
  var announce = function (msg) { if (announcer) announcer.textContent = msg; };

  /* Theme toggle (stored choice is applied before paint by the inline head script). */
  var themeBtn = $("#theme");
  var themeIcon = $("#theme-icon");
  var themeMeta = $('meta[name="theme-color"]');
  var currentTheme = function () { return root.getAttribute("data-theme") === "light" ? "light" : "dark"; };
  var syncTheme = function () {
    var t = currentTheme();
    if (themeIcon) themeIcon.setAttribute("href", t === "dark" ? "#i-sun" : "#i-moon");
    if (themeBtn) themeBtn.setAttribute("aria-label", t === "dark" ? "Switch to light theme" : "Switch to dark theme");
    if (themeMeta) themeMeta.setAttribute("content", t === "dark" ? "#050807" : "#eef2ef");
  };
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.classList.add("theming");
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("apab-theme", next); } catch (e) {}
      syncTheme();
      window.setTimeout(function () { root.classList.remove("theming"); }, 240);
    });
  }
  syncTheme();

  /* Sources toggle: reveals the citation under every figure. */
  var sourcesBtn = $("#sources");
  var sourcesN = $("#sources-n");
  var cites = $$(".cite");
  var syncSources = function () {
    if (sourcesBtn) sourcesBtn.setAttribute("aria-pressed", root.classList.contains("sources-on") ? "true" : "false");
  };
  if (sourcesN) sourcesN.textContent = cites.length ? " · " + cites.length : "";
  if (sourcesBtn) {
    if (!cites.length) sourcesBtn.hidden = true;
    sourcesBtn.addEventListener("click", function () {
      var on = root.classList.toggle("sources-on");
      try { localStorage.setItem("apab-sources", on ? "on" : "off"); } catch (e) {}
      syncSources();
    });
  }
  syncSources();

  /* Skills counters. */
  var groups = $$(".skillgroup");
  if (groups.length) {
    var items = $$(".skillgroup li");
    var withCase = items.filter(function (li) { return !!$(".fn a", li); });
    var set = function (id, v) { var el = $(id); if (el) el.textContent = String(v); };
    set("#c-listed", items.length);
    set("#c-groups", groups.length);
    set("#c-cases", withCase.length);
  }

  /* Navigation: mobile menu, active link indicator, stuck border. */
  var nav = $("#nav");
  var links = $("#navlinks");
  var toggle = $("#navtoggle");
  var toggleIcon = $("#navtoggle-icon");
  var navAnchors = links ? $$("a", links) : [];
  var ind = $("#navind");

  var setMenu = function (open) {
    if (!links || !toggle) return;
    links.setAttribute("data-open", open ? "true" : "false");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (toggleIcon) toggleIcon.setAttribute("href", open ? "#i-close" : "#i-menu");
  };
  var placeIndicator = function () {
    if (!ind || !links) return;
    var active = navAnchors.filter(function (a) {
      var c = a.getAttribute("aria-current");
      return c === "true" || c === "page";
    })[0];
    if (!active || window.innerWidth <= 960) { ind.setAttribute("data-on", "false"); return; }
    ind.style.width = active.offsetWidth + "px";
    ind.style.transform = "translateX(" + active.offsetLeft + "px)";
    ind.setAttribute("data-on", "true");
  };
  var setActive = function (id) {
    navAnchors.forEach(function (a) {
      var href = a.getAttribute("href") || "";
      if (href === "#" + id) a.setAttribute("aria-current", "true");
      else if (a.getAttribute("aria-current") === "true") a.removeAttribute("aria-current");
    });
    placeIndicator();
  };
  if (toggle) {
    toggle.addEventListener("click", function () { setMenu(links.getAttribute("data-open") !== "true"); });
    navAnchors.forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && links.getAttribute("data-open") === "true") { setMenu(false); toggle.focus(); }
    });
  }
  var sections = navAnchors
    .map(function (a) { var h = a.getAttribute("href") || ""; return h.charAt(0) === "#" ? document.getElementById(h.slice(1)) : null; })
    .filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    var seen = {};
    var secObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { seen[en.target.id] = en.isIntersecting; });
      for (var i = sections.length - 1; i >= 0; i--) {
        if (seen[sections[i].id]) { setActive(sections[i].id); return; }
      }
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    sections.forEach(function (s) { secObs.observe(s); });
  }
  var stick = function () { if (nav) nav.setAttribute("data-stuck", window.scrollY > 8 ? "true" : "false"); };
  window.addEventListener("scroll", stick, { passive: true });
  stick();
  var resizeT = null;
  window.addEventListener("resize", function () { window.clearTimeout(resizeT); resizeT = window.setTimeout(placeIndicator, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeIndicator); else placeIndicator();

  /* Reading progress bar fallback (CSS scroll timelines handle modern browsers). */
  var bar = $("#progress");
  var cssTimeline = window.CSS && CSS.supports && CSS.supports("animation-timeline: scroll()");
  if (bar && !cssTimeline) {
    var ticking = false;
    var updateBar = function () {
      ticking = false;
      var max = root.scrollHeight - root.clientHeight;
      bar.style.setProperty("--progress", String(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0));
    };
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; window.requestAnimationFrame(updateBar); } }, { passive: true });
    window.addEventListener("resize", updateBar);
    updateBar();
  }

  /* Scroll reveal and one-shot "in view" flags (stat bars). */
  var revealables = $$("[data-reveal], #stats");
  var showAll = function () {
    revealables.forEach(function (el) { el.classList.add("is-in"); el.setAttribute("data-in", "true"); });
  };
  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    showAll();
  } else {
    var revObs = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-in");
        en.target.setAttribute("data-in", "true");
        obs.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealables.forEach(function (el) { revObs.observe(el); });
  }
  var onMotionChange = function () { if (reducedMotion.matches) showAll(); };
  if (reducedMotion.addEventListener) reducedMotion.addEventListener("change", onMotionChange);
  else if (reducedMotion.addListener) reducedMotion.addListener(onMotionChange);

  /* Case-study table of contents: highlight the section being read. */
  var tocLinks = $$(".cs-toc a");
  if (tocLinks.length && "IntersectionObserver" in window) {
    var tocTargets = tocLinks.map(function (a) { return document.getElementById((a.getAttribute("href") || "").slice(1)); }).filter(Boolean);
    var tocSeen = {};
    var tocObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { tocSeen[en.target.id] = en.isIntersecting; });
      var current = null;
      for (var i = 0; i < tocTargets.length; i++) { if (tocSeen[tocTargets[i].id]) { current = tocTargets[i].id; break; } }
      if (!current) return;
      tocLinks.forEach(function (a) {
        if (a.getAttribute("href") === "#" + current) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    }, { rootMargin: "-20% 0px -60% 0px", threshold: 0 });
    tocTargets.forEach(function (t) { tocObs.observe(t); });
  }

  /* Copy-to-clipboard buttons in the contact table. */
  $$(".copy").forEach(function (btn) {
    var timer = null;
    btn.addEventListener("click", function () {
      var value = btn.getAttribute("data-copy") || "";
      var use = $("use", btn);
      window.clearTimeout(timer);
      var fail = function (msg) {
        if (use) use.setAttribute("href", "#i-close");
        btn.removeAttribute("data-done");
        btn.setAttribute("data-failed", "true");
        announce(msg);
        timer = window.setTimeout(function () {
          if (use) use.setAttribute("href", "#i-copy");
          btn.removeAttribute("data-failed");
          announce("");
        }, 2400);
      };
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        fail("Copying is not available in this browser. The details are in the row beside this button.");
        return;
      }
      navigator.clipboard.writeText(value).then(function () {
        if (use) use.setAttribute("href", "#i-check");
        btn.removeAttribute("data-failed");
        btn.setAttribute("data-done", "true");
        announce("Copied " + value);
        timer = window.setTimeout(function () {
          if (use) use.setAttribute("href", "#i-copy");
          btn.removeAttribute("data-done");
          announce("");
        }, 1600);
      }, function () { fail("Could not copy. The details are in the row beside this button."); });
    });
  });

  /* Screenshot slots: show the image only once the file actually exists. */
  $$(".slot[data-slot]").forEach(function (slot) {
    var shot = $(".slot-shot", slot);
    var img = shot ? $("img", shot) : null;
    var code = $(".slot-file code", slot);
    var path = code ? (code.textContent || "").trim() : "";
    if (!shot || !img || !path) return;
    var probe = new Image();
    probe.onload = function () {
      img.src = path;
      img.hidden = false;
      shot.hidden = false;
      var inner = $(".slot-inner", slot);
      if (inner) inner.remove();
      slot.setAttribute("data-state", "filled");
    };
    probe.src = path;
  });

  /* Lightbox for any .slot-shot button. */
  var lb = $("#lightbox");
  var lbImg = $("#lightbox-img");
  var lbCap = $("#lightbox-cap");
  var lbClose = $("#lightbox-close");
  var page = $(".page");
  var lastFocus = null;
  var prevOverflow = "";
  var setInert = function (on) {
    if (!page) return;
    page.inert = on;
    if (on) page.setAttribute("aria-hidden", "true"); else page.removeAttribute("aria-hidden");
  };
  var closeLb = function () {
    if (!lb || lb.hidden) return;
    lb.hidden = true;
    setInert(false);
    document.body.style.overflow = prevOverflow;
    if (lbImg) { lbImg.removeAttribute("src"); lbImg.alt = ""; }
    if (lastFocus) { lastFocus.focus(); lastFocus = null; }
  };
  if (lb && lbImg) {
    document.addEventListener("click", function (e) {
      var trigger = e.target.closest ? e.target.closest(".slot-shot") : null;
      if (!trigger) return;
      var img = $("img", trigger);
      var src = img ? (img.currentSrc || img.getAttribute("src")) : null;
      if (!src) return;
      var fig = trigger.closest(".slot, figure");
      var cap = fig ? $("figcaption", fig) : null;
      lbImg.src = src;
      lbImg.alt = img.alt || "";
      if (lbCap) lbCap.textContent = cap ? cap.textContent.trim() : "";
      lb.hidden = false;
      prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      setInert(true);
      lastFocus = trigger;
      if (lbClose) lbClose.focus();
    });
    if (lbClose) lbClose.addEventListener("click", closeLb);
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") { closeLb(); return; }
      if (e.key === "Tab" && lbClose) { e.preventDefault(); lbClose.focus(); }
    });
  }

  /* Click-to-load dashboard embeds: nothing is requested until the click. */
  $$(".slot--embed").forEach(function (slot) {
    var url = (slot.getAttribute("data-embed") || "").trim();
    var loadBtn = $(".embed-load", slot);
    var inner = $(".slot-inner", slot);
    if (!url || !loadBtn) return;
    if (inner) inner.remove();
    loadBtn.hidden = false;
    slot.setAttribute("data-state", "ready");
    loadBtn.addEventListener("click", function () {
      var frame = document.createElement("iframe");
      frame.className = "embed-frame";
      frame.src = url;
      frame.title = slot.getAttribute("data-embed-title") || "Interactive dashboard";
      frame.loading = "lazy";
      frame.setAttribute("allowfullscreen", "");
      frame.referrerPolicy = "no-referrer-when-downgrade";
      loadBtn.replaceWith(frame);
      slot.setAttribute("data-state", "live");
      frame.focus();
      announce("Dashboard loaded.");
    });
  });
})();
