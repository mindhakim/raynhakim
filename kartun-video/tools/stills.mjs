// Render a handful of preview frames of one composition at a small scale.
// Usage: node tools/stills.mjs <Composition> <outDir> <frame> [frame...]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "path";

const B = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const [id, outDir, ...rest] = process.argv.slice(2);
const frames = rest.map(Number);
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const comp = await selectComposition({ serveUrl, id, browserExecutable: B });
for (const f of frames) {
  await renderStill({
    serveUrl,
    composition: comp,
    frame: f,
    output: `${outDir}/f${String(f).padStart(4, "0")}.png`,
    scale: 0.35,
    browserExecutable: B,
    chromiumOptions: { gl: "angle" },
  });
  console.log("done", f);
}
