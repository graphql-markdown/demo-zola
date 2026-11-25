(function () {
  var root = document.documentElement;
  var modes = ["auto", "light", "dark"];
  var mode = "auto";
  try { mode = localStorage.getItem("theme") || "auto"; } catch (e) {}
  if (modes.indexOf(mode) < 0) mode = "auto";
  var btn = document.querySelector(".theme-btn");
  function apply() {
    if (mode === "auto") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", mode);
    if (btn) btn.title = "Theme: " + mode;
  }
  apply();
  if (btn) btn.addEventListener("click", function () {
    mode = modes[(modes.indexOf(mode) + 1) % 3];
    try { if (mode === "auto") localStorage.removeItem("theme"); else localStorage.setItem("theme", mode); } catch (e) {}
    apply();
  });

  var menu = document.querySelector(".menu-btn");
  function setNav(open) {
    document.body.classList.toggle("nav-open", open);
    if (menu) menu.setAttribute("aria-expanded", String(open));
  }
  if (menu) menu.addEventListener("click", function () { setNav(!document.body.classList.contains("nav-open")); });
  var bd = document.querySelector(".backdrop");
  if (bd) bd.addEventListener("click", function () { setNav(false); });

  var input = document.getElementById("search");
  var list = document.getElementById("search-results");
  if (!input || !list || !window.elasticlunr || !window.searchIndex) return;
  var index = elasticlunr.Index.load(window.searchIndex);
  input.addEventListener("input", function () {
    var q = input.value.trim();
    list.textContent = "";
    if (!q) { list.hidden = true; return; }
    var res = index.search(q, { bool: "AND", expand: true }).slice(0, 10);
    res.forEach(function (r) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = r.ref;
      a.textContent = (r.doc && r.doc.title) || r.ref;
      li.appendChild(a);
      list.appendChild(li);
    });
    if (!res.length) {
      var li = document.createElement("li");
      li.textContent = "No results";
      li.style.padding = ".4rem .6rem";
      list.appendChild(li);
    }
    list.hidden = false;
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".search")) list.hidden = true;
  });
})();

// Entity headings: tag badges by kind, and turn `href="#"` self links into permalinks.
(function () {
  function run() {
    document.querySelectorAll("main.content .gqlmd-badge").forEach(function (b) {
      b.setAttribute("data-kind", b.textContent.trim().toLowerCase());
    });
    document.querySelectorAll("main.content :is(h3, h4, h5)[id] > a[href='#']").forEach(function (a) {
      a.href = "#" + a.parentElement.id;
      a.classList.add("gqlmd-permalink");
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
