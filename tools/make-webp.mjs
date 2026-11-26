// ===== Make the pictures lighter: WebP, at most 2400px on the long side, quality 80 =====
// Uses the Chrome that is already on the computer (nothing to install): it opens each picture, draws it
// smaller on a canvas (in steps of half, so it stays sharp) and saves it as WebP.
// Run from the portfolio folder:  node tools/make-webp.mjs <folder with the pictures> <folder for the WebP files>
// (a little web server must be serving the portfolio folder on port 8123: python3 -m http.server 8123)
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const [from, to] = process.argv.slice(2);
const LONG_SIDE = 2400, QUALITY = 0.8, PORT = "9467";
fs.mkdirSync(to, { recursive: true });
const files = fs.readdirSync(from).filter((f) => /\.(png|jpe?g)$/i.test(f));

const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ["--headless=new", "--remote-debugging-port=" + PORT, "--user-data-dir=" + path.resolve(to, "..", "chrome-" + PORT), "about:blank"]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let list; for (let k = 0; k < 20; k++) { await sleep(500); try { list = await (await fetch("http://127.0.0.1:" + PORT + "/json")).json(); break; } catch (e) {} }
const ws = new WebSocket(list.find((t) => t.type === "page").webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
let id = 0; const wait = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (wait.has(d.id)) { wait.get(d.id)(d.result); wait.delete(d.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send("Page.navigate", { url: "http://127.0.0.1:8123/favicon.svg" }); await sleep(800);

const results = [];
for (const file of files) {
  const url = "http://127.0.0.1:8123/" + path.relative(process.cwd(), path.join(from, file)).split(path.sep).join("/");
  const r = await send("Runtime.evaluate", { awaitPromise: true, returnByValue: true, expression: `(async () => {
    const img = new Image(); img.src = ${JSON.stringify(url)}; await img.decode();
    let w = img.naturalWidth, h = img.naturalHeight;
    const k = Math.min(1, ${LONG_SIDE} / Math.max(w, h));
    const W = Math.round(w * k), H = Math.round(h * k);
    // halve in steps, then the last step to the exact size (sharper than one big jump)
    let src = img, sw = w, sh = h;
    while (sw / 2 >= W && sh / 2 >= H) {
      const c = document.createElementNS("http://www.w3.org/1999/xhtml", "canvas"); c.width = Math.round(sw / 2); c.height = Math.round(sh / 2);
      const g = c.getContext("2d"); g.imageSmoothingQuality = "high"; g.drawImage(src, 0, 0, c.width, c.height);
      src = c; sw = c.width; sh = c.height;
    }
    const out = document.createElementNS("http://www.w3.org/1999/xhtml", "canvas"); out.width = W; out.height = H;
    const g = out.getContext("2d"); g.imageSmoothingQuality = "high"; g.drawImage(src, 0, 0, W, H);
    return { w, h, W, H, data: out.toDataURL("image/webp", ${QUALITY}) };
  })()` });
  const v = r.result.value;
  if (r.exceptionDetails || !v || !v.data || !v.data.startsWith("data:image/webp")) { results.push({ file, error: JSON.stringify(r.exceptionDetails || r).slice(0, 300) }); continue; }
  const name = file.replace(/\.(png|jpe?g)$/i, ".webp");
  fs.writeFileSync(path.join(to, name), Buffer.from(v.data.split(",")[1], "base64"));
  results.push({ file, name, before: fs.statSync(path.join(from, file)).size, after: fs.statSync(path.join(to, name)).size, from: v.w + "x" + v.h, to: v.W + "x" + v.H });
}
fs.writeFileSync(path.join(to, "report.json"), JSON.stringify(results, null, 1));
console.log(results.map((r) => r.error ? r.file + " ERROR " + r.error : `${r.file} ${r.from} -> ${r.to} ${Math.round(r.before / 1024)}K -> ${Math.round(r.after / 1024)}K`).join("\n"));
chrome.kill(); process.exit(0);
