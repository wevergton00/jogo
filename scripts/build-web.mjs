import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(".");
const webDir = resolve("www");

await rm(webDir, { recursive: true, force: true });
await mkdir(webDir, { recursive: true });

// Material-fonte pesado não deve ser empacotado no navegador ou nos apps.
const EXCLUDE = new Set([resolve(root, "assets", "raw")]);

for (const entry of ["index.html", "css", "js", "assets"]) {
  await cp(resolve(root, entry), resolve(webDir, entry), {
    recursive: true,
    filter: (src) => !EXCLUDE.has(src),
  });
}

console.log(`Web build copied to ${webDir}`);
