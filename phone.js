// ===== Phones held upright (portrait): the phone version of the site =====
// Figma: "iPhone 16 - 3" (the home page's first screen) and "iPhone 16 - 5" (the menu open).
// On every page:
//   - a small black square at the top right is the menu. Tapping it slides a dark layer over the page from
//     the right, the button turns into a white square (in the same place), and the menu types itself out:
//     "Contact me  /" with the contact details under it, "About Me  /" and "Home  /".
//     The page you are on is oblique. Tapping the square again closes it.
//   - "ELANA GERTEL" (oblique) at the top left (at the bottom while the menu is open); it leads home.
// On the home page:
//   - the first screen: "ELANA GERTEL" in the big black letters, in two rows in the middle; the letters
//     slide in from the sides one after the other, like the pieces of a puzzle;
//   - under it, the projects one under the other: each picture with its number ("1  /") on its left, and
//     its name typing itself out under it once it is on the screen. Tapping a picture opens the project.
// The smallest texts are 16px (Figma); the other sizes keep their proportions to them.
// Nothing here runs on a computer or on a phone held sideways (they keep the big version).
(function () {
  const PHONE = window.matchMedia("(max-width: 900px) and (orientation: portrait)");
  if (!PHONE.matches) {
    // turning the phone upright later: reload, so the phone version is built
    PHONE.addEventListener("change", (event) => { if (event.matches) location.reload(); });
    return;
  }
  PHONE.addEventListener("change", (event) => { if (!event.matches) location.reload(); });
  document.documentElement.classList.add("is-phone-portrait");

  const page = location.pathname.split("/").pop() || "index.html";
  const isHome = page === "index.html";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ----- Typing: a text types itself out letter by letter, with a bar that goes away at the end -----
  // (an invisible copy keeps the text at its full size, so nothing moves while it types)
  function typed(el, words) {
    el.textContent = "";
    const ghost = document.createElement("span");
    ghost.className = "phone-ghost";
    ghost.textContent = words;
    const live = document.createElement("span");
    live.className = "phone-live";
    const box = document.createElement("span");
    const bar = document.createElement("span");
    bar.className = "flow-edge-cursor phone-bar";
    bar.textContent = "|";
    live.append(box, bar);
    el.append(ghost, live);
    el.setAttribute("aria-label", words.replace(/\s+\/\s*$/, "").replace(/\s+/g, " ").trim());
    ghost.setAttribute("aria-hidden", "true");
    live.setAttribute("aria-hidden", "true");
    let timer = null;
    return {
      type(perLetter = 30, wait = 0) {
        clearInterval(timer);
        clearTimeout(el.typeWait);
        box.textContent = "";
        bar.hidden = false;
        let shown = 0;
        if (reduced) { box.textContent = words; bar.hidden = true; return; }
        el.typeWait = setTimeout(() => {
          timer = setInterval(() => {
            shown++;
            box.textContent = words.slice(0, shown);
            if (shown >= words.length) { clearInterval(timer); bar.hidden = true; }
          }, perLetter);
        }, wait);
      },
      clear() { clearInterval(timer); clearTimeout(el.typeWait); box.textContent = ""; bar.hidden = true; },
      show() { clearInterval(timer); clearTimeout(el.typeWait); box.textContent = words; bar.hidden = true; },   // all at once
    };
  }

  // ----- The menu (Figma "iPhone 16 - 5") -----
  const button = document.createElement("button");
  button.type = "button";
  button.className = "phone-menu-button";
  button.setAttribute("aria-label", "Menu");
  button.setAttribute("aria-expanded", "false");

  const menu = document.createElement("nav");
  menu.className = "phone-menu";
  menu.setAttribute("aria-label", "Site");
  menu.hidden = true;
  // (Figma "iPhone 16 - 5", from the top: "Home  /", "About Me  /", "Contact me  /" and its details)
  const LINKS = [
    // ("Home" goes straight to the gallery; the opening only plays from "ELANA GERTEL" at the top left)
    { cls: "phone-menu-home", words: "Home  /", href: "index.html?gallery", here: isHome },
    { cls: "phone-menu-about", words: "About Me  /", href: "about.html", here: page === "about.html" },
    { cls: "phone-menu-contact", words: "Contact me  /" },
    { cls: "phone-menu-line", words: "@elanagertel  /  Instagram", href: "https://www.instagram.com/elanagertel/" },
    { cls: "phone-menu-line", words: "+972-54-262-7915  /  Whatsapp", href: "https://wa.me/972542627915" },
    { cls: "phone-menu-line", words: "gertel.elana@gmail.com", href: "mailto:gertel.elana@gmail.com" },
  ];
  const menuTexts = LINKS.map((link) => {
    const el = document.createElement(link.href ? "a" : "p");
    el.className = "phone-menu-item " + link.cls + (link.here ? " is-here" : "");
    if (link.href) el.href = link.href;
    if (link.href && link.href.startsWith("http")) { el.target = "_blank"; el.rel = "noopener"; }
    if (link.here) el.setAttribute("aria-current", "page");
    menu.appendChild(el);
    return typed(el, link.words);
  });

  const name = document.createElement("a");
  name.className = "phone-name";
  name.href = "index.html";
  name.textContent = "ELANA GERTEL";

  document.body.append(menu, button, name);
  // (its width, so it can be centred where Figma has it while the menu is open)
  document.fonts.ready.then(() => name.style.setProperty("--name-w", name.offsetWidth + "px"));

  let open = false;
  function setMenu(value) {
    open = value;
    button.setAttribute("aria-expanded", String(open));
    document.documentElement.classList.toggle("phone-menu-open", open);
    if (open) {
      menu.hidden = false;
      // the texts type themselves out once the dark layer has slid in, one group after the other
      // Home, About Me and Contact me are there at once; only the contact details type themselves out
      // (all three together, once the dark layer has slid in)
      menuTexts.forEach((t, i) => (i < 3 ? t.show() : t.type(30, 350)));
    } else {
      menuTexts.forEach((t) => t.clear());
      setTimeout(() => { if (!open) menu.hidden = true; }, reduced ? 0 : 450);
    }
  }
  button.addEventListener("click", () => setMenu(!open));
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && open) setMenu(false); });

  // ----- A project page (memory-lab, israeli-cactus, …) -----
  // The big version stacks things while you scroll (pictures sliding over the title, paragraphs sticking).
  // On the phone they simply come one under the other, in the same order:
  //   the first screen (Figma "iPhone 16 - 7"): the title across the whole width, the arrows and the
  //   counter under it, and the short texts; then the pictures and the story paragraphs in the order the
  //   big version shows them, and at the end the black end with the title in white.
  if (document.getElementById("lab")) {
    window.addEventListener("DOMContentLoaded", buildProjectPage);
  }
  function buildProjectPage() {
    const lab = document.getElementById("lab");
    if (typeof TITLE_PIECES === "undefined") return;

    // The order of the big version: each picture's and paragraph's place on the page there
    const root = document.documentElement;
    // (measured as on a computer screen: the page 1440 wide)
    root.classList.remove("is-phone-portrait");
    lab.style.width = "1440px";
    const parts = [...lab.querySelectorAll(":scope > .lab-track, :scope > .lab-text-track, :scope > .lab-side-track")]
      .map((el) => ({ el, y: el.getBoundingClientRect().top }));
    lab.style.width = "";
    root.classList.add("is-phone-portrait");
    parts.sort((a, b) => a.y - b.y).forEach((part, i) => { part.el.style.order = 10 + i; });

    // The short texts, on the first screen (Figma "iPhone 16 - 7", 12px): the project's name and the year
    // side by side at y 607, the school and the technique under them at y 625, and the brief and the
    // solution lower down (y 739 and 757). Each one is found by its place on the big version (--x, --y).
    root.classList.add("phone-project");

    // the pictures beside a paragraph lie in one row, the same height: each one's share of the row is its
    // width divided by its height (from its aspect-ratio in the page)
    lab.querySelectorAll(".lab-side img").forEach((img) => {
      const [w, h] = (img.style.aspectRatio || "1 / 1").split("/").map(Number);
      img.style.setProperty("--share", w / h);
    });
    lab.querySelectorAll(".lab-intro").forEach((el) => {
      const x = parseFloat(el.style.getPropertyValue("--x")), y = parseFloat(el.style.getPropertyValue("--y"));
      let place;
      if (x < 200) place = [18, 607];                       // the project's name
      else if (x < 450) place = y < 860 ? [200, 607] : [18, 635];   // the year / the school (a little lower than Figma: more room under the name)
      else if (x < 800) place = [198, 635];                 // the technique
      else place = y < 860 ? [18, 739] : [18, 757];         // the brief / the solution
      el.style.setProperty("--px", place[0]);
      el.style.setProperty("--py", place[1]);
    });

    // The title's size: as wide as the room between the arrows, but never taller than about half the screen.
    // (TITLE_PIECES: [shape, width, x, y] in Figma pixels; pieces.js has each shape's proportions.)
    const boxes = TITLE_PIECES.map(([number, width, x, y]) => {
      const [, , vw, vh] = PIECE_SHAPES["flow-piece-" + number + ".svg"].viewBox.split(/[\s,]+/).map(Number);
      const w = width * TITLE_SCALE;
      return [x, y, x + w, y + w * vh / vw];
    });
    const left = Math.min(...boxes.map((b) => b[0])), right = Math.max(...boxes.map((b) => b[2]));
    const top = Math.min(...boxes.map((b) => b[1])), bottom = Math.max(...boxes.map((b) => b[3]));
    lab.style.setProperty("--title-cx", (left + right) / 2);
    lab.style.setProperty("--title-cy", (top + bottom) / 2);
    lab.style.setProperty("--title-w", right - left);
    lab.style.setProperty("--title-full-h", bottom - top);

    // Then measure where the title's shapes really are, and nudge it so its middle is exactly in the
    // middle of the screen (left to right), at Figma's height
    const first = document.getElementById("lab-first");
    function centreTitle() {
      first.style.translate = "";
      const shapes = [...first.querySelectorAll(".lab-piece")].map((el) => el.getBoundingClientRect());
      if (!shapes.length) return;
      const box = first.parentElement.getBoundingClientRect();
      const midX = (Math.min(...shapes.map((r) => r.left)) + Math.max(...shapes.map((r) => r.right))) / 2;
      const midY = (Math.min(...shapes.map((r) => r.top)) + Math.max(...shapes.map((r) => r.bottom))) / 2;
      // its middle: 37.5% + 15.3 down the screen (Figma "iPhone 16 - 7"), or higher for a tall title,
      // so its bottom stays 40px above the arrows
      const height = Math.max(...shapes.map((r) => r.bottom)) - Math.min(...shapes.map((r) => r.top));
      const pp = window.innerWidth / 393;
      const wanted = Math.min(box.height * 0.375 + 15.3 * pp, box.height * 0.5 + 20 * pp - 40 - height / 2);
      first.style.translate = `${box.left + box.width / 2 - midX}px ${box.top + wanted - midY}px`;
    }
    requestAnimationFrame(centreTitle);
    window.addEventListener("resize", centreTitle);

    // ----- The counter -----
    // On the first screen: this project's number ("1  /" and "/  05"), part of the first screen, so it
    // scrolls up and away with the title. Then the pictures' counter ("1  /  11", fold-count.js) comes up
    // with the first picture and stays at its place (right under the arrows) while you scroll on.
    const now = document.querySelector(".fold-count-now"), total = document.querySelector(".fold-count-total");
    if (now && total) {
      [[now, "phone-first-count-now"], [total, "phone-first-count-total"]].forEach(([counter, cls]) => {
        const copy = document.createElement("p");
        copy.className = "phone-first-count " + cls;
        copy.setAttribute("aria-hidden", "true");
        // (fold-count.js gives this project's number; the left one has its slash after it: "1  /")
        copy.textContent = (counter.dataset.project || "") + (counter === now ? "  /" : "");
        lab.appendChild(copy);
      });
      const firstPicture = () => {
        const tops = [...lab.querySelectorAll(".lab-media")].map((m) => m.getBoundingClientRect().top);
        return tops.length ? Math.min(...tops) : null;
      };
      function placeCounter() {
        const stick = window.innerHeight * 0.5 + 65 * window.innerWidth / 393;   // (right under the arrows)
        const pictureTop = firstPicture();
        // it comes up level with the first picture's top, and stops at its place; at the end the black
        // part pushes it up and away (so it never lies over the white title)
        const end = lab.querySelector(".lab-footer");
        const endTop = end ? end.getBoundingClientRect().top : Infinity;
        const y = Math.min(pictureTop === null ? stick : Math.max(stick, pictureTop), endTop - 40);
        [now, total].forEach((counter) => {
          counter.style.top = y + "px";
          counter.style.visibility = pictureTop === null ? "hidden" : "";   // (a page without pictures: none)
        });
      }
      placeCounter();
      window.addEventListener("scroll", placeCounter, { passive: true });
      window.addEventListener("resize", placeCounter);
    }

    // At the end: the white title goes into the black end (it lies still there, in white)
    const footer = lab.querySelector(".lab-footer");
    const whiteTitle = document.getElementById("lab-footer-title");
    if (footer && whiteTitle) {
      whiteTitle.style.clipPath = "none";
      footer.appendChild(whiteTitle);
    }
  }

  // ----- The About page: you can also swipe sideways to go on -----
  // The page moves on as you scroll down; on a phone a sideways swipe does the same: swiping to the left
  // moves the words along like scrolling down (back to the right goes back). The words follow the finger
  // (the page moves one pixel for every 3 of scrolling, about.js), and a quick flick glides on a little.
  if (page === "about.html") {
    const PER_PIXEL = 3;   // (SCROLL_PER_PIXEL in about.js)
    let start = null, last = null, sideways = null, speed = 0, glide = 0;
    document.addEventListener("touchstart", (event) => {
      cancelAnimationFrame(glide);
      const t = event.touches[0];
      start = last = [t.clientX, t.clientY, performance.now()];
      sideways = null;
      speed = 0;
    }, { passive: true });
    document.addEventListener("touchmove", (event) => {
      if (!start || open) return;
      const t = event.touches[0];
      const dx = t.clientX - start[0], dy = t.clientY - start[1];
      if (sideways === null && Math.hypot(dx, dy) > 8) sideways = Math.abs(dx) > Math.abs(dy);
      if (!sideways) return;   // (up and down: the page scrolls as usual)
      event.preventDefault();
      const now = performance.now(), step = t.clientX - last[0];
      window.scrollBy(0, -step * PER_PIXEL);
      speed = -step * PER_PIXEL / Math.max(1, now - last[2]);   // (scroll px per ms)
      last = [t.clientX, t.clientY, now];
    }, { passive: false });
    document.addEventListener("touchend", () => {
      if (sideways && Math.abs(speed) > 0.2) {
        let prev = performance.now();
        (function slide(now) {
          const dt = now - prev; prev = now;
          window.scrollBy(0, speed * dt);
          speed *= Math.pow(0.995, dt);   // it slows down
          if (Math.abs(speed) > 0.05) glide = requestAnimationFrame(slide);
        })(prev + 16);
      }
      start = null;
    }, { passive: true });
  }

  // ----- The home page -----
  if (!isHome) return;
  buildHome();
  function buildHome() {
  // Like the big version:
  //   1. the black pieces slide in from the edges and puzzle their way into "ELANA GERTEL"
  //      (Figma "iPhone 16 - 3": two rows in the middle of the screen), each in 2 to 4 straight slides on a beat;
  //   2. it breaks apart in three movements (each moves some letters and some pictures):
  //      E L A N A G go between the pictures, the others out past the edges of the screen (Figma "iPhone 16 - 12");
  //      the pictures slide in from the sides; at the end the numbers and names type themselves out.
  // The page (Figma "iPhone 16 - 12"): the pictures in a zigzag between the letters, each with its number above it and its
  // name under it. Tapping a picture: the letters' pieces come back in from the edges and puzzle into
  // the project's title, then the project page opens.
  // Everything is placed in pixels of the Figma phone (393 wide); p = one of them on this screen.
  const p = window.innerWidth / 393;
  const screenH = window.innerHeight;
  const skip = reduced || new URLSearchParams(location.search).has("gallery");

  const SLIDE = 550;                 // ms for one straight slide (like the big version)
  const EASE = "cubic-bezier(0.65, 0, 0.35, 1)";
  const LETTER = 57.21;              // a letter's size in the name (Figma: 2 × 2 pieces)

  // Places are in Figma phone px, on the page (Figma frame 12)
  const g = (place) => place;

  // The letters, in the order of the name (row, column), and where they stand around the page (Figma
  // "iPhone 16 - 12"): E L A N A G inside the page between the pictures (big, 74), the others pushed out
  // past the edges (size = their Figma size). The last four are extra copies that only wait outside the
  // screen (they are not in the name; their pieces help build the project titles).
  const LETTERS = [
    { file: "phone-e1", row: 0, col: 0, at: [159, 126], size: 74 },
    { file: "phone-l1", row: 0, col: 1, at: [39, 316], size: 74 },
    { file: "phone-a1", row: 0, col: 2, at: [284, 322], size: 74 },
    { file: "phone-n",  row: 0, col: 3, at: [163, 527], size: 74 },
    { file: "phone-a2", row: 0, col: 4, at: [39, 716], size: 74 },
    { file: "phone-g",  row: 1, col: 0, at: [278, 716], size: 74 },
    { file: "phone-e2", row: 1, col: 1, at: [429.8, 496.07], size: 56.99 },
    { file: "phone-r",  row: 1, col: 2, at: [139, 858.31], size: 74 },
    { file: "phone-t",  row: 1, col: 3, at: [-96.1, 560.91], size: 74 },
    { file: "phone-e3", row: 1, col: 4, at: [18.79, 866], size: 74 },
    { file: "phone-l2", row: 1, col: 5, at: [430, 696], size: 56.99 },
    { file: "phone-n",  extra: true, at: [419.5, 103], size: 56.99 },
    { file: "phone-a1", extra: true, at: [429, 364.62], size: 56.99 },
    { file: "phone-a2", extra: true, at: [460, 642], size: 56.99 },
    { file: "phone-g",  extra: true, at: [-90.2, 430.8], size: 74.2 },
  ];
  // The pictures (Figma "iPhone 16 - 12"): place, size, how the picture lies in its window ([left, top,
  // width, height] of the picture, in % of the window, from Figma's crop), the number above it ("1  /")
  // and the name under it (both Helvetica Oblique 12, at their Figma places).
  const PICTURES = [
    { file: "gallery-brain.png", at: [18, 102], size: [117, 122], crop: [-1.86, -32.04, 101.86, 143.37],
      number: 1, numberAt: [18, 81], name: "The Memory Lab", nameAt: [16, 230], href: "memory-lab.html" },
    { file: "gallery-sense.jpg", at: [258, 102], size: [117, 122], crop: [-5.3, 0, 107.61, 101.89],
      number: 2, numberAt: [258, 81], name: "Sense Shopping", nameAt: [257, 230], href: "sense.html" },
    { file: "gallery-archive.jpg", at: [138, 300], size: [117, 122], crop: [-25.64, -3.59, 166.45, 103.59],
      number: 3, numberAt: [137, 279], name: "Israeli Movie Archive", nameAt: [138, 428], href: "israeli-movie-archive.html" },
    { file: "gallery-cactus.png", at: [18, 496], size: [116, 123], crop: [-2.7, -49.29, 107.13, 149.5],
      number: 4, numberAt: [18, 475], name: "The Israeli Cactus", nameAt: [16, 625], href: "israeli-cactus.html" },
    { file: "gallery-house.png?v=2", at: [253, 478], size: [126, 148], crop: [-0.01, -6.59, 99.99, 111.53],
      number: 5, numberAt: [258, 475], name: "The Double Family", nameAt: [256, 625], href: null },
    { file: "gallery-watercolor.png?v=2", at: [138, 694], size: [117, 122], crop: [-3.02, -38.91, 120, 162.76],
      number: 6, numberAt: [139, 672], name: "Shintana", nameAt: [137, 821], href: null },
  ];
  const PAGE_H = 852;   // the page's height (Figma frame 12; the letters below it stay hidden)

  // The scrolling box (the whole screen) and the gallery in it
  const home = document.createElement("section");
  home.className = "phone-home";
  home.setAttribute("aria-label", "Projects");
  const flowBox = document.createElement("div");
  flowBox.className = "phone-flow";
  flowBox.style.width = 393 * p + "px";   // (as wide as the screen: what lies outside it is cut off)
  flowBox.style.height = PAGE_H * p + "px";
  home.appendChild(flowBox);

  // Where each letter stands in the name (Figma Frame 220: rows of 57.2 letters, 2.75 apart, 9.16 between
  // the rows, the second row 357 wide and the first centred over it; the name's middle 41.67% + 5.8 down)
  const nameMid = [393 / 2, (screenH / p) * 0.4167 + 5.8];
  function namePlace(l) {
    const rowW = l.row === 0 ? 5 * LETTER + 4 * 2.75 : 6 * LETTER + 5 * 2.75;
    const x = nameMid[0] - rowW / 2 + l.col * (LETTER + 2.75);
    const y = nameMid[1] - (2 * LETTER + 9.16) / 2 + l.row * (LETTER + 9.16);
    return [x, y];
  }

  // ----- The letters: one <svg> each, every piece in its own group (so each piece can slide) -----
  const SVG_NS = "http://www.w3.org/2000/svg";
  function readSvg(file) {
    return fetch("images/" + file + ".svg").then((r) => r.text())
      .then((text) => new DOMParser().parseFromString(text, "image/svg+xml").documentElement);
  }
  // Each letter is a box; each of its pieces is its own small drawing (as big as the letter, showing only
  // that piece), so every piece can slide on its own (this also works in Safari on the iPhone)
  const letters = LETTERS.map((l) => {
    const el = document.createElement("div");
    el.className = "phone-flow-letter";
    el.setAttribute("aria-hidden", "true");
    flowBox.appendChild(el);
    return { ...l, el, pieces: [], scale: l.size / LETTER };
  });
  const ready = Promise.all(letters.map((l) => {
    const files = l.file === "phone-g" ? ["phone-g-base", "phone-g-corner"] : [l.file];
    return Promise.all(files.map(readSvg)).then((svgs) => {
      svgs.forEach((svg, k) => {
        svg.querySelectorAll("path").forEach((path) => {
          const piece = document.createElementNS(SVG_NS, "svg");
          piece.setAttribute("class", "phone-piece");
          piece.setAttribute("viewBox", `0 0 ${LETTER} ${LETTER}`);
          const copy = document.createElementNS(SVG_NS, "path");
          copy.setAttribute("d", path.getAttribute("d"));
          // (the G's small square lies in its bottom right quarter)
          if (k === 1) copy.setAttribute("transform", "translate(28.61 28.62)");
          piece.appendChild(copy);
          l.el.appendChild(piece);
          l.pieces.push(piece);
        });
      });
    });
  }));
  // a piece's outline (to measure it)
  const shapeIn = (piece) => piece.querySelector("path");

  // Put a letter at [x, y] (Figma phone px, on the page) at a size (1 = the name's 57.2)
  const at = ([x, y], size) => `translate(${x * p}px, ${y * p}px) scale(${size})`;
  const put = (l, place, size) => { l.el.style.transform = at(place, size); };

  // ----- The pictures, numbers and names -----
  const pictures = PICTURES.map((pr) => {
    const item = document.createElement(pr.href ? "a" : "div");
    item.className = "phone-flow-photo";
    if (pr.href) item.href = pr.href;
    const [x, y] = g(pr.at);
    item.style.left = x * p + "px";
    item.style.top = y * p + "px";
    item.style.setProperty("--pic-w", pr.size[0] * p + "px");
    item.style.setProperty("--pic-h", pr.size[1] * p + "px");
    const window_ = document.createElement("span");
    window_.className = "phone-photo-window";
    const picture = document.createElement("img");
    picture.src = "images/" + pr.file;
    picture.alt = pr.name;
    picture.style.left = pr.crop[0] + "%";
    picture.style.top = pr.crop[1] + "%";
    picture.style.width = pr.crop[2] + "%";
    picture.style.height = pr.crop[3] + "%";
    window_.appendChild(picture);
    item.appendChild(window_);
    flowBox.appendChild(item);
    // the number above it and the name under it (they type themselves out at the end of the opening)
    const texts = [[pr.number + "  /", pr.numberAt], [pr.name, pr.nameAt]].map(([words, [tx, ty]]) => {
      const text = document.createElement("span");
      text.className = "phone-grid-text";
      text.setAttribute("aria-hidden", "true");
      text.style.left = tx * p + "px";
      text.style.top = ty * p + "px";
      flowBox.appendChild(text);
      const typer = typed(text, words);
      typer.clear();
      return typer;
    });
    const entry = { item, texts, pr };
    // Tapping a picture: the letters' pieces build the project's title, then the project opens
    item.addEventListener("click", (event) => {
      event.preventDefault();
      if (!home.classList.contains("is-done") || leaving || !pr.href) return;
      goToProject(entry);
    });
    // it waits outside the screen on the side it is nearest to, and slides in from there
    const fromLeft = x + pr.size[0] / 2 < 393 / 2;
    entry.outside = fromLeft ? -(x + pr.size[0] + 40) * p : (393 - x + 40) * p;
    return entry;
  });

  document.body.appendChild(home);

  let leaving = false;

  // ----- Tapping a picture: the pieces puzzle into the project's title, then the project page opens -----
  // The title is built exactly where the project page shows it (Figma "iPhone 16 - 7": across the width,
  // its middle 37.5% + 15.3 down the screen, its letters 52.51 wide), so the page opens with it in place.
  // Each place in the title is taken by the nearest piece, which slides there in two straight slides
  // (across, then up or down); pieces that are not needed slide out through the nearest side, and if the
  // title needs more pieces than there are, the others come in from the sides. The pictures slide out.
  const TITLE_FILES = {
    "memory-lab.html": "lab-organic.js",
    "israeli-cactus.html": "cactus-title.js",
    "israeli-movie-archive.html": "archive-title.js",
    "sense.html": "sense-title.js",
  };
  const shapeFiles = {};
  function shapeOf(number) {   // a title piece's outline (images/flow-piece-NN.svg)
    const file = "images/flow-piece-" + number + ".svg";
    if (!shapeFiles[file]) shapeFiles[file] = fetch(file).then((r) => r.text())
      .then((text) => new DOMParser().parseFromString(text, "image/svg+xml").documentElement);
    return shapeFiles[file];
  }
  function readTitle(href) {   // the project's title (the same file the project page draws it from)
    return fetch(TITLE_FILES[href]).then((r) => r.text())
      .then((text) => new Function(text + "\nreturn { pieces: TITLE_PIECES, scale: TITLE_SCALE };")());
  }

  async function goToProject(entry) {
    leaving = true;
    home.classList.add("is-leaving");
    const href = entry.pr.href;
    // first the pictures slide out to their sides and their numbers and names go away; only then do
    // the pieces come in from beyond the edges to write the title
    pictures.forEach((ph) => {
      ph.texts.forEach((t) => t.clear());
      ph.item.animate([{ translate: "0 0" }, { translate: ph.outside + "px 0" }],
        { duration: SLIDE, easing: EASE, fill: "forwards" });
    });
    let title;
    try { [title] = await Promise.all([readTitle(href), wait(SLIDE + 100)]); } catch (e) { location.href = href; return; }
    const shapes = await Promise.all(title.pieces.map(([number]) => shapeOf(number)));

    // where each title piece goes on the screen (as the project page draws it)
    const W = window.innerWidth, H = window.innerHeight;
    const boxes = title.pieces.map(([number, width, x, y], i) => {
      const [, , vw, vh] = shapes[i].getAttribute("viewBox").split(/[\s,]+/).map(Number);
      const w = width * title.scale;
      return { x, y, w, h: w * vh / vw };
    });
    const left = Math.min(...boxes.map((b) => b.x)), right = Math.max(...boxes.map((b) => b.x + b.w));
    const top = Math.min(...boxes.map((b) => b.y)), bottom = Math.max(...boxes.map((b) => b.y + b.h));
    // (the same size and place as on the page: the same pieces' size for every title, letters 52.51 wide;
    // a tall title a little higher, so its bottom stays 40px above the arrows)
    const tu = 52.513 / 126.225 * p;
    const mid = [W / 2, Math.min(H * 0.375 + 15.3 * p, 0.5 * H + 20 * p - 40 - (bottom - top) * tu / 2)];
    const targets = boxes.map((b) => ({
      x: mid[0] + (b.x - (left + right) / 2) * tu, y: mid[1] + (b.y - (top + bottom) / 2) * tu,
      w: b.w * tu, h: b.h * tu,
    }));

    // the pieces on the screen now, and the nearest one for each place in the title
    const sources = [];
    letters.forEach((l) => l.pieces.forEach((piece) => {
      const r = shapeIn(piece).getBoundingClientRect();
      sources.push({ piece, scale: l.scale, x: r.left + r.width / 2, y: r.top + r.height / 2, used: false });
    }));
    const order = targets.map((t, i) => i).sort(() => Math.random() - 0.5);
    const from = [];
    order.forEach((i) => {
      const t = targets[i], tx = t.x + t.w / 2, ty = t.y + t.h / 2;
      let best = null, bestD = Infinity;
      sources.forEach((src) => {
        if (src.used) return;
        const d = Math.hypot(src.x - tx, src.y - ty);
        if (d < bestD) { bestD = d; best = src; }
      });
      if (best) { best.used = true; from[i] = [best.x, best.y]; best.piece.style.visibility = "hidden"; }
      else from[i] = [tx < W / 2 ? -60 : W + 60, ty];   // (more pieces than there are: from the side)
    });

    // the title's pieces, in a layer over the screen, each starting where its piece was
    const layer = document.createElement("div");
    layer.className = "phone-title-build";
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);
    const BUILD = 2 * SLIDE, SPREAD_TIME = 500;
    targets.forEach((t, i) => {
      const svg = shapes[i].cloneNode(true);
      svg.setAttribute("class", "phone-title-piece");
      svg.removeAttribute("width");
      svg.removeAttribute("height");
      svg.style.left = t.x + "px";
      svg.style.top = t.y + "px";
      svg.style.width = t.w + "px";
      svg.style.height = t.h + "px";
      layer.appendChild(svg);
      const dx = from[i][0] - (t.x + t.w / 2), dy = from[i][1] - (t.y + t.h / 2);
      svg.animate([
        { transform: `translate(${dx}px, ${dy}px)` },
        { transform: `translate(0px, ${dy}px)`, offset: 0.5, easing: EASE },
        { transform: "translate(0px, 0px)" },
      ], { duration: BUILD, delay: Math.random() * SPREAD_TIME, easing: "linear", fill: "backwards" });
    });

    // the pieces that are not needed leave through the nearest side
    sources.filter((src) => !src.used).forEach((src) => {
      const out = src.x < W / 2 ? -(src.x + 80) : (W - src.x + 80);
      src.piece.animate([{ translate: "0 0" }, { translate: `${out / src.scale}px 0` }],
        { duration: SLIDE, easing: EASE, fill: "forwards" });
    });
    // the finished title stays a moment, then the project page opens (with the title in the same place)
    await wait(BUILD + SPREAD_TIME + 250);
    location.href = href;
  }

  // ----- The opening -----
  const wait = (ms) => new Promise((done) => setTimeout(done, ms));
  ready.then(async () => {
    if (skip) {   // straight to the pictures
      letters.forEach((l) => put(l, g(l.at), l.scale));
      pictures.forEach((ph) => ph.texts.forEach((t) => t.show()));
      home.classList.add("is-done");
      return;
    }
    const named = letters.filter((l) => !l.extra);   // the letters of the name (the extras just wait outside)
    letters.forEach((l) => l.extra ? put(l, g(l.at), l.scale) : put(l, namePlace(l), 1));
    pictures.forEach((ph) => { ph.item.style.translate = ph.outside + "px 0"; });
    home.classList.add("is-opening");

    // Like the big version, everything moves in straight slides of SLIDE ms, one right after the other,
    // on a beat (every 110 ms); a shape turns only between slides. `slides` turns a path (a list of
    // places) into such a movement: each part is one slide, slow at the start and soft at the end.
    const BEAT = 110;
    const slides = (path) => path.map((place, k) => ({
      transform: place, offset: k / (path.length - 1), easing: EASE,
    }));
    const pick = (list) => list[Math.floor(Math.random() * list.length)];
    const away = () => (Math.random() < 0.5 ? -1 : 1) * (40 + Math.random() * 110);   // a sideways step

    // 1. The puzzle (like the big version): every piece waits outside the screen, on the line of its
    //    first slide, and comes in with 2 to 4 straight slides (across, up or down, turning between
    //    them) into its place in the name. Most set off together, the others a few beats later.
    const all = [];
    named.forEach((l) => {
      const [lx, ly] = namePlace(l);
      l.pieces.forEach((piece) => all.push({ piece, lx, ly }));
    });
    const START_PAUSE = 300;
    const screenFigmaH = screenH / p;
    const px_ = ([x, y]) => `translate(${x * p}px, ${y * p}px)`;   // (Figma phone px → screen px)
    let puzzleEnd = 0;
    all.forEach(({ piece, lx, ly }) => {
      // the path, from the end back to the start: [0, 0] is its place in the name
      const count = pick([2, 2, 3, 3, 3, 4]);
      let axis = Math.random() < 0.5 ? 0 : 1;   // the last slide: 0 across, 1 up or down
      const path = [[0, 0]];
      for (let k = 1; k < count; k++) {
        const [x, y] = path[0];
        path.unshift(axis === 0 ? [x + away(), y] : [x, y + away()]);
        axis = 1 - axis;
      }
      // the first slide comes straight in from beyond the nearest edge on its line
      const [x, y] = path[0], beyond = 40 + Math.random() * 60;
      if (axis === 0) path.unshift([lx + x < 393 / 2 ? -(lx + LETTER + beyond) : 393 - lx + beyond, y]);
      else path.unshift([x, ly + y < screenFigmaH / 2 ? -(ly + LETTER + beyond) : screenFigmaH - ly + beyond]);
      const delay = Math.random() < 0.6 ? 0 : (1 + Math.floor(Math.random() * 9)) * BEAT;
      const duration = (path.length - 1) * SLIDE;
      piece.animate(slides(path.map(px_)), { duration, delay: START_PAUSE + delay, fill: "backwards" });
      puzzleEnd = Math.max(puzzleEnd, START_PAUSE + delay + duration);
    });
    home.classList.add("is-ready");   // (the pieces are placed: show them)
    await wait(puzzleEnd + 400);      // (a short moment with the whole name)

    // 2. It breaks apart, like the big version: three movements, one right after the other (each one
    //    slide long), and each movement moves some letters and some pictures.
    //    - The letters move as blocks, in two slides each (across, then up or down) to their places:
    //      the top row (E L A N A) in movements 1 and 2, the bottom row (G E R T E L) in 2 and 3.
    //      They grow (or shrink) to their size gradually along both slides (drawn as many small steps,
    //      so the size changes smoothly).
    //    - The pictures slide in from the nearest side, in one slide each, in the movement given in
    //      BEATS (picture number: 0 = first movement).
    const BEATS = { 1: 0, 2: 1, 3: 2, 4: 2, 5: 0, 6: 1 };
    const ease = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);   // slow start, soft stop
    const STEPS = 30;
    named.forEach((l) => {
      const from = namePlace(l), to = g(l.at), mid = [to[0], from[1]];
      const frames = [];
      for (let k = 0; k <= STEPS; k++) {
        const t = k / STEPS;
        const [a, b, part] = t < 0.5 ? [from, mid, ease(t * 2)] : [mid, to, ease(t * 2 - 1)];
        const place = [a[0] + (b[0] - a[0]) * part, a[1] + (b[1] - a[1]) * part];
        frames.push({ transform: at(place, 1 + (l.scale - 1) * ease(t)) });
      }
      const delay = l.row === 0 ? 0 : SLIDE;
      l.el.animate(frames, { duration: 2 * SLIDE, delay, easing: "linear", fill: "backwards" });
      put(l, to, l.scale);
    });
    const slideIn = (el, out, beat) => {
      el.animate([{ translate: out + "px 0" }, { translate: "0 0" }],
        { duration: SLIDE, delay: beat * SLIDE, easing: EASE, fill: "backwards" });
      el.style.translate = "";
    };
    pictures.forEach((ph) => {
      slideIn(ph.item, ph.outside, BEATS[ph.pr.number]);
    });
    await wait(3 * SLIDE);
    // 3. Once everything is in place, the numbers and names type themselves out
    pictures.forEach((ph) => ph.texts.forEach((t) => t.type(30, 0)));
    home.classList.remove("is-opening");
    home.classList.add("is-done");
  });
  }
})();
