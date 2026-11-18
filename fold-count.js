// ===== The fold counter on project pages (Figma: "0" on the left, "/  11" on the right) =====
// Left: which fold you are looking at. 0 = the title; each picture (or video) that has slid up to
// its place in the middle of the screen adds one. Right: how many pictures the project has.
(function () {
  const now = document.querySelector(".fold-count-now");
  const total = document.querySelector(".fold-count-total");
  if (!now || !total) return;
  const pictures = [...document.querySelectorAll(".lab-media")];
  if (!pictures.length) {   // a project without pictures (yet): no counter
    now.hidden = true;
    total.hidden = true;
    return;
  }
  total.textContent = "/  " + pictures.length;

  // A picture counts once its middle has come up to the middle of the screen (where it stops)
  function update() {
    const middle = window.innerHeight / 2 + 2;
    const seen = pictures.filter((pic) => {
      const box = pic.getBoundingClientRect();
      return box.height > 0 && box.top + box.height / 2 <= middle;
    }).length;
    now.textContent = String(seen);
  }
  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
})();
