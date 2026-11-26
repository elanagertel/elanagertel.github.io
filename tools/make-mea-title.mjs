// ===== Makes mea-title.js: the title "MEA SHEARIM" (Figma: frame "Mahshuf", Frame 137) =====
// The letters M, E, A, S, H, R, I are the same as in "ISRAELI MOVIE ARCHIVE" (archive-title.js): this takes
// each letter's pieces and organic shape from there, and puts the letter where Figma has it in "MEA SHEARIM".
// Figma draws this title on a 61.86 grid; every piece on the site is one size (63.11), so the letters' places
// are scaled by 63.11 / 61.86 around the middle of the screen (x 720, y 512 of the 1440 × 1024 frame).
// Run from the portfolio folder:  node tools/make-mea-title.mjs
import fs from "fs";

const src = fs.readFileSync("archive-title.js", "utf8");
const { P, O } = new Function(src + "\nreturn { P: TITLE_PIECES, O: ORGANIC_LETTERS };")();
const names = [...src.slice(src.indexOf("ORGANIC_LETTERS")).matchAll(/^ {2}\/\/ (\w)/gm)].map((m) => m[1]);
const CELL = 63.1125;

// each organic letter's middle (from the numbers in its outline: close enough to tell letters apart)
const middle = (o) => {
  const n = o.d.match(/-?\d+(\.\d+)?/g).map(Number);
  const xs = n.filter((_, i) => i % 2 === 0), ys = n.filter((_, i) => i % 2 === 1);
  return [o.x + (Math.min(...xs) + Math.max(...xs)) / 2, o.y + (Math.min(...ys) + Math.max(...ys)) / 2];
};
const mids = O.map(middle);
// each piece belongs to the letter whose middle is nearest
const groups = O.map(() => []);
P.forEach((p) => {
  const cx = p[2] + CELL / 2, cy = p[3] + CELL / 2;
  let best = 0, bestD = Infinity;
  mids.forEach((m, i) => { const d = Math.hypot(m[0] - cx, m[1] - cy); if (d < bestD) { bestD = d; best = i; } });
  groups[best].push(p);
});
// the first of each letter in the archive title, measured from its top left corner
const letters = {};
names.forEach((n, i) => {
  if (letters[n]) return;
  const g = groups[i], ox = Math.min(...g.map((p) => p[2])), oy = Math.min(...g.map((p) => p[3]));
  letters[n] = { pieces: g.map((p) => [p[0], p[1], p[2] - ox, p[3] - oy]), organic: { x: O[i].x - ox, y: O[i].y - oy, d: O[i].d } };
});

// the letters' top left corners in Figma (inside Frame 137, which is 837 × 265.66)
const FIGMA = [["M", 227.4478, 0], ["E", 356.6374, 0], ["A", 485.8269, 0],
  ["S", 0, 141.9397], ["H", 129.1896, 141.9397], ["E", 258.3792, 141.9397], ["A", 387.5687, 141.9397],
  ["R", 516.7583, 141.9397], ["I", 645.9479, 141.9397], ["M", 713.2748, 141.9397]];
const K = 63.1125 / 61.8626, FW = 837, FH = 265.6649;
const pieces = [], organic = [];
FIGMA.forEach(([n, fx, fy]) => {
  const X = 720 + (fx - FW / 2) * K, Y = 512 + (fy - FH / 2) * K, L = letters[n];
  L.pieces.forEach((p) => pieces.push([p[0], p[1], X + p[2], Y + p[3]]));
  organic.push({ n, x: X + L.organic.x, y: Y + L.organic.y, d: L.organic.d });
});
const top = Math.min(...pieces.map((p) => p[3]));
const f2 = (v) => v.toFixed(2);

fs.writeFileSync("mea-title.js", `// ===== The title "MEA SHEARIM" (Figma: frame "Mahshuf", Frame 137) =====
// Used by lab.js, which draws the title and makes its letters ooze into organic shapes on hover.
// All positions are in Figma pixels (the frame is 1440 wide). Made by tools/make-mea-title.mjs: the letters
// are the same as in "ISRAELI MOVIE ARCHIVE" (its pieces and organic letters), placed where Figma has them.

// Each title shape: [shape file number (images/flow-piece-NN.svg), width, x, y]
const TITLE_PIECES = [
${pieces.map((p) => `  [${JSON.stringify(p[0])}, ${p[1]}, ${f2(p[2])}, ${f2(p[3])}],`).join("\n")}
];
const TITLE_TOP = ${f2(top)};   // the top edge of the title (the white copy is drawn from this edge)
// The title's grid is not the same size as the home page's (67.49 per cell):
// each shape is drawn that much bigger or smaller, so touching shapes meet exactly
const TITLE_SCALE = 63.1125 / 67.4928;

// Each letter's organic shape (for the hover): where it is, and its outline
const ORGANIC_LETTERS = [
${organic.map((o) => `  // ${o.n}\n  { x: ${f2(o.x)}, y: ${f2(o.y)}, d: ${JSON.stringify(o.d)} },`).join("\n")}
];
`);
const xs = pieces.map((p) => p[2]), ys = pieces.map((p) => p[3]);
console.log(Object.entries(letters).map(([k, v]) => k + ":" + v.pieces.length).join(" "),
  "| pieces", pieces.length, "| x", f2(Math.min(...xs)), "-", f2(Math.max(...xs) + CELL), "| y", f2(Math.min(...ys)), "-", f2(Math.max(...ys) + CELL));
