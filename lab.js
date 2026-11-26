// ===== Project pages ("The Memory Lab", "The Israeli Cactus") =====
// Draws the project title with the same black shapes as the home page, and again in white at the
// bottom of the page. Clicking the first screen scrolls down to the pictures (they slide up over the
// title, which stays). All positions are in Figma pixels (the frame is 1440 wide).
// Each page loads its own title first: TITLE_PIECES, TITLE_TOP, TITLE_SCALE and ORGANIC_LETTERS
// (lab-organic.js for The Memory Lab, cactus-title.js for The Israeli Cactus).

const SVG_NS = "http://www.w3.org/2000/svg";

// Put an element at [x, y] (Figma pixels). The CSS reads --x and --y.
function place(el, point) {
  el.style.setProperty("--x", point[0]);
  el.style.setProperty("--y", point[1]);
}

// ----- Create the shapes: the black title at the top (and, later, the white one at the bottom) -----
// Each shape is an <svg> right in the page, so it gets the same thin outline as on the home page
// (touching shapes look merged, with no white line between them).
// The black title goes in the first screen (which stays while you scroll). The white title is the NEXT
// project's title (Figma "Israeli Movie Archive", the end: black, with "THE ISRAELI CACTUS" in white);
// it lies in the same place as this one and only shows over the black end (see "The white title" below).
const titleShapes = [];
const footerTitle = document.getElementById("lab-footer-title");

// The outlines come from pieces.js (loaded before this file), so the title is drawn right away,
// before the page is first shown: coming from the home page, the title is simply there.
function drawShape(shape) {
  const { viewBox, outlines } = PIECE_SHAPES[shape.file];
  shape.svg.setAttribute("viewBox", viewBox);
  outlines.forEach((d) => {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", d);
    shape.svg.appendChild(path);
  });
}

// Make the shapes of a title (pieces: [shape number, width, x, y] in Figma pixels)
function makeShapes(pieces, scale, white) {
  pieces.forEach(([number, width, x, y]) => {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", white ? "flow-piece lab-piece lab-piece-white" : "flow-piece lab-piece");
    svg.setAttribute("aria-hidden", "true");
    svg.style.setProperty("--w", width * scale);
    place(svg, white ? [x, y - TITLE_TOP] : [x, y]);
    (white ? footerTitle : document.getElementById("lab-first")).appendChild(svg);
    const shape = { svg, file: "flow-piece-" + number + ".svg", white, x, y, width: width * scale };
    drawShape(shape);
    titleShapes.push(shape);
  });
}
makeShapes(TITLE_PIECES, TITLE_SCALE, false);

// A title's box (Figma pixels): left, top, right, bottom
function titleBox(pieces, scale) {
  const boxes = pieces.map(([number, width, x, y]) => {
    const [, , vw, vh] = PIECE_SHAPES["flow-piece-" + number + ".svg"].viewBox.split(/[\s,]+/).map(Number);
    return [x, y, x + width * scale, y + width * scale * vh / vw];
  });
  return [Math.min(...boxes.map((b) => b[0])), Math.min(...boxes.map((b) => b[1])),
          Math.max(...boxes.map((b) => b[2])), Math.max(...boxes.map((b) => b[3]))];
}

// The title's middle (Figma y), measured from its shapes: the CSS puts it in the middle of the
// screen, level with the side names
const titleTop = Math.min(...TITLE_PIECES.map(([n, w, x, y]) => y));
const titleBottom = Math.max(...TITLE_PIECES.map(([number, width, x, y]) => {
  const [, , vw, vh] = PIECE_SHAPES["flow-piece-" + number + ".svg"].viewBox.split(/[\s,]+/).map(Number);
  return y + width * TITLE_SCALE * vh / vw;
}));
document.getElementById("lab").style.setProperty("--title-mid", (titleTop + titleBottom) / 2);

// ----- The texts under the title scroll out first: everything else waits until they have left -----
// --intro-out: how far you scroll until the lowest of them has left the top of the screen (plus a
// short pause). The CSS starts everything after the first screen that much lower (see styles.css).
// (They stay in the same place on the page whatever --intro-out is, so they can be measured any time.)
const INTRO_PAUSE = 30;   // px of scrolling between the texts leaving and the next thing coming
function placeIntroOut() {
  const intros = [...document.querySelectorAll(".lab-intro")];
  if (!intros.length) return;
  const bottom = Math.max(...intros.map((el) => el.getBoundingClientRect().bottom + window.scrollY));
  document.getElementById("lab").style.setProperty("--intro-out", Math.round(bottom + INTRO_PAUSE) + "px");
}
placeIntroOut();
document.fonts.ready.then(placeIntroOut);
window.addEventListener("resize", placeIntroOut);

// ----- The white title only shows over the black end -----
// While you scroll, everything of it above the top of the black end is cut off,
// so the title turns white exactly where the black end passes behind it.
const whiteLayer = document.getElementById("lab-white");
if (whiteLayer) {
  const footer = document.querySelector(".lab-footer");
  // The white title is the next project's name, so this project's black title must not show
  // through around it: everything of the black title below the top of the black end is cut off.
  // (phones held upright: the same; their name and menu button at the top are covered too)
  const keepBlack = false;
  const blackParts = () => keepBlack ? [] : document.querySelectorAll(
    "#lab-first > .lab-piece:not(.lab-piece-white), #lab-first > .lab-morph:not(.lab-morph-white)");
  const cutWhite = () => {
    const footerTop = footer.getBoundingClientRect().top;
    const cut = footerTop - whiteLayer.getBoundingClientRect().top;
    whiteLayer.style.clipPath = `inset(${Math.max(0, cut)}px 0 0 0)`;
    // the bar at the top, the counter and the left arrow belong to the project, not to the black end with
    // the next project's name: they stay where they are, and the black end comes up over them and covers
    // them (only the right arrow stays: on the black it leads to the next project)
    // (everything of them below the top of the black end is cut off, like the black title)
    const covered = keepBlack ? [] : [...document.querySelectorAll(".site-nav-item, .fold-count, .project-arrow-prev, .phone-name, .phone-menu-button")];
    [...blackParts(), ...covered].forEach((el) => {
      const box = el.getBoundingClientRect();
      const below = box.bottom - footerTop;   // how much of it lies over the black end
      el.style.clipPath = below > 0 ? `inset(0 0 ${Math.min(below, box.height + 1)}px 0)` : "";
    });
  };
  window.addEventListener("scroll", cutWhite, { passive: true });
  window.addEventListener("resize", cutWhite);
  cutWhite();
}

// ----- Clicking the first screen scrolls down until the first picture is in the middle -----
// (a page without pictures yet scrolls down to its black end instead)
document.getElementById("lab-first-screen").addEventListener("click", () => {
  const firstPicture = document.querySelector(".lab-media");
  if (firstPicture) firstPicture.scrollIntoView({ behavior: "smooth", block: "center" });
  else window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
});

// ----- Hovering a letter: its shapes ooze into the letter's organic shape, like slime -----
// (The organic letters are in the page's title file: ORGANIC_LETTERS.)
// Each shape's outline and its letter's organic outline are turned into the same number of points;
// every point slides from one outline to the other, so the shapes melt into the organic letter
// (all shapes of a letter end up as the same organic shape, on top of each other).
// Like slime: the change starts where the mouse touched the letter and oozes outward, and while it
// changes the shapes melt together like liquid (a "goo" filter: soften, then cut sharp again);
// the melting fades out as the letter arrives, so it ends crisp on the organic shape.
// The holes (O, R, A, B) grow in from their middle. Each letter reacts on its own and stays
// organic for a moment after the mouse leaves, so a quick sweep leaves a few organic together.
const MORPH_POINTS = 120;   // points on each outline
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const MORPH_TIME = REDUCED ? 1 : 1100;   // ms for a whole letter to change
const OOZE_SPREAD = 0.3;                 // how much later the far points start (part of the time)
const STAY_TIME = 700;                   // ms a letter stays organic after the mouse leaves
const GOO = 7;                           // how soft the shapes melt together halfway (Figma pixels)
const TAP_STAY_TIME = 900;               // phones: ms a tapped letter stays organic before it oozes back

// The project's picture inside the organic letters is turned off: a hovered letter just turns organic,
// with no picture in it. (To bring it back: use the page's data-organic-picture here instead of null.
// It showed the picture from the home page inside a letter while it was organic, Figma "Frame 219".)
const ORGANIC_PICTURE = null;
const PICTURE_BOX = [297, 96, 846, 832];   // Figma pixels: x, y, width, height

// Phones: a tap also sends "mouse" events; they are ignored right after a finger touched the screen (mobile.js)
const byFinger = () => typeof window.touchedJustNow === "function" && window.touchedJustNow();

// A hidden <svg> to measure outlines in
const measureSvg = document.createElementNS(SVG_NS, "svg");
measureSvg.setAttribute("class", "lab-measure");
document.body.appendChild(measureSvg);

// Points along an outline (d), turned into page positions by toPage([x, y])
function outlinePoints(d, toPage) {
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", d);
  measureSvg.appendChild(path);
  const length = path.getTotalLength();
  const points = [];
  for (let i = 0; i < MORPH_POINTS; i++) {
    const p = path.getPointAtLength((length * i) / MORPH_POINTS);
    points.push(toPage([p.x, p.y]));
  }
  path.remove();
  return points;
}

// Which way an outline goes round (clockwise or not)
function turning(points) {
  let area = 0;
  points.forEach((p, i) => { const q = points[(i + 1) % points.length]; area += p[0] * q[1] - q[0] * p[1]; });
  return Math.sign(area);
}

// Line up the target's points with the shape's points (same direction, nearest starting point),
// so every point travels as little as possible
function lineUp(from, to) {
  if (turning(from) !== turning(to)) to = [...to].reverse();
  let best = 0, bestCost = Infinity;
  for (let shift = 0; shift < to.length; shift++) {
    let cost = 0;
    for (let i = 0; i < from.length; i++) {
      const q = to[(i + shift) % to.length];
      cost += (from[i][0] - q[0]) ** 2 + (from[i][1] - q[1]) ** 2;
    }
    if (cost < bestCost) { bestCost = cost; best = shift; }
  }
  return from.map((_, i) => to[(i + best) % to.length]);
}

function pathFrom(points) {
  return "M" + points.map((p) => p[0].toFixed(2) + " " + p[1].toFixed(2)).join("L") + "Z";
}

// Thick and gooey: a slow start and a soft stop, never past the shape
function ooze(p) {
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  return p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2;
}
const clamp01 = (v) => Math.min(1, Math.max(0, v));

// Every title's letters, so they can all turn back into their pieces at once (when the page slides out:
// page-change.js calls window.resetOrganic, so no organic letter stays behind on the screen)
const morphResets = [];
window.resetOrganic = () => morphResets.forEach((reset) => reset());

function setUpMorph(white, organicLetters) {
  const container = white ? footerTitle : document.getElementById("lab-first");
  const top = white ? TITLE_TOP : 0;   // the white title's box starts at the title's top edge

  // the drawing that shows the reshaping (on top of the shapes, in the same place);
  // it covers the title's band only (y 255 to 775), so it never makes the page longer
  const drawing = document.createElementNS(SVG_NS, "svg");
  drawing.setAttribute("class", white ? "lab-morph lab-morph-white" : "lab-morph");
  drawing.setAttribute("viewBox", "0 255 1440 520");
  drawing.style.top = `calc(${255 - top} * var(--u))`;
  drawing.setAttribute("aria-hidden", "true");
  container.appendChild(drawing);

  const defs = document.createElementNS(SVG_NS, "defs");
  drawing.appendChild(defs);

  // the picture as a fill (black title only): it lies where Figma puts it, whatever part of it a letter covers
  const pictureId = white ? null : "organic-picture";
  if (ORGANIC_PICTURE && pictureId) {
    const pattern = document.createElementNS(SVG_NS, "pattern");
    pattern.setAttribute("id", pictureId);
    pattern.setAttribute("patternUnits", "userSpaceOnUse");
    const [px, py, pw, ph] = PICTURE_BOX;
    [["x", px], ["y", py], ["width", pw], ["height", ph]].forEach(([k, v]) => pattern.setAttribute(k, v));
    const image = document.createElementNS(SVG_NS, "image");
    image.setAttribute("href", ORGANIC_PICTURE);
    image.setAttribute("width", pw);
    image.setAttribute("height", ph);
    image.setAttribute("preserveAspectRatio", "xMidYMid slice");
    pattern.appendChild(image);
    defs.appendChild(pattern);
  }

  // the organic letters: outer outline and holes, in page positions
  const letters = organicLetters.map((organic, n) => {
    const parts = organic.d.split(/(?=M)/).map((part) => part.trim());
    const toPage = ([x, y]) => [organic.x + x, organic.y + y];
    const outer = outlinePoints(parts[0], toPage);
    const middle = [outer.reduce((a, p) => a + p[0], 0) / outer.length, outer.reduce((a, p) => a + p[1], 0) / outer.length];
    // the letter's own goo filter: blur the shapes, then make the edge sharp again, so touching
    // parts flow into each other like drops of liquid
    const filterId = (white ? "goo-white-" : "goo-") + n;
    const filter = document.createElementNS(SVG_NS, "filter");
    filter.setAttribute("id", filterId);
    filter.setAttribute("x", "-30%"); filter.setAttribute("y", "-30%");
    filter.setAttribute("width", "160%"); filter.setAttribute("height", "160%");
    const blur = document.createElementNS(SVG_NS, "feGaussianBlur");
    blur.setAttribute("in", "SourceGraphic");
    blur.setAttribute("stdDeviation", "0");
    const sharpen = document.createElementNS(SVG_NS, "feColorMatrix");
    sharpen.setAttribute("type", "matrix");
    sharpen.setAttribute("values", "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -11");
    filter.append(blur, sharpen);
    defs.appendChild(filter);
    const group = document.createElementNS(SVG_NS, "g");
    drawing.appendChild(group);
    return { outer, middle, holeOutlines: parts.slice(1).map((part) => outlinePoints(part, toPage)),
             shapes: [], holes: [], t: 0, target: 0, from: middle, leaveTimer: null, group, blur, filterId };
  });

  // every shape: its own outline, and the same number of points on its letter's organic outline
  titleShapes.filter((shape) => shape.white === white).forEach((shape) => {
    const [vx, vy, vw] = shape.svg.getAttribute("viewBox").split(/[\s,]+/).map(Number);
    const scale = shape.width / vw;
    const toPage = ([x, y]) => [shape.x + (x - vx) * scale, shape.y + (y - vy) * scale];
    const d = [...shape.svg.querySelectorAll("path")].map((path) => path.getAttribute("d")).join(" ");
    const from = outlinePoints(d, toPage);
    // its letter: the organic letter whose middle is nearest
    const cx = from.reduce((a, p) => a + p[0], 0) / from.length, cy = from.reduce((a, p) => a + p[1], 0) / from.length;
    const letter = letters.reduce((best, l) => (Math.hypot(l.middle[0] - cx, l.middle[1] - cy) < Math.hypot(best.middle[0] - cx, best.middle[1] - cy) ? l : best));
    const path = document.createElementNS(SVG_NS, "path");
    path.style.visibility = "hidden";
    letter.group.appendChild(path);
    // the same outline again, filled with the picture, on top (it fades in as the letter turns organic)
    let picture = null;
    if (ORGANIC_PICTURE && pictureId) {
      picture = document.createElementNS(SVG_NS, "path");
      picture.style.fill = `url(#${pictureId})`;   // (a style, so it wins over the black fill in styles.css)
      picture.style.stroke = `url(#${pictureId})`;   // its edge too, so no plain black outline is left
      picture.style.mixBlendMode = "hard-light";      // Figma: "Hard light" over the black letter
      picture.style.visibility = "hidden";
      letter.group.appendChild(picture);
    }
    letter.shapes.push({ svg: shape.svg, path, picture, from, to: lineUp(from, letter.outer) });
  });
  // the holes, drawn in the background colour on top
  letters.forEach((letter) => letter.holeOutlines.forEach((points) => {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("class", "lab-morph-hole");
    path.style.visibility = "hidden";
    drawing.appendChild(path);
    const mx = points.reduce((a, p) => a + p[0], 0) / points.length, my = points.reduce((a, p) => a + p[1], 0) / points.length;
    letter.holes.push({ path, points, middle: [mx, my] });
  }));

  // how much later each point starts: the further from where the mouse touched, the later
  function delays(letter) {
    const all = letter.shapes.flatMap((s) => s.from);
    const far = Math.max(...all.map((p) => Math.hypot(p[0] - letter.from[0], p[1] - letter.from[1])), 1);
    letter.shapes.forEach((s) => {
      s.delay = s.from.map((p) => OOZE_SPREAD * Math.hypot(p[0] - letter.from[0], p[1] - letter.from[1]) / far);
    });
  }

  function draw(letter) {
    const showing = letter.t > 0;
    // the melting: none at the start and the end, strongest halfway
    const goo = GOO * Math.sin(Math.PI * letter.t) ** 0.8;
    if (goo > 0.05) {
      letter.blur.setAttribute("stdDeviation", goo.toFixed(2));
      letter.group.setAttribute("filter", `url(#${letter.filterId})`);
    } else {
      letter.group.removeAttribute("filter");
    }
    letter.shapes.forEach((s) => {
      s.svg.classList.toggle("is-reshaping", showing);   // the real shape hides while reshaping
      s.path.style.visibility = showing ? "visible" : "hidden";
      if (s.picture) s.picture.style.visibility = showing ? "visible" : "hidden";
      if (!showing) return;
      const d = pathFrom(s.from.map((p, i) => {
        // each point runs its own part of the time: it starts later the further it is
        const e = ooze(clamp01((letter.t * (1 + OOZE_SPREAD) - s.delay[i]) / 1));
        return [p[0] + (s.to[i][0] - p[0]) * e, p[1] + (s.to[i][1] - p[1]) * e];
      }));
      s.path.setAttribute("d", d);
      if (s.picture) {
        s.picture.setAttribute("d", d);
        s.picture.style.opacity = ooze(letter.t).toFixed(3);   // the more organic, the more picture
      }
    });
    letter.holes.forEach(({ path, points, middle }) => {
      const e = ooze(clamp01((letter.t * (1 + OOZE_SPREAD) - OOZE_SPREAD * 0.6) / 1));
      path.style.visibility = showing && e > 0 ? "visible" : "hidden";
      path.setAttribute("d", pathFrom(points.map((p) => [middle[0] + (p[0] - middle[0]) * e, middle[1] + (p[1] - middle[1]) * e])));
    });
  }

  // play every letter that is changing; one animation loop for the whole title
  let last = null, running = false;
  function frame(now) {
    const step = last === null ? 0 : (now - last) / MORPH_TIME;
    last = now;
    let busy = false;
    letters.forEach((letter) => {
      if (letter.t === letter.target) return;
      letter.t = letter.target > letter.t ? Math.min(letter.target, letter.t + step) : Math.max(letter.target, letter.t - step);
      draw(letter);
      if (letter.t !== letter.target) busy = true;
    });
    if (busy) requestAnimationFrame(frame);
    else { running = false; last = null; }
  }
  morphResets.push(() => letters.forEach((letter) => {
    clearTimeout(letter.leaveTimer);
    letter.target = 0;
    letter.t = 0;
    draw(letter);
  }));
  function goTo(letter, value) {
    letter.target = value;
    if (!running) { running = true; requestAnimationFrame(frame); }
  }

  // each letter has its own spot that feels the mouse: around its shapes and its organic shape
  letters.forEach((letter) => {
    const pts = letter.shapes.flatMap((s) => s.from).concat(letter.outer);
    const x0 = Math.min(...pts.map((p) => p[0])), x1 = Math.max(...pts.map((p) => p[0]));
    const y0 = Math.min(...pts.map((p) => p[1])), y1 = Math.max(...pts.map((p) => p[1]));
    const area = document.createElement("div");
    area.className = "lab-title-hover";
    place(area, [x0, y0 - top]);
    area.style.setProperty("--w", x1 - x0);
    area.style.setProperty("--h", y1 - y0);
    container.appendChild(area);
    function oozeFrom(event) {
      clearTimeout(letter.leaveTimer);
      if (letter.t === 0) {
        // the ooze starts where the mouse came in (in page positions)
        const box = area.getBoundingClientRect();
        letter.from = [x0 + ((event.clientX - box.left) / box.width) * (x1 - x0), y0 + ((event.clientY - box.top) / box.height) * (y1 - y0)];
        delays(letter);
      }
      goTo(letter, 1);
    }
    // it stays organic for a moment, then oozes back
    function oozeBackSoon(wait) {
      clearTimeout(letter.leaveTimer);
      letter.leaveTimer = setTimeout(() => goTo(letter, 0), wait);
    }
    // (a tap on a phone also sends mouseenter/mouseleave: then they do nothing, the tap is handled below)
    // (the square cursor turns organic with the letter, and back into the square when the mouse leaves: cursor.js)
    area.addEventListener("mouseenter", (event) => {
      if (byFinger()) return;
      oozeFrom(event);
      if (window.squareCursor) window.squareCursor.organic(true);
    });
    area.addEventListener("mouseleave", () => {
      if (byFinger()) return;
      oozeBackSoon(STAY_TIME);
      if (window.squareCursor) window.squareCursor.organic(false);
    });
    area.addEventListener("click", (event) => {
      // the white title at the end (the next project's name) opens the next project, also with a finger
      if (white && nextPage) {
        // (the black stays and slides up on the next page: page-change.js)
        if (window.pageChange && window.pageChange.nextFromEnd) window.pageChange.nextFromEnd(nextPage);
        else location.href = nextPage;
        return;
      }
      if (byFinger()) {
        // Phones: a tap makes the letter ooze from where the finger touched it; a moment later it oozes back
        oozeFrom(event);
        oozeBackSoon(MORPH_TIME + TAP_STAY_TIME);
        return;
      }
      // the first screen's title still scrolls down when clicked (it lies over the big button)
      if (!white) document.getElementById("lab-first-screen").click();
    });
  });
}

// Hovering the title: its letters ooze into organic shapes
setUpMorph(false, ORGANIC_LETTERS);   // the black title (first screen)

// ----- The white title at the end: the next project's name -----
// The projects in order (like the arrows, fold-count.js): after the last one comes the first.
// Each has its page and its title file (the same file its own page draws its title from).
const NEXT_PROJECT = {
  "memory-lab.html": ["sense.html", "sense-title.js"],
  "sense.html": ["israeli-movie-archive.html", "archive-title.js"],
  "israeli-movie-archive.html": ["israeli-cactus.html", "cactus-title.js"],
  "israeli-cactus.html": ["mea-shearim.html", "mea-title.js"],
  "mea-shearim.html": ["memory-lab.html", "lab-organic.js"],
};
const thisPage = location.pathname.split("/").pop() || "";
const [nextPage, nextTitleFile] = NEXT_PROJECT[thisPage] || [null, null];

// read the next project's title file (its TITLE_PIECES, TITLE_SCALE and ORGANIC_LETTERS)
function readNextTitle() {
  return fetch(nextTitleFile).then((r) => r.text()).then((text) => new Function(text +
    "\nreturn { pieces: TITLE_PIECES, scale: TITLE_SCALE, organic: ORGANIC_LETTERS };")());
}

// (phones held upright too: their black end at the bottom of the page shows the next project's name)
const upright = document.documentElement.classList.contains("is-phone-portrait");
if (footerTitle && !nextPage) {
  makeShapes(TITLE_PIECES, TITLE_SCALE, true);
  setUpMorph(true, ORGANIC_LETTERS);
} else if (footerTitle) {
  readNextTitle().then((next) => {
    // its middle goes up or down to where this title's middle is (the middle of the screen at the end of
    // the page); across, it stays where its own page has it (so opening the next page, it does not move)
    const [l0, t0, r0, b0] = titleBox(TITLE_PIECES, TITLE_SCALE);
    const [l1, t1, r1, b1] = titleBox(next.pieces, next.scale);
    const dx = upright ? (l0 + r0) / 2 - (l1 + r1) / 2 : 0, dy = (t0 + b0) / 2 - (t1 + b1) / 2;
    makeShapes(next.pieces.map(([n, w, x, y]) => [n, w, x + dx, y + dy]), next.scale, true);
    setUpMorph(true, next.organic.map((letter) => ({ ...letter, x: letter.x + dx, y: letter.y + dy })));
    if (upright) requestAnimationFrame(() => requestAnimationFrame(placeEndTitle));
  }).catch(() => {
    // (if it cannot be read: this project's own title, as before)
    makeShapes(TITLE_PIECES, TITLE_SCALE, true);
    setUpMorph(true, ORGANIC_LETTERS);
  });

  // Phones held upright: the black end fills the screen at the very end; the name in it stands exactly
  // where the next project's page shows its title (phone.js: in the middle across, and its middle 37.5% +
  // 15.3 down the screen, or higher for a tall title, so its bottom stays 40px above the arrows), so the
  // title does not jump when that page opens
  function placeEndTitle() {
    const end = document.querySelector(".lab-footer");
    const shapes = [...footerTitle.querySelectorAll(".lab-piece-white")];
    if (!end || !shapes.length) return;
    footerTitle.style.transform = "";
    footerTitle.style.top = "";
    const boxes = shapes.map((el) => el.getBoundingClientRect()), e = end.getBoundingClientRect();
    const left = Math.min(...boxes.map((b) => b.left)), right = Math.max(...boxes.map((b) => b.right));
    const top = Math.min(...boxes.map((b) => b.top)), bottom = Math.max(...boxes.map((b) => b.bottom));
    const H = e.height, pp = window.innerWidth / 393;
    const wanted = Math.min(H * 0.375 + 15.3 * pp, H * 0.5 + 20 * pp - 40 - (bottom - top) / 2);
    footerTitle.style.transform = `translate(${window.innerWidth / 2 - (left + right) / 2}px, ${e.top + wanted - (top + bottom) / 2}px)`;
    revealEndTitle();
  }
  // While the black end comes up, the name does not come up with it: it stays still where it will be
  // (as if it were already there under the page) and the black uncovers it as it rises, like the big
  // version (the black end cuts off what is outside it, styles.css)
  function revealEndTitle() {
    const end = document.querySelector(".lab-footer");
    if (!end) return;
    const rise = Math.max(0, end.getBoundingClientRect().top);   // (how far the black still has to come up)
    footerTitle.style.top = rise ? `${-rise}px` : "";
  }
  if (upright) {
    window.addEventListener("resize", placeEndTitle);
    window.addEventListener("scroll", revealEndTitle, { passive: true });
  }

  // (the white title, and the right arrow that stays on the screen, lead to the next project)
}
