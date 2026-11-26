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
  // (phones held upright have their own home page, phone.js: the letters' pieces, the pictures and their
  // texts; and on a project page a copy of the project's number under the title)
  const THINGS = {
    home: ".flow-piece, .flow-photo, .flow-name, .flow-year, .phone-piece, .phone-flow-photo, .phone-grid-text",
    project: ".lab-piece, .lab-intro, .lab-media, .lab-text, .lab-info, .lab-footer-text",
    about: ".about-piece, .about-photo, .about-text, .about-bio",
  };

  // Where it is on the screen (a phone letter's piece is drawn in a box as big as its letter: its own
  // shape tells where the piece really is)
  function boxOf(el) {
    const shape = el.matches(".phone-piece") ? el.querySelector("path") : null;
    return (shape || el).getBoundingClientRect();
  }
  // Is it (partly) on the screen?
  function onScreen(el) {
    const r = boxOf(el);
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
  }
  // The shortest straight way off the screen: [dx, dy] in px
  function wayOut(el) {
    const r = boxOf(el), w = window.innerWidth, h = window.innerHeight;
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
    const r = boxOf(el);
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

  // (the script at the top of the page hid what slides in, or made the screen black: show the page again)
  const arrived = () => document.documentElement.classList.remove("is-arriving");
  const arrivedFromEnd = () => document.documentElement.classList.remove("from-end");

  window.pageChange = {
    // Did we just come here from another page by sliding out? (only asked once)
    cameBack() {
      try {
        const saved = JSON.parse(sessionStorage.getItem(KEY) || "null");
        sessionStorage.removeItem(KEY);
        const yes = !REDUCED && !!saved && saved.page === PAGE && Date.now() - saved.at < 10000;
        if (!yes) arrived();
        return yes;
      } catch (e) { arrived(); return false; }
    },
    // The things on the screen slide in from the nearest edge; done() once they are in
    slideIn(elements, done) {
      const shown = elements.filter(onScreen);
      // first put them outside the screen at once (so the page never shows them in place first)...
      const starts = shown.map((el) => [el, wayOut(el), delayOf(el)]);
      starts.forEach(([el, from]) => { el.style.transition = "none"; el.style.translate = `${from[0]}px ${from[1]}px`; });
      arrived();   // (now they are outside the screen, they can be shown)
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
    const slideInProject = () => window.pageChange.slideIn([...document.querySelectorAll(THINGS.project)]);
    // (phones held upright lay the page out once it has loaded, phone.js: measure only after that)
    if (document.documentElement.classList.contains("is-phone-portrait")) {
      window.addEventListener("DOMContentLoaded", () => requestAnimationFrame(slideInProject));
    } else {
      slideInProject();
    }
  }

  // Clicking a link in the bar: everything on the screen slides out first, then the page opens
  // (outFirst false: the page opens at once, with no sliding out first; the new page still slides in)
  function slideOutTo(link, page, always = false, outFirst = true) {
    if (!link || (page === PAGE && !always)) return;   // (the link to the page you are on: nothing changes)
    link.addEventListener("click", (event) => {
      // (on a phone the first tap only shows the link's name: mobile.js stops that tap)
      if (event.defaultPrevented || REDUCED) return;
      event.preventDefault();
      // the right arrow on the black end of a project page: the next project opens under the same black
      if (link.classList.contains("project-arrow-next") && atBlackEnd()) { nextFromEnd(link.href); return; }
      if (!outFirst) {
        try { sessionStorage.setItem(KEY, JSON.stringify({ page, at: Date.now() })); } catch (e) {}
        window.location.href = link.href;
        return;
      }
      // (phones: the menu closes, so the page shows while its things slide out)
      const menuButton = document.querySelector(".phone-menu-button");
      if (menuButton && document.documentElement.classList.contains("phone-menu-open")) menuButton.click();
      // letters that are organic (or soft) turn back into their pieces at once, so they slide out with the
      // rest (lab.js, about.js); the cursor is the square again
      if (window.resetOrganic) window.resetOrganic();
      if (window.squareCursor) window.squareCursor.organic(false);
      const things = [...document.querySelectorAll(THINGS[PAGE])].filter(onScreen);
      things.forEach((el) => slide(el, [0, 0], wayOut(el), delayOf(el)));
      try { sessionStorage.setItem(KEY, JSON.stringify({ page, at: Date.now() })); } catch (e) {}
      setTimeout(() => { window.location.href = link.href; }, SLIDE + SPREAD + 50);
    });
  }
  slideOutTo(document.querySelector(".site-nav-home"), "home");
  slideOutTo(document.querySelector(".site-nav-name"), "home");
  slideOutTo(document.querySelector(".site-nav-about"), "about");
  // phones held upright: the links in the menu and the name at the top left (phone.js)
  slideOutTo(document.querySelector(".phone-menu-home"), "home");
  slideOutTo(document.querySelector(".phone-name"), "home");
  // (About Me on the phone: no sliding out, the About page just slides in)
  slideOutTo(document.querySelector(".phone-menu-about"), "about", false, false);
  // the arrows on a project page: to the previous / next project (they slide out the same way)
  document.querySelectorAll(".project-arrow").forEach((arrow) => slideOutTo(arrow, "project", true));
  // ----- From the black end of a project page to the next project -----
  // The right arrow (and the white title, lab.js) opens the next project at once: it opens looking just like
  // the black end you left (black, its name in white, the right arrow); then the black slides up over the
  // title (which stays where it is), uncovering the new page (the bar at the top, the title), and
  // only then do the texts under the title type themselves out (type-texts.js waits introTypingWait).
  const END_KEY = "fromProjectEnd";
  const UP_HOLD = 0;     // ms the black stays before it slides up (none: it starts at once)
  const UP_TIME = 700;   // ms it takes to slide up
  const HANDOVER_KEY = "endTitle";   // the white title on the black, handed over to the next page
  function nextFromEnd(href) {
    if (!REDUCED) {
      try {
        sessionStorage.setItem(END_KEY, String(Date.now()));
        // the white title and the right arrow, exactly as they are on the screen now: the next page draws them
        // on its black at once, so they never disappear for a moment while it gets ready
        const shot = (el) => { const b = el.getBoundingClientRect(); return { html: el.outerHTML, box: [b.left, b.top, b.width, b.height] }; };
        const pieces = [...document.querySelectorAll("#lab-footer-title .lab-piece-white")]
          .filter((el) => { const b = el.getBoundingClientRect(); return b.width > 0 && b.bottom > 0 && b.top < window.innerHeight; })
          .map(shot);
        const arrow = document.querySelector(".project-arrow-next img");
        sessionStorage.setItem(HANDOVER_KEY, JSON.stringify({ pieces, arrow: arrow ? shot(arrow) : null }));
      } catch (e) {}
    }
    window.location.href = href;
  }
  window.pageChange.nextFromEnd = nextFromEnd;
  // Is the black end of a project page (with the next project's name) on most of the screen?
  function atBlackEnd() {
    const end = document.querySelector(".lab-footer");
    return !!end && end.getBoundingClientRect().top < window.innerHeight / 2;
  }

  function cameFromEnd() {
    try {
      const at = Number(sessionStorage.getItem(END_KEY) || 0);
      sessionStorage.removeItem(END_KEY);
      const yes = !REDUCED && Date.now() - at < 10000;
      if (!yes) arrivedFromEnd();
      return yes;
    } catch (e) { arrivedFromEnd(); return false; }
  }
  if (PAGE === "project" && cameFromEnd()) {
    // the black, right away (so the page never shows without it)
    const black = document.createElement("div");
    black.className = "project-arrive";
    black.setAttribute("aria-hidden", "true");
    document.body.appendChild(black);
    arrivedFromEnd();   // (the black layer covers the page now)
    // (the early layer from the top of the page: this one is over it now, with the same title)
    document.querySelectorAll(".project-arrive-early").forEach((el) => el.remove());
    window.introTypingWait = UP_HOLD + UP_TIME + 150;

    // right away: the white title and arrow exactly as the page before left them (it handed them over);
    // dress() puts this page's own copies there once it is laid out (in the same places)
    const handed = document.createElement("div");
    try {
      const saved = JSON.parse(sessionStorage.getItem(HANDOVER_KEY) || "null");
      sessionStorage.removeItem(HANDOVER_KEY);
      const put = ({ html, box }, cls) => {
        const holder = document.createElement("div");
        holder.innerHTML = html;
        const el = holder.firstElementChild;
        if (!el) return;
        el.setAttribute("class", cls);
        el.style.cssText = `left:${box[0]}px; top:${box[1]}px; width:${box[2]}px; height:${box[3]}px`;
        handed.appendChild(el);
      };
      if (saved) {
        saved.pieces.forEach((piece) => put(piece, "project-arrive-piece"));
        if (saved.arrow) put(saved.arrow, "project-arrive-arrow");
      }
    } catch (e) {}
    black.appendChild(handed);

    // on it: this project's name in white, exactly over the page's own title (drawn from its own shapes)
    const phone = document.documentElement.classList.contains("is-phone-portrait");
    function dress() {
      handed.remove();   // (this page's own copies take their place, in the same spots)
      const pieces = [...document.querySelectorAll("#lab-first > .lab-piece:not(.lab-piece-white)")];
      const boxes = pieces.map((el) => el.getBoundingClientRect());
      if (boxes.length) {
        const dx = 0, dy = 0;   // (exactly over the page's own title, so it never moves)
        pieces.forEach((el, i) => {
          const b = boxes[i], copy = el.cloneNode(true);
          copy.setAttribute("class", "project-arrive-piece");
          copy.style.cssText = `left:${b.left + dx}px; top:${b.top + dy}px; width:${b.width}px; height:${b.height}px`;
          black.appendChild(copy);
        });
      }
      // the right arrow, white, where this page has it (it stayed on the black end before)
      const arrow = document.querySelector(".project-arrow-next img");
      if (arrow) {
        const b = arrow.getBoundingClientRect(), copy = arrow.cloneNode(true);
        copy.className = "project-arrive-arrow";
        copy.style.cssText = `left:${b.left}px; top:${b.top}px; width:${b.width}px; height:${b.height}px`;
        black.appendChild(copy);
      }
      // then the black slides up over the title: its edge rises from the bottom of the screen to the top,
      // and the title and the arrow stay where they are (where the black has gone, the page shows)
      black.animate([{ clipPath: "inset(0 0 0% 0)" }, { clipPath: "inset(0 0 100% 0)" }],
        { duration: UP_TIME, delay: UP_HOLD, easing: EASE, fill: "forwards" })
        .finished.then(() => black.remove());
    }
    // (phones held upright lay the page out once it has loaded, phone.js: measure only after that)
    if (phone) window.addEventListener("DOMContentLoaded", () => requestAnimationFrame(() => requestAnimationFrame(dress)));
    else dress();
  }
})();
