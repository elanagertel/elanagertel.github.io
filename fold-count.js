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
    null,                            // 5  The Double Family
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
