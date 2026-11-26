import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Person } from "../Person";
import { VUTI, VUTU } from "../looks";
import { celebrate, idle, jump, kick, laugh, run, shrug, talk, walk, wave } from "../poses";
import { Pose, View } from "../types";

// Transparent character assets for use in other apps (CapCut, Canva, Premiere...).
// Stills: render a single frame. Loops: render the whole composition with an alpha codec.

export type AssetProps = {
  who: "vutu" | "vuti";
  pose: "idle" | "talk" | "wave" | "walk" | "run" | "jump" | "kick" | "celebrate" | "shrug" | "laugh";
  view: View;
  t?: number; // fixed moment for stills (seconds); omit to animate
};

export const poseFor = (p: AssetProps["pose"], who: AssetProps["who"], t: number): Pose => {
  const mood = who === "vutu" ? "playful" : "chill";
  const seed = who === "vutu" ? 1 : 2;
  switch (p) {
    case "talk":
      return talk(t, mood, seed);
    case "wave":
      return wave(t, mood, seed);
    case "walk":
      return walk(t, mood, seed);
    case "run":
      return run(t, seed);
    case "jump":
      return jump((t % 1.3) / 1.3, who === "vutu" ? 200 : 70, mood);
    case "kick":
      return kick((t % 1.4) / 1.4);
    case "celebrate":
      return celebrate(t, seed);
    case "shrug":
      return shrug(Math.min(1, (t % 2) / 1.4));
    case "laugh":
      return laugh(t);
    default:
      return idle(t, mood, seed);
  }
};

export const CharacterAsset: React.FC<AssetProps> = ({ who, pose, view, t }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const time = t ?? frame / fps;
  const p = poseFor(pose, who, time);
  if (t !== undefined) p.blink = 0; // eyes open on stills
  return (
    <AbsoluteFill style={{ backgroundColor: "transparent" }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
        <Person look={who === "vutu" ? VUTU : VUTI} pose={p} view={view} x={width / 2} groundY={height - 60} scale={1.45} />
      </svg>
    </AbsoluteFill>
  );
};
