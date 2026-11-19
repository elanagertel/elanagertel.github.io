// The project pages' short texts type themselves out (once; they are never erased):
// - the four on the first screen (.lab-intro) a moment after the page opens; they then scroll up and out
//   with the page,
// - the four on the black end (.lab-info) right away, as soon as they start coming onto the screen.
// - the last story paragraph (on the last fold; the others just scroll in, stick and scroll out): once it
//   has come fully onto the screen; while it comes up only its bar shows, blinking. It types very fast (with a tiny stop
//   after each sentence) and then scrolls up and out with the page as before.
// All the texts of a group type at the same time, each with its own bar; the bar stands still while it
// types and goes away once its text is typed.
// An invisible copy of each text keeps it at its full size, and the line breaks are measured on it first,
// so a word that goes on the next row is typed there from its first letter (it never jumps down).
(function () {
  const PER_LETTER = 30;     // ms for each letter
  const FIRST_WAIT = 600;    // ms the bars blink before the first letter

  function prepare(el) {
    const full = el.textContent.trim();
    el.setAttribute("aria-label", full);
    el.textContent = "";
    const ghost = document.createElement("span");
    ghost.className = "type-ghost";
    ghost.setAttribute("aria-hidden", "true");
    ghost.textContent = full;
    const live = document.createElement("span");
    live.className = "type-live";
    live.setAttribute("aria-hidden", "true");
    const typed = document.createElement("span");
    const bar = document.createElement("span");
    bar.className = "type-bar flow-edge-cursor";
    bar.textContent = "|";
    live.append(typed, bar);
    el.append(ghost, live);
    el.classList.add("is-waiting");   // nothing shows until it starts
    return { el, full, ghost, typed, shown: 0, withBreaks: full };
  }

  // Where the rows break (the space before a word that starts a new row becomes a line break)
  function measure(t) {
    const node = t.ghost.firstChild, range = document.createRange();
    let out = "", lastTop = null;
    for (let i = 0; i < t.full.length; i++) {
      const ch = t.full[i];
      if (ch === "\n") { out += ch; lastTop = null; continue; }
      if (ch !== " ") {
        range.setStart(node, i); range.setEnd(node, i + 1);
        const top = range.getBoundingClientRect().top;
        if (lastTop !== null && top > lastTop + 2 && out.endsWith(" ")) out = out.slice(0, -1) + "\n";
        lastTop = top;
      }
      out += ch;
    }
    t.withBreaks = out;
    t.typed.textContent = out.slice(0, t.shown);
  }

  // Types a group of texts together.
  // wait: ms the bars blink before the first letter; already: letters that are typed right away
  // (the first screen's texts started typing on the home page, while the title was being built)
  function typeGroup(group, wait = FIRST_WAIT, already = 0, onStart) {
    group.forEach((t) => {
      t.el.classList.remove("is-waiting");
      t.shown = Math.min(t.full.length, already);
      t.typed.textContent = t.withBreaks.slice(0, t.shown);
    });
    setTimeout(() => {
      if (onStart) onStart();
      group.forEach((t) => t.el.classList.add(t.shown < t.full.length ? "is-typing" : "is-done"));
      const timer = setInterval(() => {
        let busy = false;
        group.forEach((t) => {
          if (t.shown < t.full.length) {
            t.shown++;
            t.typed.textContent = t.withBreaks.slice(0, t.shown);
            if (t.shown === t.full.length) { t.el.classList.remove("is-typing"); t.el.classList.add("is-done"); }
            else busy = true;
          }
        });
        if (!busy) clearInterval(timer);
      }, PER_LETTER);
    }, wait);
  }

  // ----- Home page: the first screen's texts start typing while the project's title is being built -----
  // home.js calls this with the project page's texts (and where they stand); they are drawn in the same
  // place as on the project page. save() is called just before the project page opens: it remembers how
  // many letters are typed by then, so the project page goes on typing from exactly that letter (the
  // moment the new page takes to open does not make letters jump in).
  const STARTED_KEY = "introTypingStarted";
  window.typeIntroPreview = function (texts, page, project = "") {
    const box = document.createElement("div");
    box.className = "lab-intro-preview " + project;   // the project's class: its title's size (styles.css)
    box.setAttribute("aria-hidden", "true");
    texts.forEach(({ className, style, text }) => {
      const p = document.createElement("p");
      p.className = className;
      p.setAttribute("style", style);   // where it stands: --x, --y and its width --w
      p.textContent = text;
      box.appendChild(p);
    });
    document.body.appendChild(box);
    const group = [...box.children].map(prepare);
    let started = null;
    document.fonts.ready.then(() => {
      group.forEach(measure);
      typeGroup(group, FIRST_WAIT, 0, () => { started = Date.now(); });
    });
    return {
      save() {
        if (started === null) return;
        const typed = Math.max(...group.map((t) => t.shown));   // letters typed so far (all type together)
        try { sessionStorage.setItem(STARTED_KEY, JSON.stringify({ page, typed, at: Date.now() })); } catch (e) {}
      },
    };
  };
  // On the project page: how many letters of its first-screen texts were already typed on the home page
  // (null if they did not start there)
  function typedOnHome() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STARTED_KEY) || "null");
      sessionStorage.removeItem(STARTED_KEY);
      if (!saved || saved.page !== location.pathname || Date.now() - saved.at > 15000) return null;
      return saved.typed;
    } catch (e) { return null; }
  }
  const homeTyped = typedOnHome();

  // A story paragraph types on its own, quickly, with a tiny stop after each sentence
  const STORY_STEP = 10;       // ms between two steps
  const STORY_LETTERS = 2;     // letters typed in each step (6 while it catches up)
  const STORY_SENTENCE = 110;  // ms more after a full stop, a question mark or an exclamation mark
  function typeStory(t) {
    t.started = true;
    t.el.classList.add("is-typing");
    (function next() {
      // once it starts sliding up and out, it catches up (3 times as fast), so it is typed before it leaves
      const leaving = t.el.getBoundingClientRect().bottom < storyPlace() - 20;
      const before = t.shown;
      t.shown = Math.min(t.full.length, t.shown + STORY_LETTERS * (leaving ? 3 : 1));
      t.typed.textContent = t.withBreaks.slice(0, t.shown);
      if (t.shown >= t.full.length) { t.el.classList.remove("is-typing"); t.el.classList.add("is-done"); return; }
      // a tiny stop if a sentence ended in this step
      const ended = /[.?!] /.test(t.full.slice(before, t.shown + 1));
      setTimeout(next, STORY_STEP + (ended && !leaving ? STORY_SENTENCE : 0));
    })();
  }

  const intro = [...document.querySelectorAll(".lab-intro")].map(prepare);
  const info = [...document.querySelectorAll(".lab-info")].map(prepare);
  const story = [...document.querySelectorAll(".lab-text-last .lab-text")].map(prepare);   // only the last one (the others just scroll)
  story.forEach((t) => t.el.classList.replace("is-waiting", "is-coming"));   // its bar shows while it comes up
  const all = intro.concat(info, story);
  if (!all.length) return;

  document.fonts.ready.then(() => {
    all.forEach(measure);
    // the first screen: right away, or going on from where it got to on the home page
    if (intro.length && homeTyped !== null) typeGroup(intro, 0, homeTyped);
    else if (intro.length) typeGroup(intro);
    // the black end (the last fold): as soon as its texts start coming onto the screen, with no pause
    if (info.length) {
      const watch = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { watch.disconnect(); typeGroup(info, 0); }
      }, { threshold: 0 });
      info.forEach((t) => watch.observe(t.el));
    }
  });
  window.addEventListener("resize", () => all.forEach(measure));

  // A story paragraph is in its place once its bottom has come up to where it sticks
  // (19.91 Figma pixels above the bottom of the screen, see .lab-text in styles.css)
  function storyPlace() { return window.innerHeight - 19.91 * (document.documentElement.clientWidth / 1440) + 2; }
  function checkStory() {
    story.forEach((t) => {
      if (!t.started && t.el.getBoundingClientRect().bottom <= storyPlace()) typeStory(t);
    });
  }
  if (story.length) {
    document.fonts.ready.then(() => {
      checkStory();
      window.addEventListener("scroll", checkStory, { passive: true });
    });
  }
})();
