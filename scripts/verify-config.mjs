import { readFile } from "node:fs/promises";

const config = JSON.parse(await readFile("capacitor.config.json", "utf8"));
for (const key of ["appId", "appName", "webDir"]) {
  if (!config[key]) throw new Error(`Missing Capacitor config value: ${key}`);
}

console.log(`Capacitor config OK (${config.appId})`);
