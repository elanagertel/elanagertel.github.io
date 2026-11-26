// ===== The project videos (YouTube) =====
// The links are kept in projects.json (not in the page): each project lists its videos, in order.
// A page marks where each video goes with <div class="lab-youtube" data-video="1"> (1 = the project's first
// video, 2 = the second…); this file puts the YouTube player there.
// - It is as wide as the content column (the place's own width) and as tall as the video's proportion
//   ("ratio" in projects.json, like "16:9").
// - It just plays, like a moving picture: by itself, silent and on a loop, with no YouTube controls, title
//   or play button on it (the mouse does not reach it). Until YouTube really plays it, a still of the video
//   lies over the player, so YouTube's paused or loading screen is never seen (the player itself stays
//   visible under it: browsers do not start a video that cannot be seen). Because it loops, it never ends,
//   so YouTube never shows other suggested videos after it.
// - "zoom" in projects.json: a little bigger than its box, so a thin black edge in the video itself is cut off.
// - youtube-nocookie.com: YouTube's privacy-friendly address (no tracking cookies until it is played).
(function () {
  const places = [...document.querySelectorAll(".lab-youtube")];
  if (!places.length) return;
  const project = location.pathname.split("/").pop().replace(/\.html$/, "");
  // the video's id from a YouTube link (youtu.be/ID or youtube.com/watch?v=ID)
  const idOf = (url) => (url.match(/(?:youtu\.be\/|[?&]v=|embed\/)([\w-]{11})/) || [])[1];

  // YouTube tells the page what its player is doing (messages from the player, with enablejsapi=1): the
  // player only shows once it is really playing; if it ever stops (the end of a round), it starts again
  // (test mode: the page's address ends with ?debug: no still over the videos, and a label on each one
  // saying what YouTube's player reports, to see why a video does not play)
  const DEBUG = /[?&]debug\b/.test(location.search);
  const frames = [];
  const SHOW_AFTER = 3500;   // ms after it starts playing (YouTube's buttons are gone by then)
  const FALLBACK = 9000;     // ms: if the player never answers, it shows anyway
  function playing(frame) {
    frames.push(frame);
    // ask the player to tell us about itself (YouTube's own way of listening, without its script). The player
    // only hears it once it is ready, so the page asks again and again until it answers.
    const ask = () => { try { frame.contentWindow.postMessage(JSON.stringify({ event: "listening", id: frames.indexOf(frame) }), "*"); } catch (e) {} };
    frame.addEventListener("load", () => {
      ask();
      frame.askTimer = setInterval(() => { if (frame.answered) clearInterval(frame.askTimer); else ask(); }, 250);
    });
    // (just in case the player never answers at all, it shows after a while anyway)
    setTimeout(() => { if (!frame.answered) frame.still.classList.add("is-gone"); }, FALLBACK);
  }
  const command = (frame, func) => { try { frame.contentWindow.postMessage(JSON.stringify({ event: "command", func, args: [] }), "*"); } catch (e) {} };
  function play(frame) { command(frame, "mute"); command(frame, "playVideo"); }
  // (and every second, until it really plays)
  setInterval(() => frames.forEach((frame) => { if (frame.answered && !frame.showTimer) play(frame); }), 1000);

  window.addEventListener("message", (event) => {
    if (!/youtube(-nocookie)?\.com$/.test(new URL(event.origin).hostname)) return;
    let data;
    try { data = JSON.parse(event.data); } catch (e) { return; }
    const frame = frames.find((f) => f.contentWindow === event.source);
    if (!frame || !data) return;
    frame.answered = true;
    if (DEBUG && frame.label) frame.label.textContent = "player says: " + event.data.slice(0, 140);
    const state = data.info && data.info.playerState !== undefined ? data.info.playerState : null;
    // 1 = playing: YouTube still shows its buttons for a moment after it starts, so it shows a little later
    if (state === 1 && !frame.showTimer) frame.showTimer = setTimeout(() => frame.still.classList.add("is-gone"), SHOW_AFTER);
    // not playing (-1 = not started, 0 = ended, 2 = paused, 5 = ready): tell it to be silent and play
    // (some browsers do not start it by themselves)
    if (state !== null && state !== 1 && state !== 3) play(frame);
  });

  fetch("projects.json").then((r) => r.json()).then((projects) => {
    const videos = (projects[project] && projects[project].videos) || [];
    places.forEach((place) => {
      const video = videos[Number(place.dataset.video) - 1];
      const id = video && idOf(video.url);
      if (!id) return;
      const [rw, rh] = (video.ratio || "16:9").split(":").map(Number);
      const cover = video.fit === "cover";   // ("cover": it fills a box of its own shape, cropped, like a picture)
      if (!cover) {
        // its height from its proportion: the place's track gets the new height (--h), so the page's own
        // rules (the pile, the phone's sizes) follow it
        const track = place.closest(".lab-track") || place;
        const w = parseFloat(getComputedStyle(track).getPropertyValue("--w")) || 850;
        track.style.setProperty("--h", (w * rh / rw).toFixed(2));
      }
      const frame = document.createElement("iframe");
      // (no controls and no keyboard: it is a moving picture; enablejsapi: so we hear when it really plays)
      const options = `autoplay=1&mute=1&loop=1&playlist=${id}&rel=0&playsinline=1&modestbranding=1` +
        `&controls=0&disablekb=1&iv_load_policy=3&fs=0&vq=hd1080&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`;
      // a still of the video shows until it plays (the page's own still, or YouTube's)
      // the still over the player (the page's own still, or YouTube's sharpest one, maxresdefault, with the
      // smaller one under it in case there is none); it goes away once the video plays
      const still = document.createElement("div");
      still.className = "lab-youtube-still";
      still.style.background = place.style.background ||
        `url(https://i.ytimg.com/vi/${id}/maxresdefault.jpg) center / cover, #000 url(https://i.ytimg.com/vi/${id}/hqdefault.jpg) center / cover`;
      if (video.zoom) still.style.scale = video.zoom;
      frame.src = `https://www.youtube-nocookie.com/embed/${id}?${options}`;
      frame.title = video.title || "Video";
      frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      frame.setAttribute("allowfullscreen", "");
      frame.className = "lab-youtube-frame";
      if (video.zoom) frame.style.scale = video.zoom;
      place.append(frame, still);
      if (DEBUG) {
        still.style.display = "none";
        frame.style.pointerEvents = "auto";
        frame.label = document.createElement("p");
        frame.label.textContent = "player has not answered yet";
        frame.label.style.cssText = "position:absolute;left:0;top:0;z-index:9;margin:0;padding:4px 6px;background:#ff0;color:#000;font:11px/1.3 monospace;max-width:100%";
        place.appendChild(frame.label);
      }
      frame.still = still;
      playing(frame);
      if (cover) {
        // as big as needed to fill the whole box, in its own proportion, centred (the edges are cut off)
        frame.classList.add("is-cover");
        const fit = () => {
          const w = place.clientWidth, h = place.clientHeight;
          let fw = w, fh = (w * rh) / rw;
          if (fh < h) { fh = h; fw = (h * rw) / rh; }
          Object.assign(frame.style, { width: fw + "px", height: fh + "px", left: (w - fw) / 2 + "px", top: (h - fh) / 2 + "px" });
        };
        fit();
        window.addEventListener("resize", fit);
      }
    });
    // (the pages measure their pictures: let them measure again with the videos' new heights)
    window.dispatchEvent(new Event("resize"));
  }).catch(() => {});
})();
