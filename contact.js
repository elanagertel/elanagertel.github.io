// "Contact me  /" (in the bar at the top, on every page).
// - Hovering it types out the contact details next to it (Figma: Frame 218, Variant2): all three lines at
//   once, each with its own bar; a line's bar goes away once that line is typed.
// - Leaving the area (the words and the details) for a few moments erases them the same way, from the end,
//   letter by letter. Coming back before that keeps them open.
(function () {
  const contact = document.querySelector(".flow-contact");
  if (!contact) return;
  const PER_LETTER = 30;     // ms for each letter (typing and erasing)
  const LEAVE_WAIT = 2500;   // ms after the mouse leaves before the details erase themselves

  // ----- The contact details (Figma: 131 to the right of "contact me", on the grid's 2nd column) -----
  const LINES = [
    ["@elanagertel  /  instagram", "https://www.instagram.com/elanagertel/"],
    ["+972-54-262-7915  /  whatsapp", "https://wa.me/972542627915"],
    ["gertel.elana@gmail.com", "mailto:gertel.elana@gmail.com"],
  ];
  const list = document.createElement("div");
  list.className = "flow-contact-lines";
  list.hidden = true;
  const lines = LINES.map(([words, href]) => {
    const line = document.createElement("a");
    line.className = "flow-small-text flow-contact-line";
    line.href = href;
    if (href.startsWith("http")) { line.target = "_blank"; line.rel = "noopener"; }
    line.setAttribute("aria-label", words);
    const box = document.createElement("span");
    const bar = document.createElement("span");
    bar.className = "flow-edge-cursor";
    bar.textContent = "|";
    line.append(box, bar);
    list.appendChild(line);
    return { line, box, words, shown: 0 };
  });
  contact.after(list);
  // with a mouse, the cursor turns into a small blob over each contact line (cursor.js)
  lines.forEach(({ line }) => {
    line.addEventListener("mouseenter", () => { if (!byFinger() && window.squareCursor) window.squareCursor.organic(true, { small: true }); });
    line.addEventListener("mouseleave", () => { if (window.squareCursor) window.squareCursor.organic(false); });
  });

  // Types (open) or erases (closed) all the lines together, one letter each step
  let open = false, linesTimer = null, leaveTimer = null;
  function step() {
    let busy = false;
    lines.forEach((l) => {
      const target = open ? l.words.length : 0;
      if (l.shown !== target) { l.shown += open ? 1 : -1; l.box.textContent = l.words.slice(0, l.shown); }
      const done = l.shown === target;
      l.line.classList.toggle("is-typing", !done);          // the bar stands still while it types or erases
      l.line.classList.toggle("is-done", done && open);     // ...and goes away once the line is typed
      if (!done) busy = true;
    });
    if (!busy) {
      clearInterval(linesTimer);
      if (!open) list.hidden = true;   // all erased: the details are gone
    }
  }
  function setOpen(value) {
    clearTimeout(leaveTimer);
    if (open === value) return;
    open = value;
    if (open) list.hidden = false;
    else contact.dispatchEvent(new Event("contact-closing"));   // "Contact me" types back in regular
    lines.forEach((l) => l.line.classList.remove("is-done"));   // the bars show while it erases
    clearInterval(linesTimer);
    linesTimer = setInterval(step, PER_LETTER);
  }
  // A few moments after leaving, the details erase themselves
  function leaveSoon() {
    clearTimeout(leaveTimer);
    if (open) leaveTimer = setTimeout(() => setOpen(false), LEAVE_WAIT);
  }

  // ----- The mouse (and the keyboard: moving onto "contact me" with Tab works the same) -----
  // (a tap on a phone also sends these; it is handled below instead, so they do nothing then)
  const byFinger = () => typeof window.touchedJustNow === "function" && window.touchedJustNow();
  contact.setAttribute("tabindex", "0");
  contact.addEventListener("mouseenter", () => { if (!byFinger()) setOpen(true); });
  contact.addEventListener("focus", () => { if (!byFinger()) setOpen(true); });
  contact.addEventListener("mouseleave", () => { if (!byFinger()) leaveSoon(); });
  contact.addEventListener("blur", () => { if (!byFinger()) leaveSoon(); });
  list.addEventListener("mouseenter", () => { if (!byFinger()) clearTimeout(leaveTimer); });
  list.addEventListener("mouseleave", () => { if (!byFinger()) leaveSoon(); });

  // ----- The email address: a click copies it (it does not open the mail app) and "  /  copied" types
  // itself out after it, on the same line (Figma: Frame 218, Variant2: "gertel.elana@gmail.com  /  copied").
  // It erases with the rest when the details close. -----
  const COPIED = "  /  copied";
  const mail = lines.find((l) => l.line.href.startsWith("mailto:"));
  if (mail) {
    const address = mail.words;
    mail.line.addEventListener("click", (event) => {
      event.preventDefault();
      copyText(address);
      // (clicked again: "  /  copied" goes and types itself out again)
      mail.words = address + COPIED;   // (step() types up to the new end)
      mail.shown = Math.min(mail.shown, address.length);
      mail.box.textContent = mail.words.slice(0, mail.shown);
      mail.line.classList.remove("is-done");
      clearInterval(linesTimer);
      linesTimer = setInterval(step, PER_LETTER);
    });
    // once everything is erased, the line is the address again for next time
    contact.addEventListener("contact-closing", () => { setTimeout(function back() {
      if (open) return;
      if (mail.shown === 0) mail.words = address; else setTimeout(back, 100);
    }, 100); });
  }
  // (a hidden text box copies on older browsers)
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(text).catch(() => copyOld(text)); return; }
    copyOld(text);
  }
  function copyOld(text) {
    const box = document.createElement("textarea");
    box.value = text;
    box.setAttribute("readonly", "");
    box.style.position = "fixed";
    box.style.opacity = "0";
    document.body.appendChild(box);
    box.select();
    try { document.execCommand("copy"); } catch (e) {}
    box.remove();
  }
  window.copyText = copyText;   // (the phone menu uses it too, phone.js)

  // ----- A finger (phones): a tap on "contact me" opens or closes the details;
  //       a tap anywhere else, or a few seconds without a tap, closes them -----
  const TOUCH_OPEN_TIME = 8000;   // ms the details stay open after a tap
  contact.addEventListener("click", () => {
    if (!byFinger()) return;
    setOpen(!open);
    if (open) leaveTimer = setTimeout(() => setOpen(false), TOUCH_OPEN_TIME);
  });
  document.addEventListener("click", (event) => {
    if (!byFinger() || !open) return;
    if (event.target.closest(".flow-contact, .flow-contact-lines")) return;
    setOpen(false);
  });
})();

// "Contact me  /", "About Me  /" and "Home  /" (in the bar at the top, on every page): hovering About Me or Home
// types its own words out again, oblique, letter by letter, with the same bar as the contact details (it
// stands still while typing and goes away once the words are typed). Hovering Contact me only tilts it
// over to oblique (its details type out next to it).
(function () {
  // The page you are on has its word oblique (Home on the home page, About Me on About)
  const page = location.pathname.split("/").pop() || "index.html";
  const here = page === "about.html" ? ".site-nav-about" : page === "index.html" ? ".site-nav-home" : null;
  if (here && document.querySelector(here)) document.querySelector(here).setAttribute("aria-current", "page");

  const PER_LETTER = 80;   // ms for each letter
  document.querySelectorAll(".flow-contact, .site-nav-about, .site-nav-home").forEach((link) => {
    const words = link.textContent;
    link.setAttribute("aria-label", words.replace("/", "").trim());
    const box = document.createElement("span");
    box.setAttribute("aria-hidden", "true");
    box.textContent = words;
    const bar = document.createElement("span");
    bar.className = "flow-edge-cursor site-nav-bar";
    bar.setAttribute("aria-hidden", "true");
    bar.textContent = "|";
    bar.hidden = true;
    // an invisible copy of the words keeps the word at its full size while it types (otherwise the mouse
    // would end up outside it and the typing would start over and over); the typed letters lie on top
    const ghost = document.createElement("span");
    ghost.className = "site-nav-ghost";
    ghost.setAttribute("aria-hidden", "true");
    ghost.textContent = words;
    const live = document.createElement("span");
    live.className = "site-nav-live";
    live.append(box, bar);
    link.textContent = "";
    link.append(ghost, live);

    // types the words again, oblique or regular (the bar has the same slant as the letters)
    let timer = null, oblique = false;
    function typeAgain(slanted) {
      clearInterval(timer);
      oblique = slanted;
      link.classList.toggle("is-oblique", slanted);
      let shown = 0;
      box.textContent = "";
      bar.hidden = false;
      timer = setInterval(() => {
        shown++;
        box.textContent = words.slice(0, shown);
        if (shown >= words.length) {
          clearInterval(timer);
          timer = null;
          bar.hidden = true;   // typed: the bar goes away
        }
      }, PER_LETTER);
    }
    // back to regular without typing: the letters straighten up smoothly (Helvetica's oblique is its
    // regular letters slanted, so the regular letters start slanted the same way and shift back upright)
    function straighten() {
      if (!oblique) return;
      clearInterval(timer);
      timer = null;
      box.textContent = words;
      bar.hidden = true;
      oblique = false;
      link.classList.remove("is-oblique");
      link.animate([{ transform: "skewX(-12deg)" }, { transform: "skewX(0deg)" }],
        { duration: 500, easing: "cubic-bezier(0.65, 0, 0.35, 1)" });
    }
    // to oblique without typing: the letters tilt over smoothly (the oblique letters start straightened up
    // the same way and lean over into their slant)
    function tilt() {
      if (oblique) return;
      clearInterval(timer);
      timer = null;
      box.textContent = words;
      bar.hidden = true;
      oblique = true;
      link.classList.add("is-oblique");
      link.animate([{ transform: "skewX(12deg)" }, { transform: "skewX(0deg)" }],
        { duration: 500, easing: "cubic-bezier(0.65, 0, 0.35, 1)" });
    }
    const byFinger = () => typeof window.touchedJustNow === "function" && window.touchedJustNow();   // phones: no
    const isContact = link.classList.contains("flow-contact");
    const isHere = link.getAttribute("aria-current") === "page";
    // hovering: it types itself out oblique, so when it is clicked it is already oblique
    // (Contact me does not type again: it only tilts over to oblique, and its details type out next to it)
    link.addEventListener("mouseenter", () => {
      if (byFinger() || oblique) return;
      if (isContact) tilt(); else typeAgain(true);
    });
    // leaving: About Me / Home shift back to regular (the page you are on stays oblique);
    // Contact me shifts back once its details start erasing themselves
    if (isContact) link.addEventListener("contact-closing", () => { straighten(); });
    else if (!isHere) link.addEventListener("mouseleave", () => { if (!byFinger()) straighten(); });
    if (isHere) { oblique = true; link.classList.add("is-oblique"); }
    // leaving this page (a click on a link to another page): its word types back in regular as it goes
    if (isHere) document.addEventListener("click", (event) => {
      const to = event.target.closest("a[href]");
      if (!to || !oblique) return;
      const toPage = new URL(to.href, location.href).pathname.split("/").pop() || "index.html";
      if (toPage !== page) straighten();
    });
  });
})();
