import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Easing, Interactive, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Person } from "../Person";
import { VUTI_MOROCCO as VI, VUTU_SENEGAL as VU } from "../looks";
import { celebrate, idle, jump, kick, laugh, mix, run, shrug, speech, talk, walk, wave } from "../poses";
import { Pose, View } from "../types";
import { LINES, RATE, Slot, schedule, totalSeconds } from "./script";

// "Juara, dicabut, dibalikin lagi": Vutu (Senegal) & Vuti (Morocco) explain the AFCON 2025 final saga.
// Vertical 1080x1920, brand-1 style: warm light, depth, particles, camera moves, captions.

const W = 1080;
const H = 1920;
const FONT = '"Baloo 2", "Nunito", "Inter", system-ui, sans-serif';
const OUT = "#2A1B17";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ez = { ...clamp, easing: Easing.bezier(0.45, 0, 0.25, 1) };
const GROUND = 1600;
const VU_X = 300;
const VI_X = 780;

const rand = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

// ---------------------------------------------------------------------------
// Backgrounds
// ---------------------------------------------------------------------------

const Stadium: React.FC<{ empty?: boolean }> = ({ empty }) => {
  const frame = useCurrentFrame();
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="aSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0E1030" />
          <stop offset="0.5" stopColor="#24245A" />
          <stop offset="0.7" stopColor="#3D3270" />
        </linearGradient>
        <radialGradient id="aFlood" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.25" stopColor="#FFF3C8" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FFF3C8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#aSky)" />
      {/* Stars */}
      {new Array(40).fill(0).map((_, i) => (
        <circle key={i} cx={rand(i) * W} cy={rand(i + 40) * 600} r={1.5 + rand(i + 3) * 2} fill="white" opacity={0.3 + 0.5 * Math.abs(Math.sin(frame * 0.04 + i))} />
      ))}
      {/* Floodlights */}
      {[90, 990].map((x, i) => (
        <g key={x}>
          <rect x={x - 8} y={560} width={16} height={560} fill="#1A1A3A" />
          <rect x={x - 60} y={520} width={120} height={60} rx={8} fill="#2A2A55" stroke="#11112A" strokeWidth={6} />
          <circle cx={x} cy={550} r={260} fill="url(#aFlood)" opacity={0.55 + Math.sin(frame * 0.07 + i) * 0.03} />
        </g>
      ))}
      {/* Stands with crowd */}
      <path d="M 0 900 L 1080 900 L 1080 1250 L 0 1250 Z" fill="#26224E" />
      {new Array(5).fill(0).map((_, r) => (
        <rect key={r} x={0} y={920 + r * 64} width={W} height={5} fill="#1B1840" />
      ))}
      {!empty
        ? new Array(160).fill(0).map((_, i) => {
            const x = (i * 71) % W;
            const row = (i * 37) % 5;
            const cols = ["#00853F", "#FDEF42", "#E31B23", "#C1272D", "#006233", "#F5F5F0"];
            const jumpy = Math.abs(Math.sin(frame * 0.18 + i * 0.9)) * 6;
            return <circle key={i} cx={x + 8} cy={950 + row * 64 - jumpy} r={11} fill={cols[i % cols.length]} opacity={0.85} />;
          })
        : null}
      {/* Pitch */}
      <path d="M0 1240 Q 540 1215 1080 1240 V1920 H0 Z" fill="#2E8B3E" />
      {new Array(7).fill(0).map((_, i) => (
        <path
          key={i}
          d={`M 0 ${1280 + i * 100} Q 540 ${1262 + i * 100} 1080 ${1280 + i * 100} L 1080 ${1330 + i * 100} Q 540 ${1312 + i * 100} 0 ${1330 + i * 100} Z`}
          fill="#2A7E38"
          opacity={0.8}
        />
      ))}
      <path d="M 0 1300 Q 540 1280 1080 1300" stroke="white" strokeWidth={6} opacity={0.6} fill="none" />
    </svg>
  );
};

const Court: React.FC = () => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
    <rect width={W} height={H} fill="#4A2E22" />
    {new Array(9).fill(0).map((_, i) => (
      <rect key={i} x={i * 130 - 20} y={0} width={110} height={1240} fill="#5A3A2A" />
    ))}
    {/* Judge bench */}
    <rect x={140} y={700} width={800} height={340} rx={20} fill="#6B4430" stroke={OUT} strokeWidth={8} />
    <rect x={140} y={700} width={800} height={50} fill="#7D5238" stroke={OUT} strokeWidth={8} />
    <rect x={380} y={790} width={320} height={110} rx={14} fill="#1F3B66" stroke="#D9B45A" strokeWidth={8} />
    <text x={540} y={872} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={84} fill="#F3D27A">
      CAS
    </text>
    {/* Scales of justice */}
    <g transform="translate(540 520)" stroke="#D9B45A" strokeWidth={8} fill="none">
      <line x1={0} y1={-90} x2={0} y2={120} />
      <line x1={-110} y1={-60} x2={110} y2={-60} />
      <path d="M -110 -60 L -150 20 L -70 20 Z" />
      <path d="M 110 -60 L 70 20 L 150 20 Z" />
      <line x1={-60} y1={120} x2={60} y2={120} />
    </g>
    {/* Floor */}
    <rect x={0} y={1240} width={W} height={H - 1240} fill="#8A5A3C" />
    {new Array(10).fill(0).map((_, i) => (
      <line key={i} x1={0} y1={1260 + i * 70} x2={W} y2={1260 + i * 70} stroke="#7A4C31" strokeWidth={6} />
    ))}
  </svg>
);

const WarmLight: React.FC<{ court?: boolean }> = ({ court }) => (
  <>
    <AbsoluteFill
      style={{
        background: court
          ? "radial-gradient(circle at 50% 30%, rgba(255,210,140,0.35) 0px, rgba(0,0,0,0) 900px)"
          : "radial-gradient(circle at 50% 35%, rgba(255,240,200,0.28) 0px, rgba(0,0,0,0) 1000px)",
        mixBlendMode: "screen",
      }}
    />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 55%, rgba(10,5,25,0.55) 100%)" }} />
  </>
);

const Confetti: React.FC<{ t0: number; t: number }> = ({ t0, t }) => {
  const k = t - t0;
  if (k < 0) return null;
  const cols = ["#00853F", "#FDEF42", "#E31B23", "#FFFFFF"];
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
      {new Array(70).fill(0).map((_, i) => {
        const x = rand(i) * W + Math.sin(k * 3 + i) * 30;
        const y = -50 + ((k * (260 + rand(i + 5) * 260) + rand(i + 9) * 900) % 2000);
        return (
          <rect key={i} x={x} y={y} width={14} height={24} fill={cols[i % 4]} transform={`rotate(${k * 300 + i * 40} ${x + 7} ${y + 12})`} />
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

const Trophy: React.FC<{ x: number; y: number; s?: number; glow?: boolean }> = ({ x, y, s = 1, glow }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {glow ? <circle cx={0} cy={-70} r={120} fill="#FFE27A" opacity={0.25} /> : null}
    <path d="M -55 -150 L 55 -150 Q 55 -60 0 -40 Q -55 -60 -55 -150 Z" fill="#F2C744" stroke={OUT} strokeWidth={6} />
    <path d="M -55 -135 Q -95 -125 -80 -95 Q -70 -75 -45 -80" stroke={OUT} strokeWidth={14} fill="none" />
    <path d="M -55 -135 Q -95 -125 -80 -95 Q -70 -75 -45 -80" stroke="#F2C744" strokeWidth={6} fill="none" />
    <path d="M 55 -135 Q 95 -125 80 -95 Q 70 -75 45 -80" stroke={OUT} strokeWidth={14} fill="none" />
    <path d="M 55 -135 Q 95 -125 80 -95 Q 70 -75 45 -80" stroke="#F2C744" strokeWidth={6} fill="none" />
    <rect x={-12} y={-42} width={24} height={30} fill="#E0B232" stroke={OUT} strokeWidth={5} />
    <rect x={-40} y={-14} width={80} height={22} rx={5} fill="#7A4A26" stroke={OUT} strokeWidth={5} />
    <path d="M -30 -130 Q -28 -90 -10 -70" stroke="white" strokeWidth={6} opacity={0.6} fill="none" strokeLinecap="round" />
  </g>
);

const Ball: React.FC<{ x: number; y: number; s?: number; rot?: number }> = ({ x, y, s = 1, rot = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(${rot})`}>
    <circle r={30} fill="white" stroke={OUT} strokeWidth={5} />
    <path d="M 0 -12 L 11 -4 L 7 10 L -7 10 L -11 -4 Z" fill={OUT} />
    {[0, 72, 144, 216, 288].map((a) => (
      <path key={a} d="M 0 -12 L 0 -29" stroke={OUT} strokeWidth={4} transform={`rotate(${a})`} />
    ))}
  </g>
);

const Goal: React.FC<{ x: number; ground: number; w: number; h: number; shake?: number }> = ({ x, ground, w, h, shake = 0 }) => {
  const l = x - w / 2;
  const r = x + w / 2;
  const top = ground - h;
  const lines: React.ReactNode[] = [];
  for (let xx = l + 16; xx < r - 10; xx += 26) lines.push(<line key={`v${xx}`} x1={xx + shake} y1={top + 14} x2={xx + shake * 1.5} y2={ground - 26} stroke="white" strokeWidth={2} opacity={0.5} />);
  for (let yy = top + 26; yy < ground - 26; yy += 24) lines.push(<line key={`h${yy}`} x1={l + 16} y1={yy + shake} x2={r - 16} y2={yy + shake} stroke="white" strokeWidth={2} opacity={0.5} />);
  return (
    <g>
      {lines}
      <path d={`M ${l} ${ground} L ${l} ${top} L ${r} ${top} L ${r} ${ground}`} stroke={OUT} strokeWidth={20} fill="none" strokeLinejoin="round" />
      <path d={`M ${l} ${ground} L ${l} ${top} L ${r} ${top} L ${r} ${ground}`} stroke="white" strokeWidth={11} fill="none" strokeLinejoin="round" />
    </g>
  );
};

const Scoreboard: React.FC<{ a: string; b: string; note?: string; pop: number }> = ({ a, b, note, pop }) => (
  <div
    style={{
      position: "absolute",
      top: 470,
      left: "50%",
      translate: "-50% 0",
      scale: String(pop),
      display: "flex",
      alignItems: "center",
      gap: 22,
      padding: "16px 32px",
      borderRadius: 26,
      background: "rgba(10,10,30,0.85)",
      border: "4px solid white",
      fontFamily: FONT,
      fontWeight: 900,
      fontSize: 58,
      color: "white",
      whiteSpace: "nowrap",
    }}
  >
    <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ width: 42, height: 28, background: "linear-gradient(90deg,#00853F 33%,#FDEF42 33% 66%,#E31B23 66%)", borderRadius: 4 }} />
      SEN
    </span>
    <span>
      {a} – {b}
    </span>
    <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
      MAR
      <span style={{ width: 42, height: 28, background: "#C1272D", borderRadius: 4, border: "3px solid #006233" }} />
    </span>
    {note ? <span style={{ fontSize: 40, color: "#FFD54F" }}>{note}</span> : null}
  </div>
);

const VarScreen: React.FC<{ t: number }> = ({ t }) => (
  <g transform="translate(860 1010)">
    <rect x={-10} y={160} width={20} height={250} fill="#1A1A2A" />
    <rect x={-150} y={0} width={300} height={190} rx={16} fill="#0D1A2B" stroke={OUT} strokeWidth={8} />
    <text x={0} y={80} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={70} fill="#4FC3F7">
      VAR
    </text>
    <text x={0} y={150} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={48} fill="#FF5252" opacity={Math.sin(t * 12) > 0 ? 1 : 0.25}>
      PENALTI
    </text>
  </g>
);

const Paper: React.FC<{ x: number; y: number; text: string; rot?: number }> = ({ x, y, text, rot = -6 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <rect x={-80} y={-100} width={160} height={200} rx={8} fill="#FFFDF5" stroke={OUT} strokeWidth={6} />
    <text x={0} y={-50} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill="#C1272D">
      {text}
    </text>
    {[0, 1, 2, 3].map((i) => (
      <line key={i} x1={-55} y1={-10 + i * 26} x2={55} y2={-10 + i * 26} stroke="#B9B2A0" strokeWidth={6} strokeLinecap="round" />
    ))}
  </g>
);

const Gavel: React.FC<{ x: number; y: number; ang: number }> = ({ x, y, ang }) => (
  <g transform={`translate(${x} ${y}) rotate(${ang})`}>
    <rect x={-8} y={-10} width={16} height={150} rx={6} fill="#7A4A26" stroke={OUT} strokeWidth={5} />
    <rect x={-60} y={-46} width={120} height={50} rx={12} fill="#8E5A30" stroke={OUT} strokeWidth={6} />
  </g>
);

// ---------------------------------------------------------------------------
// Text overlays
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
          fontSize: 68,
          color: "white",
          textAlign: "center",
          maxWidth: 920,
          lineHeight: 1.1,
          padding: "22px 40px",
          borderRadius: 34,
          background: "rgba(20, 10, 30, 0.62)",
          textShadow: "0 6px 0 rgba(0,0,0,0.5)",
          scale: interpolate(frame, [0, 0.35 * fps], [0.6, 1], { ...clamp, easing: Easing.spring({ damping: 12 }), output: "perceptual-scale" }),
          opacity: interpolate(frame, [0, 0.2 * fps], [0, 1], clamp),
        }}
      >
        {text}
      </Interactive.Div>
    </AbsoluteFill>
  );
};

const Subtitle: React.FC<{ slot: Slot; big?: boolean }> = ({ slot, big }) => (
  <div
    style={{
      position: "absolute",
      left: 60,
      right: 60,
      bottom: 90,
      textAlign: "center",
      fontFamily: FONT,
      fontWeight: 800,
      fontSize: big ? 50 : 44,
      lineHeight: 1.18,
      color: slot.who === "vutu" ? "#FFFFFF" : "#FFE0E0",
      textShadow: "0 3px 0 #000, 0 0 10px rgba(0,0,0,0.8)",
    }}
  >
    <span style={{ color: slot.who === "vutu" ? "#7CF2A6" : "#FF8A8A" }}>{slot.who === "vutu" ? "VUTU: " : "VUTI: "}</span>
    {slot.text}
  </div>
);

const Bubble: React.FC<{ text: string; x: number; y: number; big?: boolean; k: number }> = ({ text, x, y, big, k }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      translate: "-50% -100%",
      background: "white",
      border: "6px solid #2A1B17",
      borderRadius: 32,
      padding: big ? "16px 38px" : "10px 28px",
      fontFamily: FONT,
      fontWeight: 900,
      fontSize: big ? 74 : 50,
      color: OUT,
      whiteSpace: "nowrap",
      scale: String(interpolate(k, [0, 0.25], [0, 1], { ...clamp, easing: Easing.spring({ damping: 10 }) })),
      transformOrigin: "50% 100%",
    }}
  >
    {text}
  </div>
);

const InfoCard: React.FC<{ text: string; y: number; k: number; color: string }> = ({ text, y, k, color }) => (
  <div
    style={{
      position: "absolute",
      top: y,
      left: "50%",
      translate: `${interpolate(k, [0, 0.3], [-160, 0], ez) - 50}% 0`,
      opacity: interpolate(k, [0, 0.25], [0, 1], clamp),
      background: "rgba(255,253,245,0.96)",
      border: `6px solid ${color}`,
      borderRadius: 24,
      padding: "14px 30px",
      fontFamily: FONT,
      fontWeight: 900,
      fontSize: 46,
      color: OUT,
      whiteSpace: "nowrap",
    }}
  >
    {text}
  </div>
);

// ---------------------------------------------------------------------------
// Scene logic
// ---------------------------------------------------------------------------

type Actor = { x: number; ground: number; scale: number; view: View; pose: Pose; show: boolean };

const CAPTIONS = [
  "Juara 2x di final yang sama?!",
  "Final AFCON 2025: Senegal vs Maroko",
  "WALK-OUT di final!",
  "±15 menit...",
  "Penalti Panenka... DITEPIS!",
  "Penalti Panenka... DITEPIS!",
  "Extra time: 1–0 Senegal!",
  "Banding CAF: Senegal kalah WO 0–3",
  "Trofi tetap diarak di Senegal",
  "Dibawa ke CAS...",
  "Putusan CAS, 24 November",
  "Hasil 1–0 SAH!",
  "Setuju sama CAS, atau harusnya Maroko yang juara?",
  "Setuju sama CAS, atau harusnya Maroko yang juara?",
  "Tulis di komentar!",
];

export const EpisodeAfcon: React.FC<{ silent?: boolean }> = ({ silent = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const slots = schedule(silent);

  // The current scene = the latest line that has started
  let si = 0;
  for (const s of slots) if (t >= s.start - 0.05) si = s.i;
  const slot = slots[si];
  const lt = t - slot.start; // local time in the scene
  const dur = slot.end - slot.start;
  const u = Math.min(1, Math.max(0, lt / dur));
  const ev = slot.events;
  const at = (k: string, fallback: number) => (ev[k] !== undefined ? ev[k] : fallback);

  const vu: Actor = { x: VU_X, ground: GROUND, scale: 1, view: "front", pose: idle(t, "playful", 1), show: true };
  const vi: Actor = { x: VI_X, ground: GROUND, scale: 1, view: "front", pose: idle(t, "chill", 2), show: true };
  let bg: "stadium" | "empty" | "court" = "stadium";
  let trophy: { x: number; y: number; s: number; glow?: boolean } | null = null;
  let ball: { x: number; y: number; s: number; rot: number } | null = null;
  let goal: { x: number; ground: number; w: number; h: number; shake: number } | null = null;
  let score: { a: string; b: string; note?: string } | null = null;
  const extras: React.ReactNode[] = [];
  const overlays: React.ReactNode[] = [];
  let confettiAt: number | null = null;
  let shake = 0;

  const trophyAt = (who: "vutu" | "vuti", up = false) => ({
    x: (who === "vutu" ? vu.x : vi.x) + (up ? 0 : 0),
    y: up ? GROUND - 520 : GROUND - 190,
    s: up ? 1.05 : 0.9,
    glow: true,
  });
  const fly = (from: { x: number; y: number }, to: { x: number; y: number }, k: number) => ({
    x: interpolate(k, [0, 1], [from.x, to.x], ez),
    y: interpolate(k, [0, 1], [from.y, to.y], ez) - Math.sin(Math.min(1, Math.max(0, k)) * Math.PI) * 260,
    s: 1,
    glow: true,
  });

  switch (si) {
    case 0: {
      // Hook: the trophy flies away and comes back
      const a = trophyAt("vutu");
      const b = trophyAt("vuti");
      const away = at("away", 1.7);
      const back = at("back", 3.5);
      const k1 = interpolate(lt, [away - 0.1, away + 0.8], [0, 1], clamp);
      const k2 = interpolate(lt, [back - 0.1, back + 0.8], [0, 1], clamp);
      trophy = k2 > 0 ? fly(b, a, k2) : fly(a, b, k1);
      vu.pose = k2 >= 1 ? celebrate(lt, 1) : k1 > 0.5 ? mix(idle(t, "playful", 1), shrug(Math.min(1, (lt - away) / 1.2)), 1) : talk(t, "playful", 1);
      if (k1 >= 1 && k2 < 0.5) vi.pose.brow = 0.5;
      if (k2 >= 1) confettiAt = slot.start + back + 0.8;
      break;
    }
    case 1: {
      score = { a: "0", b: "0" };
      break;
    }
    case 2: {
      // VAR → penalty → walk-out
      score = { a: "0", b: "0", note: "90+'" };
      extras.push(<VarScreen key="var" t={t} />);
      const walkStart = at("walk", dur * 0.62);
      if (lt > walkStart) {
        const k = lt - walkStart;
        vu.view = "left";
        vu.x = VU_X - k * 210;
        vu.pose = walk(k, "playful", 1);
        vu.pose.brow = -1;
      } else {
        vu.pose = talk(t, "playful", 1);
        vu.pose.brow = -0.6 + Math.sin(t * 3) * 0.3;
      }
      vi.x = 560;
      break;
    }
    case 3: {
      // Empty pitch, Vuti waits
      bg = "empty";
      vu.show = false;
      vi.x = 540;
      vi.pose = idle(t, "chill", 2);
      vi.pose.armB = { sh: 30, el: 100, ab: 30, elAb: -60 };
      vi.pose.look = -0.2;
      extras.push(
        <g key="clock" transform="translate(540 800)">
          <circle r={150} fill="#FFFDF5" stroke={OUT} strokeWidth={10} />
          <path d={`M 0 0 L 0 -110 A 110 110 0 ${u > 0.5 ? 1 : 0} 1 ${110 * Math.sin(u * Math.PI * 1.8)} ${-110 * Math.cos(u * Math.PI * 1.8)} Z`} fill="#FFB74D" opacity={0.7} />
          <line x1={0} y1={0} x2={110 * Math.sin(u * Math.PI * 1.8)} y2={-110 * Math.cos(u * Math.PI * 1.8)} stroke={OUT} strokeWidth={10} strokeLinecap="round" />
          <circle r={12} fill={OUT} />
        </g>,
      );
      extras.push(
        <text key="krik" x={210 + Math.sin(t * 6) * 6} y={1260} fontFamily={FONT} fontWeight={800} fontSize={44} fill="#B6F5B0" opacity={Math.sin(t * 5) > 0 ? 1 : 0.4}>
          krik... krik...
        </text>,
      );
      break;
    }
    case 4: {
      // Panenka: Vuti kicks (side view, left), Vutu saves in goal (right)
      goal = { x: 760, ground: 1360, w: 440, h: 300, shake: 0 };
      vu.x = 760;
      vu.ground = 1360;
      vu.scale = 0.7;
      vi.view = "right";
      vi.x = 190;
      vi.ground = GROUND;
      const contact = at("contact", dur * 0.4 + 0.61);
      const kickStart = contact - 0.47 * 1.3;
      const save = Math.max(contact + 0.6, at("save", contact + 1.0));
      if (lt < kickStart) {
        vi.pose = lt < kickStart - 0.6 ? idle(t, "chill", 2) : run(lt, 2);
        vi.x = 190 + Math.max(0, lt - (kickStart - 0.6)) * 120;
      } else {
        vi.x = 262;
        vi.pose = kick(Math.min(1, (lt - kickStart) / 1.3));
      }
      // Keeper bounces, then jumps to save
      vu.pose = lt > save - 0.35 ? jump(Math.min(1, (lt - save + 0.35) / 1.1), 120, "playful") : idle(t, "playful", 1);
      const bx0 = 262 + 110;
      const by0 = GROUND - 30;
      if (lt < contact) ball = { x: bx0, y: by0, s: 1, rot: 0 };
      else if (lt < save) {
        const k = (lt - contact) / (save - contact);
        ball = {
          x: interpolate(k, [0, 1], [bx0, 760]),
          y: interpolate(k, [0, 1], [by0, 1360 - 230]) - Math.sin(k * Math.PI) * 220,
          s: interpolate(k, [0, 1], [1, 0.75]),
          rot: k * 200,
        };
      } else {
        ball = { x: 760 + (lt - save) * 40, y: 1360 - 250 - Math.min(40, (lt - save) * 120), s: 0.75, rot: 0 };
        overlays.push(<Bubble key="save" text="DITEPIS!" x={760} y={980} big k={lt - save} />);
      }
      break;
    }
    case 5: {
      // "...aduh." Vuti hides his face
      vi.pose = shrug(0.5);
      vi.pose.blink = 1;
      vi.pose.head = 14;
      vu.pose = celebrate(t, 1);
      trophy = null;
      break;
    }
    case 6: {
      // Extra-time long shot
      score = { a: lt > at("goal", dur * 0.7) ? "1" : "0", b: "0", note: "ET" };
      goal = { x: 820, ground: 1360, w: 400, h: 280, shake: 0 };
      vu.view = "right";
      vu.x = 200;
      vi.show = false;
      const contact = at("contact", dur * 0.3 + 0.61);
      const kickStart = contact - 0.47 * 1.3;
      const inNet = Math.max(contact + 0.6, at("goal", contact + 0.8));
      if (lt < kickStart) vu.pose = idle(t, "playful", 1);
      else if (lt < inNet + 0.4) vu.pose = kick(Math.min(1, (lt - kickStart) / 1.3));
      else {
        vu.view = "front";
        vu.pose = celebrate(lt, 1);
        confettiAt = slot.start + inNet + 0.4;
      }
      if (lt >= contact && lt < inNet) {
        const k = (lt - contact) / (inNet - contact);
        ball = {
          x: interpolate(k, [0, 1], [310, 860]),
          y: interpolate(k, [0, 1], [GROUND - 30, 1360 - 180]) - Math.sin(k * Math.PI) * 160,
          s: interpolate(k, [0, 1], [1, 0.7]),
          rot: k * 900,
        };
      } else if (lt < contact) ball = { x: 310, y: GROUND - 30, s: 1, rot: 0 };
      else {
        ball = { x: 880, y: 1360 - 60, s: 0.7, rot: 0 };
        if (goal) goal.shake = Math.sin(lt * 40) * Math.max(0, 6 - (lt - inNet) * 8);
      }
      if (lt >= inNet) shake = Math.sin(t * 80) * Math.max(0, 10 - (lt - inNet) * 30);
      break;
    }
    case 7: {
      // CAF appeal: trophy moves to Vuti
      score = { a: "0", b: "3", note: "WO" };
      const move = at("move", dur * 0.55);
      const k = interpolate(lt, [move, move + 1], [0, 1], clamp);
      trophy = fly(trophyAt("vutu"), trophyAt("vuti"), k);
      if (lt >= at("paper", 0)) extras.push(<Paper key="paper" x={VI_X + 120} y={GROUND - 260} text="BANDING" />);
      vu.pose = k >= 1 ? shrug(Math.min(1, (lt - move - 1) / 1.5)) : idle(t, "playful", 1);
      vu.pose.brow = k >= 1 ? -0.8 : 0;
      vi.pose = talk(t, "chill", 2);
      break;
    }
    case 8: {
      // Senegal still parades the trophy
      trophy = trophyAt("vutu", true);
      vu.pose = celebrate(t, 1);
      vi.pose = idle(t, "chill", 2);
      vi.pose.brow = 0.8;
      vi.pose.look = -1;
      confettiAt = slot.start;
      overlays.push(<Bubble key="huh" text="?" x={VI_X} y={1060} k={lt} />);
      break;
    }
    case 9:
    case 10: {
      bg = "court";
      vu.x = 290;
      vi.x = 790;
      if (si === 10) {
        overlays.push(<InfoCard key="c1" text="Lanjut main = wewenang wasit" y={1120} k={lt - at("card1", 0.5)} color="#00853F" />);
        overlays.push(<InfoCard key="c2" text="Kalah WO = laga dihentikan total" y={1230} k={lt - at("card2", dur * 0.5)} color="#C1272D" />);
      }
      break;
    }
    case 11: {
      // Gavel bang, trophy returns
      bg = "court";
      vu.x = 290;
      vi.x = 790;
      const bang = interpolate(lt, [0, 0.25, 0.4], [-40, 20, 0], clamp);
      extras.push(<Gavel key="gavel" x={680} y={640} ang={bang} />);
      if (lt > 0.25) shake = Math.sin(t * 80) * Math.max(0, 12 - (lt - 0.25) * 40);
      const sah = at("sah", 0.4);
      const k = interpolate(lt, [sah - 0.2, sah + 0.8], [0, 1], clamp);
      trophy = k < 1 ? fly(trophyAt("vuti"), trophyAt("vutu"), k) : trophyAt("vutu", true);
      vu.pose = k >= 1 ? celebrate(lt, 1) : idle(t, "playful", 1);
      score = lt >= sah ? { a: "1", b: "0", note: "SAH" } : { a: "0", b: "3", note: "WO" };
      if (k >= 1) confettiAt = slot.start + sah + 0.8;
      break;
    }
    default: {
      // Ending
      trophy = { x: 540, y: GROUND - 60, s: 0.8, glow: true };
      if (si === 13) vu.pose = laugh(t);
      if (si === 14) vi.pose = wave(t, "chill", 2);
      break;
    }
  }

  // Lip-sync: whoever is speaking moves their mouth
  const mouthFor = (who: "vutu" | "vuti") => {
    const s = slots.find((x) => x.who === who && t >= x.start && t <= x.end);
    if (!s) return null;
    if (s.env.length === 0) return speech(t);
    const f = Math.floor((t - s.start) * 30);
    return s.env[Math.min(s.env.length - 1, Math.max(0, f))] ?? 0;
  };
  const mVu = mouthFor("vutu");
  const mVi = mouthFor("vuti");
  if (mVu !== null && vu.show) vu.pose = { ...vu.pose, mouth: Math.max(vu.pose.mouth, mVu) };
  if (mVi !== null && vi.show) vi.pose = { ...vi.pose, mouth: Math.max(vi.pose.mouth, mVi * 0.9) };

  // Camera: gentle push-in per scene, quick pop on every cut
  const pop = 1 + Math.max(0, 0.06 - lt * 0.3);
  const zoom = (1 + u * 0.05) * pop;
  const scorePop = interpolate(lt, [0, 0.3], [0.7, 1], { ...clamp, easing: Easing.spring({ damping: 11 }) });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0E1030", overflow: "hidden" }}>
      {/* Voice clips */}
      {slots.map((s) =>
        s.file ? (
          <Sequence key={s.i} from={Math.round(s.start * fps)} durationInFrames={Math.ceil(((s.end - s.start) + 0.2) * fps)}>
            <Audio src={staticFile(s.file)} playbackRate={RATE} />
          </Sequence>
        ) : null,
      )}

      <AbsoluteFill style={{ scale: String(zoom), transformOrigin: "50% 62%", translate: `${shake}px ${shake * 0.4}px` }}>
        {bg === "court" ? <Court /> : <Stadium empty={bg === "empty"} />}
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", overflow: "visible" }}>
          {goal ? <Goal {...goal} /> : null}
          {extras}
          {[vi, vu]
            .filter((a) => a.show)
            .sort((a, b) => a.ground - b.ground)
            .map((a) => (
              <Person key={a === vu ? "vu" : "vi"} look={a === vu ? VU : VI} pose={a.pose} view={a.view} x={a.x} groundY={a.ground} scale={a.scale} />
            ))}
          {ball ? <Ball {...ball} /> : null}
          {trophy ? <Trophy {...trophy} /> : null}
        </svg>
        {confettiAt !== null ? <Confetti t0={confettiAt} t={t} /> : null}
        <WarmLight court={bg === "court"} />
        {overlays}
      </AbsoluteFill>

      {score ? <Scoreboard {...score} pop={scorePop} /> : null}
      <Sequence key={`cap${si}`} from={Math.round(slot.start * fps)}>
        <Caption text={CAPTIONS[si]} />
      </Sequence>
      {t <= slot.end + 0.25 ? <Subtitle slot={slot} big={silent} /> : null}
    </AbsoluteFill>
  );
};

export const afconFrames = (fps: number, silent = false) => Math.ceil(totalSeconds(silent) * fps);
export const AFCON_LINES = LINES.length;
