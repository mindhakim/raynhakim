import React from "react";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Person } from "./Person";
import { VUTI, VUTU } from "./looks";
import { celebrate, idle, kfs, kick, laugh, mix, run, shrug, walk, wave } from "./poses";
import { Pose, View } from "./types";

// Episode "Penalti": Vutu tests Vuti, the laziest goalkeeper in the kampung.
// Vertical 1080x1920, same look as the monster short: warm light, depth, camera moves, captions.

const W = 1080;
const H = 1920;
const FONT = '"Baloo 2", "Nunito", "Inter", system-ui, sans-serif';
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ez = { ...clamp, easing: Easing.bezier(0.45, 0, 0.25, 1) };

const rand = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

// Layout
const VU_GROUND = 1620;
const GOAL_X = 790;
const GOAL_GROUND = 1330;
const GOAL_W = 420;
const GOAL_H = 300;
const VI_SCALE = 0.68;

// Timeline (seconds)
const T_WALK = 2.6;
const T_WALK_END = 5.2;
const T_RUN = 6.8;
const T_KICK = 7.4;
const KICK_DUR = 1.4;
const T_CONTACT = T_KICK + 0.47 * KICK_DUR;
const T_BALL_END = T_CONTACT + 1.0;
const T_TURN = T_BALL_END + 0.2;
const T_REALIZE = T_TURN + 2.0;
const T_OUT = T_REALIZE + 0.6;
const T_SCORE = 16.6;
const END = 20;

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------

const Sky: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="pSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3B2A6B" />
          <stop offset="0.35" stopColor="#C2577A" />
          <stop offset="0.6" stopColor="#F79A5B" />
          <stop offset="0.72" stopColor="#FFD28A" />
        </linearGradient>
        <radialGradient id="pSun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFF6D6" />
          <stop offset="0.35" stopColor="#FFE29A" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FFB067" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#pSky)" />
      {/* Sun + glow */}
      <circle cx={270} cy={1040} r={420} fill="url(#pSun)" opacity={0.8} />
      <circle cx={270} cy={1040} r={120} fill="#FFF1C4" />
      {/* Clouds */}
      {[0, 1, 2].map((i) => {
        const x = ((frame * (0.35 + i * 0.15) + i * 420) % (W + 500)) - 250;
        return (
          <g key={i} transform={`translate(${x} ${300 + i * 150})`} fill="#FFC9A8" opacity={0.75}>
            <ellipse cx={0} cy={0} rx={140} ry={34} />
            <ellipse cx={70} cy={-18} rx={90} ry={34} />
            <ellipse cx={-60} cy={-10} rx={70} ry={26} />
          </g>
        );
      })}
      {/* Birds */}
      {[0, 1, 2, 3, 4].map((i) => {
        const x = 1200 - ((frame * 2.2 + i * 60) % 1600);
        const y = 520 + i * 26 + Math.sin(frame * 0.1 + i) * 10;
        const flap = Math.sin(frame * 0.5 + i * 1.3) * 10;
        return (
          <path
            key={i}
            d={`M ${x - 18} ${y} Q ${x - 9} ${y - 8 - flap} ${x} ${y} Q ${x + 9} ${y - 8 - flap} ${x + 18} ${y}`}
            stroke="#3B2340"
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
};

const Kampung: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
      {/* Far hills */}
      <path d="M0 1180 Q 200 1080 420 1150 Q 640 1060 860 1140 Q 980 1100 1080 1130 V1300 H0 Z" fill="#8A4B6E" opacity={0.7} />
      {/* Houses with tiled roofs */}
      {[
        { x: -40, w: 230, h: 120 },
        { x: 200, w: 180, h: 100 },
        { x: 600, w: 220, h: 130 },
        { x: 840, w: 260, h: 110 },
      ].map((h, i) => (
        <g key={i} transform={`translate(${h.x} ${1250 - h.h})`}>
          <rect x={10} y={50} width={h.w - 20} height={h.h} fill="#6B3A52" />
          <path d={`M -10 60 L ${h.w / 2} 0 L ${h.w + 10} 60 Z`} fill="#5A2E44" />
          <rect x={h.w * 0.3} y={80} width={28} height={30} fill="#FFD48A" opacity={0.85} />
          <rect x={h.w * 0.6} y={80} width={28} height={30} fill="#FFD48A" opacity={0.6} />
        </g>
      ))}
      {/* Electric poles + sagging wires */}
      {[120, 560, 1000].map((x) => (
        <rect key={x} x={x} y={880} width={12} height={400} fill="#3E2436" />
      ))}
      {[0, 1].map((k) => (
        <path
          key={k}
          d={`M 126 ${900 + k * 24} Q 343 ${960 + k * 24} 566 ${900 + k * 24} Q 783 ${960 + k * 24} 1006 ${900 + k * 24}`}
          stroke="#3E2436"
          strokeWidth={3}
          fill="none"
        />
      ))}
      {/* Coconut palms */}
      {[
        { x: 40, s: 1.2 },
        { x: 1010, s: 1.0 },
      ].map((p, i) => {
        const sway = Math.sin(frame * 0.04 + i) * 3;
        return (
          <g key={i} transform={`translate(${p.x} 1300) scale(${p.s}) rotate(${sway})`}>
            <path d="M 0 0 Q 20 -200 -10 -430" stroke="#4A2A36" strokeWidth={22} fill="none" strokeLinecap="round" />
            {new Array(7).fill(0).map((_, k) => (
              <path
                key={k}
                d={`M -10 -430 q ${Math.cos(k * 0.9) * 90} ${-40 + Math.sin(k * 1.3) * 30} ${Math.cos(k * 0.9) * 170} ${60 + Math.abs(Math.sin(k)) * 50}`}
                stroke="#3C2A3E"
                strokeWidth={18}
                fill="none"
                strokeLinecap="round"
              />
            ))}
          </g>
        );
      })}
      {/* Field */}
      <path d="M0 1250 Q 540 1215 1080 1250 V1920 H0 Z" fill="#5C8F3A" />
      {new Array(6).fill(0).map((_, i) => (
        <path
          key={i}
          d={`M 0 ${1290 + i * 110} Q 540 ${1270 + i * 110} 1080 ${1290 + i * 110} L 1080 ${1345 + i * 110} Q 540 ${1325 + i * 110} 0 ${1345 + i * 110} Z`}
          fill="#527F33"
          opacity={0.7}
        />
      ))}
      {/* Penalty spot + box line */}
      <ellipse cx={420} cy={1590} rx={22} ry={8} fill="white" opacity={0.85} />
      <path d="M 300 1400 L 1080 1400" stroke="white" strokeWidth={6} opacity={0.6} />
      {/* Grass tufts */}
      {new Array(30).fill(0).map((_, i) => {
        const x = rand(i) * W;
        const y = 1300 + rand(i + 9) * 600;
        return (
          <path
            key={i}
            d={`M ${x} ${y} l -6 -18 M ${x} ${y} l 0 -22 M ${x} ${y} l 6 -18`}
            stroke="#3F6E26"
            strokeWidth={4}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
};

const Goal: React.FC<{ front: boolean }> = ({ front }) => {
  const l = GOAL_X - GOAL_W / 2;
  const r = GOAL_X + GOAL_W / 2;
  const top = GOAL_GROUND - GOAL_H;
  if (!front) {
    // Net behind the keeper
    const lines: React.ReactNode[] = [];
    for (let x = l + 20; x < r; x += 30) {
      lines.push(<line key={`v${x}`} x1={x} y1={top + 20} x2={x + 10} y2={GOAL_GROUND - 40} stroke="white" strokeWidth={2} opacity={0.45} />);
    }
    for (let y = top + 30; y < GOAL_GROUND - 40; y += 28) {
      lines.push(<line key={`h${y}`} x1={l + 20} y1={y} x2={r - 20} y2={y} stroke="white" strokeWidth={2} opacity={0.45} />);
    }
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
        <path d={`M ${l + 20} ${top + 20} L ${r - 20} ${top + 20} L ${r - 20} ${GOAL_GROUND - 40} L ${l + 20} ${GOAL_GROUND - 40} Z`} fill="rgba(255,255,255,0.08)" />
        {lines}
      </svg>
    );
  }
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
      {/* Posts and crossbar */}
      <path
        d={`M ${l} ${GOAL_GROUND} L ${l} ${top} L ${r} ${top} L ${r} ${GOAL_GROUND}`}
        stroke="#2A1B17"
        strokeWidth={22}
        fill="none"
        strokeLinejoin="round"
      />
      <path d={`M ${l} ${GOAL_GROUND} L ${l} ${top} L ${r} ${top} L ${r} ${GOAL_GROUND}`} stroke="white" strokeWidth={12} fill="none" strokeLinejoin="round" />
      <path d={`M ${l} ${top} L ${l + 20} ${top + 20} M ${r} ${top} L ${r - 20} ${top + 20}`} stroke="white" strokeWidth={6} />
    </svg>
  );
};

// Warm sunset light + vignette, like the campfire glow in the monster short
const Light: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <AbsoluteFill
        style={{
          background: "radial-gradient(circle at 270px 1040px, rgba(255,190,110,0.45) 0px, rgba(255,150,90,0.12) 600px, rgba(0,0,0,0) 1100px)",
          mixBlendMode: "screen",
          opacity: 0.9 + Math.sin(frame * 0.05) * 0.05,
        }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 55%, rgba(40,10,40,0.45) 100%)" }} />
    </>
  );
};

const Dust: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
      {new Array(22).fill(0).map((_, i) => {
        const x = (rand(i) * W + frame * (0.4 + rand(i + 3) * 0.8)) % W;
        const y = 900 + rand(i + 7) * 800 + Math.sin(frame * 0.03 + i) * 30;
        return <circle key={i} cx={x} cy={y} r={3 + rand(i + 1) * 3} fill="#FFE7B0" opacity={0.25 + 0.35 * Math.abs(Math.sin(frame * 0.05 + i))} />;
      })}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Characters
// ---------------------------------------------------------------------------

type Act = { x: number; view: View; pose: Pose };

const vutuAt = (t: number): Act => {
  if (t < T_WALK) return { x: -200, view: "right", pose: idle(t, "playful", 1) };
  if (t < T_WALK_END) {
    const k = t - T_WALK;
    return { x: -200 + k * 165, view: "right", pose: walk(k, "playful", 1) };
  }
  const xReady = -200 + (T_WALK_END - T_WALK) * 165;
  if (t < T_RUN) {
    // Sizes up the goal, a bit too confident
    const p = idle(t, "playful", 1);
    p.brow = 1;
    p.mouth = 0.5;
    return { x: xReady, view: "right", pose: mix(walk(t - T_WALK, "playful", 1), p, (t - T_WALK_END) / 0.3) };
  }
  if (t < T_KICK) {
    const k = t - T_RUN;
    return { x: xReady + k * 140, view: "right", pose: run(k, 1) };
  }
  const xKick = xReady + (T_KICK - T_RUN) * 140;
  if (t < T_TURN) {
    const u = Math.min(1, (t - T_KICK) / KICK_DUR);
    return { x: xKick, view: "right", pose: kick(u) };
  }
  // Turns to the camera: premature celebration, then the realisation
  if (t < T_REALIZE) return { x: xKick + 40, view: "front", pose: celebrate(t - T_TURN, 1) };
  if (t < T_REALIZE + 2.4) {
    const u = Math.min(1, (t - T_REALIZE) / 2.2);
    const p = shrug(u);
    p.mouth = 0.9;
    p.brow = -0.3;
    p.blink = 0;
    p.look = 1;
    return { x: xKick + 40, view: "front", pose: mix(celebrate(t - T_TURN, 1), p, (t - T_REALIZE) / 0.3) };
  }
  return { x: xKick + 40, view: "front", pose: laugh(t) };
};

const vutiAt = (t: number): Pose => {
  let p = idle(t, "chill", 2);
  // Ball flies past: the tiniest head tilt
  const dodge = interpolate(t, [T_CONTACT + 0.5, T_CONTACT + 0.75, T_CONTACT + 1.6], [0, 1, 0], ez);
  p.head = 7 - dodge * 14;
  p.look = 0.55 - dodge * 1.2;
  if (t > T_OUT && t < T_OUT + 2.6) {
    p.mouth = t < T_OUT + 0.6 ? 0.4 : 0;
  }
  if (t > T_SCORE - 1.2) p = mix(p, wave(t, "chill", 2), (t - (T_SCORE - 1.2)) / 0.5);
  return p;
};

// Ball: rests on the spot, then flies just over the bar into the distance
const ballAt = (t: number, kickX: number) => {
  const startX = kickX + 95;
  const startY = VU_GROUND - 30;
  if (t < T_CONTACT) return { x: startX, y: startY, s: 1, rot: 0, trail: 0 };
  const k = Math.min(1, (t - T_CONTACT) / (T_BALL_END - T_CONTACT));
  const x = interpolate(k, [0, 0.62, 1], [startX, GOAL_X + 30, GOAL_X + 260]);
  const y = interpolate(k, [0, 0.62, 1], [startY, GOAL_GROUND - GOAL_H - 34, 700], {
    easing: Easing.bezier(0.2, 0.7, 0.4, 1),
  });
  return { x, y, s: interpolate(k, [0, 0.62, 1], [1, 0.72, 0.35]), rot: k * 900, trail: k < 0.95 ? 1 : 0 };
};

const Ball: React.FC<{ x: number; y: number; s: number; rot: number }> = ({ x, y, s, rot }) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(${rot})`}>
    <circle r={30} fill="white" stroke="#2A1B17" strokeWidth={5} />
    <path d="M 0 -12 L 11 -4 L 7 10 L -7 10 L -11 -4 Z" fill="#2A1B17" />
    {[0, 72, 144, 216, 288].map((a) => (
      <path key={a} d="M 0 -12 L 0 -29" stroke="#2A1B17" strokeWidth={4} transform={`rotate(${a})`} />
    ))}
  </g>
);

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------

const Caption: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 220 }}>
      <Interactive.Div
        name="Caption"
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 72,
          color: "white",
          textAlign: "center",
          maxWidth: 900,
          lineHeight: 1.1,
          padding: "24px 44px",
          borderRadius: 36,
          background: "rgba(20, 10, 30, 0.6)",
          textShadow: "0 6px 0 rgba(0,0,0,0.5)",
          scale: interpolate(frame, [0, 0.35 * fps], [0.6, 1], {
            ...clamp,
            easing: Easing.spring({ damping: 12 }),
            output: "perceptual-scale",
          }),
          opacity: interpolate(frame, [0, 0.2 * fps], [0, 1], clamp),
        }}
      >
        {text}
      </Interactive.Div>
    </AbsoluteFill>
  );
};

const Bubble: React.FC<{ text: string; x: number; y: number; big?: boolean }> = ({ text, x, y, big }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        translate: "-50% -100%",
        background: "white",
        border: "6px solid #2A1B17",
        borderRadius: 34,
        padding: big ? "18px 40px" : "12px 30px",
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: big ? 78 : 54,
        color: "#2A1B17",
        whiteSpace: "nowrap",
        scale: interpolate(frame, [0, 0.25 * fps], [0, 1], {
          ...clamp,
          easing: Easing.spring({ damping: 10 }),
          output: "perceptual-scale",
        }),
        transformOrigin: "50% 100%",
      }}
    >
      {text}
    </div>
  );
};

const Scoreboard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 150 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 26,
          padding: "22px 40px",
          borderRadius: 30,
          background: "rgba(20,10,30,0.8)",
          border: "5px solid white",
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 76,
          color: "white",
          scale: interpolate(frame, [0, 0.4 * fps], [0.4, 1], {
            ...clamp,
            easing: Easing.spring({ damping: 11 }),
            output: "perceptual-scale",
          }),
        }}
      >
        <span style={{ color: VUTU.jersey }}>VUTU</span>
        <span>0 – 1</span>
        <span style={{ color: VUTI.jersey }}>VUTI</span>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export const EpisodePenalti: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const vu = vutuAt(t);
  const vi = vutiAt(t);
  const kickX = -200 + (T_WALK_END - T_WALK) * 165 + (T_KICK - T_RUN) * 140;
  const ball = ballAt(t, kickX);

  // Camera: open on the lazy keeper, pull back, punch in on the kick, shake on contact
  const zoom = kfs(t, [0, 2.4, T_RUN, T_CONTACT, T_BALL_END, T_TURN + 0.6, END], [1.35, 1.0, 1.0, 1.14, 1.06, 1.0, 1.0]);
  const fx = kfs(t, [0, 2.4, T_RUN, T_CONTACT, T_BALL_END, END], [GOAL_X, 540, 540, kickX + 120, GOAL_X - 80, 540]);
  const fy = kfs(t, [0, 2.4, T_RUN, T_CONTACT, T_BALL_END, END], [GOAL_GROUND - 200, 1300, 1300, VU_GROUND - 180, GOAL_GROUND - 200, 1300]);
  const shake = t > T_CONTACT && t < T_CONTACT + 0.25 ? Math.sin(t * 90) * 10 * (1 - (t - T_CONTACT) / 0.25) : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#3B2A6B", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transformOrigin: `${fx}px ${fy}px`,
          scale: String(zoom),
          translate: `${shake}px ${shake * 0.5}px`,
        }}
      >
        <Sky />
        <Kampung />
        <Goal front={false} />
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", overflow: "visible" }}>
          <Person look={VUTI} pose={vi} view="front" x={GOAL_X} groundY={GOAL_GROUND} scale={VI_SCALE} />
        </svg>
        <Goal front />
        <Dust />
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", overflow: "visible" }}>
          {ball.trail ? (
            <path
              d={`M ${ball.x - 120} ${ball.y + 40} Q ${ball.x - 60} ${ball.y + 10} ${ball.x - 20} ${ball.y}`}
              stroke="white"
              strokeWidth={10 * ball.s}
              opacity={0.45}
              fill="none"
              strokeLinecap="round"
            />
          ) : null}
          <Person look={VUTU} pose={vu.pose} view={vu.view} x={vu.x} groundY={VU_GROUND} scale={1.05} />
          {t < T_BALL_END + 0.05 ? <Ball x={ball.x} y={ball.y} s={ball.s} rot={ball.rot} /> : null}
        </svg>
        <Light />

        {/* Speech bubbles live in the world so they zoom with the camera */}
        <Sequence from={Math.round((T_TURN + 0.2) * fps)} durationInFrames={Math.round((T_REALIZE - T_TURN - 0.2) * fps)}>
          <Bubble text="GOOOL!!" x={vu.x} y={1050} big />
        </Sequence>
        <Sequence from={Math.round((T_REALIZE + 0.3) * fps)} durationInFrames={Math.round(1.6 * fps)}>
          <Bubble text="...lho, kok?" x={vu.x} y={1060} />
        </Sequence>
        <Sequence from={Math.round(T_OUT * fps)} durationInFrames={Math.round(2.4 * fps)}>
          <Bubble text="Out." x={GOAL_X} y={930} />
        </Sequence>
      </AbsoluteFill>

      <Sequence name="Caption 1" from={0} durationInFrames={Math.round(T_WALK * fps)}>
        <Caption text="Sore-sore di lapangan kampung..." />
      </Sequence>
      <Sequence name="Caption 2" from={Math.round(T_WALK * fps)} durationInFrames={Math.round((T_RUN - T_WALK) * fps)}>
        <Caption text="Vutu mau ngetes kiper paling santai sedunia" />
      </Sequence>
      <Sequence name="Caption 3" from={Math.round(T_RUN * fps)} durationInFrames={Math.round((T_TURN - T_RUN) * fps)}>
        <Caption text="Tendangan maut!" />
      </Sequence>
      <Sequence name="Caption 4" from={Math.round(T_OUT * fps)} durationInFrames={Math.round((T_SCORE - T_OUT) * fps)}>
        <Caption text="Kipernya bahkan gak gerak." />
      </Sequence>
      <Sequence name="Score" from={Math.round(T_SCORE * fps)}>
        <Scoreboard />
      </Sequence>
    </AbsoluteFill>
  );
};

export const PENALTI_FRAMES = END * 30;
