import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Person } from "../Person";
import { VUTI_MOROCCO as VI, VUTU_SENEGAL as VU } from "../looks";
import { celebrate, idle, jump, kfs, kick, run, shrug } from "../poses";
import { Pose, View } from "../types";

// Cinematic penalty demo: a real 2.5D stage (pitch, goal and stands placed in 3D space)
// with the flat 2D characters standing in it like paper cut-outs. The camera dollies,
// orbits, tilts and racks focus, shot by shot.

const W = 1080;
const H = 1920;
const P = 1100; // perspective (px)
const OUT = "#2A1B17";
const FONT = '"Baloo 2", "Nunito", "Inter", system-ui, sans-serif';
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ez = { ...clamp, easing: Easing.bezier(0.45, 0, 0.25, 1) };
const d2r = (d: number) => (d * Math.PI) / 180;
const r2d = (r: number) => (r * 180) / Math.PI;
const rand = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

// ---------------------------------------------------------------------------
// World layout (px; y is down, ground at y = 0, the goal is at negative z)
// ---------------------------------------------------------------------------

const GOAL_Z = -1200;
const GOAL_W = 1500;
const GOAL_H = 560;
const SPOT = { x: -30, z: -170 };
const KEEPER = { x: 0, z: GOAL_Z + 170 };
const KICKER_START = { x: -160, z: 160 };

// ---------------------------------------------------------------------------
// Timeline (seconds)
// ---------------------------------------------------------------------------

const S1 = 0; // low angle behind the kicker
const S2 = 3.0; // close-up on the keeper
const S3 = 5.3; // slow-motion orbit on the chip
const S4 = 8.5; // low dutch angle: the save
const S5 = 11.0; // wide crane: celebration
const END = 14.5;

// Slow motion between S3 and S4: world time runs slower than video time
const SLOW = 0.42;
const worldTime = (t: number) => (t < S3 ? t : t < S4 ? S3 + (t - S3) * SLOW : S3 + (S4 - S3) * SLOW + (t - S4));

const RUN_START = 5.45; // world time
const CONTACT = RUN_START + 0.55 + 0.47 * 1.3; // kick contact (world time)
const FLIGHT = 0.95; // world seconds from contact to the keeper's hands
const SAVE = CONTACT + FLIGHT;

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------

type Cam = { x: number; y: number; z: number; yaw: number; pitch: number; roll: number; focus: number; dof: number };

const lookAt = (x: number, y: number, z: number, tx: number, ty: number, tz: number) => {
  const dx = tx - x;
  const dy = ty - y;
  const dz = tz - z;
  return { yaw: r2d(Math.atan2(dx, -dz)), pitch: r2d(Math.atan2(-dy, Math.hypot(dx, dz))) };
};

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

const camAt = (t: number): Cam => {
  if (t < S2) {
    // Low behind the kicker, slow dolly in towards the goal
    const k = interpolate(t, [S1, S2], [0, 1], ez);
    const x = lerp(90, 40, k);
    const y = lerp(-170, -185, k);
    const z = lerp(1000, 760, k);
    const la = lookAt(x, y, z, -10, -250, GOAL_Z);
    return { x, y, z, ...la, roll: lerp(-2, 0, k), focus: Math.hypot(-10 - x, GOAL_Z - z), dof: 0.004 };
  }
  if (t < S3) {
    // Tight on the keeper's face, slow push in, background melts away
    const k = interpolate(t, [S2, S3], [0, 1], ez);
    const z = lerp(KEEPER.z + 230, KEEPER.z + 175, k);
    const x = lerp(45, 20, k);
    const y = -370;
    const la = lookAt(x, y, z, KEEPER.x + 5, -385, KEEPER.z);
    return { x, y, z, ...la, roll: 0, focus: z - KEEPER.z, dof: 0.022 };
  }
  if (t < S4) {
    // Orbit from the kicker's side towards the goal as the ball floats
    const k = interpolate(t, [S3, S4], [0, 1], ez);
    const ang = lerp(68, 112, k); // around the penalty spot, on the right side
    const rad = lerp(760, 820, k);
    const x = SPOT.x + rad * Math.sin(d2r(ang));
    const z = SPOT.z + rad * Math.cos(d2r(ang));
    const y = lerp(-170, -280, k);
    const tx = lerp(-110, 0, k);
    const tz = lerp(SPOT.z + 60, GOAL_Z + 380, k);
    const ty = lerp(-210, -320, k);
    const la = lookAt(x, y, z, tx, ty, tz);
    return { x, y, z, ...la, roll: lerp(3, -2, k), focus: Math.hypot(tx - x, tz - z), dof: 0.005 };
  }
  if (t < S5) {
    // Low, tilted, looking up at the keeper as he flies
    const k = interpolate(t, [S4, S5], [0, 1], ez);
    const x = lerp(260, 210, k);
    const y = -45;
    const z = lerp(KEEPER.z + 520, KEEPER.z + 470, k);
    const la = lookAt(x, y, z, KEEPER.x - 20, -380, KEEPER.z);
    return { x, y, z, ...la, roll: -8, focus: Math.hypot(x - KEEPER.x, z - KEEPER.z), dof: 0.006 };
  }
  // Wide crane up over the celebration
  const k = interpolate(t, [S5, END], [0, 1], ez);
  const x = lerp(260, 200, k);
  const y = lerp(-280, -640, k);
  const z = lerp(260, 600, k);
  const la = lookAt(x, y, z, -20, -260, -650);
  return { x, y, z, ...la, roll: 0, focus: Math.hypot(260, 900), dof: 0.003 };
};

// ---------------------------------------------------------------------------
// 3D helpers
// ---------------------------------------------------------------------------

const blurFor = (cam: Cam, x: number, y: number, z: number) => {
  const d = Math.hypot(x - cam.x, y - cam.y, z - cam.z);
  return Math.min(16, Math.abs(d - cam.focus) * cam.dof);
};

// A flat thing standing upright at (x, 0, z), turned to face the camera
const Billboard: React.FC<{
  cam: Cam;
  x: number;
  y?: number;
  z: number;
  w: number;
  h: number;
  children: React.ReactNode;
  blur?: boolean;
}> = ({ cam, x, y = 0, z, w, h, children, blur = true }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      width: w,
      height: h,
      transformOrigin: `${w / 2}px ${h}px`,
      transform: `translate3d(${x - w / 2}px, ${y - h}px, ${z}px) rotateY(${-cam.yaw}deg)`,
      filter: blur && blurFor(cam, x, y - h / 2, z) > 0.4 ? `blur(${blurFor(cam, x, y - h / 2, z).toFixed(2)}px)` : undefined,
    }}
  >
    {children}
  </div>
);

const Char: React.FC<{ cam: Cam; x: number; z: number; look: typeof VU; pose: Pose; view: View; s?: number }> = ({
  cam,
  x,
  z,
  look,
  pose,
  view,
  s = 0.9,
}) => (
  <Billboard cam={cam} x={x} z={z} w={700} h={900}>
    <svg width={700} height={900} viewBox="0 0 700 900" style={{ overflow: "visible" }}>
      <Person look={look} pose={pose} view={view} x={350} groundY={890} scale={s} />
    </svg>
  </Billboard>
);

// ---------------------------------------------------------------------------
// Set pieces
// ---------------------------------------------------------------------------

const Ground: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      width: 7000,
      height: 9000,
      transformOrigin: "0 0",
      transform: "translate3d(-3500px, 0px, 2000px) rotateX(-90deg)",
      background:
        "repeating-linear-gradient(0deg, #2F8F40 0px, #2F8F40 260px, #2A8139 260px, #2A8139 520px)",
    }}
  >
    {/* Penalty box (z = GOAL_Z + 650 → y = 2000 - z) */}
    <div style={{ position: "absolute", left: 3500 - 1300, top: 2000 - (GOAL_Z + 700), width: 2600, height: 700, border: "10px solid rgba(255,255,255,0.75)", borderBottom: "none" }} />
    <div style={{ position: "absolute", left: 3500 - 900, top: 2000 - (GOAL_Z + 280), width: 1800, height: 280, border: "10px solid rgba(255,255,255,0.75)", borderBottom: "none" }} />
    <div style={{ position: "absolute", left: 3500 - 1900, top: 2000 - GOAL_Z - 5, width: 3800, height: 10, background: "rgba(255,255,255,0.75)" }} />
    {/* Penalty spot */}
    <div style={{ position: "absolute", left: 3500 + SPOT.x - 16, top: 2000 - SPOT.z - 16, width: 32, height: 32, borderRadius: 16, background: "white" }} />
  </div>
);

const Goal: React.FC<{ shake: number }> = ({ shake }) => {
  const net = (w: number, h: number) =>
    `repeating-linear-gradient(0deg, rgba(255,255,255,0.45) 0 3px, transparent 3px 34px), repeating-linear-gradient(90deg, rgba(255,255,255,0.45) 0 3px, transparent 3px 34px)`;
  const depth = 260;
  const base: React.CSSProperties = { position: "absolute", left: 0, top: 0, transformOrigin: "0 0" };
  return (
    <>
      {/* Back net */}
      <div style={{ ...base, width: GOAL_W, height: GOAL_H, background: net(GOAL_W, GOAL_H), transform: `translate3d(${-GOAL_W / 2}px, ${-GOAL_H + shake}px, ${GOAL_Z - depth}px)` }} />
      {/* Frame */}
      <svg
        width={GOAL_W + 60}
        height={GOAL_H + 40}
        style={{ ...base, overflow: "visible", transform: `translate3d(${-GOAL_W / 2 - 30}px, ${-GOAL_H - 30}px, ${GOAL_Z}px)` }}
      >
        <path d={`M 30 ${GOAL_H + 40} L 30 30 L ${GOAL_W + 30} 30 L ${GOAL_W + 30} ${GOAL_H + 40}`} stroke={OUT} strokeWidth={40} fill="none" strokeLinejoin="round" />
        <path d={`M 30 ${GOAL_H + 40} L 30 30 L ${GOAL_W + 30} 30 L ${GOAL_W + 30} ${GOAL_H + 40}`} stroke="white" strokeWidth={26} fill="none" strokeLinejoin="round" />
      </svg>
    </>
  );
};

const Stands: React.FC<{ cam: Cam; t: number; hype: number }> = ({ cam, t, hype }) => {
  const SW = 9000;
  const SH = 1700;
  const Z = -3300;
  const cols = ["#00853F", "#FDEF42", "#E31B23", "#C1272D", "#006233", "#F5F5F0", "#FFB74D"];
  const blur = blurFor(cam, 0, -800, Z);
  const fans: React.ReactNode[] = [];
  for (let r = 0; r < 9; r++) {
    for (let i = 0; i < 70; i++) {
      const n = r * 70 + i;
      const x = (i / 70) * SW + (r % 2) * 40 + rand(n) * 30;
      const y = 180 + r * 150;
      const jumpy = Math.abs(Math.sin(t * (3 + hype * 6) + n)) * (8 + hype * 34);
      fans.push(
        <g key={n} transform={`translate(${x} ${y - jumpy})`}>
          <rect x={-26} y={10} width={52} height={70} rx={20} fill={cols[n % cols.length]} />
          <circle cx={0} cy={-6} r={20} fill={rand(n + 5) > 0.5 ? "#7A4A2A" : "#C68A5C"} />
          {hype > 0.3 && n % 3 === 0 ? <rect x={-30} y={-40 - jumpy * 0.3} width={14} height={50} rx={7} fill={cols[(n + 2) % cols.length]} /> : null}
        </g>,
      );
    }
  }
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: SW,
        height: SH,
        transformOrigin: "0 0",
        transform: `translate3d(${-SW / 2}px, ${-SH - 160}px, ${Z}px)`,
        filter: `blur(${blur.toFixed(2)}px)`,
      }}
    >
      <svg width={SW} height={SH}>
        <rect width={SW} height={SH} fill="#251F4C" />
        {new Array(9).fill(0).map((_, r) => (
          <rect key={r} x={0} y={240 + r * 150} width={SW} height={8} fill="#1A1638" />
        ))}
        {fans}
        {/* Ad boards */}
        <rect x={0} y={SH - 120} width={SW} height={120} fill="#0E1A3A" />
        {new Array(12).fill(0).map((_, i) => (
          <text key={i} x={300 + i * 750} y={SH - 40} fontFamily={FONT} fontWeight={900} fontSize={70} fill={i % 2 ? "#FDEF42" : "#4FC3F7"}>
            {i % 2 ? "AFCON 2025" : "VUTU × VUTI"}
          </text>
        ))}
      </svg>
    </div>
  );
};

const Floodlights: React.FC<{ cam: Cam; t: number }> = ({ cam, t }) => (
  <>
    {[-2600, 2600].map((x, i) => (
      <Billboard key={x} cam={cam} x={x} z={-3600} w={700} h={2900}>
        <svg width={700} height={2900}>
          <rect x={335} y={300} width={30} height={2600} fill="#141432" />
          <rect x={160} y={180} width={380} height={200} rx={20} fill="#2A2A55" />
          {[0, 1, 2].map((r) =>
            [0, 1, 2, 3].map((c) => <circle key={`${r}${c}`} cx={210 + c * 95} cy={230 + r * 55} r={20} fill="#FFF9E0" />),
          )}
        </svg>
        <div
          style={{
            position: "absolute",
            left: -350,
            top: -420,
            width: 1400,
            height: 1400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,250,220,0.9) 0%, rgba(255,240,190,0.35) 20%, rgba(255,240,190,0) 60%)",
            opacity: 0.85 + Math.sin(t * 2 + i) * 0.05,
          }}
        />
      </Billboard>
    ))}
  </>
);

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

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export const PenaltiCinematic: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const wt = worldTime(t);
  const cam = camAt(t);

  // --- Vuti (kicker) ---
  let viPose: Pose = idle(wt, "chill", 2);
  let viX = KICKER_START.x;
  let viZ = KICKER_START.z;
  const kickStart = RUN_START + 0.55;
  if (wt >= RUN_START && wt < kickStart) {
    const k = (wt - RUN_START) / 0.55;
    viPose = run(wt, 2);
    viX = lerp(KICKER_START.x, SPOT.x - 70, k);
    viZ = lerp(KICKER_START.z, SPOT.z + 40, k);
  } else if (wt >= kickStart) {
    viX = SPOT.x - 70;
    viZ = SPOT.z + 40;
    viPose = wt < kickStart + 1.3 ? kick((wt - kickStart) / 1.3) : idle(wt, "chill", 2);
    if (t > S5) viPose = shrug(Math.min(1, (t - S5) / 1.6));
  }
  // Which side of the kicker the camera sees
  const viView: View = t < S2 ? "back" : t < S4 ? "right" : t < S5 ? "back" : "front";

  // --- Vutu (keeper) ---
  let vuPose: Pose = idle(wt, "playful", 1);
  vuPose.legA.knee = 18;
  vuPose.legB.knee = 18;
  vuPose.armA = { sh: 10, el: 30, ab: 40, elAb: 20 };
  vuPose.armB = { sh: 10, el: 30, ab: 40, elAb: 20 };
  if (t >= S2 && t < S3) {
    vuPose.brow = -0.7;
    vuPose.mouth = 0;
    vuPose.look = Math.sin(t * 3.2) * 0.8;
  }
  const jumpStart = SAVE - 0.4;
  if (wt >= jumpStart && wt < jumpStart + 1.2) vuPose = jump(Math.min(1, (wt - jumpStart) / 1.2), 150, "playful");
  let vuZ = KEEPER.z;
  if (t >= S5) {
    vuPose = celebrate(t - S5, 1);
    vuZ = interpolate(t, [S5 + 0.2, S5 + 1.8], [KEEPER.z, -620], ez);
  }
  const vuView: View = t >= S3 && t < S4 ? "left" : "front";

  // --- Ball ---
  let ball = { x: SPOT.x, y: 0, z: SPOT.z, rot: 0, show: true };
  if (wt >= CONTACT && wt < SAVE) {
    const k = (wt - CONTACT) / FLIGHT;
    ball = {
      x: lerp(SPOT.x, KEEPER.x + 10, k),
      y: -Math.sin(k * Math.PI * 0.62) * 560 * (1 - k * 0.15) - k * 40,
      z: lerp(SPOT.z, KEEPER.z + 30, k),
      rot: k * 260,
      show: true,
    };
  } else if (wt >= SAVE) {
    // Caught: rides with the keeper's hands, then gets held up
    const jumpU = Math.min(1, (wt - jumpStart) / 1.2);
    const air = jumpU > 0.25 && jumpU < 0.8 ? Math.sin(((jumpU - 0.25) / 0.55) * Math.PI) : 0;
    ball = { x: KEEPER.x + 10, y: -470 - air * 150 * 0.9, z: KEEPER.z + 30, rot: 260, show: t < S5 };
  }

  // Effects
  const flash = Math.max(0, 1 - Math.abs(wt - SAVE) * 6);
  const shake = wt > SAVE && wt < SAVE + 0.35 ? Math.sin(t * 90) * 14 * (1 - (wt - SAVE) / 0.35) : 0;
  const cutFlash = [S2, S3, S4, S5].reduce((m, c) => Math.max(m, Math.max(0, 1 - Math.abs(t - c) * 8)), 0);
  const letterbox = interpolate(t, [S3 - 0.2, S3 + 0.3, S4 - 0.1, S4 + 0.2], [0, 1, 1, 0], clamp);
  const hype = interpolate(wt, [SAVE, SAVE + 0.4], [0, 1], clamp);
  const netShake = 0;

  const world = `translateZ(${P}px) rotateZ(${cam.roll}deg) rotateX(${cam.pitch}deg) rotateY(${cam.yaw}deg) translate3d(${-cam.x}px, ${-cam.y}px, ${-cam.z}px)`;

  return (
    <AbsoluteFill style={{ background: "linear-gradient(#070818 0%, #151640 45%, #2B2462 70%, #3A2E6E 100%)", overflow: "hidden" }}>
      {/* Stars */}
      <svg width={W} height={H} style={{ position: "absolute" }}>
        {new Array(60).fill(0).map((_, i) => (
          <circle key={i} cx={rand(i) * W} cy={rand(i + 9) * 900} r={1 + rand(i + 3) * 2} fill="white" opacity={0.3 + 0.5 * Math.abs(Math.sin(t * 0.8 + i))} />
        ))}
      </svg>

      <AbsoluteFill style={{ perspective: P, perspectiveOrigin: "50% 50%", translate: `${shake}px ${shake * 0.5}px` }}>
        <div style={{ position: "absolute", left: W / 2, top: H / 2, width: 0, height: 0, transformStyle: "preserve-3d", transform: world }}>
          <Floodlights cam={cam} t={t} />
          <Stands cam={cam} t={t} hype={hype} />
          <Ground />
          <Goal shake={netShake} />
          {/* Draw far to near so nearer cut-outs cover farther ones */}
          {[
            { z: vuZ, node: <Char key="vu" cam={cam} x={KEEPER.x} z={vuZ} look={VU} pose={vuPose} view={vuView} /> },
            { z: viZ, node: <Char key="vi" cam={cam} x={viX} z={viZ} look={VI} pose={viPose} view={viView} /> },
            ...(ball.show
              ? [
                  {
                    z: ball.z + 1,
                    node: (
                      <Billboard key="ball" cam={cam} x={ball.x} y={ball.y} z={ball.z} w={80} h={80}>
                        <BallSvg rot={ball.rot} />
                      </Billboard>
                    ),
                  },
                ]
              : []),
          ]
            .sort((a, b) => a.z - b.z)
            .map((o) => o.node)}
        </div>
      </AbsoluteFill>

      {/* Light: floodlight bloom, warm grade, vignette */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(255,240,200,0.18) 0%, rgba(0,0,0,0) 60%)", mixBlendMode: "screen" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 50%, rgba(5,2,20,0.65) 100%)" }} />
      <AbsoluteFill style={{ background: "white", opacity: Math.max(flash * 0.85, cutFlash * 0.35) }} />

      {/* Speed lines in slow motion */}
      {t > S3 && t < S4 ? (
        <svg width={W} height={H} style={{ position: "absolute", opacity: 0.35 }}>
          {new Array(18).fill(0).map((_, i) => {
            const y = (rand(i) * H + t * 400 * (0.5 + rand(i + 4))) % H;
            return <line key={i} x1={rand(i + 7) * W} y1={y} x2={rand(i + 7) * W - 160} y2={y + 40} stroke="white" strokeWidth={4} strokeLinecap="round" />;
          })}
        </svg>
      ) : null}

      {/* Cinematic bars */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 230 * letterbox, background: "black" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 230 * letterbox, background: "black" }} />

      {/* Titles */}
      <div
        style={{
          position: "absolute",
          top: 250,
          width: "100%",
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 92,
          letterSpacing: 8,
          color: "white",
          textShadow: "0 6px 0 rgba(0,0,0,0.5)",
          opacity: interpolate(t, [0.3, 0.8, 2.4, 2.9], [0, 1, 1, 0], clamp),
        }}
      >
        PENALTI
        <div style={{ fontSize: 40, letterSpacing: 4, fontWeight: 700, opacity: 0.85 }}>final · menit 90+</div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 900,
          width: "100%",
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 150,
          color: "white",
          WebkitTextStroke: "8px #2A1B17",
          paintOrder: "stroke",
          scale: String(kfs(wt - SAVE, [0, 0.15, 0.4], [0.3, 1.2, 1])),
          rotate: "-6deg",
          opacity: wt > SAVE && t < S5 ? 1 : 0,
        }}
      >
        DITEPIS!
      </div>
      <div
        style={{
          position: "absolute",
          top: 300,
          width: "100%",
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 80,
          color: "#FDEF42",
          textShadow: "0 6px 0 rgba(0,0,0,0.5)",
          opacity: interpolate(t, [S5 + 0.4, S5 + 0.9], [0, 1], clamp),
        }}
      >
        MENDY TEMBOK!
      </div>
    </AbsoluteFill>
  );
};

export const PENALTI_CINEMATIC_FRAMES = Math.round(END * 30);
