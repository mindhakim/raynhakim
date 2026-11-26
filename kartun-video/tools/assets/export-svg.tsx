// Exports Vutu & Vuti as standalone, editable SVG files.
// Usage: npx tsx tools/assets/export-svg.tsx <outDir>
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "node:fs";
import { Person } from "../../src/vutuvuti/Person";
import { VUTI, VUTU } from "../../src/vutuvuti/looks";
import { poseFor } from "../../src/vutuvuti/assets/CharacterAsset";

const out = process.argv[2];
const items: [string, string, number][] = [
  ["idle", "front", 0.3], ["idle", "back", 0.3], ["idle", "left", 0.3], ["idle", "right", 0.3],
  ["wave", "front", 0.6], ["celebrate", "front", 0.3], ["talk", "front", 0.4], ["kick", "right", 0.66],
];
for (const who of ["vutu", "vuti"] as const) {
  fs.mkdirSync(`${out}/${who}/svg`, { recursive: true });
  for (const [pose, view, t] of items) {
    const p = poseFor(pose as never, who, t);
    p.blink = 0;
    const svg = renderToStaticMarkup(
      <svg xmlns="http://www.w3.org/2000/svg" width={1000} height={1300} viewBox="0 0 1000 1300">
        <Person look={who === "vutu" ? VUTU : VUTI} pose={p} view={view as never} x={500} groundY={1240} scale={1.45} />
      </svg>,
    );
    fs.writeFileSync(`${out}/${who}/svg/${who}-${pose}-${view}.svg`, `<?xml version="1.0" encoding="UTF-8"?>\n${svg}`);
  }
}
console.log("svg done");
