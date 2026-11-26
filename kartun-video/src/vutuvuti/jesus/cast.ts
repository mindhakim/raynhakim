import { VUTI, VUTU } from "../looks";
import { celebrate, idle, jump, kfs, mix, neutral } from "../poses";
import { Arm, Look, Pose } from "../types";

// Kits, supporting cast and the extra key poses for the Jesus / Suárez episode.

export const GARNET = "#A50044";
export const BLUE = "#004D98";

// The crest: public/fcb.png when it exists, otherwise a plain striped shield
export const barcaKit = (crest: string): Partial<Look> => ({
  jersey: GARNET,
  jerseyShade: "#7A0033",
  vstripes: [GARNET, BLUE],
  shorts: BLUE,
  socks: GARNET,
  textColor: "#FFFFFF",
  number: "9",
  crest,
});

export const makeCast = (crest: string) => {
  const kit = barcaKit(crest);
  const VUTU_B: Look = { ...VUTU, ...kit };
  const VUTI_B: Look = { ...VUTI, ...kit };
  const extra = (o: Partial<Look>): Look => ({ ...VUTU, ...kit, sponsor: "", personality: "chill", ...o });
  return {
    VUTU_B,
    VUTI_B,
    KUNDE: extra({ name: "", skin: "#5A3A26", skinShade: "#422A1B", hair: "#1E1715", hairShade: "#0E0B0A", number: "23", jaw: "square" }),
    RAFINYA: extra({ name: "", skin: "#B57E57", skinShade: "#93603D", hair: "#2B211C", hairShade: "#17110E", hairStyle: "mohawk", number: "11", jaw: "round" }),
    FAN1: extra({ name: "", skin: "#A26B43", hair: "#2B211C", hairShade: "#17110E", number: "", personality: "playful" }),
    FAN2: extra({ name: "", skin: "#C78D60", hair: "#4E342E", hairShade: "#2E1E1A", hairStyle: "mohawk", number: "", jaw: "round", personality: "playful" }),
    KEEPER: extra({
      name: "",
      jersey: "#F4F4F4",
      jerseyShade: "#D6D6D6",
      vstripes: undefined,
      crest: undefined,
      shorts: "#F4F4F4",
      socks: "#F4F4F4",
      textColor: "#9E9E9E",
      number: "1",
      skin: "#D7A27A",
      hair: "#3E2A22",
      hairShade: "#24170F",
      jaw: "round",
    }),
    GIGGS: extra({
      name: "",
      jersey: "#C62828",
      jerseyShade: "#8E1B1B",
      vstripes: undefined,
      crest: undefined,
      shorts: "#F5F5F5",
      socks: "#212121",
      number: "11",
      skin: "#E0B08C",
      skinShade: "#BD8D69",
      hair: "#BDBDBD",
      hairShade: "#8E8E8E",
      beard: "#CFCFCF",
      jaw: "square",
    }),
    PAPIN: extra({
      name: "",
      jersey: "#4FC3F7",
      jerseyShade: "#0288D1",
      vstripes: undefined,
      crest: undefined,
      shorts: "#FFFFFF",
      socks: "#4FC3F7",
      number: "9",
      skin: "#E5B794",
      hair: "#6D4C41",
      hairShade: "#4E342E",
      hairStyle: "mohawk",
      jaw: "round",
    }),
    CIVILIANS: [
      extra({ name: "", jersey: "#FFB74D", jerseyShade: "#F57C00", vstripes: undefined, crest: undefined, number: "", shorts: "#5D4037", socks: "#5D4037" }),
      extra({ name: "", jersey: "#81C784", jerseyShade: "#388E3C", vstripes: undefined, crest: undefined, number: "", shorts: "#37474F", socks: "#37474F", hairStyle: "mohawk", skin: "#C78D60" }),
      extra({ name: "", jersey: "#9575CD", jerseyShade: "#5E35B1", vstripes: undefined, crest: undefined, number: "", shorts: "#212121", socks: "#212121", skin: "#8D5A36" }),
      extra({ name: "", number: "", skin: "#B57E57" }),
      extra({ name: "", jersey: "#F06292", jerseyShade: "#C2185B", vstripes: undefined, crest: undefined, number: "", shorts: "#424242", socks: "#424242", jaw: "round" }),
      extra({ name: "", number: "", hairStyle: "mohawk", skin: "#D7A27A" }),
    ],
  };
};

const A = (sh: number, el: number, ab: number, elAb: number): Arm => ({ sh, el, ab, elAb });

// ---------------------------------------------------------------------------
// Extra key poses (front view unless noted)
// ---------------------------------------------------------------------------

type Mood = "playful" | "chill";

export const hips = (t: number, mood: Mood, seed = 0): Pose => {
  const p = idle(t, mood, seed);
  p.armA = A(0, 0, 32, -95);
  p.armB = A(0, 0, 32, -95);
  p.y -= 4;
  p.squash = 1.03;
  p.brow = 0.5;
  p.mouth = mood === "chill" ? 0.15 : 0.4;
  p.look = 0;
  return p;
};

export const armsUp = (t: number, mood: Mood, seed = 0): Pose => {
  const p = idle(t, mood, seed);
  p.armA = A(0, 10, 158, 12 + Math.sin(t * 9) * 6);
  p.armB = A(0, 10, 158, 12 + Math.sin(t * 9 + 1) * 6);
  p.y -= 8;
  p.squash = 1.05;
  p.mouth = 0.75;
  p.brow = 1;
  p.look = 0;
  return p;
};

// Sitting on a bench (front view): thighs point at the camera, so the hips drop
export const sit = (t: number, mood: Mood, seed = 0): Pose => {
  const p = idle(t, mood, seed);
  p.legA = { hip: 88, knee: 88, ab: 9, foot: 0 };
  p.legB = { hip: 88, knee: 88, ab: 9, foot: 0 };
  p.y = 96 + Math.sin(t * 1.5) * 1.5;
  return p;
};

export const sitBored = (t: number, seed = 0): Pose => {
  const p = sit(t, "chill", seed);
  p.armB = A(0, 0, 120, 150);
  p.armA = A(0, 0, 22, 70);
  p.tilt = 6;
  p.head = 14;
  p.mouth = 0;
  p.brow = -0.4;
  p.blink = Math.max(p.blink, 0.45);
  p.look = 0.2;
  return p;
};

export const sitFolded = (t: number, seed = 0): Pose => {
  const p = sit(t, "chill", seed);
  p.armA = A(0, 0, 20, 250);
  p.armB = A(0, 0, 20, 250);
  p.head = -6;
  p.brow = -0.7;
  p.mouth = 0;
  p.look = -0.6;
  return p;
};

export const sitSad = (t: number, seed = 0): Pose => {
  const p = sit(t, "chill", seed);
  p.armA = A(0, 0, 25, 40);
  p.armB = A(0, 0, 25, 40);
  p.head = 0;
  p.tilt = 0;
  p.y += 6;
  p.brow = -0.9;
  p.mouth = 0;
  p.blink = Math.max(p.blink, 0.55);
  p.look = 0;
  return p;
};

// Side-on shock (side view)
export const shock = (t: number): Pose => {
  const p = neutral();
  const j = Math.sin(t * 40) * 1.5;
  p.lean = -12;
  p.armA = A(-35 + j, 50, 10, 0);
  p.armB = A(70, 40 + j, 10, 0);
  p.legA = { hip: -8, knee: 6, ab: 3, foot: 0 };
  p.legB = { hip: 14, knee: 10, ab: 3, foot: 0 };
  p.y = -6;
  p.mouth = 1;
  p.brow = 1;
  p.hairV = -8;
  p.head = -8;
  return p;
};

// Front shock: jaw drop
export const jawDrop = (t: number): Pose => {
  const p = idle(t, "chill", 2);
  p.mouth = 1;
  p.brow = 1;
  p.armA = A(0, 20, 30, 40);
  p.armB = A(0, 20, 30, 40);
  p.squash = 1.04;
  p.blink = 0;
  p.look = -0.8;
  return p;
};

// Writing on the board (back view): the chalk hand scribbles
export const writing = (t: number, active: boolean): Pose => {
  const p = idle(t, "chill", 1);
  const s = active ? Math.sin(t * 18) : 0;
  p.armB = A(0, 0, active ? 128 + s * 10 : 60, active ? 25 + Math.cos(t * 18) * 18 : 20);
  p.armA = A(0, 10, 14, 10);
  p.tilt = active ? 3 + s * 1.5 : 0;
  return p;
};

export const facepalm = (t: number): Pose => {
  const p = idle(t, "chill", 2);
  p.armB = A(0, 0, 150, 87);
  p.head = -6;
  p.tilt = -4;
  p.brow = -0.9;
  p.blink = 1;
  p.mouth = 0;
  p.y = 2;
  return p;
};

// Pat on the shoulder (side view, facing the friend)
export const pat = (t: number): Pose => {
  const p = idle(t, "chill", 2);
  p.lean = 6;
  p.armA = A(82 + Math.max(0, Math.sin(t * 9)) * 12, 12, 10, 0);
  p.armB = A(-6, 12, 10, 0);
  p.head = 4;
  p.brow = -0.3;
  p.mouth = 0.1;
  p.blink = Math.max(p.blink, 0.4);
  return p;
};

export const pointAt = (t: number, mood: Mood, side: "A" | "B", seed = 0): Pose => {
  const p = idle(t, mood, seed);
  const arm = A(0, 0, 62 + Math.sin(t * 5) * 4, 0);
  if (side === "A") p.armA = arm;
  else p.armB = arm;
  p.mouth = mood === "playful" ? 0.6 : 0.2;
  p.brow = 0.6;
  return p;
};

export const holdBall = (t: number): Pose => {
  const p = idle(t, "playful", 1);
  p.armA = A(0, 0, 26, 62);
  p.armB = A(0, 0, 26, 62);
  p.mouth = 0.15;
  p.brow = 0.6;
  return p;
};

export const leanStick = (t: number): Pose => {
  const p = idle(t, "chill", 3);
  p.armB = A(0, 0, 24, 6);
  p.armA = A(0, 0, 18, 10);
  p.tilt = 5;
  p.y = 6;
  p.legA.knee = 12;
  p.legB.knee = 8;
  p.mouth = 0.3;
  p.brow = 0.3;
  return p;
};

export const wipeBrow = (t: number): Pose => {
  const p = leanStick(t);
  p.armA = A(0, 0, 150, 87 + Math.sin(t * 10) * 10);
  p.mouth = 0.5;
  p.brow = -0.6;
  p.blink = 0.5;
  return p;
};

export const lazyPoke = (u: number): Pose => {
  // A tiny, deliberately lazy toe-poke (side view): u 0..1
  const p = neutral();
  const k = kfs(u, [0, 0.4, 0.55, 1], [0, -18, 30, 8]);
  p.legA = { hip: k, knee: kfs(u, [0, 0.4, 0.55, 1], [0, 30, 0, 0]), ab: 3, foot: kfs(u, [0, 0.55, 1], [0, 30, 10]) };
  p.legB = { hip: -4, knee: 6, ab: 3, foot: 0 };
  p.armA = A(-10, 20, 10, 0);
  p.armB = A(-25, 30, 10, 0);
  p.lean = -8;
  p.mouth = 0.1;
  p.brow = 0.8;
  p.blink = 0.45;
  return p;
};

export const smallCheer = (t: number): Pose => {
  const p = celebrate(t * 0.5, 1);
  p.y *= 0.3;
  p.armA = A(0, 40, 120, 40);
  p.armB = A(0, 40, 120, 40);
  return p;
};

export { celebrate, idle, jump, mix };

// Pose-to-pose: hold each key pose, then snap to the next over `blend` frames
export type Key = { at: number; pose: (t: number) => Pose };
export const snapPose = (f: number, fps: number, keys: Key[], blend = 4): Pose => {
  const t = f / fps;
  let i = 0;
  for (let k = 0; k < keys.length; k++) if (f >= keys[k].at) i = k;
  const cur = keys[i].pose(t);
  if (i === 0) return cur;
  const w = (f - keys[i].at) / blend;
  if (w >= 1) return cur;
  return mix(keys[i - 1].pose(t), cur, w);
};
