// Renders the Vutu & Vuti asset pack: transparent PNG stills + transparent animated loops.
// Usage: node tools/assets/render-assets.mjs <outDir> <chromiumPath>
import { bundle } from "@remotion/bundler";
import { renderStill, renderMedia, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";

const [outDir, browserExecutable] = process.argv.slice(2);
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const who = ["vutu", "vuti"];
const stills = [
  ["idle", "front", 0.3], ["idle", "back", 0.3], ["idle", "left", 0.3], ["idle", "right", 0.3],
  ["talk", "front", 0.4], ["wave", "front", 0.6], ["celebrate", "front", 0.3], ["shrug", "front", 1.0],
  ["laugh", "front", 0.2], ["jump", "front", 0.65], ["walk", "right", 0.25], ["run", "right", 0.15], ["kick", "right", 0.66],
];
const loops = [["idle", "front", 2], ["talk", "front", 3], ["wave", "front", 2], ["walk", "right", 2.1], ["celebrate", "front", 2]];

for (const w of who) {
  fs.mkdirSync(`${outDir}/${w}/png`, { recursive: true });
  fs.mkdirSync(`${outDir}/${w}/animasi`, { recursive: true });
  for (const [pose, view, t] of stills) {
    const inputProps = { who: w, pose, view, t };
    const composition = await selectComposition({ serveUrl, id: "CharacterAsset", inputProps, browserExecutable });
    await renderStill({ composition, serveUrl, inputProps, output: `${outDir}/${w}/png/${w}-${pose}-${view}.png`, imageFormat: "png", browserExecutable });
    console.log("png", w, pose, view);
  }
  for (const [pose, view, sec] of loops) {
    const inputProps = { who: w, pose, view };
    const composition = await selectComposition({ serveUrl, id: "CharacterAsset", inputProps, browserExecutable });
    const c = { ...composition, durationInFrames: Math.round(sec * 30) };
    await renderMedia({ composition: c, serveUrl, inputProps, codec: "vp9", pixelFormat: "yuva420p", imageFormat: "png", output: `${outDir}/${w}/animasi/${w}-${pose}.webm`, browserExecutable });
    await renderMedia({ composition: c, serveUrl, inputProps, codec: "prores", proResProfile: "4444", pixelFormat: "yuva444p10le", imageFormat: "png", output: `${outDir}/${w}/animasi/${w}-${pose}.mov`, browserExecutable });
    console.log("loop", w, pose);
  }
}
