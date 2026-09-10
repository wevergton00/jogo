import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(".");
const webDir = resolve("www");

await rm(webDir, { recursive: true, force: true });
await mkdir(webDir, { recursive: true });

for (const entry of ["index.html", "css", "js", "assets"]) {
  await cp(resolve(root, entry), resolve(webDir, entry), { recursive: true });
}

console.log(`Web build copied to ${webDir}`);
