import React from "react";
import { BLUE, Billboard, Cam, FONT, Floor, GARNET, GREEN, OUT, PINK, Plane, backOut, clamp01, rand } from "./stage";

// The kampung: a dirt village pitch at night surrounded by houses, power poles, cables,
// bunting and warm street lamps. All positions are world px (≈ 280 px per metre).

export const LOC = {
  podium: { x: 0, z: -600, h: 160, w: 250 },
  board198: { x: 0, z: -1050 },
  bench: { x0: 880, x1: 1720, z: -700, seat: 120 },
  vutuBenchX: 1590,
  chairX: 1180,
  rafX: 1390,
  goal: { x: 0, z: -3300, w: 860, h: 430 },
  banner: { z: -2620, x0: -720, x1: 720 },
  flag: { x: -980, z: -2480 },
  bb: { x: -1600, z: -400, w: 1500, h: 660, bottom: 90 },
  poster: { x: -2350, z: -1700 },
  stairs: { x: 2350, z0: -1300, rise: 160, run: 130, w: 1100 },
  signs: { z: -1000, x: 470 },
};

// ---------------------------------------------------------------------------
// Ground
// ---------------------------------------------------------------------------

export const Ground: React.FC = () => {
  const W = 9600;
  const D = 9600;
  const Z0 = 2600; // near edge
  const toY = (z: number) => Z0 - z; // world z -> px down the texture
  const toX = (x: number) => x + W / 2;
  const line = "rgba(245,240,225,0.38)";
  return (
    <Floor x={0} z={Z0 - D / 2} w={W} d={D}>
      <svg width={W} height={D}>
        <defs>
          <radialGradient id="dirt" cx="50%" cy="38%" r="55%">
            <stop offset="0%" stopColor="#8A6A49" />
            <stop offset="55%" stopColor="#6E5238" />
            <stop offset="100%" stopColor="#2E2A2E" />
          </radialGradient>
        </defs>
        <rect width={W} height={D} fill="url(#dirt)" />
        {/* Worn patches and pebbles */}
        {new Array(70).fill(0).map((_, i) => (
          <ellipse
            key={i}
            cx={toX(-1600 + rand(i) * 3200)}
            cy={toY(400 - rand(i + 3) * 3900)}
            rx={60 + rand(i + 7) * 220}
            ry={30 + rand(i + 9) * 90}
            fill={i % 3 ? "#7D5E40" : "#94754F"}
            opacity={0.5}
          />
        ))}
        {new Array(260).fill(0).map((_, i) => (
          <circle key={`p${i}`} cx={rand(i + 40) * W} cy={rand(i + 90) * D} r={3 + rand(i + 5) * 6} fill={i % 2 ? "#5A4330" : "#A88B66"} opacity={0.6} />
        ))}
        {/* Grass tufts at the edges */}
        {new Array(160).fill(0).map((_, i) => {
          const side = i % 2 ? 1 : -1;
          const x = toX(side * (1550 + rand(i + 11) * 1500));
          const y = toY(800 - rand(i + 13) * 4600);
          return <path key={`g${i}`} d={`M ${x - 18} ${y} L ${x - 6} ${y - 40} L ${x} ${y} L ${x + 8} ${y - 46} L ${x + 18} ${y} Z`} fill="#3D5A35" opacity={0.75} />;
        })}
        {/* Faint chalk lines of the pitch */}
        <rect x={toX(-1450)} y={toY(450)} width={2900} height={3750} fill="none" stroke={line} strokeWidth={12} strokeDasharray="60 22" />
        <line x1={toX(-1450)} y1={toY(-1425)} x2={toX(1450)} y2={toY(-1425)} stroke={line} strokeWidth={12} strokeDasharray="60 22" />
        <circle cx={toX(0)} cy={toY(-1425)} r={330} fill="none" stroke={line} strokeWidth={12} strokeDasharray="50 22" />
        <rect x={toX(-700)} y={toY(-2650)} width={1400} height={650} fill="none" stroke={line} strokeWidth={12} strokeDasharray="60 22" />
        {/* Lamp pools of warm light */}
        {[
          [-1900, -300],
          [1900, -300],
          [-1300, -3050],
          [1300, -3050],
          [0, 300],
        ].map(([x, z], i) => (
          <ellipse key={`l${i}`} cx={toX(x)} cy={toY(z)} rx={900} ry={700} fill="#FFB04A" opacity={0.16} />
        ))}
      </svg>
    </Floor>
  );
};

// ---------------------------------------------------------------------------
// Houses, poles, cables, bunting, lamps
// ---------------------------------------------------------------------------

const WALLS = ["#C99B62", "#8FA6A0", "#D98E5A", "#B9C4B0", "#A97C50", "#E2C48E", "#7F93B3"];
const ROOFS = ["#5B3A2E", "#6B6F78", "#7A2F28", "#4A4F57"];

export const HouseSvg: React.FC<{ seed: number; w: number; h: number; t: number; dim?: number }> = ({ seed, w, h, t, dim = 0 }) => {
  const wall = WALLS[seed % WALLS.length];
  const roof = ROOFS[seed % ROOFS.length];
  const roofH = h * 0.36;
  const bodyTop = roofH;
  const lit = (i: number) => (rand(seed * 7 + i) > 0.3 ? 1 : 0.15);
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <rect x={20} y={bodyTop} width={w - 40} height={h - bodyTop} fill={wall} stroke={OUT} strokeWidth={8} />
      {/* Wooden planks */}
      {new Array(8).fill(0).map((_, i) => (
        <line key={i} x1={20} y1={bodyTop + ((h - bodyTop) / 8) * i} x2={w - 20} y2={bodyTop + ((h - bodyTop) / 8) * i} stroke="rgba(0,0,0,0.12)" strokeWidth={4} />
      ))}
      <path d={`M 0 ${bodyTop + 10} L ${w / 2} 0 L ${w} ${bodyTop + 10} Z`} fill={roof} stroke={OUT} strokeWidth={8} strokeLinejoin="round" />
      {new Array(6).fill(0).map((_, i) => (
        <line key={`r${i}`} x1={(w / 2) * (i / 6)} y1={bodyTop + 10 - (bodyTop + 10) * (i / 6)} x2={w - (w / 2) * (i / 6)} y2={bodyTop + 10 - (bodyTop + 10) * (i / 6)} stroke="rgba(255,255,255,0.08)" strokeWidth={5} />
      ))}
      {/* Windows glowing warm */}
      {[0.22, 0.78].map((fx, i) => (
        <g key={`w${i}`}>
          <rect x={w * fx - 60} y={bodyTop + 70} width={120} height={110} fill={lit(i) > 0.5 ? "#FFC35C" : "#3A3346"} stroke={OUT} strokeWidth={7} opacity={lit(i) > 0.5 ? 0.92 + Math.sin(t * 3 + seed + i) * 0.04 : 1} />
          <line x1={w * fx} y1={bodyTop + 70} x2={w * fx} y2={bodyTop + 180} stroke={OUT} strokeWidth={6} />
          <line x1={w * fx - 60} y1={bodyTop + 125} x2={w * fx + 60} y2={bodyTop + 125} stroke={OUT} strokeWidth={6} />
        </g>
      ))}
      <rect x={w / 2 - 55} y={h - 210} width={110} height={210} fill="#5A3B26" stroke={OUT} strokeWidth={7} />
      <circle cx={w / 2 + 30} cy={h - 105} r={7} fill="#FFD54F" />
      {/* Distance haze */}
      {dim > 0 ? <rect x={0} y={0} width={w} height={h} fill="#1B2350" opacity={dim} /> : null}
    </svg>
  );
};

const House: React.FC<{ x: number; z: number; ry?: number; seed: number; t: number; w?: number; h?: number; dim?: number }> = ({
  x,
  z,
  ry = 0,
  seed,
  t,
  w = 860,
  h = 820,
  dim = 0.25,
}) => (
  <Plane x={x} z={z} w={w} h={h} ry={ry}>
    <HouseSvg seed={seed} w={w} h={h} t={t} dim={dim} />
  </Plane>
);

const PoleSvg: React.FC<{ h: number }> = ({ h }) => (
  <svg width={160} height={h} style={{ overflow: "visible" }}>
    <rect x={68} y={0} width={24} height={h} fill="#4B4440" stroke={OUT} strokeWidth={5} />
    <rect x={10} y={60} width={140} height={14} fill="#3B3533" stroke={OUT} strokeWidth={4} />
    <rect x={30} y={120} width={100} height={12} fill="#3B3533" stroke={OUT} strokeWidth={4} />
    {[20, 60, 100, 140].map((x) => (
      <circle key={x} cx={x} cy={56} r={7} fill="#D7CCC8" />
    ))}
    <rect x={92} y={170} width={40} height={60} rx={6} fill="#6D6A6A" stroke={OUT} strokeWidth={4} />
  </svg>
);

// A run of tangled cables hanging between pole tops, drawn on one upright plane
const Cables: React.FC<{ x0: number; x1: number; z: number; top: number; seed: number }> = ({ x0, x1, z, top, seed }) => {
  const w = x1 - x0;
  const h = 420;
  return (
    <Plane x={(x0 + x1) / 2} y={-top + h} z={z} w={w} h={h}>
      <svg width={w} height={h} style={{ overflow: "visible" }}>
        {new Array(7).fill(0).map((_, i) => {
          const sag = 90 + rand(seed + i) * 180;
          const y0 = 50 + (i % 4) * 22;
          const y1 = 50 + ((i + 2) % 4) * 22;
          return (
            <path
              key={i}
              d={`M 0 ${y0} Q ${w * (0.35 + rand(seed + i * 3) * 0.3)} ${y0 + sag * 2} ${w} ${y1}`}
              stroke="#151320"
              strokeWidth={5 + (i % 3) * 2}
              fill="none"
              opacity={0.9}
            />
          );
        })}
      </svg>
    </Plane>
  );
};

// String of triangle flags across the pitch
const Bunting: React.FC<{ x0: number; x1: number; z: number; top: number; t: number; cols: string[] }> = ({ x0, x1, z, top, t, cols }) => {
  const w = x1 - x0;
  const h = 360;
  const n = Math.floor(w / 110);
  const sagAt = (u: number) => 40 + Math.sin(u * Math.PI) * 200;
  return (
    <Plane x={(x0 + x1) / 2} y={-top + h} z={z} w={w} h={h}>
      <svg width={w} height={h}>
        <path d={`M 0 40 Q ${w / 2} 440 ${w} 40`} stroke="#1A1726" strokeWidth={6} fill="none" />
        {new Array(n).fill(0).map((_, i) => {
          const u = (i + 0.5) / n;
          const x = u * w;
          const y = sagAt(u);
          const fl = Math.sin(t * 5 + i * 0.9) * 10;
          return <path key={i} d={`M ${x - 36} ${y} L ${x + 36} ${y} L ${x + fl} ${y + 86} Z`} fill={cols[i % cols.length]} stroke={OUT} strokeWidth={4} strokeLinejoin="round" />;
        })}
      </svg>
    </Plane>
  );
};

const Clothesline: React.FC<{ x0: number; x1: number; z: number; t: number }> = ({ x0, x1, z, t }) => {
  const w = x1 - x0;
  const h = 520;
  const clothes = ["#E57373", "#FFF59D", "#81D4FA", "#F5F5F5", "#A5D6A7"];
  return (
    <Plane x={(x0 + x1) / 2} z={z} w={w} h={h}>
      <svg width={w} height={h}>
        <rect x={0} y={0} width={14} height={h} fill="#7B5A3A" stroke={OUT} strokeWidth={4} />
        <rect x={w - 14} y={0} width={14} height={h} fill="#7B5A3A" stroke={OUT} strokeWidth={4} />
        <path d={`M 7 20 Q ${w / 2} 80 ${w - 7} 20`} stroke="#E0E0E0" strokeWidth={4} fill="none" />
        {clothes.map((c, i) => {
          const x = (w / (clothes.length + 1)) * (i + 1);
          const sw = Math.sin(t * 2.2 + i) * 4;
          return <rect key={i} x={x - 45} y={48} width={90} height={120 + (i % 2) * 40} fill={c} stroke={OUT} strokeWidth={4} transform={`skewX(${sw})`} />;
        })}
      </svg>
    </Plane>
  );
};

const Lamp: React.FC<{ cam: Cam; x: number; z: number; t: number; h?: number }> = ({ cam, x, z, t, h = 1300 }) => (
  <Billboard cam={cam} x={x} z={z} w={600} h={h + 200} blur={false}>
    <div
      style={{
        position: "absolute",
        left: 0,
        top: -100,
        width: 600,
        height: 600,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,214,140,0.95) 0%, rgba(255,170,70,0.38) 22%, rgba(255,150,60,0) 65%)",
        opacity: 0.9 + Math.sin(t * 7 + x) * 0.04,
      }}
    />
    <svg width={600} height={h + 200} style={{ position: "absolute", left: 0, top: 0 }}>
      <rect x={290} y={200} width={20} height={h} fill="#2A2730" stroke={OUT} strokeWidth={4} />
      <path d="M 300 200 Q 300 150 360 150 L 380 150" stroke="#2A2730" strokeWidth={14} fill="none" />
      <circle cx={300} cy={200} r={34} fill="#FFE7B0" />
    </svg>
  </Billboard>
);

export const Kampung: React.FC<{ cam: Cam; t: number }> = ({ cam, t }) => {
  const poles = [-2600, -1300, 0, 1300, 2600];
  return (
    <>
      {/* Back row of houses beyond the far goal */}
      {[-3400, -2500, -1600, -700, 200, 1100, 2000, 2900].map((x, i) => (
        <House key={`b${x}`} x={x} z={-4300 - (i % 2) * 120} seed={i + 1} t={t} dim={0.35} />
      ))}
      {/* Side rows */}
      {[-3600, -2600, -1600, -600, 400].map((z, i) => (
        <House key={`l${z}`} x={-3300} z={z} ry={90} seed={i + 3} t={t} />
      ))}
      {[-3600, -2600, -1600, -600, 400].map((z, i) => (
        <House key={`r${z}`} x={3300} z={z} ry={-90} seed={i + 5} t={t} />
      ))}
      {/* Behind the camera side, so reverse shots have something too */}
      {[-2000, -800, 800, 2000].map((x, i) => (
        <House key={`f${x}`} x={x} z={2700} ry={180} seed={i + 2} t={t} />
      ))}
      {/* Power poles and tangled cables along the back */}
      {poles.map((x) => (
        <Plane key={`p${x}`} x={x} z={-3900} w={160} h={1500}>
          <PoleSvg h={1500} />
        </Plane>
      ))}
      {poles.slice(0, -1).map((x, i) => (
        <Cables key={`c${x}`} x0={x + 80} x1={poles[i + 1] + 80} z={-3900} top={1450} seed={i * 11} />
      ))}
      {/* Bunting across the pitch (red and white, kampung style) */}
      <Bunting x0={-1900} x1={1900} z={-1900} top={1350} t={t} cols={["#E53935", "#F5F5F5"]} />
      <Bunting x0={-1900} x1={1900} z={-3700} top={1250} t={t + 1} cols={["#E53935", "#F5F5F5", "#FFD54F"]} />
      <Clothesline x0={-3000} x1={-2400} z={-2300} t={t} />
      <Clothesline x0={2500} x1={3100} z={-2300} t={t + 2} />
      {/* Warm street and pitch lamps */}
      <Lamp cam={cam} x={-2750} z={-300} t={t} />
      <Lamp cam={cam} x={1900} z={-300} t={t} />
      <Lamp cam={cam} x={-1300} z={-3050} t={t} />
      <Lamp cam={cam} x={1300} z={-3050} t={t} />
      <Lamp cam={cam} x={-2900} z={-2000} t={t} h={1100} />
      <Lamp cam={cam} x={2900} z={-1000} t={t} h={1100} />
    </>
  );
};

// ---------------------------------------------------------------------------
// Pitch props
// ---------------------------------------------------------------------------

const wood = "#9C6B3F";
const woodDark = "#6E4A2B";
const bamboo = "#C9B46A";
const bambooDark = "#8F7D3E";

// Wooden crate podium painted "3"
export const Podium: React.FC = () => {
  const { x, z, h, w } = LOC.podium;
  const face = (label?: string) => (
    <svg width={w} height={h}>
      <rect width={w} height={h} fill={wood} stroke={OUT} strokeWidth={8} />
      {[1, 2, 3].map((i) => (
        <line key={i} x1={0} y1={(h / 4) * i} x2={w} y2={(h / 4) * i} stroke={woodDark} strokeWidth={5} />
      ))}
      {label ? (
        <text x={w / 2} y={h * 0.78} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={130} fill="#FFD23F" stroke={OUT} strokeWidth={7} paintOrder="stroke">
          {label}
        </text>
      ) : null}
    </svg>
  );
  return (
    <>
      <Plane x={x} z={z + w / 2} w={w} h={h}>
        {face("3")}
      </Plane>
      <Plane x={x + w / 2} z={z} w={w} h={h} ry={90}>
        {face()}
      </Plane>
      <Plane x={x - w / 2} z={z} w={w} h={h} ry={-90}>
        {face()}
      </Plane>
      <Floor x={x} y={-h} z={z} w={w} d={w} style={{ background: "#B07D4D", outline: `8px solid ${OUT}` }} />
    </>
  );
};

// Wooden board on two posts: "198 GOL"
export const Board198: React.FC = () => {
  const { x, z } = LOC.board198;
  return (
    <Plane x={x} z={z} w={760} h={950}>
      <svg width={760} height={950}>
        <rect x={110} y={300} width={30} height={650} fill={woodDark} stroke={OUT} strokeWidth={5} />
        <rect x={620} y={300} width={30} height={650} fill={woodDark} stroke={OUT} strokeWidth={5} />
        <rect x={20} y={20} width={720} height={330} rx={14} fill={wood} stroke={OUT} strokeWidth={9} />
        <text x={380} y={120} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={54} fill="#FFE9C2" opacity={0.9}>
          SUÁREZ · BARSA
        </text>
        <text x={380} y={290} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={170} fill="white" stroke={OUT} strokeWidth={8} paintOrder="stroke">
          198 GOL
        </text>
      </svg>
    </Plane>
  );
};

// Bamboo substitutes' bench (drawn front-on)
export const Bench: React.FC = () => {
  const { x0, x1, z, seat } = LOC.bench;
  const w = x1 - x0;
  const h = 330;
  return (
    <Plane x={(x0 + x1) / 2} z={z} w={w} h={h}>
      <svg width={w} height={h}>
        {/* Backrest */}
        {[60, 110].map((y) => (
          <rect key={y} x={10} y={y} width={w - 20} height={26} rx={13} fill={bamboo} stroke={OUT} strokeWidth={5} />
        ))}
        {/* Seat */}
        {[h - seat - 18, h - seat - 2].map((y, i) => (
          <rect key={i} x={0} y={y} width={w} height={22} rx={11} fill={i ? bambooDark : bamboo} stroke={OUT} strokeWidth={5} />
        ))}
        {/* Legs */}
        {[30, w / 3, (2 * w) / 3, w - 50].map((lx, i) => (
          <rect key={i} x={lx} y={40} width={22} height={h - 40} rx={10} fill={bambooDark} stroke={OUT} strokeWidth={5} />
        ))}
        {/* Bamboo joints */}
        {new Array(Math.floor(w / 120)).fill(0).map((_, i) => (
          <line key={`j${i}`} x1={60 + i * 120} y1={h - seat - 18} x2={60 + i * 120} y2={h - seat + 20} stroke={OUT} strokeWidth={3} opacity={0.5} />
        ))}
      </svg>
    </Plane>
  );
};

// Red plastic chair (left empty, "YAMAL") with a fly buzzing around it
export const RedChair: React.FC<{ cam: Cam; t: number }> = ({ cam, t }) => {
  const x = LOC.chairX;
  const z = LOC.bench.z + 40;
  const fa = t * 7;
  return (
    <>
      <Plane x={x} z={z} w={230} h={330}>
        <svg width={230} height={330}>
          <path d="M 30 20 Q 115 0 200 20 L 190 170 L 40 170 Z" fill="#E53935" stroke={OUT} strokeWidth={7} strokeLinejoin="round" />
          {[60, 100].map((y) => (
            <line key={y} x1={55} y1={y} x2={175} y2={y} stroke="#B71C1C" strokeWidth={8} />
          ))}
          <rect x={20} y={170} width={190} height={40} rx={10} fill="#F44336" stroke={OUT} strokeWidth={7} />
          <path d="M 35 210 L 20 330 M 195 210 L 210 330 M 70 210 L 80 320 M 160 210 L 150 320" stroke="#C62828" strokeWidth={14} strokeLinecap="round" />
        </svg>
      </Plane>
      <Billboard cam={cam} x={x} y={-360} z={z + 10} w={240} h={80} blur={false}>
        <NameTag text="YAMAL" />
      </Billboard>
      <Billboard cam={cam} x={x + Math.cos(fa) * 90} y={-240 + Math.sin(fa * 1.7) * 40} z={z + 30 + Math.sin(fa) * 50} w={40} h={30} blur={false}>
        <svg width={40} height={30}>
          <ellipse cx={20} cy={18} rx={8} ry={6} fill="#111" />
          <ellipse cx={13} cy={10} rx={8} ry={5} fill="rgba(220,230,255,0.75)" transform={`rotate(${Math.sin(t * 90) * 30} 18 14)`} />
          <ellipse cx={27} cy={10} rx={8} ry={5} fill="rgba(220,230,255,0.75)" transform={`rotate(${-Math.sin(t * 90) * 30} 22 14)`} />
        </svg>
      </Billboard>
    </>
  );
};

export const NameTag: React.FC<{ text: string; color?: string }> = ({ text, color = "#FFFDF5" }) => (
  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div
      style={{
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: 44,
        padding: "2px 22px",
        background: color,
        color: OUT,
        border: `5px solid ${OUT}`,
        borderRadius: 14,
        letterSpacing: 2,
        transform: "rotate(-3deg)",
        boxShadow: "0 6px 0 rgba(0,0,0,0.35)",
      }}
    >
      {text}
    </div>
  </div>
);

// Bamboo goal with a string net; `bulge` pushes the back net out when the ball goes in
export const BambooGoal: React.FC<{ bulge: number }> = ({ bulge }) => {
  const { x, z, w, h } = LOC.goal;
  const net = "repeating-linear-gradient(0deg, rgba(240,240,230,0.5) 0 3px, transparent 3px 30px), repeating-linear-gradient(90deg, rgba(240,240,230,0.5) 0 3px, transparent 3px 30px)";
  return (
    <>
      <Plane x={x} z={z - 220 - bulge * 90} w={w} h={h}>
        <div style={{ position: "absolute", inset: 0, transform: `scale(${1 + bulge * 0.06}, ${1 + bulge * 0.04})`, background: net }} />
      </Plane>
      <Plane x={x} z={z} w={w + 60} h={h + 30}>
        <svg width={w + 60} height={h + 30}>
          <path d={`M 30 ${h + 30} L 30 30 L ${w + 30} 30 L ${w + 30} ${h + 30}`} stroke={OUT} strokeWidth={42} fill="none" strokeLinejoin="round" />
          <path d={`M 30 ${h + 30} L 30 30 L ${w + 30} 30 L ${w + 30} ${h + 30}`} stroke={bamboo} strokeWidth={28} fill="none" strokeLinejoin="round" />
          {new Array(8).fill(0).map((_, i) => (
            <line key={i} x1={30 + ((w) / 8) * (i + 0.5)} y1={18} x2={30 + ((w) / 8) * (i + 0.5)} y2={42} stroke={bambooDark} strokeWidth={5} />
          ))}
          {[0.3, 0.65].map((k) => (
            <g key={k}>
              <line x1={18} y1={30 + h * k} x2={42} y2={30 + h * k} stroke={bambooDark} strokeWidth={5} />
              <line x1={w + 18} y1={30 + h * k} x2={w + 42} y2={30 + h * k} stroke={bambooDark} strokeWidth={5} />
            </g>
          ))}
        </svg>
      </Plane>
    </>
  );
};

// Cloth banner between two power poles
export const Banner: React.FC<{ t: number }> = ({ t }) => {
  const { z, x0, x1 } = LOC.banner;
  const w = x1 - x0 - 60;
  const h = 330;
  const wave = (i: number) => Math.sin(t * 3.2 + i * 0.7) * 10;
  return (
    <>
      {[x0, x1].map((x) => (
        <Plane key={x} x={x} z={z} w={160} h={1450}>
          <PoleSvg h={1450} />
        </Plane>
      ))}
      <Plane x={(x0 + x1) / 2} y={-640} z={z + 4} w={w} h={h}>
        <svg width={w} height={h} style={{ overflow: "visible" }}>
          <path
            d={`M 0 ${wave(0)} Q ${w / 4} ${18 + wave(1)} ${w / 2} ${wave(2)} Q ${(3 * w) / 4} ${18 + wave(3)} ${w} ${wave(4)} L ${w} ${h + wave(5)} Q ${(3 * w) / 4} ${h + 22 + wave(6)} ${w / 2} ${h + wave(7)} Q ${w / 4} ${h + 22 + wave(8)} 0 ${h + wave(9)} Z`}
            fill="#F3E9D2"
            stroke={OUT}
            strokeWidth={8}
          />
          <rect x={0} y={20} width={w} height={22} fill={GARNET} opacity={0.85} />
          <rect x={0} y={h - 40} width={w} height={22} fill={BLUE} opacity={0.85} />
          <text x={w / 2} y={h * 0.48} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={70} fill={OUT}>
            SABAH <tspan fill="#C62828">1</tspan>–<tspan fill="#00A152">4</tspan> BARCELONA
          </text>
          <text x={w / 2} y={h * 0.78} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={44} fill={OUT} opacity={0.75}>
            Baku · Liga Champions
          </text>
          <g transform={`translate(${w - 110} ${h * 0.5}) scale(2.3)`}>
            <path d="M -15 -16 L 15 -16 L 15 2 Q 15 14 0 20 Q -15 14 -15 2 Z" fill="#FFD23F" stroke={OUT} strokeWidth={3} />
            <path d="M -11 -4 L 11 -4 L 11 3 Q 11 11 0 16 Q -11 11 -11 3 Z" fill={BLUE} />
            <path d="M -4 -4 L 4 -4 L 4 15 Q 0 16.5 -4 15 Z" fill={GARNET} />
          </g>
        </svg>
      </Plane>
    </>
  );
};

// Small Azerbaijan flag on a bamboo pole
export const AzerFlag: React.FC<{ t: number }> = ({ t }) => {
  const { x, z } = LOC.flag;
  const w = 260;
  const h = 170;
  const pts = (row: number) =>
    new Array(9)
      .fill(0)
      .map((_, i) => `${(w / 8) * i} ${row + Math.sin(t * 6 - i * 0.8) * (i / 8) * 14}`)
      .join(" L ");
  const band = (y0: number, y1: number, c: string) => (
    <path d={`M ${pts(y0)} L ${pts(y1).split(" L ").reverse().join(" L ")} Z`} fill={c} />
  );
  return (
    <Plane x={x + w / 2} z={z} w={w + 40} h={900}>
      <svg width={w + 40} height={900} style={{ overflow: "visible" }}>
        <rect x={0} y={0} width={16} height={900} fill={bamboo} stroke={OUT} strokeWidth={4} />
        <g transform="translate(16 10)">
          {band(0, h / 3, "#00B5E2")}
          {band(h / 3, (2 * h) / 3, "#EF3340")}
          {band((2 * h) / 3, h, "#509E2F")}
          <circle cx={w / 2 - 6} cy={h / 2 + Math.sin(t * 6 - 4) * 6} r={20} fill="white" />
          <circle cx={w / 2 + 2} cy={h / 2 + Math.sin(t * 6 - 4) * 6} r={16} fill="#EF3340" />
          <path d={`M ${w / 2 + 24} ${h / 2 - 9} l 3 7 l 7 0 l -6 4 l 2 7 l -6 -4 l -6 4 l 2 -7 l -6 -4 l 7 0 Z`} transform={`translate(0 ${Math.sin(t * 6 - 4.4) * 6})`} fill="white" />
        </g>
      </svg>
    </Plane>
  );
};

// ---------------------------------------------------------------------------
// Blackboard scoreboard with chalk writing
// ---------------------------------------------------------------------------

export type ChalkState = {
  big28: number; // 0..1 reveal of the big "28" (scene 3A)
  star: number;
  vuti: number[]; // SUÁREZ, 27 GOL, 73 LAGA
  vutu: number[]; // JESUS, 28 GOL, 61 LAGA
  minus12: number; // drop-in progress of the pink label
};

const ChalkText: React.FC<{ x: number; y: number; size: number; text: string; p: number; id: string; w: number; color?: string }> = ({
  x,
  y,
  size,
  text,
  p,
  id,
  w,
  color = "#F5F5F0",
}) => {
  if (p <= 0) return null;
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <rect x={x - w / 2} y={y - size} width={w * clamp01(p)} height={size * 1.3} />
        </clipPath>
      </defs>
      <text
        x={x}
        y={y}
        textAnchor="middle"
        fontFamily='"Comic Sans MS", "Baloo 2", cursive'
        fontWeight={700}
        fontSize={size}
        fill={color}
        opacity={0.93}
        clipPath={`url(#${id})`}
        style={{ filter: "url(#chalky)" }}
      >
        {text}
      </text>
      {/* Chalk dust while writing */}
      {p > 0 && p < 1
        ? new Array(8).fill(0).map((_, i) => (
            <circle key={i} cx={x - w / 2 + w * p + (rand(i + p * 50) - 0.5) * 40} cy={y - size * 0.4 + (rand(i + 7 + p * 30) - 0.3) * 60} r={2 + rand(i) * 4} fill="white" opacity={0.6} />
          ))
        : null}
    </g>
  );
};

export const Blackboard: React.FC<{ s: ChalkState }> = ({ s }) => {
  const { x, z, w, h, bottom } = LOC.bb;
  const H = h + bottom;
  const mid = w / 2;
  const drop = 1 - backOut(s.minus12);
  return (
    <Plane x={x} z={z} w={w} h={H}>
      <svg width={w} height={H} style={{ overflow: "visible" }}>
        <defs>
          <filter id="chalky">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={3} />
            <feDisplacementMap in="SourceGraphic" scale={4} />
          </filter>
        </defs>
        {/* Legs */}
        <rect x={120} y={h - 20} width={34} height={bottom + 20} fill={woodDark} stroke={OUT} strokeWidth={5} />
        <rect x={w - 154} y={h - 20} width={34} height={bottom + 20} fill={woodDark} stroke={OUT} strokeWidth={5} />
        {/* Board */}
        <rect x={0} y={0} width={w} height={h} rx={16} fill={wood} stroke={OUT} strokeWidth={10} />
        <rect x={26} y={26} width={w - 52} height={h - 52} rx={8} fill="#24352D" />
        {/* Old smudges */}
        {new Array(10).fill(0).map((_, i) => (
          <ellipse key={i} cx={60 + rand(i) * (w - 120)} cy={60 + rand(i + 4) * (h - 120)} rx={60 + rand(i + 2) * 90} ry={20 + rand(i + 3) * 30} fill="white" opacity={0.035} />
        ))}
        <text x={60} y={78} fontFamily={FONT} fontWeight={800} fontSize={34} fill="#F5F5F0" opacity={0.45}>
          GOL LIGA CHAMPIONS
        </text>
        {/* Divider */}
        {s.vuti[0] > 0 || s.vutu[0] > 0 ? <line x1={mid} y1={250} x2={mid} y2={h - 60} stroke="#F5F5F0" strokeWidth={6} opacity={0.6} strokeDasharray="30 14" /> : null}
        <ChalkText id="c28" x={mid - 40} y={225} size={190} w={300} text="28" p={s.big28} />
        {s.star > 0 ? (
          <g transform={`translate(${mid + 170} 160) scale(${backOut(s.star) * 1.1})`} opacity={0.95}>
            <circle r={58} fill="none" stroke="#F5F5F0" strokeWidth={7} />
            {[0, 72, 144, 216, 288].map((a) => (
              <path key={a} d="M 0 -40 L 9 -12 L 38 -12 L 15 6 L 24 34 L 0 17 L -24 34 L -15 6 L -38 -12 L -9 -12 Z" transform={`rotate(${a}) scale(0.38) translate(0 -70)`} fill="#F5F5F0" />
            ))}
            <path d="M 0 -18 L 5 -6 L 18 -6 L 8 2 L 12 15 L 0 7 L -12 15 L -8 2 L -18 -6 L -5 -6 Z" fill="#F5F5F0" />
          </g>
        ) : null}
        <ChalkText id="cs" x={mid / 2} y={320} size={64} w={330} text="SUÁREZ" p={s.vuti[0]} />
        <ChalkText id="c27" x={mid / 2} y={430} size={92} w={380} text="27 GOL" p={s.vuti[1]} />
        <ChalkText id="c73" x={mid / 2} y={545} size={92} w={420} text="73 LAGA" p={s.vuti[2]} />
        <ChalkText id="cj" x={mid * 1.5} y={320} size={64} w={300} text="JESUS" p={s.vutu[0]} />
        <ChalkText id="c28b" x={mid * 1.5} y={430} size={92} w={380} text="28 GOL" p={s.vutu[1]} color="#B9FBC0" />
        <ChalkText id="c61" x={mid * 1.5} y={545} size={92} w={420} text="61 LAGA" p={s.vutu[2]} color="#B9FBC0" />
        {/* Pink paper label "−12 LAGA" drops in with a bounce */}
        {s.minus12 > 0 ? (
          <g transform={`translate(${mid} ${470 - drop * 520}) rotate(${-6 + drop * 20})`}>
            <rect x={-170} y={-60} width={340} height={110} rx={10} fill={PINK} stroke={OUT} strokeWidth={7} />
            <text x={0} y={20} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={66} fill="white" stroke={OUT} strokeWidth={5} paintOrder="stroke">
              −12 LAGA
            </text>
            <rect x={-40} y={-74} width={80} height={26} fill="rgba(255,255,255,0.7)" transform="rotate(4)" />
          </g>
        ) : null}
        {/* Chalk tray */}
        <rect x={20} y={h - 26} width={w - 40} height={24} rx={6} fill={woodDark} stroke={OUT} strokeWidth={5} />
      </svg>
    </Plane>
  );
};

// ---------------------------------------------------------------------------
// House wall with the faded MSN poster; its corner tears off on "Tapi"
// ---------------------------------------------------------------------------

export const PosterWall: React.FC<{ tear: number; t: number }> = ({ tear, t }) => {
  const { x, z } = LOC.poster;
  const pw = 600;
  const ph = 640;
  const flap = clamp01(tear);
  return (
    <>
      <Plane x={x} z={z} w={1300} h={1100}>
        <HouseSvg seed={4} w={1300} h={1100} t={t} />
      </Plane>
      <Plane x={x} y={-110} z={z + 3} w={pw} h={ph}>
        <svg width={pw} height={ph} style={{ overflow: "visible" }}>
          <defs>
            <clipPath id="posterClip">
              <path d={flap > 0 ? `M 0 0 L ${pw} 0 L ${pw} ${ph - 170} L ${pw - 170} ${ph} L 0 ${ph} Z` : `M 0 0 L ${pw} 0 L ${pw} ${ph} L 0 ${ph} Z`} />
            </clipPath>
          </defs>
          <g clipPath="url(#posterClip)">
            <rect width={pw} height={ph} fill="#E9DDBF" />
            <rect width={pw} height={ph} fill="#C8A96A" opacity={0.25} />
            <text x={pw / 2} y={110} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={110} fill="#1E1A1A" letterSpacing={6}>
              M · S · N
            </text>
            {[-170, 0, 170].map((dx, i) => (
              <g key={i} transform={`translate(${pw / 2 + dx} ${ph - 30}) scale(${i === 1 ? 1.08 : 1})`}>
                <circle cx={0} cy={-330} r={62} fill="#1E1A1A" />
                <path d="M -110 0 L -100 -200 Q -96 -262 -40 -262 L 40 -262 Q 96 -262 100 -200 L 110 0 Z" fill="#1E1A1A" />
              </g>
            ))}
            <text x={pw / 2} y={ph - 40} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={36} fill="#E9DDBF" letterSpacing={4}>
              TRIO MAUT
            </text>
            {/* Age stains */}
            {new Array(7).fill(0).map((_, i) => (
              <circle key={i} cx={rand(i + 20) * pw} cy={rand(i + 30) * ph} r={30 + rand(i) * 50} fill="#8D6E4A" opacity={0.12} />
            ))}
          </g>
          <rect width={pw} height={ph} fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth={4} />
          {/* The torn corner flies away */}
          {flap > 0 && flap < 1 ? (
            <g transform={`translate(${pw - 85 + flap * 420} ${ph - 85 - flap * 380}) rotate(${flap * 540})`} opacity={1 - flap * 0.6}>
              <path d="M 85 -85 L 85 85 L -85 85 Z" fill="#E9DDBF" stroke="rgba(0,0,0,0.3)" strokeWidth={3} />
            </g>
          ) : null}
        </svg>
      </Plane>
    </>
  );
};

// ---------------------------------------------------------------------------
// Rumah panggung with a wide wooden staircase, rungs numbered 37–42 (the ranking gag)
// ---------------------------------------------------------------------------

export const stepTop = (rank: number) => {
  const { z0, rise, run } = LOC.stairs;
  const i = 42 - rank;
  return { y: -(i + 1) * rise, z: z0 - i * run - run / 2 };
};

export const Stairs: React.FC<{ t: number; hi?: number[] }> = ({ t, hi = [] }) => {
  const { x, z0, rise, run, w } = LOC.stairs;
  const ranks = [42, 41, 40, 39, 38, 37];
  const topY = -ranks.length * rise;
  const backZ = z0 - ranks.length * run;
  return (
    <>
      {/* House body on stilts behind the top step */}
      <Plane x={x} y={topY} z={backZ - 10} w={w + 600} h={900}>
        <HouseSvg seed={6} w={w + 600} h={900} t={t} />
      </Plane>
      <Plane x={x} z={backZ - 10} w={w + 600} h={-topY}>
        <svg width={w + 600} height={-topY}>
          <rect width={w + 600} height={-topY} fill="#2B2230" />
          {[20, w / 2 + 280, w + 560].map((sx, i) => (
            <rect key={i} x={sx} y={0} width={40} height={-topY} fill={woodDark} stroke={OUT} strokeWidth={5} />
          ))}
        </svg>
      </Plane>
      {ranks.map((r, i) => {
        const lit = hi.includes(r);
        return (
          <React.Fragment key={r}>
            <Plane x={x} y={-i * rise} z={z0 - i * run} w={w} h={rise}>
              <svg width={w} height={rise}>
                <rect width={w} height={rise} fill={i % 2 ? "#8A5A34" : "#9C6B3F"} stroke={OUT} strokeWidth={7} />
                <line x1={0} y1={rise * 0.5} x2={w} y2={rise * 0.5} stroke={woodDark} strokeWidth={4} opacity={0.6} />
                <rect x={36} y={22} width={150} height={rise - 44} rx={12} fill={lit ? "#FFD23F" : "#F3E9D2"} stroke={OUT} strokeWidth={5} />
                <text x={111} y={rise / 2 + 30} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={86} fill={OUT}>
                  {r}
                </text>
              </svg>
            </Plane>
            <Floor x={x} y={-(i + 1) * rise} z={z0 - i * run - run / 2} w={w} d={run} style={{ background: "#A9774A", outline: `6px solid ${OUT}` }} />
          </React.Fragment>
        );
      })}
      {/* Handrails */}
      {[-1, 1].map((s) => (
        <Plane key={s} x={x + (s * w) / 2} y={0} z={z0 - (ranks.length * run) / 2} w={ranks.length * run + 40} h={-topY + 260} ry={90}>
          <svg width={ranks.length * run + 40} height={-topY + 260}>
            <line x1={ranks.length * run + 20} y1={-topY + 260 - 250} x2={20} y2={250 - 230} stroke={woodDark} strokeWidth={22} strokeLinecap="round" />
            {ranks.map((_, i) => (
              <line key={i} x1={ranks.length * run - i * run} y1={-topY + 260 - (i * rise + 20)} x2={ranks.length * run - i * run} y2={-topY + 260 - (i * rise + 250)} stroke={woodDark} strokeWidth={14} />
            ))}
          </svg>
        </Plane>
      ))}
    </>
  );
};

// ---------------------------------------------------------------------------
// CTA signboards on bamboo poles
// ---------------------------------------------------------------------------

export const Signboards: React.FC<{ t: number; pop: number }> = ({ t, pop }) => {
  const { z, x } = LOC.signs;
  const sign = (label: string[], color: string, sx: number, i: number) => {
    const sway = Math.sin(t * 2 + i) * 1.5;
    const k = backOut(clamp01(pop * 1.4 - i * 0.25));
    return (
      <Plane key={label[0]} x={sx} z={z} w={700} h={1080}>
        <div style={{ position: "absolute", inset: 0, transformOrigin: "50% 100%", transform: `scaleY(${k}) rotate(${sway}deg)` }}>
          <svg width={700} height={1080}>
            <rect x={150} y={250} width={26} height={830} rx={10} fill={bamboo} stroke={OUT} strokeWidth={5} />
            <rect x={524} y={250} width={26} height={830} rx={10} fill={bamboo} stroke={OUT} strokeWidth={5} />
            <rect x={20} y={20} width={660} height={300} rx={20} fill={color} stroke={OUT} strokeWidth={10} />
            <rect x={36} y={36} width={628} height={268} rx={14} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={4} strokeDasharray="16 10" />
            {label.map((l, li) => (
              <text
                key={l}
                x={350}
                y={label.length === 1 ? 210 : 150 + li * 110}
                textAnchor="middle"
                fontFamily={FONT}
                fontWeight={900}
                fontSize={label.length === 1 ? 110 : 88}
                fill="white"
                stroke={OUT}
                strokeWidth={8}
                paintOrder="stroke"
              >
                {l}
              </text>
            ))}
          </svg>
        </div>
      </Plane>
    );
  };
  return (
    <>
      {sign(["JESUS", "TAJAM"], "#00C853", -x, 0)}
      {sign(["SUÁREZ", "KURANG GANAS"], PINK, x, 1)}
    </>
  );
};

export { GREEN };
