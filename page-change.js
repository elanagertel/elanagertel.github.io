// ===== Going to the home page or to the About page: things slide out, the new ones slide in =====
// Clicking "Home", "ELANA GERTEL" or "About Me" in the bar at the top makes
// everything on the screen (the shapes, the texts, the pictures) slide out through the nearest edge of
// the screen, straight left, right, up or down (like the shapes always move on the site). Then the new
// page opens, and its shapes and pictures slide in from the nearest edge to their places.
// The bar at the top is on every page, so it stays where it is.
// The home page: home.js calls window.pageChange.slideIn() when the gallery is shown.
// The About page: its shapes slide in right away (this file is loaded after about.js).
// A project page reached with an arrow: its title slides in the same way (this file is loaded after lab.js).
(function () {
  const SLIDE = 650;        // ms for one thing to slide out or in
  const SPREAD = 300;       // ms between the first and the last thing starting (from left to right)
  const GAP = 20;           // px past the edge of the screen
  const KEY = "slideInPage";   // remembers (for the next page) which page should slide in, and when
  const EASE = "cubic-bezier(0.65, 0, 0.35, 1)";   // slow start, fast middle, soft stop (like the shapes)
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Which page this is, and the things on it that slide
  const PAGE = document.getElementById("about") ? "about"
    : document.body.classList.contains("lab-page") ? "project" : "home";
  const THINGS = {
    home: ".flow-piece, .flow-photo, .flow-name, .flow-year",
    project: ".lab-piece, .lab-intro, .lab-media, .lab-text, .lab-info, .lab-footer-text, .project-arrow",
    about: ".about-piece, .about-photo, .about-text, .about-bio",
  };

  // Is it (partly) on the screen?
  function onScreen(el) {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
  }
  // The shortest straight way off the screen: [dx, dy] in px
  function wayOut(el) {
    const r = el.getBoundingClientRect(), w = window.innerWidth, h = window.innerHeight;
    const ways = [
      { move: [-(r.right + GAP), 0], room: r.left },        // out on the left
      { move: [w - r.left + GAP, 0], room: w - r.right },   // out on the right
      { move: [0, -(r.bottom + GAP)], room: r.top },        // out at the top
      { move: [0, h - r.top + GAP], room: h - r.bottom },   // out at the bottom
    ];
    return ways.sort((a, b) => a.room - b.room)[0].move;
  }
  // When it starts: the things on the left first (two copies at the same place start together)
  function delayOf(el) {
    const r = el.getBoundingClientRect();
    return SPREAD * Math.min(1, Math.max(0, (r.left + r.width / 2) / window.innerWidth));
  }
  // Slide from one shift to another (CSS "translate", so it never fights with how the thing is placed)
  function slide(el, from, to, delay) {
    el.style.transition = "none";
    el.style.translate = `${from[0]}px ${from[1]}px`;
    el.getBoundingClientRect();   // (the browser takes the start first)
    el.style.transition = `translate ${SLIDE}ms ${EASE} ${delay}ms`;
    el.style.translate = `${to[0]}px ${to[1]}px`;
  }

  window.pageChange = {
    // Did we just come here from another page by sliding out? (only asked once)
    cameBack() {
      try {
        const saved = JSON.parse(sessionStorage.getItem(KEY) || "null");
        sessionStorage.removeItem(KEY);
        return !REDUCED && !!saved && saved.page === PAGE && Date.now() - saved.at < 10000;
      } catch (e) { return false; }
    },
    // The things on the screen slide in from the nearest edge; done() once they are in
    slideIn(elements, done) {
      const shown = elements.filter(onScreen);
      // first put them outside the screen at once (so the page never shows them in place first)...
      const starts = shown.map((el) => [el, wayOut(el), delayOf(el)]);
      starts.forEach(([el, from]) => { el.style.transition = "none"; el.style.translate = `${from[0]}px ${from[1]}px`; });
      // ...then, once the page is really on the screen, let them slide in
      requestAnimationFrame(() => requestAnimationFrame(() => {
        starts.forEach(([el, from, delay]) => slide(el, from, [0, 0], delay));
        setTimeout(() => {
          shown.forEach((el) => { el.style.transition = ""; el.style.translate = ""; });
          if (done) done();
        }, SLIDE + SPREAD + 50);
      }));
    },
  };

  // The About page: its shapes slide in as it opens
  if (PAGE === "about" && window.pageChange.cameBack()) {
    window.pageChange.slideIn([...document.querySelectorAll(THINGS.about)]);
  }

  // A project page opened with an arrow (from another project): the old title left in pieces through the
  // nearest edges; the new title comes in the same way, reversed: each piece slides in from its nearest edge
  if (PAGE === "project" && window.pageChange.cameBack()) {
    window.pageChange.slideIn([...document.querySelectorAll(THINGS.project)]);
  }

  // Clicking a link in the bar: everything on the screen slides out first, then the page opens
  function slideOutTo(link, page, always = false) {
    if (!link || (page === PAGE && !always)) return;   // (the link to the page you are on: nothing changes)
    link.addEventListener("click", (event) => {
      // (on a phone the first tap only shows the link's name: mobile.js stops that tap)
      if (event.defaultPrevented || REDUCED) return;
      event.preventDefault();
      const things = [...document.querySelectorAll(THINGS[PAGE])].filter(onScreen);
      things.forEach((el) => slide(el, [0, 0], wayOut(el), delayOf(el)));
      try { sessionStorage.setItem(KEY, JSON.stringify({ page, at: Date.now() })); } catch (e) {}
      setTimeout(() => { window.location.href = link.href; }, SLIDE + SPREAD + 50);
    });
  }
  slideOutTo(document.querySelector(".site-nav-home"), "home");
  slideOutTo(document.querySelector(".site-nav-name"), "home");
  slideOutTo(document.querySelector(".site-nav-about"), "about");
  // the arrows on a project page: to the previous / next project (they slide out the same way)
  document.querySelectorAll(".project-arrow").forEach((arrow) => slideOutTo(arrow, "project", true));
})();
