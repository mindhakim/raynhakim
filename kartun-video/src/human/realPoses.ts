// Grounded, realistic motions for the human rig (game-style, not cartoony).

import { Pose } from "../vutuvuti/types";
import { blinkAt, kfs, neutral } from "../vutuvuti/poses";

const TAU = Math.PI * 2;
type Mood = "playful" | "chill";

export const idleR = (t: number, mood: Mood, seed = 0): Pose => {
  const p = neutral();
  const sway = Math.sin(t * 0.9 + seed);
  const breath = Math.sin(t * 1.7 + seed);
  p.blink = blinkAt(t, seed);
  p.tilt = sway * 1.5;
  p.y = breath * 0.6;
  p.armA = { sh: 2 + breath, el: 12, ab: 8, elAb: 0 };
  p.armB = { sh: 2 - breath, el: 12, ab: 8, elAb: 0 };
  // Weight on one leg, the other relaxed
  p.legA = { hip: 2, knee: 4 + Math.max(0, sway) * 6, ab: 3, foot: 0 };
  p.legB = { hip: -1, knee: 2 + Math.max(0, -sway) * 6, ab: 4, foot: 0 };
  if (mood === "playful") {
    p.head = Math.sin(t * 1.3 + seed) * 4;
    p.mouth = 0.15;
  } else {
    p.head = 6 + Math.sin(t * 0.7) * 2;
    p.lean = -2;
    p.armA = { sh: 0, el: 8, ab: 6, elAb: 0 };
    p.armB = { sh: 0, el: 8, ab: 6, elAb: 0 };
  }
  return p;
};

// Walk cycle. Returns the pose and the forward speed (m/s) that matches the stride.
export const walkR = (t: number, mood: Mood, seed = 0): Pose => {
  const p = neutral();
  const f = mood === "playful" ? 0.95 : 0.8;
  const amp = mood === "playful" ? 26 : 21;
  const ph = t * TAU * f;
  const s = Math.sin(ph);
  const c = Math.cos(ph);
  p.legA = { hip: amp * s, knee: 6 + 52 * Math.pow(Math.max(0, c), 1.6), ab: 3, foot: -Math.max(0, -c) * 12 };
  p.legB = { hip: -amp * s, knee: 6 + 52 * Math.pow(Math.max(0, -c), 1.6), ab: 3, foot: -Math.max(0, c) * 12 };
  p.armA = { sh: -amp * 0.7 * s, el: 14 + 12 * Math.max(0, -s), ab: 7, elAb: 0 };
  p.armB = { sh: amp * 0.7 * s, el: 14 + 12 * Math.max(0, s), ab: 7, elAb: 0 };
  p.y = -Math.abs(c) * 6 + 4;
  p.tilt = s * 1.5;
  p.lean = mood === "playful" ? 4 : 1;
  p.head = mood === "playful" ? 0 : 4;
  p.blink = blinkAt(t, seed);
  p.mouth = mood === "playful" ? 0.15 : 0;
  return p;
};
export const walkSpeed = (mood: Mood) => (mood === "playful" ? 1.42 : 1.0);

export const runR = (t: number, seed = 0): Pose => {
  const p = neutral();
  const ph = t * TAU * 1.45;
  const s = Math.sin(ph);
  const c = Math.cos(ph);
  p.legA = { hip: 44 * s, knee: 22 + 92 * Math.pow(Math.max(0, c), 1.3), ab: 3, foot: -10 };
  p.legB = { hip: -44 * s, knee: 22 + 92 * Math.pow(Math.max(0, -c), 1.3), ab: 3, foot: -10 };
  p.armA = { sh: -48 * s, el: 85, ab: 9, elAb: -8 };
  p.armB = { sh: 48 * s, el: 85, ab: 9, elAb: -8 };
  p.lean = 12;
  p.y = -Math.abs(c) * 14 + 6;
  p.tilt = s * 2;
  p.mouth = 0.4;
  p.blink = blinkAt(t, seed);
  return p;
};
export const RUN_SPEED = 3.7;

// u = 0..1 over one jump
export const jumpR = (u: number): Pose => {
  const p = neutral();
  const crouch = kfs(u, [0, 0.22, 0.32, 0.72, 0.84, 1], [0, 1, 0, 0, 1, 0]);
  const air = u > 0.28 && u < 0.78 ? Math.sin(((u - 0.28) / 0.5) * Math.PI) : 0;
  p.y = crouch * 40 - air * 140;
  p.legA = { hip: crouch * 50 + air * 35, knee: crouch * 95 + air * 60, ab: 5, foot: -air * 20 };
  p.legB = { hip: crouch * 50 + air * 35, knee: crouch * 95 + air * 60, ab: 5, foot: -air * 20 };
  p.lean = crouch * 18 + air * 4;
  const arm = kfs(u, [0, 0.22, 0.34, 0.7, 0.86, 1], [0, -35, 150, 140, -10, 0]);
  p.armA = { sh: arm, el: 15, ab: 14, elAb: 0 };
  p.armB = { sh: arm, el: 15, ab: 14, elAb: 0 };
  p.mouth = air * 0.9;
  return p;
};

export const waveR = (t: number, mood: Mood, seed = 0): Pose => {
  const p = idleR(t, mood, seed);
  if (mood === "playful") {
    p.armB = { sh: 15, el: 15, ab: 115, elAb: 40 + Math.sin(t * 10) * 25 };
    p.mouth = 0.7;
    p.head = 6;
  } else {
    p.armB = { sh: 20, el: 70, ab: 35, elAb: 30 + Math.sin(t * 4) * 8 };
    p.head = 8;
  }
  return p;
};
