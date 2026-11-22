// ===== Project pages: the counter on the sides, and the arrows to the other projects =====
// The counter (Figma: "3" on the left, "/  07" on the right):
// - on the first screen (the title): this project's number out of all the projects, like on the home page;
// - once the pictures come: the picture you are looking at out of how many pictures the project has
//   (a picture counts once it has slid up to its place in the middle of the screen).
// Whenever a number changes, the new one rolls in and pushes the old one out (up when you scroll down,
// down when you scroll back up).
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
  const pictures = [...document.querySelectorAll(".lab-media")];

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

  let shown = null;   // what the counter shows now: 0 = this project, 1… = a picture
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Phones held upright (phone.js): the first screen has its own copy of this project's number (it scrolls
  // away with the title), so this counter only counts the pictures (from 1)
  const phone = document.documentElement.classList.contains("is-phone-portrait");
  now.dataset.project = String(number || 0);
  total.dataset.project = "/  " + twoDigits(PROJECTS.length);

  // Big screens, project pages: this project's number beside the title belongs to the first screen, so it
  // scrolls up and away with the title's texts (like the arrows). It is a copy that lies in the page; the
  // counter that stays in place only shows once the pictures come, and counts them.
  const lab = document.getElementById("lab");
  const firstCopies = !phone && lab && document.body.classList.contains("lab-page");
  if (firstCopies) {
    [[now, String(number || 0)], [total, "/  " + twoDigits(PROJECTS.length)]].forEach(([counter, text]) => {
      const copy = document.createElement("p");
      copy.className = counter.className + " fold-count-first";
      copy.setAttribute("aria-hidden", "true");
      const span = document.createElement("span");
      span.className = "fold-count-text";
      span.textContent = text;
      copy.appendChild(span);
      lab.appendChild(copy);
    });
  }
  function update() {
    const middle = window.innerHeight / 2 + 2;
    const counted = pictures.filter((pic) => {
      const box = pic.getBoundingClientRect();
      return box.height > 0 && box.top + box.height / 2 <= middle;
    }).length;
    const seen = phone ? Math.max(1, counted)
               : counted * (window.scrollY > 10 ? 1 : 0);   // on the first screen (not scrolled yet): this project's number,
                                                             // even when the first picture already lies under the title
    if (seen === shown) return;
    const forward = shown === null || seen > shown;
    // (coming from the first screen with its copies, the counter just appears: nothing rolls out of it)
    const animate = shown !== null && !reduced && !(firstCopies && shown === 0);
    shown = seen;
    // (with the copies, the counter that stays in place is hidden on the first screen)
    [now, total].forEach((counter) => counter.classList.toggle("is-first-hidden", firstCopies && seen === 0));
    if (seen === 0) {
      show(now, String(number || 0), forward, animate && !firstCopies);
      show(total, "/  " + twoDigits(PROJECTS.length), forward, animate && !firstCopies);
    } else {
      show(now, String(seen), forward, animate);
      show(total, "/  " + pictures.length, forward, animate);
    }
  }
  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
})();
