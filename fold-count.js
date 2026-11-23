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

// ===== The pictures' numbers (Figma "the memory lab": "1  /  04", Helvetica Oblique 15.5) =====
// Each picture has its number (which picture it is, out of the project's pictures). The number comes up
// with its picture and stays in its place while the picture stays in the middle of the screen; when the
// next picture comes up with its own number, the new number pushes the old one out through the top.
// It stands right beside its picture, its top level with the picture's top. The last one leaves with the
// pictures. (Phones: where there is no room beside a picture, on the right margin over its corner, in "exclusion".)
(function () {
  const lab = document.getElementById("lab");
  if (!lab) return;
  const twoDigits = (n) => String(n).padStart(2, "0");
  let built = [];

  // The part of a picture that is seen (pictures with see-through edges, like the book's spreads):
  // [left, top, width, height] as parts of the whole picture (0–1), measured once it has loaded
  const seen = new Map();
  let again = null;
  function visiblePart(img) {
    if (!img || img.tagName !== "IMG") return [0, 0, 1, 1];
    if (seen.has(img)) return seen.get(img);
    seen.set(img, [0, 0, 1, 1]);
    const measure = () => {
      try {
        const W = 120, H = Math.max(1, Math.round(W * img.naturalHeight / img.naturalWidth));
        const canvas = document.createElement("canvas");
        canvas.width = W; canvas.height = H;
        const pen = canvas.getContext("2d", { willReadFrequently: true });
        pen.drawImage(img, 0, 0, W, H);
        const data = pen.getImageData(0, 0, W, H).data;
        let x0 = W, y0 = H, x1 = -1, y1 = -1;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          if (data[(y * W + x) * 4 + 3] > 20) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
        }
        if (x1 >= x0 && y1 >= y0) {
          seen.set(img, [x0 / W, y0 / H, (x1 - x0 + 1) / W, (y1 - y0 + 1) / H]);
          clearTimeout(again); again = setTimeout(build, 100);   // (place the numbers again)
        }
      } catch (e) {}
    };
    if (img.complete && img.naturalWidth) measure(); else img.addEventListener("load", measure, { once: true });
    return seen.get(img);
  }

  function build() {
    built.forEach((el) => el.remove());
    built = [];
    const phone = document.documentElement.classList.contains("is-phone-portrait");
    // measured as they lie on the page (not stuck in place while scrolling)
    lab.classList.add("is-measuring-numbers");
    const tracks = [...lab.querySelectorAll(":scope > .lab-track, :scope > .lab-side-track")]
      .map((track) => {
        const media = track.querySelector(".lab-media, .lab-side") || track;
        return { track, media, top: track.offsetTop, bottom: track.offsetTop + track.offsetHeight };
      })
      .sort((a, b) => a.top - b.top);
    lab.classList.remove("is-measuring-numbers");
    if (!tracks.length) return;

    const u = window.innerWidth / 1440, h = window.innerHeight;
    const numberH = phone ? 16 : 19 * u;
    const places = tracks.map((t) => {
      // where the picture stays on the screen (the top of what is seen of it), and where its number stays
      // (on the phone the track already is what is seen of the picture, phone.js)
      const part = phone ? [0, 0, 1, 1] : visiblePart(t.media);
      if (phone) visiblePart(t.media);
      const mediaH = phone ? t.track.offsetHeight : t.media.offsetHeight;
      const pinTop = (phone ? parseFloat(t.track.style.top) || 0 : parseFloat(getComputedStyle(t.media).top) || 0) + part[1] * mediaH;
      const spot = pinTop;   // (its top level with the picture's top)
      // the number comes up with its picture: it reaches its spot when the picture reaches its own
      const shift = part[1] * mediaH;   // (how far down the picture what is seen begins)
      const start = t.top + shift;
      return { ...t, spot, start, mediaH, pinTop, shift };
    });
    // when the pile of pictures leaves (the last number leaves with it)
    const last = places[places.length - 1];
    let leave;
    if (phone) {
      const texts = [...lab.querySelectorAll(":scope > .lab-text-track")];
      const lastText = texts.length ? Math.max(...texts.map((el) => el.offsetTop + el.offsetHeight)) : last.bottom;
      leave = lastText + last.spot + numberH;
    } else {
      leave = last.bottom - last.mediaH + last.shift + numberH;
    }

    places.forEach((p, i) => {
      const end = i + 1 < places.length ? places[i + 1].start - 2 : leave;
      const track = document.createElement("div");
      track.className = "picture-count-track";
      track.setAttribute("aria-hidden", "true");
      track.style.cssText = `position:absolute; left:0; width:100%; top:${p.start}px; height:${Math.max(numberH, end - p.start)}px;`;
      const number = document.createElement("p");
      number.className = "picture-count";
      number.textContent = `${i + 1}  /  ${twoDigits(places.length)}`;
      number.style.top = `${p.spot}px`;
      track.appendChild(number);
      lab.appendChild(track);
      built.push(track);
      // right beside the picture: just past its right edge (on a phone, if there is no room there, on the
      // right margin)
      const labLeft = lab.getBoundingClientRect().left;
      const box = p.media.getBoundingClientRect(), shown = visiblePart(p.media);
      const right = box.left + (shown[0] + shown[2]) * box.width - labLeft;   // (the right edge of what is seen)
      const gap = phone ? 6 : 24 * u;
      const roomEnd = window.innerWidth - labLeft - (phone ? 18 : 0);
      const x = Math.min(right + gap, roomEnd - number.offsetWidth);
      number.style.marginLeft = `${x}px`;
      number.style.marginRight = "0";
    });
  }
  // (once the page is laid out; the phone sizes its pictures a moment later)
  window.addEventListener("load", () => { build(); setTimeout(build, 400); });
  // (the phone sizes its pictures again once they have loaded, phone.js)
  window.addEventListener("pictures-sized", () => { clearTimeout(again); again = setTimeout(build, 50); });
  let wait = null;
  window.addEventListener("resize", () => { clearTimeout(wait); wait = setTimeout(build, 200); });
})();
