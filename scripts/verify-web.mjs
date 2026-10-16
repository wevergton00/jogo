import { access, readFile } from "node:fs/promises";

const requiredFiles = [
  "www/index.html",
  "www/css/style.css",
  "www/css/mobile.css",
  "www/js/main.js",
  "www/js/input.js",
  "www/js/game.js",
  "www/assets/sprites/manifest.json",
];

for (const file of requiredFiles) await access(file);

const html = await readFile("www/index.html", "utf8");
for (const reference of ["css/mobile.css?v=1", "js/main.js?v=45", "id=\"touch-controls\""]) {
  if (!html.includes(reference)) throw new Error(`Missing web reference: ${reference}`);
}

console.log(`Web bundle OK (${requiredFiles.length} required files checked)`);
