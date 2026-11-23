// ===== The cursor: a small square piece (Figma: a square 31 × 31) =====
// On every page the mouse is a small square, like one of the site's pieces. It is drawn with "exclusion"
// (white, blended): dark on the light page, light where it is over something dark.
// It stands with its middle on the mouse. On the home page, while the mouse pushes a big letter, the liquid
// blob takes its place (home-cursor.js adds "has-blob-cursor" to the body), and the square comes back after.
// Phones and tablets without a mouse keep no cursor at all.
(function () {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const square = document.createElement("div");
  square.className = "square-cursor";
  square.setAttribute("aria-hidden", "true");
  document.body.appendChild(square);
  document.documentElement.classList.add("has-square-cursor");   // (the normal arrow hides, styles.css)

  let shown = false;
  document.addEventListener("mousemove", (event) => {
    square.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
    if (!shown) { shown = true; square.classList.add("is-on"); }
  });
  // it hides while the mouse is outside the window
  document.documentElement.addEventListener("mouseleave", () => { shown = false; square.classList.remove("is-on"); });
})();
