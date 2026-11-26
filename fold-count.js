// ===== Project pages: the counter on the sides, and the arrows to the other projects =====
// The counter (Figma: "3" on the left, "/  07" on the right): this project's number out of all the projects,
// like on the home page; it stays on the screen the whole way down the page.
// The arrows on the first screen lead to the previous and the next project (going round: after the last
// project comes the first).
(function () {
  // The projects in the order of their numbers on the home page (home.js); null = no page yet
  const PROJECTS = [
    "memory-lab.html",               // 1  The Memory Lab
    "sense.html",                    // 2  Sense Shopping
    "israeli-movie-archive.html",    // 3  The Israeli Movie Archive
    "israeli-cactus.html",           // 4  The Israeli Cactus
    "mea-shearim.html",              // 5  Mea Shearim (The Double Family is not numbered any more)
  ];
  const twoDigits = (n) => String(n).padStart(2, "0");
  const page = location.pathname.split("/").pop() || "";
  const number = PROJECTS.indexOf(page) + 1;   // this project's number (0 if unknown)

  // ----- The arrows: the nearest projects before and after this one that have a page -----
  function neighbour(step) {
    for (let k = 1; k <= PROJECTS.length; k++) {
      const i = ((number - 1 + step * k) % PROJECTS.length + PROJECTS.length) % PROJECTS.length;
      if (PROJECTS[i] && PROJECTS[i] !== page) return PROJECTS[i];
    }
    return null;
  }
  [[".project-arrow-prev", -1], [".project-arrow-next", 1]].forEach(([selector, step]) => {
    const arrow = document.querySelector(selector);
    const target = number ? neighbour(step) : null;
    if (arrow && target) arrow.href = target;
    else if (arrow) arrow.hidden = true;
  });

  // ----- The counter -----
  const now = document.querySelector(".fold-count-now");
  const total = document.querySelector(".fold-count-total");
  if (!now || !total) return;

  // Each side shows its text in a span; a new text rolls in over the old one
  const ROLL = 450;   // ms
  function show(side, text, forward, animate) {
    const old = side.querySelector(".fold-count-text");
    if (old && old.textContent === text) return;
    const fresh = document.createElement("span");
    fresh.className = "fold-count-text";
    fresh.textContent = text;
    side.textContent = "";
    if (old) side.appendChild(old);
    side.appendChild(fresh);
    if (!old || !animate) { if (old) old.remove(); return; }
    const ease = "cubic-bezier(0.65, 0, 0.35, 1)";
    const from = forward ? "110%" : "-110%";
    fresh.animate([{ translate: `0 ${from}` }, { translate: "0 0" }], { duration: ROLL, easing: ease });
    old.animate([{ translate: "0 0" }, { translate: `0 ${forward ? "-110%" : "110%"}` }], { duration: ROLL, easing: ease })
      .finished.then(() => old.remove());
  }

  // It shows this project's number out of all the projects ("4" and "/  05"), and stays in its place on the
  // side of the screen the whole way down the page (on the phone too).
  now.dataset.project = String(number || 0);
  total.dataset.project = "/  " + twoDigits(PROJECTS.length);
  show(now, String(number || 0), true, false);
  show(total, "/  " + twoDigits(PROJECTS.length), true, false);
})();

// ===== While scrolling down: the arrows and the numbers leave through the sides =====
// They stay while the short texts under the title scroll out; then, as the page goes on scrolling, the left
// arrow and number slide out through the left edge and the right ones through the right edge (straight
// across, along with the scrolling). When the black end comes up at the bottom of the page, the right arrow
// slides back in (it stays on the black end, to go to the next project). Big screens and phones alike.
(function () {
  const left = [".project-arrow-prev", ".fold-count-now"].map((s) => document.querySelector(s)).filter(Boolean);
  const right = [".project-arrow-next", ".fold-count-total"].map((s) => document.querySelector(s)).filter(Boolean);
  const nextArrow = document.querySelector(".project-arrow-next");
  if (!left.length && !right.length) return;
  const OUT_SCROLL = 260;   // px of scrolling for them to slide all the way out
  let start = 0;            // where the short texts have scrolled out (px down the page)

  // where the short texts under the title end (their bottom, down the page), and how far each one has to
  // go to be just outside its edge (measured in its place, not moved)
  const away = new Map();
  function measure() {
    const texts = [...document.querySelectorAll(".lab-intro")];
    start = texts.length ? Math.max(...texts.map((el) => el.getBoundingClientRect().bottom + window.scrollY)) : window.innerHeight;
    [...left, ...right].forEach((el) => {
      const was = el.style.translate;
      el.style.translate = "";
      const r = el.getBoundingClientRect();
      away.set(el, left.includes(el) ? -(r.right + 10) : window.innerWidth - r.left + 10);
      el.style.translate = was;
    });
    place();
  }
  function place() {
    const out = Math.min(1, Math.max(0, (window.scrollY - start) / OUT_SCROLL));   // 0 = in place, 1 = out
    // (the black end coming up: the right arrow slides back in, over the last screen's worth of scrolling)
    const end = document.querySelector(".lab-footer");
    const endTop = end ? end.getBoundingClientRect().top : Infinity;
    const back = Math.min(1, Math.max(0, 1 - endTop / window.innerHeight));
    [...left, ...right].forEach((el) => {
      const k = el === nextArrow ? out * (1 - back) : out;
      // (while they follow the scrolling, their own slide (styles.css) is off, so they keep up exactly)
      el.style.transitionProperty = out > 0 ? "none" : "";
      el.style.translate = k ? `${(away.get(el) || 0) * k}px 0` : "";
    });
  }
  window.addEventListener("scroll", place, { passive: true });
  window.addEventListener("resize", measure);
  window.addEventListener("load", measure);
  measure();
})();
