// ===== Home page: the mouse turns into a small liquid blob while it pushes a big letter away =====
// When the mouse pushes a letter (home.js calls blobCursor.drip()), the arrow hides and a drop oozes
// out of it like the letters on the project pages: slowly at first, from the side it touched, softly
// settling into a new blob shape (a different one every time) that keeps wobbling. It follows the
// mouse a little behind, like liquid, and stretches the way it moves. When the mouse leaves the letter
// (blobCursor.release()), the blob oozes back into a dot and the arrow comes back.
// Its colour swaps the page's two colours: dark on the page, the page's light colour where it is over
// a big (dark) letter. It does that by filtering what is behind it (backdrop-filter), cut to its outline.
(function () {
  if (!window.matchMedia("(hover: hover)").matches) return;   // phones: no mouse, no blob
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const BOX = 80;   // the element's size (pixels); the blob is drawn around its middle
  const blob = document.createElement("div");
  blob.className = "blob-cursor";
  blob.setAttribute("aria-hidden", "true");
  document.body.appendChild(blob);

  // Sizes and times
  const DOT = 2.5;         // radius of the drop when it starts (pixels)
  const BLOB = 12;         // radius of the blob (pixels): about 24 wide
  const POINTS = 48;       // points around the outline (enough for smooth curves)
  const BUMPS = 5;         // how many soft bumps the blob shape has
  const OOZE_TIME = reduced ? 1 : 900;   // ms to ooze from drop to blob (and back)
  const SPREAD = 0.45;     // how much later the far side starts oozing (part of the time)
  const FOLLOW = 0.3;      // how quickly it catches up with the mouse each frame (0–1)

  let mouse = [0, 0];
  document.addEventListener("mousemove", (event) => { mouse = [event.clientX, event.clientY]; });

  // A new blob shape: a few soft bumps, each with its own slow wobble
  let bumps = [];
  function newShape() {
    bumps = Array.from({ length: BUMPS }, (_, k) => ({
      angle: (k / BUMPS) * Math.PI * 2 + (Math.random() - 0.5) * 0.9,
      size: 0.12 + Math.random() * 0.22,
      speed: 0.0012 + Math.random() * 0.0016,
      phase: Math.random() * Math.PI * 2,
    }));
  }
  newShape();

  // the blob's own radius at an angle (1 = round), with its bumps wobbling over time
  function shapeAt(angle, time) {
    let r = 1;
    bumps.forEach((b) => {
      const near = Math.cos(angle - b.angle);   // 1 on the bump, falling off to the sides
      const wobble = reduced ? 1 : 1 + 0.35 * Math.sin(time * b.speed + b.phase);
      r += b.size * wobble * Math.max(0, near) ** 3;
    });
    return r;
  }

  // slow start, soft stop (the same ooze as the project titles)
  const ooze = (p) => (p <= 0 ? 0 : p >= 1 ? 1 : p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2);
  const clamp01 = (v) => Math.min(1, Math.max(0, v));

  // The outline as a path (smooth: many points, joined by short curves), around the element's middle
  function outline(points) {
    const n = points.length, c = BOX / 2;
    const mid = (a, b) => [(a[0] + b[0]) / 2 + c, (a[1] + b[1]) / 2 + c];
    let start = mid(points[n - 1], points[0]);
    let d = `M${start[0].toFixed(2)} ${start[1].toFixed(2)}`;
    for (let i = 0; i < n; i++) {
      const p = points[i], m = mid(p, points[(i + 1) % n]);
      d += `Q${(p[0] + c).toFixed(2)} ${(p[1] + c).toFixed(2)} ${m[0].toFixed(2)} ${m[1].toFixed(2)}`;
    }
    return d + "Z";
  }

  // State
  let t = 0;               // 0 = a dot, 1 = a full blob
  let target = 0;
  let from = 0;            // the angle the ooze starts from (the side towards the letter)
  let pos = [0, 0];        // where the blob is (it follows the mouse a little behind)
  let speed = [0, 0];
  let running = false, last = 0;

  function frame(time) {
    const dt = last ? Math.min(50, time - last) : 16;
    last = time;
    t = target > t ? Math.min(1, t + dt / OOZE_TIME) : Math.max(0, t - dt / OOZE_TIME);

    // follow the mouse like liquid: a little behind, and stretched the way it moves
    const next = [pos[0] + (mouse[0] - pos[0]) * FOLLOW, pos[1] + (mouse[1] - pos[1]) * FOLLOW];
    speed = [next[0] - pos[0], next[1] - pos[1]];
    pos = next;
    const fast = Math.min(0.6, Math.hypot(speed[0], speed[1]) / 25);   // how much it stretches
    const along = Math.atan2(speed[1], speed[0]);

    const radius = DOT + (BLOB - DOT) * ooze(t);
    const points = [];
    for (let i = 0; i < POINTS; i++) {
      const angle = (i / POINTS) * Math.PI * 2;
      // each part of the outline oozes in its own time: the side it started from first
      const far = (1 - Math.cos(angle - from)) / 2;   // 0 at the start side, 1 opposite
      const e = ooze(clamp01((t * (1 + SPREAD) - SPREAD * far)));
      const r = (DOT + (radius - DOT) * e) * (1 + (shapeAt(angle, time) - 1) * e);
      // stretch: longer along the movement, a little thinner across it
      const a = Math.cos(angle - along), b = Math.sin(angle - along);
      const x = a * r * (1 + fast), y = b * r * (1 - fast * 0.4);
      points.push([x * Math.cos(along) - y * Math.sin(along), x * Math.sin(along) + y * Math.cos(along)]);
    }
    const d = outline(points);
    blob.style.clipPath = `path("${d}")`;
    blob.style.transform = `translate(${pos[0] - BOX / 2}px, ${pos[1] - BOX / 2}px)`;

    if (t === 0 && target === 0) {   // back to a dot: the arrow returns
      running = false;
      last = 0;
      blob.classList.remove("is-on");
      document.body.classList.remove("has-blob-cursor");
      return;
    }
    requestAnimationFrame(frame);
  }

  window.blobCursor = {
    // the mouse starts pushing a letter: ooze into a new blob
    drip() {
      if (target === 1) return;
      if (t === 0) {
        newShape();                 // a new shape every time it starts from a dot
        pos = [...mouse];
        // the ooze starts from the side the mouse is moving towards (down if it is still)
        from = Math.hypot(speed[0], speed[1]) > 0.3 ? Math.atan2(speed[1], speed[0]) : Math.PI / 2;
      }
      target = 1;
      blob.classList.add("is-on");
      document.body.classList.add("has-blob-cursor");
      if (!running) { running = true; requestAnimationFrame(frame); }
    },
    // the mouse leaves the letter: ooze back, and the arrow comes back
    release() {
      target = 0;
      if (!running && t > 0) { running = true; requestAnimationFrame(frame); }
    },
  };
})();
