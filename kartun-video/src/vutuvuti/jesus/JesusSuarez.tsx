import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, getStaticFiles, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Person } from "../Person";
import { idle, run, wave, walk } from "../poses";
import { Look, Pose, View } from "../types";
import {
  armsUp,
  celebrate,
  facepalm,
  hips,
  holdBall,
  jawDrop,
  jump,
  lazyPoke,
  leanStick,
  makeCast,
  pat,
  pointAt,
  shock,
  sitBored,
  sitFolded,
  sitSad,
  smallCheer,
  snapPose,
  wipeBrow,
  writing,
} from "./cast";
import {
  AzerFlag,
  BambooGoal,
  Banner,
  Bench,
  Blackboard,
  Board198,
  ChalkState,
  Ground,
  Kampung,
  LOC,
  NameTag,
  Podium,
  PosterWall,
  RedChair,
  Signboards,
  Stairs,
  stepTop,
} from "./sets";
import { Billboard, Cam, FONT, GREEN, OUT, PINK, backOut, clamp01, lerp, lookAt, rand, smooth } from "./stage";
import { FPS, ShotId, TOTAL, at, captionWords, kOf, shotAt, shotEnd, shotStart } from "./timeline";

// "Gabriel Jesus Nyalip Suárez": Vutu (Jesus) and Vuti (Suárez) in Barça kits on a kampung
// pitch at night. 2.5D stage (CSS 3D planes) with the 2D rig as camera-facing cut-outs.

const W = 1080;
const H = 1920;
const PERSP = 1100;

const hasFile = (name: string) => getStaticFiles().some((f) => f.name === name);
const CREST = hasFile("fcb.png") ? staticFile("fcb.png") : "generic";
const C = makeCast(CREST);
const VO_FILE = hasFile("jesus/vo.mp3") ? "jesus/vo.mp3" : null;
const MUSIC_FILE = hasFile("jesus/music.mp3") ? "jesus/music.mp3" : null;

// ---------------------------------------------------------------------------
// Actors
// ---------------------------------------------------------------------------

type Icon = "sweat" | "shock" | "q";

type Actor = {
  key: string;
  look: Look;
  x: number;
  y?: number;
  z: number;
  pose: Pose;
  view: View;
  s?: number;
  rot?: number;
  tag?: string;
  icons?: Icon[];
  iconAt?: number; // frame the icons popped in (for the pop animation)
  bib?: number; // 0..1 STARTER bib being pulled on
  ball?: boolean; // holding a ball at the chest
  stick?: boolean;
  counter?: { n: number; done: number }; // Giggs' rolling counter
  bubble?: { text: string; k: number };
};

const CharCut: React.FC<{ a: Actor; cam: Cam; f: number }> = ({ a, cam, f }) => {
  const s = a.s ?? 0.9;
  const gy = 890;
  const p = a.pose;
  const hx = 350 + p.x * s;
  const hy = gy + (p.y - 232 - 178 - 100) * s; // head centre
  const chestY = gy + (p.y - 232 - 95) * s;
  const pop = a.iconAt !== undefined ? backOut((f - a.iconAt) / 6) : 1;
  return (
    <Billboard cam={cam} x={a.x} y={a.y ?? 0} z={a.z} w={700} h={1000}>
      <svg width={700} height={1000} viewBox="0 -100 700 1000" style={{ overflow: "visible" }}>
        <g transform={a.rot ? `rotate(${a.rot} 350 ${gy - 250 * s})` : undefined}>
          {a.stick ? <line x1={hx + 95 * s} y1={chestY + 60 * s} x2={hx + 120 * s} y2={gy} stroke="#6E4A2B" strokeWidth={14} strokeLinecap="round" /> : null}
          <Person look={a.look} pose={p} view={a.view} x={350} groundY={gy} scale={s} />
          {a.bib !== undefined && a.bib > 0 ? (
            <g transform={`translate(${hx} ${chestY - (1 - smooth(a.bib)) * 360 * s})`} opacity={0.95}>
              <path d={`M ${-72 * s} ${-70 * s} L ${-30 * s} ${-82 * s} L 0 ${-60 * s} L ${30 * s} ${-82 * s} L ${72 * s} ${-70 * s} L ${66 * s} ${80 * s} L ${-66 * s} ${80 * s} Z`} fill="#FF8F00" stroke={OUT} strokeWidth={5} />
              <text x={0} y={18 * s} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={30 * s} fill="white" stroke={OUT} strokeWidth={4} paintOrder="stroke">
                STARTER
              </text>
            </g>
          ) : null}
          {a.ball ? (
            <g transform={`translate(${hx} ${chestY + 10 * s})`}>
              <circle r={34 * s} fill="white" stroke={OUT} strokeWidth={5} />
              <path d={`M 0 ${-13 * s} L ${12 * s} ${-4 * s} L ${8 * s} ${11 * s} L ${-8 * s} ${11 * s} L ${-12 * s} ${-4 * s} Z`} fill={OUT} />
            </g>
          ) : null}
        </g>
        {(a.icons ?? []).map((ic) =>
          ic === "sweat" ? (
            <path
              key={ic}
              d="M 0 -26 Q 16 0 12 12 Q 0 24 -12 12 Q -16 0 0 -26 Z"
              fill="#7FD3FF"
              stroke={OUT}
              strokeWidth={4}
              transform={`translate(${hx + 95 * s} ${hy - 70 * s + ((f % 30) / 30) * 26}) scale(${pop * 1.3})`}
            />
          ) : ic === "shock" ? (
            <g key={ic} transform={`translate(${hx} ${hy - 40 * s}) scale(${pop})`} stroke={OUT} strokeWidth={7} strokeLinecap="round">
              {[-1, 1].map((sd) =>
                [-35, 0, 35].map((ang) => {
                  const r1 = 150 * s;
                  const r2 = 200 * s;
                  const a0 = ((sd > 0 ? -90 + 70 : -90 - 70) + ang * sd) * (Math.PI / 180);
                  return <line key={`${sd}${ang}`} x1={Math.cos(a0) * r1} y1={Math.sin(a0) * r1} x2={Math.cos(a0) * r2} y2={Math.sin(a0) * r2} />;
                }),
              )}
            </g>
          ) : (
            <text key={ic} x={hx + 110 * s} y={hy - 150 * s} fontFamily={FONT} fontWeight={900} fontSize={110 * pop} fill="#FFD23F" stroke={OUT} strokeWidth={7} paintOrder="stroke">
              ?
            </text>
          ),
        )}
        {a.tag ? (
          <foreignObject x={150} y={hy - 270 * s} width={400} height={90}>
            <NameTag text={a.tag} />
          </foreignObject>
        ) : null}
        {a.counter ? (
          <g transform={`translate(${hx} ${hy - 300 * s})`}>
            <rect x={-170} y={-70} width={340} height={110} rx={12} fill="#FFFDF5" stroke={OUT} strokeWidth={6} />
            <text x={0} y={12} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={72} fill={OUT}>
              {a.counter.n} LAGA
            </text>
            {a.counter.done > 0 ? (
              <g transform={`translate(0 ${-120}) scale(${backOut(a.counter.done)}) rotate(-4)`}>
                <rect x={-150} y={-55} width={300} height={90} rx={12} fill={GREEN} stroke={OUT} strokeWidth={6} />
                <text x={0} y={12} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={60} fill={OUT}>
                  = 28 GOL
                </text>
              </g>
            ) : null}
          </g>
        ) : null}
        {a.bubble && a.bubble.k > 0 ? (
          <g transform={`translate(${hx + 75} ${hy - 280 * s}) scale(${backOut(a.bubble.k) * 0.68})`}>
            <path d="M -230 -80 Q -230 -120 -190 -120 L 190 -120 Q 230 -120 230 -80 L 230 20 Q 230 60 190 60 L -20 60 L -70 120 L -60 60 L -190 60 Q -230 60 -230 20 Z" fill="#FFFDF5" stroke={OUT} strokeWidth={7} />
            <text x={0} y={-12} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={78} fill={OUT}>
              {a.bubble.text}
            </text>
          </g>
        ) : null}
      </svg>
    </Billboard>
  );
};

// ---------------------------------------------------------------------------
// The scene at a frame: camera + actors + prop state
// ---------------------------------------------------------------------------

type Ball = { x: number; y: number; z: number; rot: number };

type Scene = {
  shot: ShotId;
  cam: Cam;
  actors: Actor[];
  ball?: Ball;
  spark?: { x: number; y: number; z: number; k: number };
  chalkDrop?: { x: number; y: number; z: number };
  whip: number;
  bulge: number;
  tear: number;
  signs: number;
  stairsHi: number[];
};

const ev = (f: number, a: number, len = 10) => clamp01((f - a) / len);

const chalkAt = (f: number): ChalkState => ({
  big28: ev(f, at("3A", 527), 12),
  star: ev(f, at("3A", 548), 8),
  vuti: [ev(f, at("3B", 614)), ev(f, at("3B", 628)), ev(f, at("3B", 642))],
  vutu: [ev(f, at("3C", 704)), ev(f, at("3C", 716)), ev(f, at("3C", 728))],
  minus12: ev(f, at("3C", 740), 12),
});

const BB = LOC.bb;
const PZ = LOC.podium.z;

const sceneAt = (f: number): Scene => {
  const shot = shotAt(f);
  const t = f / FPS;
  const k = smooth(kOf(shot, f));
  const base: Scene = { shot, cam: lookAt(0, -300, 600, 0, -300, 0), actors: [], whip: 0, bulge: 0, tear: 0, signs: 0, stairsHi: [] };

  // --- Scene 1: the podium and the bench --------------------------------
  if (shot === "1A" || shot === "1B" || shot === "C") {
    const fs = shot === "C" ? at("1B", 157) : f;
    const ts = fs / FPS;
    // Vutu: bored on the bench → stands → runs → hops onto the crate
    const tStand = at("1B", 120);
    const tRun = at("1B", 124);
    const tHop = at("1B", 156);
    const tTop = at("1B", 164);
    let vu: Actor = { key: "vutu", look: C.VUTU_B, x: LOC.vutuBenchX, z: LOC.bench.z + 12, pose: sitBored(ts, 1), view: "front" };
    if (fs >= tStand && fs < tRun) vu.pose = snapPose(fs, FPS, [{ at: tStand - 1, pose: (x) => sitBored(x, 1) }, { at: tStand, pose: (x) => idle(x, "playful", 1) }]);
    if (fs >= tRun && fs < tHop) {
      const u = (fs - tRun) / (tHop - tRun);
      const tq = (Math.floor(fs / 4) * 4) / FPS; // run on fours: 3 poses, 4 frames each
      vu = { ...vu, x: lerp(LOC.vutuBenchX, 80, u), z: lerp(LOC.bench.z + 12, PZ + 60, u), pose: run(tq, 1), view: "left" };
    }
    if (fs >= tHop && fs < tTop) {
      const u = (fs - tHop) / (tTop - tHop);
      vu = { ...vu, x: lerp(80, 0, u), z: PZ + 20, y: -LOC.podium.h * smooth(u) - Math.sin(u * Math.PI) * 120, pose: jump(0.3 + u * 0.5, 0, "playful"), view: "left" };
    }
    if (fs >= tTop) vu = { ...vu, x: 0, z: PZ + 20, y: -LOC.podium.h, pose: armsUp(ts, "playful", 1), view: "front" };

    // Vuti: proud on the crate → arms up → shocked → bumped off
    const tUp = at("1A", 75);
    const tShock = at("1B", 150);
    const tOff = at("1B", 156);
    const tDown = at("1B", 164);
    let vi: Actor = {
      key: "vuti",
      look: C.VUTI_B,
      x: 0,
      y: -LOC.podium.h,
      z: PZ + 10,
      pose: snapPose(fs, FPS, [
        { at: 0, pose: (x) => hips(x, "chill", 2) },
        { at: tUp, pose: (x) => armsUp(x, "chill", 2) },
      ]),
      view: "front",
    };
    if (fs >= tShock) vi = { ...vi, pose: shock(ts), view: "right", icons: ["shock", "sweat"], iconAt: tShock };
    if (fs >= tOff) {
      const u = clamp01((fs - tOff) / (tDown - tOff));
      vi = { ...vi, x: lerp(0, -330, u), z: lerp(PZ + 10, PZ + 70, u), y: lerp(-LOC.podium.h, 0, smooth(u)) - Math.sin(u * Math.PI) * 90 };
    }
    let cam: Cam;
    if (shot === "1A" || (shot === "C" && false)) {
      cam = lookAt(lerp(60, 20, k), lerp(-150, -190, k), lerp(PZ + 1350, PZ + 820, k), 0, -470, PZ, lerp(-2, 0, k));
    } else {
      const s0 = shotStart("1B");
      const a1 = at("1B", 122);
      const a2 = at("1B", 150);
      const a3 = at("1B", 163);
      if (fs < a1) {
        const u = smooth((fs - s0) / (a1 - s0));
        cam = lookAt(lerp(60, 1250, u), -260, lerp(PZ + 980, PZ + 1150, u), lerp(0, 1480, u), -300, LOC.bench.z);
      } else if (fs < a2) {
        const u = smooth((fs - a1) / (a2 - a1));
        cam = lookAt(lerp(1250, 760, u), -260, PZ + 1150, lerp(1480, vu.x, u), -300, lerp(LOC.bench.z, vu.z, u));
      } else if (fs < a3) {
        const u = smooth((fs - a2) / (a3 - a2));
        cam = lookAt(lerp(760, 320, u), lerp(-260, -240, u), lerp(PZ + 1150, PZ + 1250, u), lerp(vu.x, 0, u), -380, PZ);
        base.whip = Math.sin(u * Math.PI);
      } else {
        const u = smooth((fs - a3) / (shotEnd("1B") - a3));
        cam = lookAt(lerp(300, 200, u), -260, lerp(PZ + 1150, PZ + 950, u), -90, -400, PZ);
      }
    }
    return { ...base, cam, actors: [vu, vi] };
  }

  // --- 2A: "Namanya Gabriel Jisus" ----------------------------------------
  if (shot === "2A") {
    const vu: Actor = { key: "vutu", look: C.VUTU_B, x: 0, z: -400, pose: wave(t, "playful", 1), view: "front" };
    vu.pose.mouth = 0.75;
    vu.pose.brow = 1;
    return { ...base, cam: lookAt(lerp(70, 30, k), lerp(-320, -335, k), lerp(-400 + 800, -400 + 560, k), 0, -330, -400), actors: [vu] };
  }

  // --- 2B: banner, villagers jumping ---------------------------------------
  if (shot === "2B") {
    const s0 = shotStart("2B");
    const fan = (key: string, look: Look, x: number, z: number, off: number): Actor => {
      const u = (((f - s0 + off) / 20) % 1 + 1) % 1;
      return { key, look, x, z, pose: jump(u, 150, "playful"), view: "front" };
    };
    return {
      ...base,
      cam: lookAt(lerp(-40, 40, k), lerp(-160, -430, k), lerp(-900, -960, k), 0, -640, LOC.banner.z),
      actors: [fan("f1", C.FAN1, -280, -2250, 0), fan("f2", C.FAN2, 270, -2300, 9)],
    };
  }

  // --- 2C: the bench line-up ----------------------------------------------
  if (shot === "2C") {
    const tUp = at("2C", 380);
    const tBib = at("2C", 396);
    const raf: Actor = { key: "raf", look: C.RAFINYA, x: LOC.rafX, z: LOC.bench.z + 12, pose: sitFolded(t, 3), view: "front", tag: "RAFINYA" };
    const vu: Actor = {
      key: "vutu",
      look: C.VUTU_B,
      x: LOC.vutuBenchX,
      z: LOC.bench.z + 12,
      pose: snapPose(f, FPS, [
        { at: 0, pose: (x) => sitBored(x, 1) },
        { at: tUp, pose: (x) => idle(x, "playful", 1) },
        { at: tBib + 24, pose: (x) => smallCheer(x) },
      ]),
      view: "front",
      bib: ev(f, tBib, 18),
    };
    if (f >= tUp) vu.z = LOC.bench.z + 120;
    return {
      ...base,
      cam: lookAt(lerp(960, 1690, k), -300, lerp(260, 180, k), lerp(1000, 1700, k), -320, LOC.bench.z),
      actors: [raf, vu],
    };
  }

  // --- 2D: the goal, pose to pose, on twos --------------------------------
  if (shot === "2D") {
    const s0 = shotStart("2D");
    const g = LOC.goal;
    const fa = f >= at("2D", 441) && f < at("2D", 492) ? f - ((f - Math.round(at("2D", 441))) % 2) : f; // hold frames ×2
    const fx = (o: number) => at("2D", o);
    const tHead = fx(447);
    const tParry = fx(459);
    const tFoot = fx(471);
    const tPoke = fx(480);
    const tNet = fx(490);
    // Ball path
    let ball: Ball;
    const lerp3 = (a: number[], b: number[], u: number) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
    const KUNDE_P = [-260, g.z + 280];
    const KEEP_P = [0, g.z + 70];
    const VUTU_P = [250, g.z + 225];
    if (fa < tHead) {
      const u = clamp01((fa - s0) / (tHead - s0));
      const p = lerp3([-1400, 0, g.z + 60], [KUNDE_P[0] + 20, 0, KUNDE_P[1] + 5], u);
      ball = { x: p[0], y: -Math.sin(u * Math.PI * 0.85) * 820 - u * 120, z: p[2], rot: u * 400 };
    } else if (fa < tParry) {
      const u = (fa - tHead) / (tParry - tHead);
      const p = lerp3([KUNDE_P[0] + 20, -640, KUNDE_P[1]], [KEEP_P[0] - 60, -420, KEEP_P[1] + 10], u);
      ball = { x: p[0], y: p[1], z: p[2], rot: 400 + u * 300 };
    } else if (fa < tFoot) {
      const u = (fa - tParry) / (tFoot - tParry);
      const p = lerp3([KEEP_P[0] - 60, 0, KEEP_P[1] + 10], [VUTU_P[0] - 40, 0, VUTU_P[1] + 10], u);
      ball = { x: p[0], y: -420 * (1 - u) - Math.sin(u * Math.PI) * 120 * (1 - u), z: p[2], rot: 700 + u * 500 };
      if (ball.y > 0) ball.y = 0;
    } else if (fa < tPoke) {
      ball = { x: VUTU_P[0] - 40, y: 0, z: VUTU_P[1] + 10, rot: 1200 };
    } else {
      const u = clamp01((fa - tPoke) / 7);
      const p = lerp3([VUTU_P[0] - 40, 0, VUTU_P[1] + 10], [110, 0, g.z - 160], u);
      ball = { x: p[0], y: -Math.sin(u * Math.PI) * 50, z: p[2], rot: 1200 + u * 200 };
    }
    // Kunde leaps and heads it
    const kuU = (fa - fx(439)) / 16;
    const kunde: Actor = {
      key: "kunde",
      look: C.KUNDE,
      x: KUNDE_P[0],
      z: KUNDE_P[1],
      pose: kuU > 0 && kuU < 1 ? jump(kuU, 230, "playful") : fa >= tNet ? celebrate(t, 4) : idle(t, "playful", 4),
      view: "front",
      tag: "KUNDE",
    };
    if (kuU > 0 && kuU < 1) {
      kunde.pose.armA = { sh: 0, el: 10, ab: 60, elAb: 20 };
      kunde.pose.armB = { sh: 0, el: 10, ab: 60, elAb: 20 };
      kunde.pose.mouth = 0.6;
    }
    // Keeper dives and parries
    const kpU = clamp01((fa - fx(452)) / 12);
    const keeper: Actor = {
      key: "keeper",
      look: C.KEEPER,
      x: KEEP_P[0] - smooth(kpU) * 150,
      y: -Math.sin(kpU * Math.PI) * 170,
      z: KEEP_P[1],
      rot: -smooth(kpU) * 78,
      pose: (() => {
        const p = idle(t, "chill", 5);
        p.legA.knee = 20;
        p.legB.knee = 20;
        p.armA = { sh: 0, el: 20, ab: kpU > 0 ? 165 : 45, elAb: 20 };
        p.armB = { sh: 0, el: 20, ab: kpU > 0 ? 150 : 45, elAb: 20 };
        p.brow = kpU > 0.5 ? -0.8 : 0;
        p.mouth = kpU > 0 ? 0.7 : 0;
        return p;
      })(),
      view: "front",
    };
    // Vutu: lazy, then the toe-poke
    const pkU = (fa - (tPoke - 4)) / 10;
    const vu: Actor = {
      key: "vutu",
      look: C.VUTU_B,
      x: VUTU_P[0],
      z: VUTU_P[1],
      pose:
        fa >= tNet
          ? smallCheer(t)
          : pkU > 0
            ? lazyPoke(Math.min(1, pkU))
            : (() => {
                const p = idle(t, "chill", 1);
                p.armA = { sh: -20, el: 30, ab: 10, elAb: 0 };
                p.armB = { sh: -20, el: 30, ab: 10, elAb: 0 };
                p.blink = Math.max(p.blink, 0.4);
                return p;
              })(),
      view: fa >= tNet ? "front" : "left",
    };
    const sparkK = ev(fa, tParry, 8);
    return {
      ...base,
      cam: lookAt(lerp(740, 610, k), lerp(-95, -115, k), lerp(g.z + 600, g.z + 520, k), lerp(-40, 30, k), -290, g.z + 100, -3),
      actors: [kunde, keeper, vu],
      ball,
      spark: sparkK > 0 && sparkK < 1 ? { x: KEEP_P[0] - 70, y: -400, z: KEEP_P[1] + 30, k: sparkK } : undefined,
      bulge: f >= tNet - 4 ? Math.max(0, Math.sin(ev(f, tNet - 4, 14) * Math.PI)) : 0,
    };
  }

  // --- Scene 3: the blackboard --------------------------------------------
  if (shot === "3A" || shot === "3B" || shot === "3C") {
    const bz = BB.z;
    let vu: Actor;
    let vi: Actor;
    let cam: Cam;
    let chalkDrop: Scene["chalkDrop"];
    if (shot === "3A") {
      const done = at("3A", 552);
      const writingNow = f >= at("3A", 524) && f < at("3A", 546);
      vu = f < done ? { key: "vutu", look: C.VUTU_B, x: BB.x + 40, z: bz + 90, pose: writing(t, writingNow), view: "back" } : { key: "vutu", look: C.VUTU_B, x: BB.x + 40, z: bz + 110, pose: hips(t, "playful", 1), view: "front" };
      vi = { key: "vuti", look: C.VUTI_B, x: BB.x - 540, z: bz + 200, pose: idle(t, "chill", 2), view: "front" };
      vi.pose.look = 1;
      cam = lookAt(lerp(BB.x + 60, BB.x + 30, k), lerp(-440, -455, k), lerp(bz + 1150, bz + 820, k), BB.x - 20, -480, bz);
    } else if (shot === "3B") {
      const turn = at("3B", 662);
      const writingNow = f >= at("3B", 612) && f < at("3B", 654);
      vi =
        f < turn
          ? { key: "vuti", look: C.VUTI_B, x: BB.x - 380, z: bz + 90, pose: writing(t, writingNow), view: "back" }
          : { key: "vuti", look: C.VUTI_B, x: BB.x - 380, z: bz + 110, pose: idle(t, "chill", 2), view: "front", icons: f >= at("3B", 668) ? ["sweat"] : [], iconAt: at("3B", 668) };
      if (f >= turn) {
        vi.pose.look = 1;
        vi.pose.brow = -0.6;
      }
      vu = { key: "vutu", look: C.VUTU_B, x: BB.x + 440, z: bz + 170, pose: hips(t, "playful", 1), view: "front" };
      cam = lookAt(lerp(BB.x + 160, BB.x - 380, k), -440, bz + 950, lerp(BB.x + 120, BB.x - 380, k), -460, bz);
    } else {
      const writingNow = f >= at("3C", 702) && f < at("3C", 738);
      const turn = at("3C", 752);
      vu =
        f < turn
          ? { key: "vutu", look: C.VUTU_B, x: BB.x + 380, z: bz + 90, pose: writing(t, writingNow), view: "back" }
          : { key: "vutu", look: C.VUTU_B, x: BB.x + 380, z: bz + 110, pose: hips(t, "playful", 1), view: "front" };
      const tShock = at("3C", 745);
      vi = {
        key: "vuti",
        look: C.VUTI_B,
        x: BB.x - 380,
        z: bz + 120,
        pose: f >= tShock ? jawDrop(t) : idle(t, "chill", 2),
        view: "front",
        icons: f >= tShock ? ["shock"] : [],
        iconAt: tShock,
      };
      if (f >= tShock) vi.pose.look = 1;
      const dk = ev(f, at("3C", 748), 9);
      if (dk > 0 && dk < 1) chalkDrop = { x: BB.x - 330, y: -300 * (1 - dk * dk), z: bz + 140 };
      cam = lookAt(BB.x, lerp(-440, -470, k), lerp(bz + 1050, bz + 1650, k), BB.x, -440, bz);
    }
    return { ...base, cam, actors: [vu, vi], chalkDrop };
  }

  // --- 4A: the MSN poster -------------------------------------------------
  if (shot === "4A") {
    const P = LOC.poster;
    const tTear = at("4A", 860);
    const vi: Actor = {
      key: "vuti",
      look: C.VUTI_B,
      x: P.x,
      z: P.z + 150,
      pose: snapPose(f, FPS, [
        { at: 0, pose: (x) => hips(x, "chill", 2) },
        {
          at: tTear + 4,
          pose: (x) => {
            const p = idle(x, "chill", 2);
            p.look = 1;
            p.brow = -0.6;
            p.mouth = 0.4;
            p.head = -8;
            return p;
          },
        },
      ]),
      view: "front",
      icons: f >= tTear + 4 ? ["q"] : [],
      iconAt: tTear + 4,
    };
    return {
      ...base,
      cam: lookAt(lerp(P.x + 40, P.x + 10, k), lerp(-440, -455, k), lerp(P.z + 750, P.z + 1080, k), P.x, -455, P.z),
      actors: [vi],
      tear: ev(f, tTear, 16),
    };
  }

  // --- 4B / 4C: the ranking stairs ----------------------------------------
  if (shot === "4B" || shot === "4C") {
    const SX = LOC.stairs.x;
    const s39 = stepTop(39);
    const s40 = stepTop(40);
    const vi: Actor = { key: "vuti", look: C.VUTI_B, x: SX - 330, y: s40.y, z: s40.z + 20, pose: sitSad(t, 2), view: "front" };
    const vu: Actor = { key: "vutu", look: C.VUTU_B, x: SX - 90, y: s39.y, z: s39.z + 10, pose: wave(t, "playful", 1), view: "front" };
    const papin: Actor = { key: "papin", look: C.PAPIN, x: SX + 420, y: s39.y, z: s39.z + 10, pose: wave(t + 0.4, "playful", 6), view: "front", tag: "PAPIN" };
    const giggs: Actor = { key: "giggs", look: C.GIGGS, x: SX + 175, y: s39.y, z: s39.z + 10, pose: wave(t + 0.8, "chill", 7), view: "front", tag: "GIGGS", stick: true, s: 0.86 };
    if (shot === "4B") {
      return {
        ...base,
        cam: lookAt(SX + lerp(80, 40, k), lerp(-250, -760, k), lerp(-260, -320, k), SX + 40, lerp(-260, -860, k), lerp(-1500, -1760, k)),
        actors: [vi, vu, papin, giggs],
        stairsHi: f >= at("4B", 900) ? [39] : [],
      };
    }
    const cu = ev(f, at("4C", 1015), at("4C", 1060) - at("4C", 1015));
    giggs.pose = f >= at("4C", 1078) ? wipeBrow(t) : leanStick(t);
    giggs.counter = { n: Math.round(145 * smooth(cu)), done: ev(f, at("4C", 1066), 8) };
    giggs.tag = undefined;
    vu.pose = idle(t, "playful", 1);
    papin.pose = idle(t, "playful", 6);
    papin.tag = undefined;
    return {
      ...base,
      cam: lookAt(SX + 175 + lerp(40, 10, k), lerp(-990, -1010, k), lerp(s39.z + 1150, s39.z + 720, k), SX + 175, -1010, s39.z),
      actors: [vi, vu, papin, giggs],
      stairsHi: [39],
    };
  }

  // --- 5A / 5B: "belum puas" ---------------------------------------------
  if (shot === "5A" || shot === "5B") {
    const tShake = at("5A", 1150);
    const ph = Math.floor((f - tShake) / 5);
    const vuPose = holdBall(t);
    if (f >= tShake && ph < 12) {
      const seq = [0, 18, 0, -18];
      vuPose.head = seq[ph % 4];
      vuPose.look = seq[ph % 4] / 18;
      vuPose.brow = -0.2;
      vuPose.mouth = 0.1;
    }
    const vu: Actor = { key: "vutu", look: C.VUTU_B, x: -150, z: -250, pose: vuPose, view: "front", ball: true, bubble: { text: "BELUM PUAS.", k: ev(f, tShake, 6) } };
    if (shot === "5A") {
      const tDrop = at("5A", 1160);
      const vi: Actor = {
        key: "vuti",
        look: C.VUTI_B,
        x: 170,
        z: -250,
        pose: f >= tDrop ? jawDrop(t) : idle(t, "chill", 2),
        view: "front",
        icons: f >= tDrop ? ["shock"] : [],
        iconAt: tDrop,
      };
      const ang = (lerp(-7.5, 7.5, k) * Math.PI) / 180;
      return { ...base, cam: lookAt(Math.sin(ang) * 800, -360, -250 + Math.cos(ang) * 800, 0, -420, -250), actors: [vu, vi] };
    }
    // 5B: snap zoom on Vuti, facepalm, then the pat on the shoulder
    const s0 = shotStart("5B");
    const tPalm = at("5B", 1250);
    const tPat = at("5B", 1305);
    const vi: Actor = {
      key: "vuti",
      look: C.VUTI_B,
      x: f >= tPat ? lerp(170, 105, ev(f, tPat, 6)) : 170,
      z: -250,
      pose: snapPose(f, FPS, [
        { at: 0, pose: (x) => jawDrop(x) },
        { at: tPalm, pose: (x) => facepalm(x) },
        { at: tPat, pose: (x) => pat(x) },
      ]),
      view: f >= tPat ? "left" : "front",
      icons: f >= tPalm ? ["sweat"] : [],
      iconAt: tPalm,
    };
    vu.bubble = undefined;
    const zoom = smooth(ev(f, s0, 6));
    const after = smooth(ev(f, tPat - 6, 20));
    const ang = (7.5 * Math.PI) / 180;
    const startCam = { x: Math.sin(ang) * 800, y: -360, z: -250 + Math.cos(ang) * 800 };
    const close = { x: 200, y: -430, z: -250 + 520 };
    const wide = { x: 110, y: -400, z: -250 + 760 };
    const cx = lerp(lerp(startCam.x, close.x, zoom), wide.x, after);
    const cy = lerp(lerp(startCam.y, close.y, zoom), wide.y, after);
    const cz = lerp(lerp(startCam.z, close.z, zoom), wide.z, after) - (f - s0) * 0.4 * (1 - after);
    return { ...base, cam: lookAt(cx, cy, cz, lerp(lerp(10, 170, zoom), 30, after), lerp(-360, -420, zoom), -250), actors: [vu, vi] };
  }

  // --- Scene 6: CTA -------------------------------------------------------
  const SZ = LOC.signs.z;
  const tSign = at("6A", 1365);
  const signs = ev(f, tSign, 14);
  const vu: Actor = { key: "vutu", look: C.VUTU_B, x: -470, z: SZ + 220, pose: armsUp(t, "playful", 1), view: "front" };
  const vi: Actor = { key: "vuti", look: C.VUTI_B, x: 470, z: SZ + 220, pose: wave(t, "chill", 2), view: "front" };
  // Villagers split to the two sides
  const vil: Actor[] = C.CIVILIANS.map((look, i) => {
    const side = i % 2 ? 1 : -1;
    const x0 = (rand(i + 3) - 0.5) * 260;
    const x1 = side * (760 + (i >> 1) * 150);
    const z = SZ + 420 + (i % 3) * 80;
    const u = ev(f, at("6A", 1380) + i * 3, 50);
    const moving = u > 0 && u < 1;
    const pose = moving ? walk(t + i * 0.3, "playful", i) : u >= 1 ? smallCheer(t + i * 0.4) : idle(t + i, "chill", i);
    return { key: `v${i}`, look, x: lerp(x0, x1, smooth(u)), z, pose, view: moving ? (side > 0 ? "right" : "left") : "front", s: 0.82 };
  });
  if (shot === "6B") {
    vu.pose = pointAt(t, "playful", "B", 1);
    vi.pose = pointAt(t, "chill", "A", 2);
    return { ...base, cam: lookAt(0, lerp(-500, -480, k), lerp(470, 330, k), 0, -500, SZ), actors: [vu, vi, ...vil], signs: 1 };
  }
  return { ...base, cam: lookAt(lerp(-60, 0, k), lerp(-1000, -500, k), lerp(900, 450, k), 0, -500, SZ), actors: [vu, vi, ...vil], signs };
};

// ---------------------------------------------------------------------------
// Overlays
// ---------------------------------------------------------------------------

const Logo: React.FC = () => (
  <div style={{ position: "absolute", top: 54, width: "100%", display: "flex", justifyContent: "center" }}>
    <div
      style={{
        width: 240,
        whiteSpace: "nowrap",
        textAlign: "center",
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: 56,
        letterSpacing: 1,
        color: "white",
        textShadow: "0 4px 0 rgba(0,0,0,0.45)",
        WebkitTextStroke: `3px ${OUT}`,
        paintOrder: "stroke",
      }}
    >
      vutb<span style={{ color: PINK, display: "inline-block", transform: "rotate(180deg) translateY(-6px)" }}>v</span>ler
    </div>
  </div>
);

const wordStyle = (raw: string) => {
  const parts: { t: string; c?: string }[] = [];
  const re = /(\*[^*]+\*|\+[^+]+\+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    if (m.index > last) parts.push({ t: raw.slice(last, m.index) });
    parts.push({ t: m[0].slice(1, -1), c: m[0][0] === "*" ? PINK : GREEN });
    last = m.index + m[0].length;
  }
  if (last < raw.length) parts.push({ t: raw.slice(last) });
  return parts;
};

const WORDS = captionWords();

const Caption: React.FC<{ f: number }> = ({ f }) => {
  const w = WORDS.find((x) => f >= x.from && f < x.to);
  if (!w) return null;
  const pop = backOut((f - w.from) / 5);
  return (
    <div style={{ position: "absolute", top: 1450, width: "100%", display: "flex", justifyContent: "center" }}>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 118,
          lineHeight: 1.05,
          color: "white",
          padding: "6px 36px 10px",
          background: "rgba(10,10,25,0.62)",
          borderRadius: 26,
          textTransform: "uppercase",
          transform: `scale(${0.6 + 0.4 * pop})`,
          WebkitTextStroke: `4px ${OUT}`,
          paintOrder: "stroke",
          textShadow: "0 6px 0 rgba(0,0,0,0.4)",
        }}
      >
        {wordStyle(w.text).map((p, i) => (
          <span key={i} style={{ color: p.c ?? "white" }}>
            {p.t}
          </span>
        ))}
      </div>
    </div>
  );
};

const Chip: React.FC<{ text: string; bg: string; fg: string; k: number; top: number }> = ({ text, bg, fg, k, top }) =>
  k <= 0 ? null : (
    <div style={{ position: "absolute", top: top + (1 - backOut(k)) * 260, width: "100%", display: "flex", justifyContent: "center", opacity: clamp01(k * 3) }}>
      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 76, padding: "10px 44px", background: bg, color: fg, border: `7px solid ${OUT}`, borderRadius: 60, boxShadow: "0 10px 0 rgba(0,0,0,0.4)" }}>{text}</div>
    </div>
  );

const NameCard: React.FC<{ k: number }> = ({ k }) =>
  k <= 0 ? null : (
    <div style={{ position: "absolute", top: 1420 + (1 - backOut(k)) * 520, width: "100%", display: "flex", justifyContent: "center" }}>
      <div
        style={{
          transform: "rotate(-3deg)",
          background: "#FFFDF5",
          border: `7px solid ${OUT}`,
          borderRadius: 18,
          padding: "14px 40px",
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 80,
          color: OUT,
          boxShadow: "0 10px 0 rgba(0,0,0,0.4)",
        }}
      >
        GABRIEL JESUS <span style={{ color: PINK }}>· 9</span>
      </div>
    </div>
  );

const Cover: React.FC = () => (
  <AbsoluteFill style={{ background: "rgba(5,6,20,0.62)", alignItems: "center", justifyContent: "center" }}>
    <div style={{ textAlign: "center", fontFamily: FONT, fontWeight: 900, lineHeight: 0.95, transform: "rotate(-4deg)" }}>
      <div style={{ fontSize: 200, color: "white", WebkitTextStroke: `10px ${OUT}`, paintOrder: "stroke", textShadow: "0 12px 0 rgba(0,0,0,0.5)" }}>SUÁREZ</div>
      <div style={{ fontSize: 210, color: PINK, WebkitTextStroke: `10px ${OUT}`, paintOrder: "stroke", textShadow: "0 12px 0 rgba(0,0,0,0.5)" }}>DISALIP?</div>
      <svg width={120} height={130} viewBox="-20 -22 40 44" style={{ marginTop: 30 }}>
        {CREST === "generic" ? (
          <>
            <path d="M -15 -16 L 15 -16 L 15 2 Q 15 14 0 20 Q -15 14 -15 2 Z" fill="#FFD23F" stroke={OUT} strokeWidth={2.5} />
            <path d="M -11 -4 L 11 -4 L 11 3 Q 11 11 0 16 Q -11 11 -11 3 Z" fill="#004D98" />
            <path d="M -4 -4 L 4 -4 L 4 15 Q 0 16.5 -4 15 Z" fill="#A50044" />
            <path d="M -11 -13 L 11 -13 L 11 -7 L -11 -7 Z" fill="white" />
          </>
        ) : (
          <image href={CREST} x={-20} y={-22} width={40} height={44} />
        )}
      </svg>
    </div>
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------
// Sound
// ---------------------------------------------------------------------------

const Fx: React.FC<{ at: number; src: string; vol?: number; rate?: number; dur?: number }> = ({ at: a, src, vol = 1, rate = 1, dur = 2 }) => (
  <Sequence from={Math.max(0, Math.round(a))} durationInFrames={Math.round(dur * FPS)} layout="none">
    <Audio src={staticFile(src)} volume={vol} playbackRate={rate} />
  </Sequence>
);

const SoundDesign: React.FC = () => {
  const musicVol = (fr: number) => {
    const f = fr + 9;
    const base = VO_FILE ? 0.16 : 0.42;
    const fadeIn = interpolate(f, [9, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const fadeOut = interpolate(f, [TOTAL - 24, TOTAL], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    // Short silence before "Bro..."
    const bro = at("5B", 1290);
    const dip = interpolate(f, [bro - 18, bro - 12, bro + 3, bro + 9], [1, 0.25, 0.25, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return base * fadeIn * fadeOut * dip;
  };
  return (
    <>
      {MUSIC_FILE ? (
        <Sequence from={9} durationInFrames={TOTAL - 9} layout="none">
          <Audio src={staticFile(MUSIC_FILE)} volume={musicVol} />
        </Sequence>
      ) : null}
      {VO_FILE ? (
        <Sequence from={9} durationInFrames={TOTAL - 9} layout="none">
          <Audio src={staticFile(VO_FILE)} volume={1} />
        </Sequence>
      ) : null}
      <Fx at={at("1B", 146)} src="sfx/whoosh.wav" vol={0.55} />
      <Fx at={at("1B", 150)} src="sfx/ding.wav" vol={0.5} />
      <Fx at={at("1B", 164)} src="sfx/thunk.wav" vol={0.45} />
      <Fx at={at("2A", 195)} src="sfx/pop.wav" vol={0.5} />
      <Fx at={at("2C", 396)} src="sfx/whoosh.wav" vol={0.3} rate={1.4} />
      <Fx at={at("2D", 447)} src="sfx/kick.wav" vol={0.55} rate={0.65} />
      <Fx at={at("2D", 459)} src="sfx/catch.wav" vol={0.7} />
      <Fx at={at("2D", 480)} src="sfx/kick.wav" vol={0.35} rate={1.3} />
      <Fx at={at("2D", 486)} src="sfx/net.wav" vol={0.6} />
      <Fx at={at("2D", 490)} src="sfx/whistle.wav" vol={0.25} dur={1} />
      <Fx at={at("3A", 524)} src="sfx/chalk.wav" vol={0.5} />
      <Fx at={at("3A", 548)} src="sfx/pop.wav" vol={0.35} />
      <Fx at={at("3B", 613)} src="sfx/chalk.wav" vol={0.45} />
      <Fx at={at("3B", 630)} src="sfx/chalk.wav" vol={0.45} />
      <Fx at={at("3B", 668)} src="sfx/ding.wav" vol={0.3} rate={0.8} />
      <Fx at={at("3C", 703)} src="sfx/chalk.wav" vol={0.45} />
      <Fx at={at("3C", 720)} src="sfx/chalk.wav" vol={0.45} />
      <Fx at={at("3C", 746)} src="sfx/thunk.wav" vol={0.6} />
      <Fx at={at("3C", 752)} src="sfx/tick.wav" vol={0.3} rate={0.6} dur={0.4} />
      <Fx at={at("4A", 860)} src="sfx/tear.wav" vol={0.6} />
      {new Array(14).fill(0).map((_, i) => (
        <Fx key={i} at={at("4C", 1015) + i * ((at("4C", 1060) - at("4C", 1015)) / 14)} src="sfx/tick.wav" vol={0.35} dur={0.3} />
      ))}
      <Fx at={at("4C", 1066)} src="sfx/ding.wav" vol={0.4} />
      <Fx at={at("5A", 1150)} src="sfx/pop.wav" vol={0.45} />
      <Fx at={at("5A", 1160)} src="sfx/ding.wav" vol={0.3} rate={0.7} />
      <Fx at={shotStart("5B")} src="sfx/dug.wav" vol={0.7} />
      <Fx at={at("6A", 1365)} src="sfx/whoosh.wav" vol={0.35} />
      <Fx at={at("6B", 1484)} src="sfx/pop.wav" vol={0.5} />
      <Fx at={at("6B", 1520)} src="sfx/pop.wav" vol={0.5} rate={1.2} />
    </>
  );
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const BallSvg: React.FC<{ rot: number }> = ({ rot }) => (
  <svg width={80} height={80} viewBox="-40 -40 80 80">
    <g transform={`rotate(${rot})`}>
      <circle r={30} fill="white" stroke={OUT} strokeWidth={5} />
      <path d="M 0 -12 L 11 -4 L 7 10 L -7 10 L -11 -4 Z" fill={OUT} />
      {[0, 72, 144, 216, 288].map((a) => (
        <path key={a} d="M 0 -12 L 0 -29" stroke={OUT} strokeWidth={4} transform={`rotate(${a})`} />
      ))}
    </g>
  </svg>
);

export const JesusSuarez: React.FC = () => {
  const frame = useCurrentFrame();
  const sc = sceneAt(frame);
  const t = frame / FPS;
  const { cam } = sc;
  const shot = sc.shot;
  const scene1 = shot === "C" || shot === "1A" || shot === "1B";
  const world = `translateZ(${PERSP}px) rotateZ(${cam.roll}deg) rotateX(${cam.pitch}deg) rotateY(${cam.yaw}deg) translate3d(${-cam.x}px, ${-cam.y}px, ${-cam.z}px)`;

  const dist = (x: number, z: number) => -Math.hypot(x - cam.x, z - cam.z);
  const cutouts: { d: number; node: React.ReactNode }[] = sc.actors.map((a) => ({ d: dist(a.x, a.z), node: <CharCut key={a.key} a={a} cam={cam} f={frame} /> }));
  if (sc.ball)
    cutouts.push({
      d: dist(sc.ball.x, sc.ball.z) + 1,
      node: (
        <Billboard key="ball" cam={cam} x={sc.ball.x} y={sc.ball.y} z={sc.ball.z} w={80} h={80}>
          <BallSvg rot={sc.ball.rot} />
        </Billboard>
      ),
    });
  if (sc.spark)
    cutouts.push({
      d: dist(sc.spark.x, sc.spark.z) + 2,
      node: (
        <Billboard key="spark" cam={cam} x={sc.spark.x} y={sc.spark.y} z={sc.spark.z} w={300} h={300} blur={false}>
          <svg width={300} height={300} viewBox="-150 -150 300 300" style={{ opacity: 1 - sc.spark.k }}>
            {new Array(10).fill(0).map((_, i) => {
              const a = (i / 10) * Math.PI * 2;
              const r = 40 + sc.spark!.k * 100;
              return <line key={i} x1={Math.cos(a) * r * 0.4} y1={Math.sin(a) * r * 0.4} x2={Math.cos(a) * r} y2={Math.sin(a) * r} stroke="#FFF59D" strokeWidth={10} strokeLinecap="round" />;
            })}
            <circle r={30 * (1 - sc.spark.k)} fill="white" />
          </svg>
        </Billboard>
      ),
    });
  if (sc.chalkDrop)
    cutouts.push({
      d: dist(sc.chalkDrop.x, sc.chalkDrop.z) + 1,
      node: (
        <Billboard key="chalk" cam={cam} x={sc.chalkDrop.x} y={sc.chalkDrop.y} z={sc.chalkDrop.z} w={60} h={30} blur={false}>
          <div style={{ width: 50, height: 16, background: "white", border: `3px solid ${OUT}`, borderRadius: 6, transform: `rotate(${frame * 40}deg)` }} />
        </Billboard>
      ),
    });
  cutouts.sort((a, b) => a.d - b.d);

  const goalSecs = shot === "2D" && frame >= at("2D", 490);
  const flash = shot === "2D" ? Math.max(0, 1 - Math.abs(frame - at("2D", 459)) / 3) * 0.35 : 0;
  const snap = shot === "5B" ? Math.max(0, 1 - (frame - shotStart("5B")) / 6) : 0;
  const chips = shot === "6B";

  return (
    <AbsoluteFill style={{ background: "#0B1030", overflow: "hidden" }}>
      <SoundDesign />
      {/* Night sky */}
      <AbsoluteFill style={{ background: "linear-gradient(#050817 0%, #0E1A44 40%, #1C2A66 62%, #3A3A6E 78%, #6B4A5A 100%)" }} />
      <svg width={W} height={H} style={{ position: "absolute" }}>
        {new Array(70).fill(0).map((_, i) => (
          <circle key={i} cx={rand(i) * W} cy={rand(i + 9) * 950} r={1 + rand(i + 3) * 2.2} fill="white" opacity={0.25 + 0.5 * Math.abs(Math.sin(t * 0.7 + i))} />
        ))}
        <circle cx={820 - cam.yaw * 6} cy={300 + cam.pitch * 8} r={58} fill="#FFF3CF" opacity={0.95} />
        <circle cx={845 - cam.yaw * 6} cy={290 + cam.pitch * 8} r={52} fill="#14205A" opacity={0.6} />
      </svg>

      <AbsoluteFill style={{ perspective: PERSP, perspectiveOrigin: "50% 50%", filter: sc.whip > 0.05 ? `blur(${(sc.whip * 7).toFixed(1)}px)` : undefined }}>
        <div style={{ position: "absolute", left: W / 2, top: H / 2, width: 0, height: 0, transformStyle: "preserve-3d", transform: world }}>
          <Ground />
          <Kampung cam={cam} t={t} />
          <Podium />
          {scene1 ? <Board198 /> : null}
          <Bench />
          <RedChair cam={cam} t={t} />
          <BambooGoal bulge={sc.bulge} />
          <Banner t={t} />
          <AzerFlag t={t} />
          <Blackboard s={chalkAt(frame)} />
          <PosterWall tear={sc.tear} t={t} />
          <Stairs t={t} hi={sc.stairsHi} />
          {shot === "6A" || shot === "6B" ? <Signboards t={t} pop={sc.signs} /> : null}
          {cutouts.map((c) => c.node)}
        </div>
      </AbsoluteFill>

      {/* Light: warm lamp glow from below, cold sky, vignette */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 85%, rgba(255,170,80,0.22) 0%, rgba(0,0,0,0) 60%)", mixBlendMode: "screen" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 52%, rgba(3,4,18,0.62) 100%)" }} />
      <AbsoluteFill style={{ background: "white", opacity: Math.max(flash, snap * 0.25) }} />

      {/* 60' chalk label after the goal */}
      {goalSecs ? (
        <div
          style={{
            position: "absolute",
            left: 70,
            top: 210,
            fontFamily: '"Comic Sans MS", "Baloo 2", cursive',
            fontWeight: 900,
            fontSize: 120,
            color: "#F5F5F0",
            padding: "0 30px",
            background: "#24352D",
            border: `8px solid #9C6B3F`,
            borderRadius: 16,
            transform: `scale(${backOut((frame - at("2D", 490)) / 6)}) rotate(-6deg)`,
            transformOrigin: "0 0",
          }}
        >
          60'
        </div>
      ) : null}

      {shot === "2A" ? <NameCard k={ev(frame, at("2A", 195), 9)} /> : null}

      {chips ? (
        <>
          <Chip text="TULIS DI KOMEN" bg="#FFFFFF" fg={OUT} k={ev(frame, at("6B", 1484), 9)} top={1590} />
          <Chip text="FOLLOW @VUTBALER" bg={PINK} fg="white" k={ev(frame, at("6B", 1520), 9)} top={1740} />
        </>
      ) : null}

      {shot === "C" ? <Cover /> : <Caption f={frame} />}
      <Logo />
    </AbsoluteFill>
  );
};

export const JESUS_SUAREZ_FRAMES = TOTAL;
