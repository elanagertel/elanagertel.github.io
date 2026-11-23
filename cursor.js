// ===== The cursor: a small square piece (Figma: a square 31 × 31) that can turn organic =====
// On every page the mouse is a small square, like one of the site's pieces. It is drawn with "exclusion"
// (white, blended): dark on the light page, light where it is over something dark. Its middle is on the mouse.
// While the mouse is on a letter of a project title that turns organic (lab.js calls squareCursor.organic(true)),
// the square oozes into a liquid blob, like the letter: its soft bumps keep swelling, shrinking and drifting
// around it, it trails a little behind the mouse and stretches the way it moves. When the mouse leaves the
// letter (organic(false)), it oozes back into the square.
// It is a small drawing (an <svg> with one white shape), not a cut-out box, so no edge of a box ever shows.
// Phones and tablets without a mouse keep no cursor at all.
(function () {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const SVG_NS = "http://www.w3.org/2000/svg";
  const BOX = 160;          // the drawing's size (screen pixels): room for the blob to wobble and stretch
  const cursor = document.createElementNS(SVG_NS, "svg");
  cursor.setAttribute("class", "square-cursor");
  cursor.setAttribute("aria-hidden", "true");
  cursor.setAttribute("viewBox", `0 0 ${BOX} ${BOX}`);
  cursor.setAttribute("width", BOX);
  cursor.setAttribute("height", BOX);
  const shape = document.createElementNS(SVG_NS, "path");
  cursor.appendChild(shape);
  document.body.appendChild(cursor);
  document.documentElement.classList.add("has-square-cursor");   // (the normal arrow hides, styles.css)

  const half = () => (31 * window.innerWidth / 1440) / 2;   // half the square's side (31 Figma px of 1440)
  const POINTS = 72;        // points around the outline
  const BUMPS = 6;          // soft bumps of the blob
  const OOZE_TIME = reduced ? 1 : 750;   // ms from square to blob (and back)
  const FOLLOW = 0.28;      // as a blob it follows the mouse a little behind, like liquid (0–1 each frame)

  // the blob's own shape: soft bumps, each swelling and shrinking at its own pace and slowly drifting
  // around the blob, so it never holds one shape (a new set every time it turns into a blob)
  let bumps = [];
  function newShape() {
    bumps = Array.from({ length: BUMPS }, (_, k) => ({
      angle: (k / BUMPS) * Math.PI * 2 + (Math.random() - 0.5),
      drift: (Math.random() < 0.5 ? -1 : 1) * (0.0004 + Math.random() * 0.0007),   // radians per ms
      size: 0.16 + Math.random() * 0.3,
      speed: 0.002 + Math.random() * 0.003,
      phase: Math.random() * Math.PI * 2,
      width: 2 + Math.random() * 3,   // how wide the bump is (bigger = narrower)
    }));
  }
  function blobRadius(angle, time) {
    let r = 1;
    bumps.forEach((b) => {
      const at = b.angle + (reduced ? 0 : b.drift * time);
      const near = Math.max(0, Math.cos(angle - at)) ** b.width;
      const swell = reduced ? 1 : 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * b.speed + b.phase));
      r += b.size * swell * near;
    });
    return r * (reduced ? 1 : 1 + 0.06 * Math.sin(time * 0.003));   // (and the whole blob breathes)
  }
  const ooze = (p) => (p <= 0 ? 0 : p >= 1 ? 1 : p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2);

  // The outline: each point between the square's edge and the blob's edge (t: 0 = square, 1 = blob),
  // the blob stretched along the way it moves
  function outline(t, time, stretch, along) {
    const h = half(), c = BOX / 2, e = ooze(t);
    if (e === 0) return `M${c - h} ${c - h}H${c + h}V${c + h}H${c - h}Z`;   // exactly the square
    const points = [];
    for (let i = 0; i < POINTS; i++) {
      const a = (i / POINTS) * Math.PI * 2 + Math.PI / 4;   // (a point on each corner of the square)
      const square = h / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a)));
      const blob = h * 1.05 * blobRadius(a, time);
      const r = square + (blob - square) * e;
      // stretch: longer along the movement, a little thinner across it (only as a blob)
      const s = stretch * e;
      const x0 = Math.cos(a) * r, y0 = Math.sin(a) * r;
      const u = x0 * Math.cos(along) + y0 * Math.sin(along), v = -x0 * Math.sin(along) + y0 * Math.cos(along);
      const u2 = u * (1 + s), v2 = v * (1 - s * 0.45);
      points.push([c + u2 * Math.cos(along) - v2 * Math.sin(along), c + u2 * Math.sin(along) + v2 * Math.cos(along)]);
    }
    // smooth: joined by short curves through the middles
    const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    const start = mid(points[POINTS - 1], points[0]);
    let d = `M${start[0].toFixed(2)} ${start[1].toFixed(2)}`;
    points.forEach((p, i) => {
      const m = mid(p, points[(i + 1) % POINTS]);
      d += `Q${p[0].toFixed(2)} ${p[1].toFixed(2)} ${m[0].toFixed(2)} ${m[1].toFixed(2)}`;
    });
    return d + "Z";
  }

  let mouse = [-500, -500], pos = [-500, -500], speed = [0, 0];
  let t = 0, target = 0, running = false, last = 0;
  function place() { cursor.style.transform = `translate(${pos[0] - BOX / 2}px, ${pos[1] - BOX / 2}px)`; }
  function frame(time) {
    const dt = last ? Math.min(50, time - last) : 16;
    last = time;
    t = target > t ? Math.min(1, t + dt / OOZE_TIME) : Math.max(0, t - dt / OOZE_TIME);
    // as a blob it trails behind the mouse like liquid; as a square it sits right on it
    const follow = 1 - (1 - FOLLOW) * ooze(t);
    const next = [pos[0] + (mouse[0] - pos[0]) * follow, pos[1] + (mouse[1] - pos[1]) * follow];
    speed = [next[0] - pos[0], next[1] - pos[1]];
    pos = next;
    const stretch = reduced ? 0 : Math.min(0.55, Math.hypot(speed[0], speed[1]) / 22);
    shape.setAttribute("d", outline(t, time, stretch, Math.atan2(speed[1], speed[0])));
    place();
    if (t === 0 && target === 0) { running = false; last = 0; return; }   // back to the square: rest
    requestAnimationFrame(frame);
  }
  shape.setAttribute("d", outline(0, 0, 0, 0));

  document.addEventListener("mousemove", (event) => {
    mouse = [event.clientX, event.clientY];
    if (!running) { pos = [...mouse]; place(); }   // (the square: right on the mouse)
    cursor.classList.add("is-on");
  });
  // it hides while the mouse is outside the window
  document.documentElement.addEventListener("mouseleave", () => cursor.classList.remove("is-on"));
  window.addEventListener("resize", () => { if (!running) shape.setAttribute("d", outline(0, 0, 0, 0)); });

  window.squareCursor = {
    // true: ooze into a blob (with a letter turning organic); false: back into the square
    organic(on) {
      if (on && t === 0) newShape();
      target = on ? 1 : 0;
      if (!running) { running = true; requestAnimationFrame(frame); }
    },
  };
})();
