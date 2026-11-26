// ===== The "About" page: the sentence builds itself while the page keeps moving to the left =====
// HI my name is.. ELANA · and I am a... VISUAL DESIGNER · and creator of... VISION
// (Figma: Frame 184; the words are in about-words.js).
//
// THE RULES:
//   1. While you scroll, the page always moves from right to left, at the pace of the scroll.
//      All the words lie on one long strip, in the order of the sentence, and slide with it.
//   2. As soon as a letter of the next word has come onto the screen (there is space for it), shapes start
//      jumping in to build it: the letter furthest to the right first. Both words keep sliding to the left.
//   3. When a word reaches the left edge, its shapes spread: they jump off to build the letters that are
//      being made. Shapes that no letter needs right then slide out at the left edge. Missing shapes come in
//      from the left edge.
//   4. A small text ("I am a...") shows up once the word before it is written out AND it has come close to
//      the middle of the screen, like a typewriter: first only its bar shows, blinking; then the scrolling types
//      the letters one by one (stop scrolling and it stops, and the bar blinks). The first one ("come scroll with me :)..", right
//      after HI) has its bar from the start.
//   5. The word after a small text only starts to build a moment after that small text has appeared.
// The words and small texts lie on the strip exactly as in Frame 184, with HI starting where Figma "Desktop - 5" shows it.
// Figma "Desktop - 5": the whole sentence got smaller (61.76 per cell instead of 67.93) and sits in the
// middle of the screen (its top at y 450 of 1024). The numbers here stay those of Frame 184 ("about units");
// the page draws them ABOUT_SCALE times as big (also in styles.css, .about --u: keep the two the same).
// The words' middle is kept in the middle of the screen, on any screen.

const ABOUT_SCALE = 0.9291;              // 63.11 / 67.93: every piece on the site is one size (63.11 per cell)
// Phones held upright (phone.js; Figma "iPhone 16 - 8"): the same strip at the big version's own size
// (each piece 28.55, a letter 57.11 tall: Figma "iPhone 16 - 8"), seen through the phone's narrow screen: HI starts at the left
// margin, and the words, texts and photos lie where that frame has them.
const ON_PHONE = document.documentElement.classList.contains("is-phone-portrait");
const PHONE_SCALE = 67.93 / 28.554;      // Figma phone px → about units (a piece 28.55, a letter 57.11: Figma "iPhone 16 - 8")
// one about unit, in screen pixels
function aboutUnit() {
  return ON_PHONE ? window.innerWidth / 393 / PHONE_SCALE
                  : document.getElementById("about-stage").clientWidth / 1440 * ABOUT_SCALE;
}
const SCREEN_W = ON_PHONE ? 393 * PHONE_SCALE : 1440 / ABOUT_SCALE;     // the screen's width in about units
const WORD_Y = 0;          // the top of the words (about units, measured from the words' top)
const WORD_MID = 67.93;    // the middle of the words (half their height): it lies in the middle of the screen
const OUTSIDE_X = -160;    // just outside the left edge: where new shapes come in from
// a letter can be built once it is fully on the screen (17 from the right edge); on a phone, whose screen
// is narrower than the words, already while it comes in from the right (so VISION is whole when its left
// edge reaches the margin at the end)
const SCREEN_RIGHT = ON_PHONE ? SCREEN_W + 520 : SCREEN_W - 17;   // (+ one jump: a shape lands 150 later)
const EDGE_X = ON_PHONE ? 200 : 300;   // a shape that slides to here (the left part of the screen) starts to spread
const SCROLL_PER_PIXEL = 3;   // how many pixels you scroll for the page to move one (Figma) pixel

// ----- Where everything lies on the strip (Figma pixels): as in Frame 184, HI starting in the middle of the screen -----
const START_X = ON_PHONE ? 18 * PHONE_SCALE : 593.46 / ABOUT_SCALE;   // where HI starts (Figma "Desktop - 5": x 593.46; phone: 18)
// On the phone (Figma "iPhone 16 - 8") the words and texts lie a little further apart: their x there
const PHONE_WORD_X = [18, 691.8, 1205.77, 1575.65, 2319.76];    // HI, ELANA, VISUAL, DESIGNER, VISION
const PHONE_TEXT_X = [110.39, 363.46, 1072, 2105.69];           // come scroll…, my name is.., and I am a…, and creator of…
const WORD_STRIP_X = ABOUT_WORDS.map((w, k) => ON_PHONE ? START_X + (PHONE_WORD_X[k] - 18) * PHONE_SCALE : START_X + w.x);

// The page has moved all the way once the last word (VISION) stands in the middle of the screen
// (also on a phone) (or a little further, if its last shape lands later: see the end of the plan)
const LAST = ABOUT_WORDS.length - 1;
const VISION_PLACE = WORD_STRIP_X[LAST] + ABOUT_WORDS[LAST].width / 2 - SCREEN_W / 2;
let TOTAL_MOVE = VISION_PLACE;

// Each small text belongs to the word before it (it shows up once that word is built)
const TEXT_APPEAR = 185;       // how far you scroll while a small text is typed (it is done within this)
const SCREEN_MIDDLE = SCREEN_W / 2;   // the middle of the screen
const LETTER_WIDTH = ON_PHONE ? 8.6 * PHONE_SCALE : 7.4;   // about how wide one letter of a small text is (about units; on a phone they are 16 px), to find its middle
const WORD_AFTER_TEXT = 40;    // how far the page moves after a small text has appeared, before the next word starts
// Where the words' middle is on the screen (part of its height): the middle; on a phone a little higher
// (Figma "iPhone 16 - 8": the words' top at y 364.84 of 852, so their middle at 393.41)
const WORDS_AT = ON_PHONE ? 393.41 / 852 : 0.5;
const TEXTS = ABOUT_TEXTS.map((t, k) => ({
  ...t,
  // on the top line, or with its bottom on the words' bottom line (on a phone all of them, 16 px, 19 high:
  // Figma "iPhone 16 - 8")
  y: ON_PHONE ? WORD_Y + 135.86 - 19 * PHONE_SCALE : t.bottom ? WORD_Y + 135.86 - 13.2 * 1.16 : WORD_Y,
  stripX: ON_PHONE ? START_X + (PHONE_TEXT_X[k] - 18) * PHONE_SCALE : START_X + t.x,
  after: ABOUT_WORDS.reduce((last, w, j) => (w.x < t.x ? j : last), 0),
}));
// When the page has moved far enough for the middle of each small text to be in the middle of the screen
// (TYPE_EARLY: how far before the middle the typing starts; 0 = right when it reaches the middle)
const TYPE_EARLY = 105;        // about units: the typing starts while the text is still on the right of the screen
// (on a phone the last one, "and creator of...", starts earlier, so VISION is built in time to stand with
// its left edge on the margin at the end)
if (ON_PHONE) TEXTS[TEXTS.length - 1].early = 180;
TEXTS.forEach((t) => { t.atMiddle = t.stripX + (t.text.length * LETTER_WIDTH) / 2 - SCREEN_MIDDLE - (t.early ?? TYPE_EARLY); });   // (a text can have its own: early)
// "my name is.." (after HI, which is there from the start) appears like the others: once it nears the middle
TEXTS.forEach((t) => { if (t.after === 0) t.appear = t.atMiddle; });
TEXTS[0].appear = 0;   // "come scroll with me :).." is there from the start (it types itself, see autoType)
// A text with "whenHI" appears once HI has moved that part of the way from where it starts to the small
// ELANA on the left edge (its right edge: x 65 + 108.49 on the screen, in about units)
const ELANA_RIGHT = (65 + 108.49) / ABOUT_SCALE;
// (on a phone there is no small ELANA on the left edge: it appears once it nears the middle, like the others)
if (!ON_PHONE) TEXTS.forEach((t) => { if (t.whenHI !== undefined) t.appear = (START_X - ELANA_RIGHT) * t.whenHI; });

// ----- Plan every jump, once, by playing the whole page through in small steps -----
// "moved" = how far the page has moved to the left (Figma pixels). A shape that rests on the strip at x
// is seen at x - moved.
const JUMP_LENGTH = 150;   // how far the page moves while one shape jumps
const FIRST_JUMP = 25;     // at first HI only slides with the page
const STARTING_GAPS = [30, 24, 19, 15, 12, 10];   // the first shapes set off slowly, then faster
const JUMP_GAP = 10;       // after that: how far the page moves between two shapes setting off

// Every shape on the page: where it rests on the strip, and its jumps
const shapes = [];
// The letters of every word, with the places that still need a shape
const letters = ABOUT_WORDS.map((word, k) => {
  const byLetter = [];
  word.pieces.forEach(([shape, x, y]) => {
    // the letter a shape belongs to: shapes that start within the same letter box
    const left = WORD_STRIP_X[k] + x;
    let letter = byLetter.find((l) => left >= l.left - 1 && left < l.left + 130);
    if (!letter) { letter = { left, right: left, places: [] }; byLetter.push(letter); }
    letter.places.push({ shape, x: left, y: WORD_Y + y });
    letter.right = Math.max(letter.right, left + ABOUT_SHAPES[shape][0]);
  });
  return byLetter;
});

// HI is already there
letters[0].forEach((letter) => {
  letter.places.forEach((p) => shapes.push({ shape: p.shape, home: { x: p.x, y: p.y }, rest: { x: p.x, y: p.y }, word: 0, jumps: [], free: Infinity }));
  letter.done = true;
});

const lastLanding = ABOUT_WORDS.map(() => 0);   // when the last letter of each word is built
const wordWritten = ABOUT_WORDS.map(() => 0);   // when every shape of each word has landed
const lateLetters = [];                          // letters that would not be ready in time (should stay empty)

(function plan() {
  let word = 1;          // the word being built
  // ELANA only starts a moment after "my name is.." has appeared
  let nextJump = Math.max(FIRST_JUMP,
    ...TEXTS.filter((t) => t.appear !== undefined).map((t) => t.appear + TEXT_APPEAR + WORD_AFTER_TEXT));
  let jumpsSoFar = 0;
  for (let moved = 0; moved <= TOTAL_MOVE + 1000; moved += 1) {
    // Shapes that have slid to the left edge are free to spread
    shapes.forEach((s) => {
      const landed = !s.jumps.length || s.jumps[s.jumps.length - 1].land <= moved;
      if (s.free === Infinity && landed && s.rest.x - moved <= EDGE_X) s.free = moved;
    });
    if (word > LAST || moved < nextJump) continue;

    // The letters of the word that are fully on the screen and not finished yet; the rightmost first
    const open = letters[word].filter((l) => !l.done && l.right - moved <= SCREEN_RIGHT).sort((a, b) => b.left - a.left);
    if (!open.length) continue;
    const letter = open[0];

    // Prefer a place whose shape is waiting at the left edge (from an earlier word, never from this one)
    const waiting = shapes.filter((s) => s.free <= moved && s.word < word && s.rest.x - moved > -60);
    let placeIndex = letter.places.findIndex((p) => waiting.some((s) => s.shape === p.shape));
    if (placeIndex === -1) placeIndex = 0;
    const [place] = letter.places.splice(placeIndex, 1);
    const land = moved + JUMP_LENGTH;
    const from = waiting.filter((s) => s.shape === place.shape).sort((a, b) => a.rest.x - b.rest.x)[0];

    if (from) {
      // A shape from a word at the left edge spreads to this place
      from.jumps.push({ start: moved, land, from: { x: from.rest.x, y: from.rest.y, onStrip: true }, to: place });
      from.rest = { x: place.x, y: place.y };
      from.word = word;
      from.free = Infinity;
    } else {
      // A new shape comes in from the left edge
      shapes.push({ shape: place.shape, home: null, rest: { x: place.x, y: place.y }, word, free: Infinity,
        jumps: [{ start: moved, land, from: { x: OUTSIDE_X, y: place.y, onStrip: false }, to: place }] });
    }

    if (!letter.places.length) {
      letter.done = true;
      if (land > letter.left - 17) lateLetters.push(ABOUT_WORDS[word].text + " letter at " + Math.round(letter.left));
      const lastLetter = letters[word].reduce((a, b) => (b.left > a.left ? b : a));
      if (letter === lastLetter) lastLanding[word] = land;
    }
    wordWritten[word] = Math.max(wordWritten[word], land);
    nextJump = moved + (jumpsSoFar < STARTING_GAPS.length ? STARTING_GAPS[jumpsSoFar] : JUMP_GAP);
    jumpsSoFar += 1;

    if (letters[word].every((l) => l.done)) {
      // The word is finished. If a small text comes after it, that text appears now (once it nears the middle
      // of the screen), and the next word waits until a moment after it has appeared.
      TEXTS.filter((t) => t.after === word).forEach((t) => {
        t.appear = Math.max(wordWritten[word], t.atMiddle);
        nextJump = Math.max(nextJump, t.appear + TEXT_APPEAR + WORD_AFTER_TEXT);
      });
      word += 1;
    }
  }
})();

// The page ends once the last word is finished
TOTAL_MOVE = Math.max(TOTAL_MOVE, wordWritten[LAST] + 20);
if (TOTAL_MOVE > VISION_PLACE + 1) {
  console.warn("VISION is built late, so it ends a little left of the middle", Math.round(TOTAL_MOVE));
}

// Each jump: how high (higher for longer jumps, always over the small texts)
shapes.forEach((s) => s.jumps.forEach((j) => {
  const fromScreen = j.from.onStrip ? j.from.x - j.start : j.from.x;
  j.height = Math.min(360, 110 + 0.3 * Math.abs(j.to.x - j.land - fromScreen));
}));

// ----- Draw -----
const stage = document.getElementById("about-stage");
const about = document.getElementById("about");
const piecesBox = document.getElementById("about-pieces");
const SVG_NS = "http://www.w3.org/2000/svg";

// Close every outline (some shapes, like the triangles, are drawn without their last side)
const closed = (d) => d.replace(/([^Zz\s])\s*M/g, "$1 Z M").replace(/([^Zz\s])\s*$/, "$1 Z");

shapes.forEach((s) => {
  const [w, h, d] = ABOUT_SHAPES[s.shape];
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "about-piece");
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.style.setProperty("--w", w);
  svg.style.setProperty("--h", h);
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", closed(d));   // closed, so its thin outline goes all the way round (no white line)
  svg.appendChild(path);
  piecesBox.appendChild(svg);
  s.el = svg;
});

// The photos (Figma "Desktop - 5"). They lie on the strip, each lined up with the left edge of a word, and
// slide with it. They are always seen: the shapes jump over them (and invert them where they cross them,
// styles.css .about-pieces).
//   - "profile 3" (270 × 283, Figma "Desktop - 6"): above ELANA, its bottom 19 above the words (one grid gutter)
//   - "Gemini_Generated_Image": under DESIGNER, exactly as wide as its last two letters "ER": its left edge at
//     the start of the E (fromX, about units in the word), its right edge at the end of the R; its height keeps
//     the photo's shape (314 × 413). Its top 19 below the words
// Their numbers are Desktop 5 pixels (the words' top at y 450), turned into about units like the words
// (61.76 per cell there, 67.93 here).
const PHOTO_SCALE = 67.93 / 61.76;
const DESIGNER = ABOUT_WORDS.findIndex((w) => w.text === "DESIGNER");
const PHOTOS = [
  { src: "images/about-profile.webp", alt: "Elana Gertel", crop: "50% 63%", word: 1, dx: 1, top: 148, w: 270, h: 283 },
  { src: "images/about-designer.webp", alt: "Elana drawing in a sketchbook among colour swatches", crop: "50% 4%", word: DESIGNER, fromX: 783.2, top: 592, w: 314, h: 413 },
].map((p) => {
  // a photo that spans the end of its word (from fromX to the word's end): its width in about units, and
  // its height keeping the photo's shape
  const spanW = p.fromX !== undefined ? ABOUT_WORDS[p.word].width - p.fromX : null;
  // Phones held upright (Figma "iPhone 16 - 8"): both under the words, 75 below them (their tops level with
  // the paragraph's top): the profile under ELANA, exactly as wide as ELANA (its height keeping Figma's
  // 295 × 308); the other (244 × 320) in the middle under DESIGNER
  let phone = null;
  if (ON_PHONE && p.word === 1) {
    const wordW = ABOUT_WORDS[1].width;
    phone = { w: wordW, h: wordW * 308 / 295, dx: 0 };
  } else if (ON_PHONE) {
    const photoW = 244 * PHONE_SCALE;
    phone = { w: photoW, h: 320 * PHONE_SCALE, dx: (ABOUT_WORDS[p.word].width - photoW) / 2 };
  }
  const w = phone ? phone.w : spanW !== null ? spanW : p.w * PHOTO_SCALE;
  const h = phone ? phone.h : spanW !== null ? spanW * p.h / p.w : p.h * PHOTO_SCALE;
  const ownH = h;
  const el = document.createElement("img");
  el.className = "about-photo";
  el.src = p.src;
  el.alt = p.alt;
  el.style.setProperty("--w", w);
  el.style.setProperty("--h", h);
  el.style.objectPosition = p.crop;   // the crop of the photo in Figma
  stage.insertBefore(el, stage.firstChild);   // under everything (also under the small texts)
  const ownY = WORD_Y + (p.top - 450) * PHOTO_SCALE;
  const above = !ON_PHONE && ownY < WORD_Y;   // the photo above the words (or under them)
  // (on a phone: 75 under the words; above the words: its bottom stays where it was)
  const y = ON_PHONE ? WORD_Y + 2 * WORD_MID + 75 * PHONE_SCALE : above ? ownY + ownH - h : ownY;
  // a photo that does not fit on a short screen is drawn smaller, keeping the corner next to the words
  el.style.transformOrigin = above ? "left bottom" : "left top";
  const x = WORD_STRIP_X[p.word] + (ON_PHONE ? phone.dx : spanW !== null ? p.fromX : p.dx * PHOTO_SCALE);
  return { el, x, y, h, above };
});

// How much smaller a photo is drawn so it fits between the words and the top or bottom edge of the screen,
// keeping a gap to the edge like in Figma ("Desktop - 6": 19 between the photo under DESIGNER and the bottom
// of the screen). 1 = its own size; on a tall enough screen the photos keep their size.
const PHOTO_EDGE_GAP = 19;   // Figma pixels kept free between a photo and the edge of the screen
function photoFit(p, u, top, screenH) {
  const gap = Math.max(8, PHOTO_EDGE_GAP * window.innerWidth / 1440);   // in screen pixels (at least 8)
  const height = p.h * u;
  const room = p.above ? top + height - gap : screenH - gap - top;
  return Math.max(0.3, Math.min(1, room / height));
}

const textEls = TEXTS.map((t) => {
  const p = document.createElement("p");
  p.className = "about-text";
  p.setAttribute("aria-label", t.text);
  // the typed letters (filled in by the typewriter), then the "|" that blinks like a typing cursor
  const typed = document.createElement("span");
  typed.setAttribute("aria-hidden", "true");
  const cursor = document.createElement("span");
  cursor.className = "about-text-cursor flow-edge-cursor";
  cursor.setAttribute("aria-hidden", "true");
  cursor.textContent = "|";
  p.append(typed, cursor);
  p.typed = typed;
  stage.insertBefore(p, piecesBox);
  return p;
});


// Smooth start and end of a jump (0 → 1)
function ease(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function clamp01(t) {
  return Math.min(1, Math.max(0, t));
}

// Where a shape is seen (screen x and Figma y) when the page has moved this far
function shapePosition(s, moved) {
  // Before its first jump: in HI (on the strip), or waiting outside the left edge
  let rest = s.home;
  if (!rest) {
    const first = s.jumps[0];
    if (moved < first.start) return [OUTSIDE_X, first.from.y];
  }
  for (const j of s.jumps) {
    if (moved < j.start) break;
    if (moved < j.land) {
      const p = ease((moved - j.start) / (j.land - j.start));
      const fromX = j.from.onStrip ? j.from.x - moved : j.from.x;
      const toX = j.to.x - moved;
      const x = fromX + (toX - fromX) * p;
      const y = j.from.y + (j.to.y - j.from.y) * p - j.height * Math.sin(Math.PI * p);   // up and down again
      return [x, y];
    }
    rest = j.to;
  }
  return [rest.x - moved, rest.y];
}

// The page is as long as the scrolling needs: one screen to stand on, plus the scrolling for the whole move
function setPageHeight() {
  const u = aboutUnit();
  about.style.height = `${window.innerHeight + (TOTAL_MOVE + EXTRA_MOVE) * SCROLL_PER_PIXEL * u}px`;
}

function draw() {
  const u = aboutUnit();   // one about unit, in screen pixels
  const screenH = stage.clientHeight;
  const fromBottom = (y) => screenH * WORDS_AT + (y - WORD_MID) * u;   // about y → screen y (the words' middle at WORDS_AT)
  const scrolled = Math.min(TOTAL_MOVE + EXTRA_MOVE, Math.max(0, window.scrollY / u / SCROLL_PER_PIXEL));
  const moved = Math.min(TOTAL_MOVE, scrolled);   // the shapes stop with VISION in the middle; the texts go on

  PHOTOS.forEach((p) => {   // they slide with the strip
    const top = fromBottom(p.y), fit = photoFit(p, u, top, screenH);
    p.el.style.transform = `translate(${(p.x - moved) * u}px, ${top}px)` + (fit < 1 ? ` scale(${fit})` : "");
  });

  shapes.forEach((s) => {
    const [x, y] = shapePosition(s, moved);
    const seen = x > -200 && x < SCREEN_W + 60;        // shapes far off the screen are not drawn
    s.el.style.display = seen ? "" : "none";
    if (seen) s.el.style.transform = `translate(${x * u}px, ${fromBottom(y)}px)`;
  });

  TEXTS.forEach((text, i) => {
    // It is typed out once the word before it is written out and it nears the middle of the screen
    // (worked out in the plan); "!.." right away
    typeTo(i, moved);
    // while it is being typed it stands still (the rest moves on); once typed it moves with the rest
    textEls[i].style.transform = `translate(${(text.stripX - scrolled + typingHold(i, scrolled)) * u}px, ${fromBottom(text.y)}px)`;
  });
  placeMorph(moved, u, screenH);
  bioAt(moved >= TOTAL_MOVE - 0.5);   // the paragraph types itself once VISION is in the middle
}


// ----- At the end: hovering a letter of VISION makes it ooze into its organic shape, like the project titles -----
// The same effect as the titles on the project pages (lab.js): the letter's pieces melt into the letter's
// organic shape (the same organic letters as the titles: V, I, S and O of "Israeli Movie Archive", N of
// "Sense"), like slime. The change starts where the mouse touched the letter and oozes outward; while it
// changes, the pieces melt together like liquid and end crisp on the organic shape. The holes (O) grow in
// from their middle. A letter stays organic for a moment after the mouse leaves, then oozes back. The square
// cursor turns organic with it (cursor.js). Scrolling back makes it sharp again.
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const MORPH_POINTS = 120;                // points on each outline
const MORPH_TIME = REDUCED ? 1 : 1100;   // ms for a whole letter to change (like the titles)
const OOZE_SPREAD = 0.3;                 // how much later the far points start (part of the time)
const STAY_TIME = 700;                   // ms a letter stays organic after the mouse leaves
const TAP_STAY_TIME = 900;               // phones: ms a tapped letter stays organic before it oozes back
const GOO = 7.5;                         // how soft the pieces melt together halfway (about units: the titles' 7)
const TITLE_TO_ABOUT = 67.93 / 63.1125;  // the titles' piece (63.11) to the about piece (67.93)

// The organic letters (the titles' outlines, Figma pixels: archive-title.js and sense-title.js)
const VISION_ORGANIC = {
  "V": "M 100.17 80.52 C 92.79 94.43 86.85 107.69 77.6 120.05 C 68.36 132.41 40.53 130.06 33.23 116.28 L 5.6 64.04 C -0.93 51.69 -1.89 39.11 3.44 26.32 C 7.26 17.11 12.76 8.03 21.15 2.58 C 40.13 -9.75 51.29 26.51 72.13 9.89 C 80.19 3.45 90.57 3.73 98.92 10.38 C 117.02 24.8 112.3 57.65 100.17 80.52 Z",
  "I": "M 43.69 129.11 H 17.65 C 9.48 129.14 5.15 120.66 4.31 113.74 L 1.64 91.99 C 0.06 79.2 -0.97 66.45 1.39 53.57 L 7.9 18.11 C 10.42 4.39 28.18 -0.76 40.2 0.08 C 52.21 0.92 60.27 7.36 62.17 18.56 L 70.66 68.3 C 73.42 84.5 64.5 100.55 59.93 115.82 C 57.85 122.74 51.87 129.14 43.72 129.14 L 43.69 129.11 Z",
  "S": "M 111.45 119.27 C 102.48 144.45 4.19 137.99 5.01 115.15 C 5.42 103.51 22.19 103.27 26.42 92.87 C 28.23 88.32 27.28 79.3 24.78 75.66 L 7.4 50.64 C 3.73 45.36 -1.58 36.04 0.44 29.3 C 10.82 -5.02 55.24 -3.09 89.45 4.75 C 95.3 6.08 100.68 12.54 101.36 17 C 102.3 23.22 99.3 29.82 94.24 33.62 C 82.5 42.4 79.63 56.27 87.56 69.09 L 109.24 104.26 C 111.35 107.68 112.74 115.75 111.48 119.3 L 111.45 119.27 Z",
  "O": "M 83.67 120.65 C 50.67 136.53 14.17 117.44 3.75 84.17 C -2.17 65.23 -1.45 48.27 8.5 31.12 C 18.11 14.57 31.92 3.08 52.02 0.37 C 69.76 -2.02 91.57 6.81 95.68 25.99 L 106.09 74.33 C 110.06 92.76 101.93 111.84 83.67 120.62 V 120.65 Z M 63.02 67.53 C 70.69 64.79 72.99 55.59 68.65 49.38 C 61.52 39.15 46.47 36.41 36.11 43.57 C 29.78 47.97 30.39 56.76 35.18 62.23 C 42.67 68.49 52.73 71.2 63.02 67.53 Z",
  "N": "M 112.63 129.36 C 107.93 142.09 74.72 145.09 48.4 125.64 C 45.86 123.76 41.76 120.58 39.3 120.55 C 31.48 120.55 29.09 136.14 16.51 136.07 C 3.71 135.99 0.9 113.39 1.79 94.24 C 2.68 75.11 2.31 56.71 0.23 37.65 C -1.52 21.49 6.72 7.83 22.24 2.31 C 37.74 -3.22 57.63 1.29 68.8 14.47 C 70.96 17.03 74.84 20.31 77.33 20.66 C 85.42 21.83 90.78 9.19 101.1 9.77 C 126.34 11.23 127.3 89.48 112.63 129.33 V 129.36 Z"
};

const morphSvg = document.createElementNS(SVG_NS, "svg");   // the drawing of the oozing letters, over the shapes
morphSvg.setAttribute("class", "about-morph");
morphSvg.setAttribute("aria-hidden", "true");
stage.appendChild(morphSvg);
const morphDefs = document.createElementNS(SVG_NS, "defs");
morphSvg.appendChild(morphDefs);

// Points along an outline d (closed), each one passed through toPage([x, y])
function outlinePoints(d, toPage) {
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", closed(d));
  morphDefs.appendChild(path);
  const length = path.getTotalLength();
  const points = [];
  for (let i = 0; i < MORPH_POINTS; i++) {
    const p = path.getPointAtLength((length * i) / MORPH_POINTS);
    points.push(toPage([p.x, p.y]));
  }
  path.remove();
  return points;
}
const pathFrom = (points) => "M" + points.map((p) => p[0].toFixed(2) + " " + p[1].toFixed(2)).join("L") + "Z";
// thick and gooey: a slow start and a soft stop
const ooze = (p) => (p <= 0 ? 0 : p >= 1 ? 1 : p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2);
const middleOf = (pts) => [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];
const svgEl = (name, attrs) => { const el = document.createElementNS(SVG_NS, name); Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v)); return el; };
// which way an outline goes round
function turning(points) {
  let area = 0;
  points.forEach((p, i) => { const q = points[(i + 1) % points.length]; area += p[0] * q[1] - q[0] * p[1]; });
  return Math.sign(area);
}
// line up the target's points with the shape's points (same direction, nearest start), so each travels least
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

// VISION's letters (each letter's place and width in the word, Figma Frame 173 in about units: the I is half as wide),
// with the shapes that stand in each one at the end of the page
const VISION_LETTERS = [["V", 0, 135.86], ["I", 141.86, 67.93], ["S", 215.79, 135.86], ["I", 357.65, 67.93], ["O", 431.58, 139.94], ["N", 577.52, 135.86]];
const visionLetters = VISION_LETTERS.map(([ch, lx, lw], n) => {
  const left = WORD_STRIP_X[LAST] + lx, right = left + lw;
  const own = shapes.filter((sh) => {
    const [x, y] = shapePosition(sh, TOTAL_MOVE);
    return x + TOTAL_MOVE >= left - 1 && x + TOTAL_MOVE < right - 1 && Math.abs(y - WORD_Y) < 140;
  });
  // its goo filter: blur the pieces, then make the edge sharp again, so touching parts flow into each other
  const filterId = "about-goo-" + n;
  const filter = svgEl("filter", { id: filterId, x: "-30%", y: "-30%", width: "160%", height: "160%" });
  const blur = svgEl("feGaussianBlur", { in: "SourceGraphic", stdDeviation: "0" });
  const sharpen = svgEl("feColorMatrix", { type: "matrix", values: "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -11" });
  filter.append(blur, sharpen);
  morphDefs.appendChild(filter);
  const group = document.createElementNS(SVG_NS, "g");
  morphSvg.appendChild(group);
  const L = { n, group, blur, filterId, t: 0, target: 0, leaveTimer: null, shapes: [], holes: [], outer: [] };
  own.forEach((sh) => {
    const [x, y] = shapePosition(sh, TOTAL_MOVE);
    const from = outlinePoints(ABOUT_SHAPES[sh.shape][2], ([px, py]) => [px + x, py + y]);
    const path = document.createElementNS(SVG_NS, "path");
    path.style.visibility = "hidden";
    group.appendChild(path);
    L.shapes.push({ el: sh.el, path, from });
  });
  // the organic letter, as big as the word's letters and centred on the letter's pieces
  const all = L.shapes.flatMap((s) => s.from);
  const [cx, cy] = all.length ? [(Math.min(...all.map((p) => p[0])) + Math.max(...all.map((p) => p[0]))) / 2,
                                 (Math.min(...all.map((p) => p[1])) + Math.max(...all.map((p) => p[1]))) / 2] : [left + lw / 2, WORD_MID];
  const parts = VISION_ORGANIC[ch].split(/(?=M)/).map((part) => part.trim());
  const raw = outlinePoints(parts[0], (p) => p);
  const ox = (Math.min(...raw.map((p) => p[0])) + Math.max(...raw.map((p) => p[0]))) / 2;
  const oy = (Math.min(...raw.map((p) => p[1])) + Math.max(...raw.map((p) => p[1]))) / 2;
  const toPage = ([px, py]) => [cx + (px - ox) * TITLE_TO_ABOUT, cy + (py - oy) * TITLE_TO_ABOUT];
  L.outer = raw.map(toPage);
  L.shapes.forEach((s) => { s.to = lineUp(s.from, L.outer); });
  // the holes (O), drawn in the page's colour on top
  parts.slice(1).forEach((part) => {
    const points = outlinePoints(part, toPage);
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("class", "about-morph-hole");
    path.style.visibility = "hidden";
    morphSvg.appendChild(path);
    L.holes.push({ path, points, middle: middleOf(points) });
  });
  L.from = [cx, cy];
  return L;
});

// how much later each point starts: the further from where the mouse touched, the later
function delays(L) {
  const all = L.shapes.flatMap((s) => s.from);
  const far = Math.max(...all.map((p) => Math.hypot(p[0] - L.from[0], p[1] - L.from[1])), 1);
  L.shapes.forEach((s) => { s.delay = s.from.map((p) => OOZE_SPREAD * Math.hypot(p[0] - L.from[0], p[1] - L.from[1]) / far); });
}
visionLetters.forEach(delays);

function drawLetter(L) {
  const showing = L.t > 0;
  // the melting: none at the start and the end, strongest halfway
  const goo = GOO * Math.sin(Math.PI * L.t) ** 0.8;
  if (goo > 0.05) {
    L.blur.setAttribute("stdDeviation", goo.toFixed(2));
    L.group.setAttribute("filter", `url(#${L.filterId})`);
  } else L.group.removeAttribute("filter");
  L.shapes.forEach((s) => {
    s.el.style.visibility = showing ? "hidden" : "";   // the real shape hides while it changes
    s.path.style.visibility = showing ? "visible" : "hidden";
    if (!showing) return;
    s.path.setAttribute("d", pathFrom(s.from.map((p, i) => {
      // each point runs its own part of the time: it starts later the further it is
      const e = ooze(clamp01(L.t * (1 + OOZE_SPREAD) - s.delay[i]));
      return [p[0] + (s.to[i][0] - p[0]) * e, p[1] + (s.to[i][1] - p[1]) * e];
    })));
  });
  L.holes.forEach(({ path, points, middle }) => {
    const e = ooze(clamp01(L.t * (1 + OOZE_SPREAD) - OOZE_SPREAD * 0.6));
    path.style.visibility = showing && e > 0 ? "visible" : "hidden";
    path.setAttribute("d", pathFrom(points.map((p) => [middle[0] + (p[0] - middle[0]) * e, middle[1] + (p[1] - middle[1]) * e])));
  });
}
// one animation loop for the whole word
let morphLast = null, morphRunning = false;
function morphFrame(now) {
  const step = morphLast === null ? 0 : (now - morphLast) / MORPH_TIME;
  morphLast = now;
  let busy = false;
  visionLetters.forEach((L) => {
    if (L.t === L.target) return;
    L.t = L.target > L.t ? Math.min(L.target, L.t + step) : Math.max(L.target, L.t - step);
    drawLetter(L);
    if (L.t !== L.target) busy = true;
  });
  if (busy) requestAnimationFrame(morphFrame);
  else { morphRunning = false; morphLast = null; }
}
// (page-change.js calls this when the page slides out: every organic letter is its pieces again at once)
window.resetOrganic = () => visionLetters.forEach((L) => {
  clearTimeout(L.leaveTimer);
  L.target = 0;
  L.t = 0;
  drawLetter(L);
});
function goTo(L, value) {
  L.target = value;
  if (!morphRunning) { morphRunning = true; requestAnimationFrame(morphFrame); }
}

// Phones: a tap also sends "mouse" events; they are ignored right after a finger touched the screen (mobile.js)
const byFinger = () => typeof window.touchedJustNow === "function" && window.touchedJustNow();

// each letter has a spot that feels the mouse: around its shapes and its organic shape
visionLetters.forEach((L) => {
  const pts = L.shapes.flatMap((sh) => sh.from).concat(L.outer);
  L.area = { x0: Math.min(...pts.map((p) => p[0])), x1: Math.max(...pts.map((p) => p[0])),
             y0: Math.min(...pts.map((p) => p[1])), y1: Math.max(...pts.map((p) => p[1])) };
  const el = document.createElement("div");
  el.className = "about-letter-hover";
  stage.appendChild(el);
  L.el = el;
  function oozeFrom(event) {
    clearTimeout(L.leaveTimer);
    if (L.t === 0) {
      // the ooze starts where the mouse came in
      const b = el.getBoundingClientRect();
      L.from = [L.area.x0 + ((event.clientX - b.left) / b.width) * (L.area.x1 - L.area.x0),
                L.area.y0 + ((event.clientY - b.top) / b.height) * (L.area.y1 - L.area.y0)];
      delays(L);
    }
    goTo(L, 1);
  }
  // it stays organic for a moment, then oozes back
  function oozeBackSoon(wait) {
    clearTimeout(L.leaveTimer);
    L.leaveTimer = setTimeout(() => goTo(L, 0), wait);
  }
  // (a tap on a phone also sends mouseenter/mouseleave: then they do nothing, the tap is handled below)
  // (the square cursor turns organic with the letter, and back into the square when the mouse leaves)
  el.addEventListener("mouseenter", (event) => {
    if (byFinger() || !stage.classList.contains("is-at-end")) return;
    oozeFrom(event);
    if (window.squareCursor) window.squareCursor.organic(true);
  });
  el.addEventListener("mouseleave", () => {
    if (byFinger()) return;
    oozeBackSoon(STAY_TIME);
    if (window.squareCursor) window.squareCursor.organic(false);
  });
  // phones: a tap turns the letter organic (from where the finger touched it), and it oozes back soon after
  el.addEventListener("click", (event) => {
    if (!byFinger()) return;
    oozeFrom(event);
    oozeBackSoon(TAP_STAY_TIME);
  });
});

// Called by draw(): the drawing and the hover spots follow the screen; they only work at the very end
function placeMorph(moved, u, screenH) {
  const atEnd = moved >= TOTAL_MOVE - 0.5;
  stage.classList.toggle("is-at-end", atEnd);
  if (!atEnd) visionLetters.forEach((L) => { if (L.target !== 0) { clearTimeout(L.leaveTimer); goTo(L, 0); } });   // scrolling back: its pieces again
  const w = stage.clientWidth / u, h = screenH / u;
  morphSvg.setAttribute("viewBox", `0 ${(WORD_MID - h / 2).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}`);
  visionLetters.forEach((L) => {
    L.el.style.left = L.area.x0 * u + "px";
    L.el.style.top = screenH * WORDS_AT + (L.area.y0 - WORD_MID) * u + "px";
    L.el.style.width = (L.area.x1 - L.area.x0) * u + "px";
    L.el.style.height = (L.area.y1 - L.area.y0) * u + "px";
  });
}

// ----- The typewriter: the bar blinks, the letters are typed one by one, then the bar blinks on -----
// The scrolling types it: once it is reached only its bar shows (blinking); then the further you scroll,
// the more letters are typed (scrolling back takes them away). When the scrolling stops, even in the
// middle of a word, the typing stops and the bar blinks. It is fully typed within TEXT_APPEAR, so always
// before the next word starts.
const BAR_FIRST = 15;       // how far you scroll with only the bar showing, before the first letter
const PER_LETTER = 10;      // how far you scroll for each letter (about units)
// How far you scroll while a text is being typed (from its bar appearing until its last letter)
function typingLength(i) { return BAR_FIRST + (TEXTS[i].text.length - 1) * (TEXTS[i].perLetter ?? PER_LETTER); }
// How much a text stays behind the moving page: it stands still while it is typed, so afterwards it is
// that much further right than its place on the strip (it never jumps)
function typingHold(i, moved) {
  const t = TEXTS[i];
  if (t.appear === undefined || t.hold === false) return 0;   // ("!.." moves with HI all the time)
  return Math.min(Math.max(moved - t.appear, 0), typingLength(i));
}
// A text with "auto" types itself by time (not by the scrolling) as soon as the page opens:
// its bar blinks a moment, then the letters come one by one, then the bar blinks on
const AUTO_FIRST = 700, AUTO_LETTER = 55;   // ms
TEXTS.forEach((t, i) => {
  if (!t.auto) return;
  let n = 0;
  setTimeout(function next() {
    n++;
    textEls[i].typed.textContent = t.text.slice(0, n);
    textEls[i].classList.add("is-typing");
    hidePassedBars();
    if (n < t.text.length) setTimeout(next, AUTO_LETTER);
    else textEls[i].classList.remove("is-typing");
  }, AUTO_FIRST);
});

// Once a later text has started typing, the earlier texts' bars go away (only the newest one blinks).
// The paragraph at the bottom counts as the last text.
var bioStarted = false;   // (set once the paragraph has typed its first letter)
function hidePassedBars() {
  let later = bioStarted;
  for (let i = textEls.length - 1; i >= 0; i--) {
    textEls[i].classList.toggle("is-passed", later);
    if (textEls[i].typed.textContent.length > 0) later = true;
  }
}

function typeTo(i, moved) {
  const el = textEls[i], t = TEXTS[i];
  if (t.auto) { el.classList.add("is-shown"); return; }   // typed by time (above)
  const shown = t.appear !== undefined && moved >= t.appear;
  el.classList.toggle("is-shown", shown);
  // how many letters the scrolling has reached
  el.want = !shown ? 0 : Math.max(0, Math.min(t.text.length, Math.floor((moved - t.appear - BAR_FIRST) / (t.perLetter ?? PER_LETTER)) + 1));
  if (!el.stepping && el.typed.textContent.length !== el.want) stepLetters(el, t);
}
// The letters follow the scrolling one at a time, never faster than a person types (like "come scroll
// with me"): scrolling quickly, they keep typing at that pace until they catch up. Scrolling back
// takes them away a little faster.
const CATCH_UP_LETTER = 55, CATCH_UP_ERASE = 25;   // ms for each letter
function stepLetters(el, t) {
  const n = el.typed.textContent.length;
  if (n === el.want) {
    el.stepping = false;
    // a moment after the last letter the bar blinks again
    el.blinkTimer = setTimeout(() => el.classList.remove("is-typing"), 250);
    return;
  }
  el.stepping = true;
  el.typed.textContent = t.text.slice(0, n + (el.want > n ? 1 : -1));
  hidePassedBars();
  // while letters are being typed the bar stands still
  el.classList.add("is-typing");
  clearTimeout(el.blinkTimer);
  setTimeout(() => stepLetters(el, t), el.want > n ? CATCH_UP_LETTER : CATCH_UP_ERASE);
}

// ----- The end: VISION stays in the middle, but the small texts keep moving with the scrolling until
// "and creator of..." has left the screen at the left (EXTRA_MOVE more) -----
const LAST_TEXT = TEXTS.length - 1;
const EXTRA_MOVE = Math.max(0, TEXTS[LAST_TEXT].stripX + typingLength(LAST_TEXT) + TEXTS[LAST_TEXT].text.length * LETTER_WIDTH + 30 - TOTAL_MOVE);

// ----- The paragraph at the bottom left (Figma "Desktop - 5": "I'm Elana, a designer…") -----
// Once VISION stands in the middle of the screen, it types itself out as if someone were typing it live:
// first the bar blinks a moment, then the letters come at an uneven pace, with short stops after commas,
// longer ones after full stops and between the two paragraphs, and now and then a little hesitation.
// The bar stands still while letters come and blinks while it pauses; at the end it keeps blinking.
// Scrolling back away from VISION untypes it; coming back types it again.
// The lines end exactly where they end in Figma ("Desktop - 6": one paragraph). [line, true = the paragraph ends here]
const BIO_LINES = [
  ["I’m Elana, a designer working at the intersection of product, UI / UX, and branding.", false],
  ["My roots are typography, illustration, and motion. I design with the business goal in", false],
  ["mind first, making sure strong aesthetics always serve a purpose. Using AI as a core", false],
  ["part of my workflow, I also vibe-code and ship my own functional products from", false],
  ["scratch, bridging the gap between visual craft and live software. I love collaborating", false],
  ["closely with teams to solve messy problems early and turn ideas into clear,", false],
  ["expressive experiences.", true],
];
const BIO = BIO_LINES.map(([line]) => line).join("\n");
// Its styles (Figma "Desktop - 6", Helvetica 12): two parts bold and the last sentence oblique
const BIO_STYLES = [
  ["", "I’m Elana, a designer working at the intersection of product, UI / UX, and branding. My roots are typography, illustration, and motion. "],
  ["bold", "I design with the business goal in mind first"],
  ["", ", making sure strong aesthetics always serve a purpose. Using AI as a core part of my workflow,"],
  ["bold", " I also vibe-code and ship my own functional products from scratch"],
  ["", ", bridging the gap between visual craft and live software. "],
  ["oblique", "I love collaborating closely with teams to solve messy problems early and turn ideas into clear, expressive experiences."],
];
// each letter's style ("" = regular), in the order of BIO (its line breaks are the spaces of the styles' text)
const BIO_STYLE_AT = BIO_STYLES.flatMap(([style, text]) => [...text].map(() => style));
// Write the first n letters of a text into an element, each run of one style in its own span
// (returns where each letter is: [text node, place in it], so the rows can be measured)
function writeBio(el, text, n) {
  el.textContent = "";
  const places = [];
  let span = null, style = null;
  for (let i = 0; i < n; i++) {
    const s = BIO_STYLE_AT[i] || "";
    if (span === null || s !== style) {
      span = document.createElement("span");
      if (s) span.className = "about-bio-" + s;
      span.appendChild(document.createTextNode(""));
      el.appendChild(span);
      style = s;
    }
    places.push([span.firstChild, span.firstChild.data.length]);
    span.firstChild.data += text[i];
  }
  return places;
}
// where a paragraph ends (the typing stops to think there; at the other line ends it just goes on)
const BIO_PARAGRAPH_ENDS = new Set();
BIO_LINES.reduce((at, [line, ends]) => { if (ends) BIO_PARAGRAPH_ENDS.add(at + line.length); return at + line.length + 1; }, 0);
const BIO_FIRST_WAIT = 800;    // ms the bar blinks before the first letter
const BLINK_AFTER = 350;       // a pause longer than this (ms) lets the bar blink
const bioEl = document.createElement("p");
bioEl.className = "about-bio";
bioEl.setAttribute("aria-label", BIO_LINES.map(([line, ends]) => line + (ends ? "\n" : " ")).join("").trim());
const bioTyped = document.createElement("span");
bioTyped.setAttribute("aria-hidden", "true");
const bioBar = document.createElement("span");
bioBar.className = "about-text-cursor flow-edge-cursor";
bioBar.setAttribute("aria-hidden", "true");
bioBar.textContent = "|";
// an invisible copy of the whole paragraph holds its full size, so the typed lines never move;
// the typed letters and the bar lie on top of it
const bioGhost = document.createElement("span");
bioGhost.className = "about-bio-ghost";
bioGhost.setAttribute("aria-hidden", "true");
const bioGhostPlaces = writeBio(bioGhost, BIO, BIO.length);
const bioLive = document.createElement("span");
bioLive.className = "about-bio-live";
bioLive.append(bioTyped, bioBar);
bioEl.append(bioGhost, bioLive);

// Where the lines break: measured on the invisible paragraph, so a word that goes on the next row is typed
// there from its first letter (it never starts at the end of a row and then jumps down).
// The space before such a word becomes a line break (the same length, so every letter keeps its place).
let bioWithBreaks = BIO;
function measureBioLines() {
  const range = document.createRange();
  let out = "", lastTop = null;
  for (let i = 0; i < BIO.length; i++) {
    const ch = BIO[i];
    if (ch === "\n") { out += ch; lastTop = null; continue; }
    if (ch !== " ") {
      const [node, at] = bioGhostPlaces[i];
      range.setStart(node, at); range.setEnd(node, at + 1);
      const top = range.getBoundingClientRect().top;
      if (lastTop !== null && top > lastTop + 2 && out.endsWith(" ")) out = out.slice(0, -1) + "\n";   // a new row
      lastTop = top;
    }
    out += ch;
  }
  bioWithBreaks = out;
  writeBio(bioTyped, bioWithBreaks, bioShown);
}
document.fonts.ready.then(measureBioLines);
window.addEventListener("resize", measureBioLines);
stage.appendChild(bioEl);

let bioShown = 0, bioTimer = null, bioOn = false;
// How long to wait before the next letter, like a person typing
// (typedAt: where the letter just typed is in BIO)
function bioPause(typed, next, typedAt) {
  // (about twice as fast as a person, so the paragraph does not take long)
  if (next === "\n") return BIO_PARAGRAPH_ENDS.has(typedAt + 1) ? 0 : 6 + Math.random() * 14;
  if (typed === ".") return 200 + Math.random() * 150;        // the end of a sentence: a breath
  if (typed === "\n") return BIO_PARAGRAPH_ENDS.has(typedAt) ? 400 + Math.random() * 150   // a new paragraph: a longer think
                                                          : 6 + Math.random() * 14;      // just the next line
  if (typed === ",") return 70 + Math.random() * 60;
  if (typed === " " && Math.random() < 0.03) return 200 + Math.random() * 150;   // a little hesitation
  return 6 + Math.random() * 14;                              // the letters of a word, unevenly
}
function bioWait(ms) {
  // the bar only blinks during the longer pauses
  bioEl.classList.toggle("is-typing", ms < BLINK_AFTER);
  bioTimer = setTimeout(bioNext, ms);
}
function bioNext() {
  bioTimer = null;
  if (!bioOn || bioShown >= BIO.length) { bioEl.classList.remove("is-typing"); return; }
  bioShown++;
  writeBio(bioTyped, bioWithBreaks, bioShown);
  bioStarted = bioShown > 0;
  hidePassedBars();
  if (bioShown >= BIO.length) { bioEl.classList.remove("is-typing"); return; }   // done: the bar blinks on
  bioWait(bioPause(BIO[bioShown - 1], BIO[bioShown], bioShown - 1));
}
// Called by draw(): on at the end (VISION in the middle), off when scrolled back
// Scrolling back away from VISION untypes it, quickly (a few letters each frame), then it hides; coming
// back types it again from where it got to
const BIO_ERASE = 6;   // letters taken away each screen frame
let bioEraseFrame = null;
function bioErase() {
  bioEraseFrame = null;
  if (bioOn) return;
  bioShown = Math.max(0, bioShown - BIO_ERASE);
  writeBio(bioTyped, bioWithBreaks, bioShown);
  bioStarted = bioShown > 0;
  hidePassedBars();
  if (bioShown > 0) bioEraseFrame = requestAnimationFrame(bioErase);
  else bioEl.classList.remove("is-shown", "is-typing");
}
function bioAt(atEnd) {
  if (atEnd === bioOn) return;
  bioOn = atEnd;
  clearTimeout(bioTimer);
  bioTimer = null;
  if (bioEraseFrame !== null) { cancelAnimationFrame(bioEraseFrame); bioEraseFrame = null; }
  if (atEnd) {
    bioEl.classList.add("is-shown");
    if (bioShown < BIO.length) bioWait(bioShown === 0 ? BIO_FIRST_WAIT : 400);
  } else if (bioShown > 0) {
    bioEl.classList.add("is-typing");   // (the bar stands still while it untypes)
    bioErase();
  } else {
    bioEl.classList.remove("is-shown");
  }
}

// Draw again on every scroll and resize (at most once per screen frame)
let waiting = false;
function drawSoon() {
  if (waiting) return;
  waiting = true;
  requestAnimationFrame(() => {
    waiting = false;
    draw();
  });
}

window.addEventListener("scroll", drawSoon, { passive: true });

// Scrolling sideways (a trackpad's sideways swipe, or shift + the wheel) moves the page too, both ways:
// to the left goes on like scrolling down, to the right goes back (it stops at the start and at the end).
// (Phones: a sideways swipe does the same, phone.js.)
window.addEventListener("wheel", (event) => {
  if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;   // (up and down: the page scrolls as usual)
  event.preventDefault();   // (so the browser does not go back a page instead)
  window.scrollBy(0, event.deltaX);
}, { passive: false });
window.addEventListener("resize", () => {
  setPageHeight();
  drawSoon();
});
setPageHeight();
draw();
