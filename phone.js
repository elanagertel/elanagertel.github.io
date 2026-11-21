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
  const LINKS = [
    { cls: "phone-menu-contact", words: "Contact me  /" },
    { cls: "phone-menu-line", words: "@elanagertel  /  Instagram", href: "https://www.instagram.com/elanagertel/" },
    { cls: "phone-menu-line", words: "+972-54-262-7915  /  Whatsapp", href: "https://wa.me/972542627915" },
    { cls: "phone-menu-line", words: "gertel.elana@gmail.com", href: "mailto:gertel.elana@gmail.com" },
    { cls: "phone-menu-about", words: "About Me  /", href: "about.html", here: page === "about.html" },
    { cls: "phone-menu-home", words: "Home  /", href: "index.html", here: isHome },
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
      menuTexts.forEach((t, i) => t.type(30, 350 + (i === 0 ? 0 : i < 4 ? 250 : 250 + (i - 3) * 200)));
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
      // (never wider than the screen's margins: shrink it if it is)
      const room = window.innerWidth - 2 * 18;
      const wide = Math.max(...shapes.map((r) => r.right)) - Math.min(...shapes.map((r) => r.left));
      if (wide > room + 1 && !first.dataset.fitted) {
        first.dataset.fitted = "1";
        lab.style.setProperty("--tu-fit", room / wide);
        return requestAnimationFrame(centreTitle);
      }
      // its middle: 37.5% + 15.3 down the screen (Figma "iPhone 16 - 7")
      first.style.translate = `${box.left + box.width / 2 - midX}px ${box.top + box.height * 0.375 + 15.3 * window.innerWidth / 393 - midY}px`;
    }
    requestAnimationFrame(centreTitle);
    window.addEventListener("resize", centreTitle);

    // At the end: the white title goes into the black end (it lies still there, in white)
    const footer = lab.querySelector(".lab-footer");
    const whiteTitle = document.getElementById("lab-footer-title");
    if (footer && whiteTitle) {
      whiteTitle.style.clipPath = "none";
      footer.appendChild(whiteTitle);
    }
  }

  // ----- The home page -----
  if (!isHome) return;
  buildHome();
  function buildHome() {
  // Like the big version:
  //   1. the black pieces slide in from the edges and puzzle their way into "ELANA GERTEL"
  //      (Figma "iPhone 16 - 3": two rows in the middle of the screen), each in two straight slides;
  //   2. the whole name grows a little;
  //   3. it breaks apart: each letter slides (as one block, in two straight slides) to its place in the
  //      gallery, while the pictures slide in from the sides to theirs.
  // The gallery (Figma "iPhone 16 - 6"): the big version's gallery, made small; it scrolls up and down.
  // Tapping a picture breaks the letters apart and shows its name (typing itself out); tapping the picture
  // again puts the letters back, and tapping its name opens the project.
  // Everything is placed in pixels of the Figma phone (393 wide); p = one of them on this screen.
  const p = window.innerWidth / 393;
  const screenH = window.innerHeight;
  const skip = reduced || new URLSearchParams(location.search).has("gallery");

  const SLIDE = 550;                 // ms for one straight slide (like the big version)
  const EASE = "cubic-bezier(0.65, 0, 0.35, 1)";
  const GROW = 1.08;                 // how much the name grows before it breaks apart (it just fits the screen)
  const LETTER = 57.21;              // a letter's size in the name (Figma: 2 × 2 pieces)

  // The gallery (Figma "Component 2" in frame 6): 592.75 × 803, its left edge 40 outside the screen and
  // its top 37 from the top. It only scrolls up and down: what lies outside the screen at the sides stays
  // cut off (like in Figma).
  const GALLERY = { w: 592.75, h: 803, left: 40, top: 37 };
  const g = ([x, y]) => [x - GALLERY.left, y + GALLERY.top];   // gallery → screen (Figma phone px)

  // The letters, in the order of the name (row, column), and their places in the gallery (Figma frame 6)
  const IN_GALLERY = 56.99;          // a letter's size in the gallery
  const LETTERS = [
    { file: "phone-e1", row: 0, col: 0, at: [57, 196.67] },
    { file: "phone-l1", row: 0, col: 1, at: [117, 0] },
    { file: "phone-a1", row: 0, col: 2, at: [239, 327.62] },
    { file: "phone-n",  row: 0, col: 3, at: [359.5, 66] },
    { file: "phone-a2", row: 0, col: 4, at: [500, 605] },
    { file: "phone-g",  row: 1, col: 0, at: [57, 393.8] },
    { file: "phone-e2", row: 1, col: 1, at: [359.8, 459.07] },
    { file: "phone-r",  row: 1, col: 2, at: [179, 721.31] },
    { file: "phone-t",  row: 1, col: 3, at: [121, 523.91] },
    { file: "phone-e3", row: 1, col: 4, at: [58.79, 659] },
    { file: "phone-l2", row: 1, col: 5, at: [360, 659] },
  ];
  // The pictures (Figma frame 6): place, size, and how the picture lies in its window (the same crops
  // as the big version: [left, top, width, height] of the picture, in % of the window).
  // number: the project's number, on the picture's left (only on one picture of each project).
  // caption: its name, one word on each row (Figma: "The / Israeli / Cactus").
  const PICTURES = [
    { file: "gallery-sense.jpg", at: [235, -0.46], size: [58.25, 57.43], crop: [0, 0, 100, 100],
      number: 2, caption: "Sense\nShopping", alt: "Sense Shopping", href: "sense.html" },
    { file: "gallery-archive.jpg", at: [360, 330], size: [57.63, 56.71], crop: [-19.53, -4.56, 159.77, 104.94],
      number: 3, caption: "The\nIsraeli\nMovie\nArchive", alt: "The Israeli Movie Archive", href: "israeli-movie-archive.html" },
    { file: "gallery-brain.png", at: [178.15, 131.05], size: [57.63, 56.71], crop: [0.68, -36.51, 99.32, 148.21],
      number: 1, caption: "The\nMemory\nLab", alt: "The Memory Lab", href: "memory-lab.html" },
    { file: "gallery-house.png?v=2", at: [293, 181], size: [64.03, 75], crop: [-0.01, -6.59, 99.99, 111.53],
      number: 5, caption: "The\nDouble\nFamily", alt: "The Double Family", href: null },
    { file: "gallery-cactus.png", at: [118.7, 263.23], size: [57.04, 55.8], crop: [-0.11, -51.11, 100.22, 151.11],
      number: 4, caption: "The\nIsraeli\nCactus", alt: "The Israeli Cactus", href: "israeli-cactus.html" },
    { file: "gallery-watercolor.png?v=2", at: [174, 393.31], size: [64.94, 57.17], crop: [-2.11, -9.59, 102.45, 164.6],
      caption: "The\nMemory\nLab", alt: "The Memory Lab", href: "memory-lab.html" },
    { file: "gallery-archive.jpg", at: [296, 524], size: [57.63, 56.71], crop: [-19.53, -4.56, 159.77, 104.94],
      caption: "The\nIsraeli\nMovie\nArchive", alt: "The Israeli Movie Archive", href: "israeli-movie-archive.html" },
    { file: "gallery-house.png?v=2", at: [175, 581], size: [64.03, 75], crop: [-0.01, -6.59, 99.99, 111.53],
      caption: "The\nDouble\nFamily", alt: "The Double Family", href: null },
  ];

  // The scrolling box (the whole screen) and the gallery in it
  const home = document.createElement("section");
  home.className = "phone-home";
  home.setAttribute("aria-label", "Projects");
  const flowBox = document.createElement("div");
  flowBox.className = "phone-flow";
  flowBox.style.width = 393 * p + "px";   // (as wide as the screen: what lies outside it is cut off)
  flowBox.style.height = Math.max((GALLERY.top + GALLERY.h + 70) * p, screenH) + "px";
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
  // the same place once the name has grown (around its middle)
  const grown = ([x, y]) => [nameMid[0] + (x - nameMid[0]) * GROW, nameMid[1] + (y - nameMid[1]) * GROW];

  // ----- The letters: one <svg> each, every piece in its own group (so each piece can slide) -----
  const SVG_NS = "http://www.w3.org/2000/svg";
  function readSvg(file) {
    return fetch("images/" + file + ".svg").then((r) => r.text())
      .then((text) => new DOMParser().parseFromString(text, "image/svg+xml").documentElement);
  }
  const letters = LETTERS.map((l) => {
    const el = document.createElementNS(SVG_NS, "svg");
    el.setAttribute("class", "phone-flow-letter");
    el.setAttribute("viewBox", `0 0 ${LETTER} ${LETTER}`);
    el.setAttribute("aria-hidden", "true");
    flowBox.appendChild(el);
    return { ...l, el, pieces: [] };
  });
  const ready = Promise.all(letters.map((l) => {
    const files = l.file === "phone-g" ? ["phone-g-base", "phone-g-corner"] : [l.file];
    return Promise.all(files.map(readSvg)).then((svgs) => {
      svgs.forEach((svg, k) => {
        svg.querySelectorAll("path").forEach((path) => {
          const piece = document.createElementNS(SVG_NS, "g");
          piece.setAttribute("class", "phone-piece");
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

  // Put a letter at [x, y] (Figma phone px, on the page) at a size (1 = the name's 57.2)
  const at = ([x, y], size) => `translate(${x * p}px, ${y * p}px) scale(${size})`;
  const put = (l, place, size) => { l.el.style.transform = at(place, size); };
  const SMALL = IN_GALLERY / LETTER;

  // ----- The pictures, numbers and names -----
  let shownName = null;   // the picture whose name shows (after a first tap)
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
    picture.alt = pr.alt;
    picture.style.left = pr.crop[0] + "%";
    picture.style.top = pr.crop[1] + "%";
    picture.style.width = pr.crop[2] + "%";
    picture.style.height = pr.crop[3] + "%";
    window_.appendChild(picture);
    item.appendChild(window_);
    if (pr.number) {
      const number = document.createElement("span");
      number.className = "phone-project-number";
      number.setAttribute("aria-hidden", "true");
      number.textContent = pr.number + "  /";
      item.appendChild(number);
    }
    const caption = document.createElement("span");
    caption.className = "phone-project-caption";
    caption.setAttribute("aria-hidden", "true");
    const typer = typed(caption, pr.caption);
    typer.clear();
    item.appendChild(caption);
    flowBox.appendChild(item);
    // Pressing a picture (like hovering it on the big version): the letters spread away from it and
    // its name types itself out under it. Pressing it again opens the project; pressing anywhere else
    // puts the letters back.
    const entry = { item, typer, pr };
    item.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!home.classList.contains("is-done") || leaving) return;
      const onName = event.target.closest(".phone-project-caption");
      if (shownName === entry && onName && pr.href) goToProject(entry);   // tapping its name: the pieces
                                                                         // build its title, then it opens
      else if (shownName === entry) hidePicture();   // tapping it again: the letters come back together
      else showPicture(entry);                        // the first tap: the letters break apart, its name shows
    });
    // it waits outside the screen on the side it is nearest to, and slides in from there
    const fromLeft = x + pr.size[0] / 2 < 393 / 2;
    entry.outside = fromLeft ? -(x + pr.size[0] + 40) * p : (393 - x + 40) * p;
    return entry;
  });

  document.body.appendChild(home);

  // ----- Pressing a picture: the letters break apart, and its name shows -----
  // Like the big version: each letter breaks along its grid. Half of it (a column or a row of its 2 × 2
  // squares) slides exactly one square, straight away from the picture (sideways or up/down, whichever
  // the letter is more off to), so the pieces stay neat. Which half moves differs from letter to letter
  // and from picture to picture. Tapping anywhere else, they slide back.
  const CELL = LETTER / 2;     // one square of a letter (its own units)
  let leaving = false;
  function spreadFrom(entry) {
    const [px, py] = g(entry.pr.at);
    const cx = px + entry.pr.size[0] / 2, cy = py + entry.pr.size[1] / 2;
    const pictureIndex = pictures.indexOf(entry);
    letters.forEach((l, k) => {
      const [lx, ly] = g(l.at);
      const dx = lx + IN_GALLERY / 2 - cx, dy = ly + IN_GALLERY / 2 - cy;
      const across = Math.abs(dx) > Math.abs(dy);          // it moves sideways (or up/down)
      const away = across ? Math.sign(dx || 1) : Math.sign(dy || 1);
      const kind = (k + pictureIndex) % 3;                 // which half of the letter moves
      l.pieces.forEach((piece) => {
        const b = piece.getBBox();
        const col = b.x + b.width / 2 < CELL ? 0 : 1, row = b.y + b.height / 2 < CELL ? 0 : 1;
        const far = away > 0 ? 1 : 0;                      // the column / row on the side away from the picture
        let moves;
        if (kind === 0) moves = across ? col === far : row === far;   // the far half slides further away
        else if (kind === 1) moves = across ? row === 0 : col === 0;  // the top (or left) half slides
        else moves = across ? row === 1 : col === 1;                  // the bottom (or right) half slides
        const step = moves ? away * CELL : 0;
        piece.style.transform = across ? `translate(${step}px, 0px)` : `translate(0px, ${step}px)`;
      });
    });
  }
  function gatherPieces() {
    letters.forEach((l) => l.pieces.forEach((piece) => { piece.style.transform = ""; }));
  }
  function showPicture(entry) {
    hidePicture();
    shownName = entry;
    entry.item.classList.add("is-named");
    entry.typer.type(30, 0);
    spreadFrom(entry);
  }
  function hidePicture() {
    if (!shownName) return;
    shownName.typer.clear();
    shownName.item.classList.remove("is-named");
    shownName = null;
    gatherPieces();
  }

  // ----- Tapping the name: the pieces puzzle into the project's title, then the project page opens -----
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
    let title;
    try { title = await readTitle(href); } catch (e) { location.href = href; return; }
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
    let tu = 52.513 / 126.225 * p;
    if ((right - left) * tu > W - 36 + 1) tu *= (W - 36) / ((right - left) * tu);   // (as the page shrinks it)
    const mid = [W / 2, H * 0.375 + 15.3 * p];
    const targets = boxes.map((b) => ({
      x: mid[0] + (b.x - (left + right) / 2) * tu, y: mid[1] + (b.y - (top + bottom) / 2) * tu,
      w: b.w * tu, h: b.h * tu,
    }));

    // the pieces on the screen now, and the nearest one for each place in the title
    const sources = [];
    letters.forEach((l) => l.pieces.forEach((piece) => {
      const r = piece.getBoundingClientRect();
      sources.push({ piece, x: r.left + r.width / 2, y: r.top + r.height / 2, used: false });
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
      src.piece.animate([{ translate: "0 0" }, { translate: `${out / (SMALL * p)}px 0` }],
        { duration: SLIDE, easing: EASE, fill: "forwards" });
    });
    // the pictures slide out to their sides, and the names go away
    pictures.forEach((ph) => {
      ph.typer.clear();
      ph.item.animate([{ translate: "0 0" }, { translate: ph.outside + "px 0" }],
        { duration: SLIDE, easing: EASE, fill: "forwards" });
    });

    // the finished title stays a moment, then the project page opens (with the title in the same place)
    await wait(BUILD + SPREAD_TIME + 250);
    location.href = href;
  }
  home.addEventListener("click", (event) => { if (!event.target.closest(".phone-flow-photo")) hidePicture(); });

  // ----- The opening -----
  const wait = (ms) => new Promise((done) => setTimeout(done, ms));
  ready.then(async () => {
    if (skip) {   // straight to the gallery
      letters.forEach((l) => put(l, g(l.at), SMALL));
      home.classList.add("is-done");
      return;
    }
    letters.forEach((l) => put(l, namePlace(l), 1));
    pictures.forEach((ph) => { ph.item.style.translate = ph.outside + "px 0"; });
    home.classList.add("is-opening");

    // 1. The puzzle: every piece starts outside the screen (left or right, a little higher or lower)
    //    and comes in with two straight slides: across first, then up or down into its place
    const all = [];
    letters.forEach((l) => {
      const [lx] = namePlace(l);
      l.pieces.forEach((piece) => all.push({ piece, lx }));
    });
    all.sort(() => Math.random() - 0.5);
    const START_PAUSE = 300, SPREAD = 1500;   // the pieces set off one after the other within SPREAD ms
    all.forEach(({ piece, lx }, i) => {
      const side = Math.random() < 0.5 ? -1 : 1;
      const dx = side < 0 ? -(lx + LETTER + 40 + Math.random() * 60) : (393 - lx + 40 + Math.random() * 60);
      const dy = (Math.random() < 0.5 ? -1 : 1) * (40 + Math.random() * 140);
      piece.animate([
        { transform: `translate(${dx}px, ${dy}px)` },
        { transform: `translate(0px, ${dy}px)`, offset: 0.5, easing: EASE },
        { transform: "translate(0px, 0px)" },
      ], { duration: 2 * SLIDE, delay: START_PAUSE + (i / all.length) * SPREAD, easing: "linear", fill: "backwards" });
    });
    home.classList.add("is-ready");   // (the pieces are placed: show them)
    await wait(START_PAUSE + SPREAD + 2 * SLIDE + 500);

    // 2. The name grows
    letters.forEach((l) => {
      const from = namePlace(l), to = grown(from);
      l.el.animate([{ transform: at(from, 1) }, { transform: at(to, GROW) }], { duration: 700, easing: EASE });
      put(l, to, GROW);
    });
    await wait(700 + 350);

    // 3. It breaks apart: each letter slides across, then up or down, to its place in the gallery
    //    (back to its own size on the way), one after the other; the pictures slide in from the sides
    letters.forEach((l, i) => {
      const from = grown(namePlace(l)), to = g(l.at), mid = [to[0], from[1]];
      l.el.animate([
        { transform: at(from, GROW) },
        { transform: at(mid, (GROW + SMALL) / 2), offset: 0.5, easing: EASE },
        { transform: at(to, SMALL) },
      ], { duration: 2 * SLIDE, delay: i * 70, easing: "linear", fill: "backwards" });
      setTimeout(() => put(l, to, SMALL), i * 70);
    });
    pictures.forEach((ph, i) => {
      ph.item.animate([{ translate: ph.outside + "px 0" }, { translate: "0 0" }],
        { duration: 2 * SLIDE, delay: 200 + i * 90, easing: EASE, fill: "backwards" });
      setTimeout(() => { ph.item.style.translate = ""; }, 200 + i * 90);
    });
    await wait(200 + PICTURES.length * 90 + 2 * SLIDE);
    home.classList.remove("is-opening");
    home.classList.add("is-done");
  });
  }
})();
