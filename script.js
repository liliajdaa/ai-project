/* AI ≠ magic — interactions
   1. Next-word demo in the hero (illustration with invented odds).
   2. Case-study tabs (ARIA tabs pattern, arrow keys, Home/End).
   3. Highlights the current section in the navigation.
   Without this file the page still works: the demo shows its first
   step and both case studies are visible. */

(function () {
  "use strict";

  // ---------- 1. Next-word demo ----------
  // Invented probabilities: the point is that the model picks what is LIKELY.
  var STEPS = {
    start: [["a tool", 34], ["everywhere", 27], ["overhyped", 21], ["dangerous", 18]],
    "a tool": [["that predicts", 46], ["we must check", 31], ["like any other", 23]],
    "everywhere": [["already", 44], ["but invisible", 33], ["in your phone", 23]],
    "overhyped": [["and underestimated", 40], ["in the short term", 35], ["by marketing", 25]],
    "dangerous": [["without supervision", 50], ["in the wrong hands", 30], ["for some jobs", 20]]
  };
  var BASE = "Artificial intelligence is";
  var sentence = document.getElementById("sentence");
  var list = document.getElementById("options");
  var button = document.getElementById("next-word");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (sentence && list && button) {
    var state = "start", picked = [], busy = false;

    function render(options) {
      list.innerHTML = options.map(function (o) {
        return '<li><span class="word">' + o[0] + '</span><span class="bar"><span style="width:0%" data-w="' + o[1] + '"></span></span><span class="pct">' + o[1] + "%</span></li>";
      }).join("");
      // animate bars in on the next frame
      requestAnimationFrame(function () {
        list.querySelectorAll("[data-w]").forEach(function (b) { b.style.width = b.getAttribute("data-w") + "%"; });
      });
    }

    function weightedPick(options) {
      var total = options.reduce(function (s, o) { return s + o[1]; }, 0);
      var r = Math.random() * total;
      for (var i = 0; i < options.length; i++) { r -= options[i][1]; if (r <= 0) return i; }
      return 0;
    }

    function step() {
      if (busy) return;
      if (state === "done") { // reset
        state = "start"; picked = [];
        sentence.textContent = BASE;
        render(STEPS.start);
        button.textContent = "Predict next words";
        return;
      }
      busy = true;
      var options = STEPS[state];
      var i = weightedPick(options);
      list.children[i].classList.add("picked");
      setTimeout(function () {
        picked.push(options[i][0]);
        var added = document.createElement("span");
        added.className = "added";
        added.textContent = " " + options[i][0];
        sentence.appendChild(added);
        if (state === "start") {
          state = options[i][0];
          render(STEPS[state]);
          button.textContent = "Predict next words";
        } else {
          sentence.appendChild(document.createTextNode("."));
          state = "done";
          button.textContent = "Write it again";
        }
        busy = false;
      }, reduce ? 0 : 650);
    }

    button.hidden = false;
    button.addEventListener("click", step);
  }

  // ---------- 2. Tabs ----------
  document.querySelectorAll("[data-tabs]").forEach(function (box) {
    var tablist = box.querySelector('[role="tablist"]');
    var tabs = Array.prototype.slice.call(box.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute("aria-controls")); });

    tablist.hidden = false;
    box.classList.add("js");

    function select(i, focus) {
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        panels[k].hidden = !on;
      });
      if (focus) tabs[i].focus();
    }

    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(i, false); });
      t.addEventListener("keydown", function (e) {
        var n = tabs.length, next = null;
        if (e.key === "ArrowRight") next = (i + 1) % n;
        if (e.key === "ArrowLeft") next = (i - 1 + n) % n;
        if (e.key === "Home") next = 0;
        if (e.key === "End") next = n - 1;
        if (next !== null) { e.preventDefault(); select(next, true); }
      });
    });

    panels.forEach(function (p) { p.tabIndex = 0; });
    select(0, false);
  });

  // ---------- 3. Current section in the nav ----------
  var links = Array.prototype.slice.call(document.querySelectorAll('.site-header nav a[href^="#"]'));
  if (!("IntersectionObserver" in window) || !links.length) return;
  var byId = {};
  links.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      links.forEach(function (a) { a.removeAttribute("aria-current"); });
      var link = byId[entry.target.id];
      if (link) link.setAttribute("aria-current", "true");
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  Object.keys(byId).forEach(function (id) {
    var section = document.getElementById(id);
    if (section) observer.observe(section);
  });
})();
