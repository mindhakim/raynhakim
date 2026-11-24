// Motion library for the Vutu & Vuti rig. Every function returns a Pose for time t (seconds).

import { Arm, Leg, Pose } from "./types";

const A = (sh = 0, el = 10, ab = 10, elAb = 0): Arm => ({ sh, el, ab, elAb });
const L = (hip = 0, knee = 0, ab = 3, foot = 0): Leg => ({ hip, knee, ab, foot });
const TAU = Math.PI * 2;

export const neutral = (): Pose => ({
  x: 0,
  y: 0,
  lean: 0,
  tilt: 0,
  head: 0,
  armA: A(),
  armB: A(),
  legA: L(),
  legB: L(),
  mouth: 0,
  blink: 0,
  brow: 0,
  look: 0,
  squash: 1,
  hairV: 0,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

// Piecewise eased keyframes
export const kfs = (u: number, xs: number[], ys: number[]) => {
  if (u <= xs[0]) return ys[0];
  for (let i = 0; i < xs.length - 1; i++) {
    if (u <= xs[i + 1]) {
      const k = ease((u - xs[i]) / (xs[i + 1] - xs[i]));
      return ys[i] + (ys[i + 1] - ys[i]) * k;
    }
  }
  return ys[ys.length - 1];
};

const mixNum = (a: number, b: number, w: number) => a + (b - a) * w;
const mixArm = (a: Arm, b: Arm, w: number): Arm => ({
  sh: mixNum(a.sh, b.sh, w),
  el: mixNum(a.el, b.el, w),
  ab: mixNum(a.ab, b.ab, w),
  elAb: mixNum(a.elAb, b.elAb, w),
});
const mixLeg = (a: Leg, b: Leg, w: number): Leg => ({
  hip: mixNum(a.hip, b.hip, w),
  knee: mixNum(a.knee, b.knee, w),
  ab: mixNum(a.ab, b.ab, w),
  foot: mixNum(a.foot, b.foot, w),
});

// Blend two poses (w = 0 → a, w = 1 → b)
export const mix = (a: Pose, b: Pose, w: number): Pose => {
  const k = ease(Math.min(1, Math.max(0, w)));
  return {
    x: mixNum(a.x, b.x, k),
    y: mixNum(a.y, b.y, k),
    lean: mixNum(a.lean, b.lean, k),
    tilt: mixNum(a.tilt, b.tilt, k),
    head: mixNum(a.head, b.head, k),
    armA: mixArm(a.armA, b.armA, k),
    armB: mixArm(a.armB, b.armB, k),
    legA: mixLeg(a.legA, b.legA, k),
    legB: mixLeg(a.legB, b.legB, k),
    mouth: mixNum(a.mouth, b.mouth, k),
    blink: Math.max(a.blink, b.blink),
    brow: mixNum(a.brow, b.brow, k),
    look: mixNum(a.look, b.look, k),
    squash: mixNum(a.squash, b.squash, k),
    hairV: mixNum(a.hairV, b.hairV, k),
  };
};

// Natural blinking: quick close every few seconds
export const blinkAt = (t: number, seed = 0) => {
  const period = 2.8 + (seed % 3) * 0.6;
  const c = (t + seed * 0.37) % period;
  return c < 0.14 ? Math.sin((c / 0.14) * Math.PI) : 0;
};

// Speech-like mouth movement
export const speech = (t: number) =>
  Math.max(0, Math.abs(Math.sin(t * 11)) * (0.55 + 0.45 * Math.sin(t * 3.1)) - 0.08);

type Mood = "playful" | "chill";

// ---------------------------------------------------------------------------
// Motions
// ---------------------------------------------------------------------------

export const idle = (t: number, mood: Mood, seed = 0): Pose => {
  const p = neutral();
  p.blink = blinkAt(t, seed);
  if (mood === "playful") {
    const b = Math.abs(Math.sin(t * 4.2));
    p.y = -b * 7;
    p.hairV = -Math.abs(Math.sin(t * 4.2 - 0.6)) * 8;
    p.head = Math.sin(t * 2.1) * 6;
    p.tilt = Math.sin(t * 2.1) * 2;
    p.armA = A(0, 15, 14 + b * 6, 10);
    p.armB = A(0, 15, 14 + b * 6, 10);
    p.legA = L(0, b * 8, 4);
    p.legB = L(0, b * 8, 4);
    p.brow = 0.3;
    p.look = Math.sin(t * 0.9) * 0.5;
  } else {
    const br = Math.sin(t * 1.5);
    p.y = br * 2;
    p.hairV = br * 2;
    p.head = 7 + Math.sin(t * 0.8) * 2;
    p.tilt = -2;
    p.armA = A(0, 8, 7 + br, 0);
    p.armB = A(0, 8, 7 + br, 0);
    p.legA = L(0, 4, 6);
    p.legB = L(0, 0, 2);
    p.look = 0.55;
  }
  return p;
};

export const talk = (t: number, mood: Mood, seed = 0): Pose => {
  const p = idle(t, mood, seed);
  p.mouth = speech(t);
  if (mood === "playful") {
    p.head = Math.sin(t * 3.2) * 8;
    p.brow = 0.4 + Math.sin(t * 2.4) * 0.6;
    p.look = Math.sin(t * 1.3) * 0.3;
    p.armB = A(30, 70, 35 + Math.sin(t * 2.6) * 15, 70 + Math.sin(t * 5.2) * 25);
    p.armA = A(10, 40, 25 + Math.sin(t * 1.9 + 1) * 12, 35 + Math.sin(t * 4.1) * 20);
  } else {
    p.mouth *= 0.7;
    p.head = 6 + Math.sin(t * 1.2) * 3;
    p.armB = A(10, 30, 18, 35 + Math.sin(t * 1.4) * 10);
    p.look = 0.4;
  }
  return p;
};

export const walk = (t: number, mood: Mood, seed = 0): Pose => {
  const p = neutral();
  const f = mood === "playful" ? 0.95 : 0.78;
  const amp = mood === "playful" ? 28 : 22;
  const ph = t * TAU * f;
  const s = Math.sin(ph);
  const c = Math.cos(ph);
  p.legA = L(amp * s, 6 + 44 * Math.pow(Math.max(0, c), 1.5), 3, Math.max(0, -c) * 10);
  p.legB = L(-amp * s, 6 + 44 * Math.pow(Math.max(0, -c), 1.5), 3, Math.max(0, c) * 10);
  const bob = Math.abs(c);
  p.y = -bob * (mood === "playful" ? 10 : 5) + 4;
  p.hairV = -Math.abs(Math.cos(ph - 0.7)) * (mood === "playful" ? 10 : 4);
  p.armA = A(-amp * 0.95 * s, 22 + 10 * Math.max(0, -s), 8);
  p.armB = A(amp * 0.95 * s, 22 + 10 * Math.max(0, s), 8);
  p.lean = mood === "playful" ? 5 : -1;
  p.head = mood === "playful" ? Math.sin(ph * 2) * 3 : 3;
  p.blink = blinkAt(t, seed);
  p.mouth = mood === "playful" ? 0.15 : 0;
  return p;
};

export const run = (t: number, seed = 0): Pose => {
  const p = neutral();
  const ph = t * TAU * 1.6;
  const s = Math.sin(ph);
  const c = Math.cos(ph);
  p.legA = L(48 * s, 18 + 88 * Math.pow(Math.max(0, c), 1.2), 3, 10);
  p.legB = L(-48 * s, 18 + 88 * Math.pow(Math.max(0, -c), 1.2), 3, 10);
  p.armA = A(-55 * s, 88, 8);
  p.armB = A(55 * s, 88, 8);
  p.lean = 14;
  p.y = -Math.abs(c) * 22 + 6;
  p.hairV = -Math.abs(Math.cos(ph - 0.8)) * 14;
  p.head = -6;
  p.mouth = 0.6;
  p.blink = blinkAt(t, seed);
  return p;
};

// u = 0..1 over one jump. height in px.
export const jump = (u: number, height: number, mood: Mood): Pose => {
  const p = idle(u * 1.2, mood);
  const crouch = kfs(u, [0, 0.2, 0.3, 0.72, 0.82, 1], [0, 1, 0, 0, 1, 0]);
  const air = u > 0.25 && u < 0.8 ? Math.sin(((u - 0.25) / 0.55) * Math.PI) : 0;
  p.y = crouch * 34 - air * height;
  p.squash = 1 - crouch * 0.12 + (u > 0.24 && u < 0.4 ? 0.08 : 0);
  p.legA = L(crouch * 45 + air * 30, crouch * 85 + air * 55, 8);
  p.legB = L(crouch * 45 + air * 30, crouch * 85 + air * 55, 8);
  const up = kfs(u, [0, 0.2, 0.32, 0.7, 0.85, 1], [10, 25, mood === "playful" ? 165 : 60, mood === "playful" ? 150 : 50, 30, 10]);
  p.armA = A(0, 10, up, 10);
  p.armB = A(0, 10, up, 10);
  p.hairV = air > 0 ? -air * 10 + (u > 0.5 ? 16 * air : 0) : crouch * 10;
  p.mouth = mood === "playful" ? air * 0.9 : 0;
  p.brow = mood === "playful" ? air : 0;
  return p;
};

// u = 0..1 over one kick (side view). Contact happens at u ≈ 0.47.
export const kick = (u: number): Pose => {
  const p = neutral();
  p.legA = L(
    kfs(u, [0, 0.35, 0.47, 0.6, 1], [0, -45, 75, 95, 0]),
    kfs(u, [0, 0.35, 0.47, 0.6, 1], [0, 85, 10, 0, 0]),
    3,
    kfs(u, [0, 0.35, 0.47, 1], [0, -20, 20, 0]),
  );
  p.legB = L(kfs(u, [0, 0.35, 0.6, 1], [0, 10, -12, 0]), kfs(u, [0, 0.35, 0.6, 1], [0, 25, 10, 0]));
  p.armA = A(kfs(u, [0, 0.35, 0.47, 1], [0, 45, -50, 0]), 30, 10);
  p.armB = A(kfs(u, [0, 0.35, 0.47, 1], [0, -40, 70, 0]), kfs(u, [0, 0.47, 1], [20, 10, 10]), 10);
  p.lean = kfs(u, [0, 0.35, 0.47, 0.6, 1], [0, -6, -14, -10, 0]);
  p.y = kfs(u, [0, 0.35, 0.47, 0.6, 0.75, 1], [0, 10, 0, -14, 0, 0]);
  p.mouth = kfs(u, [0, 0.4, 0.5, 0.8, 1], [0.1, 0.1, 1, 0.8, 0.3]);
  p.brow = kfs(u, [0, 0.35, 0.5, 1], [0, -0.6, 1, 0.3]);
  p.hairV = kfs(u, [0, 0.47, 0.55, 0.7, 1], [0, 6, -12, 4, 0]);
  return p;
};

export const wave = (t: number, mood: Mood, seed = 0): Pose => {
  const p = idle(t, mood, seed);
  const sp = mood === "playful" ? 11 : 5;
  const amp = mood === "playful" ? 28 : 12;
  p.armB = A(10, 20, mood === "playful" ? 120 : 75, 45 + Math.sin(t * sp) * amp);
  p.tilt = mood === "playful" ? 4 : 1;
  p.head = mood === "playful" ? 10 + Math.sin(t * 3) * 4 : 8;
  p.mouth = mood === "playful" ? 0.5 + 0.3 * Math.sin(t * 6) : 0;
  p.look = 0;
  return p;
};

export const celebrate = (t: number, seed = 0): Pose => {
  const p = neutral();
  const b = Math.abs(Math.sin(t * 6));
  p.y = -b * 24;
  p.hairV = -Math.abs(Math.sin(t * 6 - 0.7)) * 14;
  p.squash = 1 + (b - 0.5) * 0.05;
  p.armA = A(0, 10, 150 + Math.sin(t * 12) * 10, 15);
  p.armB = A(0, 10, 150 + Math.sin(t * 12 + 1) * 10, 15);
  p.legA = L(0, (1 - b) * 25, 8);
  p.legB = L(0, (1 - b) * 25, 8);
  p.mouth = 0.9;
  p.brow = 1;
  p.blink = blinkAt(t, seed);
  return p;
};

// Vuti's unbothered shrug (front view)
export const shrug = (u: number): Pose => {
  const p = idle(u * 2, "chill");
  const k = kfs(u, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  p.armA = A(20, 40, 25 + 20 * k, -70 * k);
  p.armB = A(20, 40, 25 + 20 * k, -70 * k);
  p.y = -k * 6;
  p.head = 7 + k * 8;
  p.brow = k * 0.6;
  p.look = 0.55 - k * 0.3;
  return p;
};

// Tiptoe sneaking (side view)
export const sneak = (t: number): Pose => {
  const p = neutral();
  const ph = t * TAU * 0.7;
  const s = Math.sin(ph);
  const c = Math.cos(ph);
  p.legA = L(22 * s, 20 + 55 * Math.max(0, c), 3, -15);
  p.legB = L(-22 * s, 20 + 55 * Math.max(0, -c), 3, -15);
  p.armA = A(55 + s * 8, 75, 10);
  p.armB = A(40 - s * 8, 80, 10);
  p.lean = 14;
  p.y = 8 - Math.abs(c) * 8;
  p.head = -4;
  p.mouth = 0.2;
  p.brow = 0.9;
  p.hairV = -Math.abs(Math.cos(ph - 0.6)) * 6;
  return p;
};

// Poke (side view): u = 0..1
export const poke = (u: number): Pose => {
  const p = sneak(0);
  p.armA = A(kfs(u, [0, 0.4, 0.7, 1], [55, 85, 85, 40]), kfs(u, [0, 0.4, 0.7, 1], [75, 0, 0, 60]), 10);
  p.lean = kfs(u, [0, 0.4, 1], [14, 18, 6]);
  p.mouth = kfs(u, [0, 0.5, 1], [0.2, 0.6, 1]);
  return p;
};

// Big laugh (front view)
export const laugh = (t: number): Pose => {
  const p = neutral();
  const b = Math.abs(Math.sin(t * 9));
  p.y = -b * 8;
  p.tilt = Math.sin(t * 4.5) * 6;
  p.head = -10 + Math.sin(t * 9) * 5;
  p.armA = A(30, 90, 35, 95);
  p.armB = A(10, 60, 30 + b * 20, 80);
  p.mouth = 0.8 + b * 0.2;
  p.blink = 0.85;
  p.brow = 1;
  p.hairV = -Math.abs(Math.sin(t * 9 - 0.6)) * 10;
  return p;
};
