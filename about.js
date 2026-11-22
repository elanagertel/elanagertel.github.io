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
const PHONE_WORD_X = [18, 623.8, 1137.77, 1507.65, 2221.77];    // HI, ELANA, VISUAL, DESIGNER, VISION
const PHONE_TEXT_X = [110.39, 325.46, 1004, 2037.69];           // come scroll…, my name is.., and I am a…, and creator of…
const WORD_STRIP_X = ABOUT_WORDS.map((w, k) => ON_PHONE ? START_X + (PHONE_WORD_X[k] - 18) * PHONE_SCALE : START_X + w.x);

// The page has moved all the way once the last word (VISION) stands in the middle of the screen
// (on a phone: with its left edge on the left margin, like HI at the start)
// (or a little further, if its last shape lands later: see the end of the plan)
const LAST = ABOUT_WORDS.length - 1;
const VISION_PLACE = ON_PHONE ? WORD_STRIP_X[LAST] - START_X : WORD_STRIP_X[LAST] + ABOUT_WORDS[LAST].width / 2 - SCREEN_W / 2;
let TOTAL_MOVE = VISION_PLACE;

// Each small text belongs to the word before it (it shows up once that word is built)
const TEXT_APPEAR = 185;       // how far you scroll while a small text is typed (it is done within this)
const SCREEN_MIDDLE = SCREEN_W / 2;   // the middle of the screen
const LETTER_WIDTH = 7.4;      // about how wide one letter of a small text is (about units), to find its middle
const WORD_AFTER_TEXT = 40;    // how far the page moves after a small text has appeared, before the next word starts
// Where the words' middle is on the screen (part of its height): the middle; on a phone a little higher
// (Figma "iPhone 16 - 8": the words' top at y 364.84 of 852, so their middle at 393.41)
const WORDS_AT = ON_PHONE ? 393.41 / 852 : 0.5;
const TEXTS = ABOUT_TEXTS.map((t, k) => ({
  ...t,
  y: t.bottom ? WORD_Y + 135.86 - 13.2 * 1.16 : WORD_Y,   // on the top line, or with its bottom on the words' bottom line
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
  { src: "images/about-profile.jpg", alt: "Elana Gertel", crop: "50% 63%", word: 1, dx: 1, top: 148, w: 270, h: 283 },
  { src: "images/about-designer.jpg", alt: "Elana drawing in a sketchbook among colour swatches", crop: "50% 4%", word: DESIGNER, fromX: 783.2, top: 592, w: 314, h: 413 },
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


// ----- At the end: hovering a letter of VISION "squashes" it (reference: Paul Cocksedge's Squash mirrors) -----
// The letter keeps its own square pieces, but they turn soft and puffed up: each piece shrinks a little and
// gets round corners, touching pieces melt into each other with a narrow waist (like a squashed 8), and a
// soft light glows along their inside edges, like a convex mirror. Then they keep breathing slowly:
// swelling and shrinking (so the waists open and close), drifting a little, their edges rippling, and the
// mouse gently presses them away. It starts with the hover and stays soft; with the mouse on it, it moves
// more, on its own it is calm. Scrolling back makes it sharp again.
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const MORPH_POINTS = 120;                // points on each outline
const SQUASH_TIME = REDUCED ? 1 : 1700;  // ms to ooze from the square pieces into the soft ones
const CALM = REDUCED ? 0 : 0.35;         // how lively it is on its own (1 = while the mouse is on it)
const REST_AFTER = 4000;                 // ms without the mouse before a letter goes back to its square pieces
const REST_TIME = REDUCED ? 1 : 2200;    // ms to slowly ooze back into the sharp pieces
const SOFT = 6.5;                        // how round and melted the pieces get (about units)
const SHRINK = 0.17;                     // how much each piece shrinks around its middle (so each square pillow and its waists show)
const BREATH = 0.05;                     // how much it swells and shrinks while breathing
const DRIFT = 3;                         // how far a piece drifts, slowly (about units)
const RIPPLE = 2.2;                      // how big the slow ripples on the edges are (about units)
const RIM = 6;                           // how wide the light along the inside edge is
const RIM_LIGHT = "#e2e2e2";             // the colour of that light (reference: soft grey)
const PUSH = 12;                         // how far the mouse presses the pieces away
const PUSH_REACH = 80;                   // how close the mouse has to be to press
const SPREAD = 0.8;                      // the change spreads from where the mouse came in, piece after piece (0 = all at once)
const LUMP = 5;                          // while oozing: how much the edges bulge and wobble (about units)
const DRIP = 9;                          // while oozing: how far the bottoms sag down, like thick liquid (about units)
const GOO = 0.7;                         // while oozing: extra melting, so pieces stretch liquid bridges to each other

const morphSvg = document.createElementNS(SVG_NS, "svg");   // the drawing of the soft pieces, over the shapes
morphSvg.setAttribute("class", "about-morph");
morphSvg.setAttribute("aria-hidden", "true");
stage.appendChild(morphSvg);
const morphDefs = document.createElementNS(SVG_NS, "defs");
morphSvg.appendChild(morphDefs);

// Points along an outline d (closed), moved by [dx, dy]
function outlinePoints(d, dx, dy) {
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", closed(d));
  morphDefs.appendChild(path);
  const length = path.getTotalLength();
  const points = [];
  for (let i = 0; i < MORPH_POINTS; i++) {
    const p = path.getPointAtLength((length * i) / MORPH_POINTS);
    points.push([p.x + dx, p.y + dy]);
  }
  path.remove();
  return points;
}
const pathFrom = (points) => "M" + points.map((p) => p[0].toFixed(2) + " " + p[1].toFixed(2)).join("L") + "Z";
// soft start and soft stop
const ooze = (p) => (p <= 0 ? 0 : p >= 1 ? 1 : p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2);
const middleOf = (pts) => [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];
const svgEl = (name, attrs) => { const el = document.createElementNS(SVG_NS, name); Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v)); return el; };

// VISION's letters (each letter's place and width in the word, Figma Frame 173 in about units: the I is half as wide),
// with the shapes that stand in each one at the end of the page
const VISION_LETTERS = [["V", 0, 135.86], ["I", 141.86, 67.93], ["S", 215.79, 135.86], ["I", 357.65, 67.93], ["O", 431.58, 139.94], ["N", 577.52, 135.86]];
const visionLetters = VISION_LETTERS.map(([ch, lx, lw], n) => {
  const left = WORD_STRIP_X[LAST] + lx, right = left + lw;
  const own = shapes.filter((sh) => {
    const [x, y] = shapePosition(sh, TOTAL_MOVE);
    return x + TOTAL_MOVE >= left - 1 && x + TOTAL_MOVE < right - 1 && Math.abs(y - WORD_Y) < 140;
  });
  // its own filter: soften the pieces and cut them sharp again (so close pieces melt together with a waist),
  // then add the light along the inside edge (the shape minus a blurred copy of itself = a soft inner rim)
  const filterId = "about-squash-" + n;
  const filter = svgEl("filter", { id: filterId, x: "-30%", y: "-30%", width: "160%", height: "160%", "color-interpolation-filters": "sRGB" });
  const blur = svgEl("feGaussianBlur", { in: "SourceGraphic", stdDeviation: "0", result: "soft" });
  const sharpen = svgEl("feColorMatrix", { in: "soft", type: "matrix", values: "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -11", result: "shape" });
  // (the light starts a hair inside the edge, so the outline itself stays crisp and black on the white page)
  const inside = svgEl("feMorphology", { in: "shape", operator: "erode", radius: "1.3", result: "inside" });
  const rimBlur = svgEl("feGaussianBlur", { in: "inside", stdDeviation: "0", result: "inner" });
  const edge = svgEl("feComposite", { in: "inside", in2: "inner", operator: "arithmetic", k1: "0", k2: "1", k3: "-1", k4: "0", result: "edge" });
  const light = svgEl("feFlood", { "flood-color": RIM_LIGHT, "flood-opacity": "0", result: "light" });
  const rim = svgEl("feComposite", { in: "light", in2: "edge", operator: "in", result: "rim" });
  const merge = svgEl("feMerge", {});
  merge.append(svgEl("feMergeNode", { in: "shape" }), svgEl("feMergeNode", { in: "rim" }));
  filter.append(blur, sharpen, inside, rimBlur, edge, light, rim, merge);
  morphDefs.appendChild(filter);
  const group = document.createElementNS(SVG_NS, "g");
  morphSvg.appendChild(group);
  const L = { n, group, blur, rimBlur, light, filterId, t: 0, target: 0, energy: 0, hovered: false, lastTouch: 0, outer: [], shapes: [] };
  own.forEach((sh) => {
    const [x, y] = shapePosition(sh, TOTAL_MOVE);
    const from = outlinePoints(ABOUT_SHAPES[sh.shape][2], x, y);
    const path = document.createElementNS(SVG_NS, "path");
    path.style.visibility = "hidden";
    group.appendChild(path);
    L.shapes.push({ el: sh.el, path, from, mid: middleOf(from), phase: L.shapes.length * 1.7 + n * 2.3 });
  });
  return L;
});

// Each piece changes at its own moment: first the pieces near where the mouse came in, the rest follow,
// like liquid spreading. pieceTime() is that piece's own progress (0 = sharp, 1 = soft).
const pieceTime = (L, sh) => Math.min(1, Math.max(0, L.t * (1 + SPREAD) - SPREAD * (sh.reach || 0)));
// remembers where the change starts and how far each piece is from there (0 = nearest, 1 = farthest)
function spreadFrom(L, point) {
  const far = Math.max(...L.shapes.map((sh) => Math.hypot(sh.mid[0] - point[0], sh.mid[1] - point[1]))) || 1;
  L.shapes.forEach((sh) => { sh.reach = Math.hypot(sh.mid[0] - point[0], sh.mid[1] - point[1]) / far; });
}

function drawLetter(L, time) {
  const showing = L.t > 0;
  const s = ooze(L.t);            // how soft it is (0 = its sharp pieces, 1 = squashed)
  const live = s * (0.35 + 0.65 * L.energy);   // how much it moves
  // how much it is in the middle of oozing (0 when it rests sharp or rests soft)
  const flowing = L.shapes.reduce((a, sh) => a + Math.sin(Math.PI * pieceTime(L, sh)), 0) / (L.shapes.length || 1);
  // the filter: melting and the inner light come with the softness, and breathe a little;
  // while oozing it melts a bit more, so the pieces pull liquid bridges between them
  const soft = SOFT * (s + GOO * flowing) * (1 + 0.15 * live * Math.sin(time * 0.9 + L.n));
  if (soft > 0.05) {
    L.blur.setAttribute("stdDeviation", soft.toFixed(2));
    L.rimBlur.setAttribute("stdDeviation", (RIM * s).toFixed(2));
    L.light.setAttribute("flood-opacity", (0.9 * s).toFixed(3));
    L.group.setAttribute("filter", `url(#${L.filterId})`);
  } else L.group.removeAttribute("filter");
  L.shapes.forEach((sh) => {
    sh.el.style.visibility = showing ? "hidden" : "";   // the real shape hides while it is soft
    sh.path.style.visibility = showing ? "visible" : "hidden";
    if (!showing) return;
    const ps = ooze(pieceTime(L, sh));                 // this piece's own softness
    const flow = Math.sin(Math.PI * pieceTime(L, sh));  // this piece is oozing right now (0 before and after)
    // breathing: each piece swells and shrinks around its middle at its own slow pace (the waists open and close)
    const k = 1 - ps * SHRINK + live * BREATH * Math.sin(time * 0.8 + sh.phase);
    // drifting a little, slowly
    const ox = live * DRIFT * Math.sin(time * 0.5 + sh.phase), oy = live * DRIFT * Math.cos(time * 0.6 + sh.phase * 1.3);
    const [cx, cy] = sh.mid;
    sh.path.setAttribute("d", pathFrom(sh.from.map(([px, py]) => {
      let x = cx + (px - cx) * k + ox, y = cy + (py - cy) * k + oy;
      // slow ripples along the edge
      const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy) || 1, a = Math.atan2(dy, dx);
      const ripple = live * RIPPLE * Math.sin(time * 1.2 + a * 2 + sh.phase);
      // while oozing: the edges bulge in moving lumps, and the bottom sags down like thick liquid
      const lump = flow * LUMP * (Math.sin(a * 3 + time * 3.2 + sh.phase) * 0.6 + Math.sin(a * 5 - time * 2.1 + sh.phase * 2) * 0.4);
      x += (dx / r) * (ripple + lump); y += (dy / r) * (ripple + lump);
      y += flow * DRIP * Math.max(0, dy / r) ** 3;
      // the mouse presses it away, gently
      if (L.hovered && pointer) {
        const mx = x - pointer[0], my = y - pointer[1], d = Math.hypot(mx, my) || 1;
        if (d < PUSH_REACH) { const f = PUSH * (1 - d / PUSH_REACH) ** 2 * L.energy * s; x += (mx / d) * f; y += (my / d) * f; }
      }
      return [x, y];
    })));
  });
}
// one animation loop for the whole word: it runs as long as any letter is soft
let morphLast = null, morphRunning = false;
function morphFrame(now) {
  const dt = morphLast === null ? 0 : Math.min(0.05, (now - morphLast) / 1000);
  morphLast = now;
  let busy = false;
  visionLetters.forEach((L) => {
    if (L.t === 0 && L.target === 0) return;
    // left alone for a while: it slowly goes back to its original square pieces
    // (going back, the farthest pieces turn sharp first and it ends where the mouse came in)
    if (L.target === 1 && !L.hovered && now - L.lastTouch > REST_AFTER) L.target = 0;
    const step = (dt * 1000) / (L.target > L.t ? SQUASH_TIME : REST_TIME);
    L.t = L.target > L.t ? Math.min(L.target, L.t + step) : Math.max(L.target, L.t - step);
    // how lively it is: calm on its own, much more while the mouse is on it
    const lively = L.target === 0 ? 0 : L.hovered ? 1 : CALM;
    L.energy += (lively - L.energy) * Math.min(1, dt * (lively > L.energy ? 1.5 : 0.6));
    drawLetter(L, now / 1000);
    busy = true;
  });
  if (busy) requestAnimationFrame(morphFrame);
  else { morphRunning = false; morphLast = null; }
}
function goTo(L, value) {
  L.target = value;
  if (!morphRunning) { morphRunning = true; requestAnimationFrame(morphFrame); }
}
function delays() {}   // (the old ooze started where the mouse came in; the squash is even all over)

// Phones: a tap also sends "mouse" events; they are ignored right after a finger touched the screen (mobile.js)
const byFinger = () => typeof window.touchedJustNow === "function" && window.touchedJustNow();
const TAP_LIVELY_TIME = 1800;   // phones: ms a tapped letter stays as lively as under the mouse

// where the mouse is, in about units (for the liquid to move away from it)
let pointer = null;
stage.addEventListener("mousemove", (event) => {
  const b = stage.getBoundingClientRect(), u = aboutUnit();
  pointer = [(event.clientX - b.left) / u, WORD_MID + (event.clientY - b.top - b.height * WORDS_AT) / u];
});

// each letter has a spot that feels the mouse: around its shapes and its organic shape
visionLetters.forEach((L) => {
  const pts = L.shapes.flatMap((sh) => sh.from).concat(L.outer);
  L.area = { x0: Math.min(...pts.map((p) => p[0])), x1: Math.max(...pts.map((p) => p[0])),
             y0: Math.min(...pts.map((p) => p[1])), y1: Math.max(...pts.map((p) => p[1])) };
  const el = document.createElement("div");
  el.className = "about-letter-hover";
  stage.appendChild(el);
  L.el = el;
  function touchLetter(event) {
    L.hovered = true;
    L.lastTouch = performance.now();
    if (L.t === 0) {
      // the ooze starts where the mouse came in
      const b = el.getBoundingClientRect();
      L.from = [L.area.x0 + ((event.clientX - b.left) / b.width) * (L.area.x1 - L.area.x0),
                L.area.y0 + ((event.clientY - b.top) / b.height) * (L.area.y1 - L.area.y0)];
      spreadFrom(L, L.from);
    }
    goTo(L, 1);   // once touched it turns soft; it goes back a few seconds after the mouse leaves
  }
  // (a tap on a phone also sends mouseenter/mouseleave: then they do nothing, the tap is handled below)
  el.addEventListener("mouseenter", (event) => { if (!byFinger()) touchLetter(event); });
  el.addEventListener("mouseleave", () => { if (!byFinger()) { L.hovered = false; L.lastTouch = performance.now(); } });
  // Phones: a tap turns the letter liquid (from where the finger touched it), and for a moment it is as
  // lively as under the mouse, moving away from the finger
  let calmTimer = null;
  el.addEventListener("click", (event) => {
    if (!byFinger()) return;
    const b = stage.getBoundingClientRect(), u = aboutUnit();
    pointer = [(event.clientX - b.left) / u, WORD_MID + (event.clientY - b.top - b.height * WORDS_AT) / u];
    touchLetter(event);
    clearTimeout(calmTimer);
    calmTimer = setTimeout(() => { L.hovered = false; L.lastTouch = performance.now(); }, TAP_LIVELY_TIME);
  });
});

// Called by draw(): the drawing and the hover spots follow the screen; they only work at the very end
function placeMorph(moved, u, screenH) {
  const atEnd = moved >= TOTAL_MOVE - 0.5;
  stage.classList.toggle("is-at-end", atEnd);
  if (!atEnd) visionLetters.forEach((L) => { if (L.target !== 0) { L.hovered = false; goTo(L, 0); } });   // scrolling back: sharp again
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
// Scrolling back away from VISION hides it (the typing waits); coming back shows it again and it goes on.
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
function bioAt(atEnd) {
  if (atEnd === bioOn) return;
  bioOn = atEnd;
  bioEl.classList.toggle("is-shown", atEnd);
  clearTimeout(bioTimer);
  bioTimer = null;
  if (atEnd && bioShown < BIO.length) bioWait(bioShown === 0 ? BIO_FIRST_WAIT : 400);
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
window.addEventListener("resize", () => {
  setPageHeight();
  drawSoon();
});
setPageHeight();
draw();
